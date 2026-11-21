# Arquitectura de PawPets

## 1. Visión general

```
┌──────────────── NAVEGADOR ────────────────┐        ┌──────────────────── BACKEND · Spring Boot (:8080) ────────────────────┐        ┌──── MONGODB ATLAS ────┐
│ React + Vite (:5173)                      │        │                                                                        │        │ base: pawpets         │
│                                           │  HTTP  │  SecurityConfig ── valida el JWT y el rol (401 / 403)                 │        │                       │
│ Páginas ─▶ hooks ─▶ data/db.js            │  JSON  │        │                                                               │        │  categorias           │
│                        │                  │ ─────▶ │        ▼                                                               │ Spring │  productos            │
│                        ▼                  │        │  controller/  (recibe la petición, valida el cuerpo con @Valid)        │  Data  │  usuarios             │
│              services/api.js  ────────────┼─fetch──┼─▶      │                                                               │ Mongo  │  boletas              │
│   (VITE_API_URL + Authorization: Bearer)  │        │        ▼                                                               │ ─────▶ │   └ items (detalle)   │
│                                           │ ◀───── │  service/     (lógica de negocio: precios, stock, reglas)              │        │                       │
│ AuthProvider (sesión JWT en localStorage) │  JSON  │        │                                                               │        │                       │
│                                           │        │        ▼                                                               │        │                       │
│                                           │        │  repository/  (MongoRepository: findAll, save, findById...)            │        │                       │
│                                           │        │  model/       (@Document: Categoria, Producto, Usuario, Boleta)        │        │                       │
│                                           │        │  exception/   (@RestControllerAdvice → JSON de error uniforme)         │        │                       │
└───────────────────────────────────────────┘        └────────────────────────────────────────────────────────────────────────┘        └───────────────────────┘
```

- El **frontend nunca habla con MongoDB**: solo con la API REST, mediante `fetch` centralizado en `src/services/api.js`.
- La URL del backend sale de la variable de entorno **`VITE_API_URL`** (`paw-pets-frontend/.env`).
- El backend permite al origen del frontend mediante **CORS** (`CorsConfig`, origen en `CORS_ORIGIN`).
- El backend sigue las capas de los proyectos del profesor: **controller → service → repository → model**.
- Todas las rutas están **versionadas**: `/api/v1/...` (requisito del Anexo 1).

### Modelo de datos (Figura 1 del Anexo 1 → MongoDB)

```
USUARIO 1 ─ ─ ─ * BOLETA 1 ───── * DETALLE_BOLETA * ───── 1 PRODUCTO * ───── 1 CATEGORIA
 usuarios          boletas          boletas.items[]           productos          categorias
                   (clienteId)      (productoId)              (categoriaId)
```

| Figura 1 | Colección | Clase | Relación |
|---|---|---|---|
| USUARIO | `usuarios` | `Usuario` | Un usuario tiene muchas boletas (`Boleta.clienteId`) |
| BOLETA | `boletas` | `Boleta` | Contiene su detalle incrustado |
| DETALLE_BOLETA | `boletas.items` (incrustado) | `DetalleBoleta` | Cada línea referencia un producto (`productoId`) |
| PRODUCTO | `productos` | `Producto` | Pertenece a una categoría (`categoriaId`) |
| CATEGORIA | `categorias` | `Categoria` | Una categoría agrupa muchos productos |

- MongoDB no tiene `JOIN`: las relaciones se guardan como **ids**.
- El detalle va **incrustado** porque siempre se lee junto con la boleta. Guarda una copia del nombre y del precio,
  así la boleta histórica no cambia si después se edita el producto.
- El `id` es numérico (`@Id Integer`, se guarda como `_id`). El servicio asigna el siguiente: máximo actual + 1.

### Roles (Anexo 1)

| Acción | Visitante | Cliente | Vendedor | Admin |
|---|:-:|:-:|:-:|:-:|
| Ver productos y categorías | ✔ | ✔ | ✔ | ✔ |
| Comprar (`POST /boletas`) | ✘ | ✔ | ✘ | ✔ |
| Ver boletas | ✘ | Solo las suyas | Todas | Todas |
| Panel: Productos (lectura) y Órdenes | ✘ | ✘ | ✔ | ✔ |
| Crear / editar / eliminar productos y categorías | ✘ | ✘ | ✘ | ✔ |
| Usuarios, Reportes, Dashboard, Perfil | ✘ | ✘ | ✘ | ✔ |

La seguridad real está en el **backend** (401/403). El frontend además oculta menús y redirige,
para que cada rol vea solo lo que le corresponde.

---

## 2. Recorrido de una petición: un cliente compra

1. **`pages/Checkout.jsx`**: el cliente completa el formulario. `useFormulario` valida los campos
   (reglas de `utils/validaciones.js`). Si todo está bien llama a:
   ```js
   db.crear('boletas', { ...datosDeEnvio, items: [{ productoId: 1, cantidad: 2 }] })
   ```
   Solo envía **ids y cantidades**: nunca precios ni total.
2. **`data/db.js`** → `api.post('/boletas', datos)`.
3. **`services/api.js`** arma la petición:
   `POST ${VITE_API_URL}/boletas` con `Content-Type: application/json` y
   `Authorization: Bearer <token>` (el token sale de `localStorage`, clave `pawpets:sesion`).
4. El navegador primero envía un **preflight CORS** (`OPTIONS`). `CorsConfig` responde que
   `http://localhost:5173` está permitido.
5. **`security/SecurityConfig.java`**: el `JwtDecoder` verifica la **firma HS256** y que el token **no haya vencido**,
   y convierte el claim `rol` en `ROLE_CLIENTE`. La regla `POST /api/v1/boletas → hasAnyRole("CLIENTE","ADMIN")`
   lo deja pasar. Sin token respondería 401; un vendedor recibiría 403.
6. **`controller/BoletaController.crear`**: `@Valid` revisa el `BoletaRequest` (campos obligatorios,
   carrito no vacío, cantidades ≥ 1). Obtiene el id del cliente desde el JWT (`jwt.getSubject()`), no del cuerpo.
7. **`service/BoletaService.crear`** (lógica de negocio):
   - junta las líneas repetidas del mismo producto;
   - busca cada producto con `ProductoRepository.findById` (si no existe → 400);
   - valida el stock (si no alcanza → **409** "Stock insuficiente...");
   - calcula precio (oferta si existe), subtotales y total **en el servidor**;
   - estado `Rechazada` si el medio de pago es "Tarjeta sin fondos (simula error)", si no `Pagada`;
   - si está pagada, **descuenta el stock** (`productos.saveAll`);
   - guarda la boleta con `BoletaRepository.save`.
8. **`repository/BoletaRepository`** (Spring Data) inserta el documento en la colección `boletas` de **Atlas**.
9. La respuesta vuelve como JSON (`201 Created`) por las mismas capas.
10. **`Checkout.jsx`**: recarga los productos (el stock cambió) y, según `estado`, navega a
    `/compra/exitosa/:id` (y vacía el carrito) o a `/compra/error/:id`.
11. **`pages/PagoResultado.jsx`** muestra la boleta usando `useColeccion('boletas')` → `GET /boletas`.

Si algo falla en cualquier capa, **`GlobalExceptionHandler`** convierte la excepción en
`{ estado, error, mensaje, campos }` y el frontend muestra `mensaje` en una alerta (`AlertaError`).

---

## 3. Backend (`paw-pets-backend`)

### Raíz

| Archivo | Qué contiene / qué hace | Se comunica con |
|---|---|---|
| `pom.xml` | Proyecto Maven: Spring Boot 4.1.2, Java 17. Dependencias: `webmvc` (REST), `data-mongodb`, `validation`, `security`, `security-oauth2-resource-server` (JWT), `springdoc-openapi` 3.2.0 (Swagger), Lombok y `webmvc-test` (JUnit 5 + Mockito) | Maven Wrapper |
| `mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties` | Maven Wrapper: descarga y usa Maven sin instalarlo | `pom.xml` |
| `.env.example` | Plantilla de secretos (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`). Se copia como `.env` | `application.properties` |
| `.gitignore` | Excluye `target/`, `.env` y archivos de IDE | Git |
| `.gitattributes` | Fines de línea correctos para `mvnw` (LF) y `.cmd` (CRLF) | Git |

### `src/main/resources`

| Archivo | Qué hace |
|---|---|
| `application.properties` | Puerto 8080; `spring.config.import=optional:file:.env[.properties]` (lee el `.env`); `spring.mongodb.uri=${MONGODB_URI}`; secreto y duración del JWT (60 min); origen CORS; ruta de Swagger |
| `data/categorias.json`, `data/productos.json`, `data/usuarios.json` | Datos iniciales (4 categorías, 20 productos, 3 usuarios). Los carga `DataSeeder` solo si la colección está vacía |

### `cl/duoc/pawpets`

| Archivo | Qué hace | Se comunica con |
|---|---|---|
| `Application.java` | Punto de entrada (`@SpringBootApplication`): levanta el servidor y escanea los paquetes | Todo el resto |

### `model/` — documentos de MongoDB

| Archivo | Qué contiene |
|---|---|
| `Categoria.java` | `@Document("categorias")`: `id`, `nombre`, `imagen`, con validaciones (`@NotBlank`) |
| `Producto.java` | `@Document("productos")`: `id`, `nombre`, `categoriaId`, `precio`, `precioOferta`, `stock`, `imagen`, `descripcion`, `destacado`. Método `precioFinal()` |
| `Usuario.java` | `@Document("usuarios")`: datos personales, `correo`, `clave` (hash BCrypt) y `rol` (`admin`/`vendedor`/`cliente`). Nunca se devuelve directo |
| `Boleta.java` | `@Document("boletas")`: fecha, `clienteId`, datos de envío, `medioPago`, `items`, `total`, `estado` |
| `DetalleBoleta.java` | Línea de la boleta (incrustada): `productoId`, `nombre`, `precio`, `cantidad`, `subtotal` |

Lombok (`@Getter`, `@Setter`) genera los getters y setters al compilar. `@Schema` documenta cada campo en Swagger.

### `repository/` — acceso a datos

Interfaces que extienden `MongoRepository<Entidad, Integer>`; Spring Data crea la implementación (`findAll`, `findById`, `save`, `deleteById`, `existsById`...).
Métodos extra derivados del nombre:

| Archivo | Métodos propios |
|---|---|
| `CategoriaRepository.java` | `findTopByOrderByIdDesc()` (para el siguiente id) |
| `ProductoRepository.java` | `findTopByOrderByIdDesc()`, `existsByCategoriaId()` |
| `UsuarioRepository.java` | `findTopByOrderByIdDesc()`, `findByCorreoIgnoreCase()`, `existsByCorreoIgnoreCase()` |
| `BoletaRepository.java` | `findTopByOrderByIdDesc()`, `findByClienteIdOrderByIdAsc()` |

### `service/` — lógica de negocio

| Archivo | Reglas |
|---|---|
| `CategoriaService.java` | CRUD. No permite eliminar una categoría con productos (409) |
| `ProductoService.java` | CRUD. La categoría debe existir; la oferta debe ser menor que el precio (400); conserva `destacado` si no viene |
| `UsuarioService.java` | CRUD para el admin. Correo único (409); clave mínima de 6 caracteres cifrada con BCrypt; al editar, clave vacía = mantener; responde siempre `UsuarioResponse` (sin clave) |
| `AuthService.java` | `login` (compara con el hash), `registrar` (siempre crea **cliente**), `refrescar` (token nuevo y datos actuales) |
| `BoletaService.java` | Compra completa (ver recorrido) y consultas según rol: el cliente solo ve las suyas; una boleta ajena da 404 |

### `controller/` — endpoints REST

| Archivo | Ruta base | Qué expone |
|---|---|---|
| `AuthController.java` | `/api/v1/auth` | `login`, `registro`, `refresh` |
| `CategoriaController.java` | `/api/v1/categorias` | CRUD |
| `ProductoController.java` | `/api/v1/productos` | CRUD |
| `UsuarioController.java` | `/api/v1/usuarios` | CRUD (solo admin) |
| `BoletaController.java` | `/api/v1/boletas` | Listar, obtener y crear (comprar) |

Cada método lleva `@Operation` y `@ApiResponse` (Swagger) y valida el cuerpo con `@Valid`.
Los controladores no tienen lógica: delegan al servicio (igual que `ProductosController` del profesor).

### `dto/` — formas de entrada y salida

| Archivo | Uso |
|---|---|
| `LoginRequest.java` | `{correo, clave}` del login |
| `RegistroRequest.java` | Datos del formulario "Crear cuenta" (sin rol) |
| `UsuarioRequest.java` | Datos que el admin envía al crear/editar un usuario (incluye rol validado) |
| `UsuarioResponse.java` | Usuario **sin la clave** (lo que ve el frontend) |
| `AuthResponse.java` | `{token, usuario}` |
| `BoletaRequest.java`, `ItemBoletaRequest.java` | Datos del checkout: envío, medio de pago e ítems `{productoId, cantidad}` (sin precios) |

### `security/`

| Archivo | Qué hace |
|---|---|
| `SecurityConfig.java` | Reglas de acceso por ruta y rol; sesión **stateless**; CSRF desactivado (no hay cookies); CORS; `JwtEncoder` y `JwtDecoder` (HS256 con `JWT_SECRET`, valida firma, vencimiento y emisor); convierte el claim `rol` en `ROLE_...`; `PasswordEncoder` BCrypt; respuestas 401/403 en JSON |
| `JwtService.java` | Genera el token: `sub` = id, `rol`, `correo`, `iat`, `exp` (60 min), `iss` = `paw-pets-backend` |

### `config/`

| Archivo | Qué hace |
|---|---|
| `CorsConfig.java` | `WebMvcConfigurer` (como en el material 3.2.2): permite `GET, POST, PUT, DELETE, OPTIONS` desde `cors.origen` en `/api/**` |
| `OpenApiConfig.java` | Título y descripción de Swagger, y el esquema `bearerAuth` (botón **Authorize**) |
| `DataSeeder.java` | Al arrancar, llena las colecciones vacías con los JSON de `data/` y cifra las claves |

### `exception/`

| Archivo | Código HTTP |
|---|---|
| `RecursoNoEncontradoException.java` | 404 |
| `SolicitudInvalidaException.java` | 400 |
| `ConflictoException.java` | 409 |
| `CredencialesInvalidasException.java` | 401 |
| `ErrorRespuesta.java` | Formato único `{estado, error, mensaje, campos}` |
| `GlobalExceptionHandler.java` | `@RestControllerAdvice` (material 3.1.1): convierte cada excepción —incluidas las de `@Valid`, JSON mal formado, ids no numéricos, 404 de ruta y 405— en `ErrorRespuesta`. Lo inesperado es 500 sin detalles internos |

### `src/test/java` — pruebas unitarias y de integración (JUnit 5 + Mockito + MockMvc, sin MongoDB)

| Archivo | Qué prueba |
|---|---|
| `BoletaServiceTest.java` (7) | Precio con oferta, total y stock; líneas repetidas; pago rechazado sin descontar; stock insuficiente; producto inexistente; listado según rol; boleta ajena |
| `ProductoServiceTest.java` (5) | Id siguiente y valores por defecto; categoría inexistente; oferta ≥ precio; `destacado` se conserva; 404 |
| `AuthServiceTest.java` (4) | Login correcto con BCrypt; credenciales incorrectas; registro fuerza rol cliente; correo repetido |
| `JwtServiceTest.java` (4) | Token válido con sus claims; firma ajena rechazada; token vencido rechazado; clave corta |
| `UsuarioServiceTest.java` (3) | Clave vacía al editar se mantiene; correo de otro usuario; clave cifrada al crear |
| `CategoriaServiceTest.java` (3) | No elimina con productos; elimina sin productos; 404 |
| `integracion/SeguridadApiIntegracionTest.java` (14) | **Integración** con MockMvc (controladores + Spring Security + JWT + CORS + validación, servicios simulados): rutas públicas; 401 sin token; 403 para cliente/vendedor; CRUD completo de productos, categorías y usuarios como admin; 409; vendedor ve órdenes pero no compra; renovación de token; token vencido, con otra clave o con el rol cambiado → 401; CORS |

---

## 4. Frontend (`paw-pets-frontend`)

### Raíz

| Archivo | Qué hace |
|---|---|
| `package.json` / `package-lock.json` | Dependencias (React 19, react-router-dom 7, Bootstrap 5) y scripts (`dev`, `build`, `lint`, `test`) |
| `vite.config.js` | Configuración de Vite con el plugin de React |
| `index.html` | Página única donde se monta React; carga la fuente de íconos Material Symbols |
| `.env.example` | Plantilla con `VITE_API_URL` (se copia como `.env`) |
| `karma.conf.cjs` | Karma + Jasmine + webpack + Babel + Istanbul (cobertura) |
| `.oxlintrc.json`, `.prettierrc.json`, `.prettierignore` | Reglas de lint y formato |
| `.gitignore` | Excluye `node_modules`, `dist`, `coverage` y `.env` |
| `public/img/` | Imágenes de categorías y productos |
| `docs/cobertura-testing.md` | Informe de cobertura de pruebas |

### `src/`

| Archivo | Qué hace | Se comunica con |
|---|---|---|
| `main.jsx` | Monta `<App />` y carga Bootstrap + `index.css` | `App.jsx` |
| `App.jsx` | Mapa de rutas (react-router). Rutas de la tienda y del panel, protegidas por rol con `RutaAdmin` | Páginas, layouts, providers |
| `index.css` | Paleta PawPets (sin cambios) + tokens de diseño (radios, sombras, bordes, espaciados) y estilos de estados, etiquetas, tablas y panel | Todos los componentes |

#### `services/`
| Archivo | Qué hace |
|---|---|
| `api.js` | **Único cliente HTTP**: `fetch` a `VITE_API_URL`, agrega `Authorization: Bearer`, convierte errores en `ErrorApi(mensaje, estado, campos)`, avisa el evento `pawpets:sesion-expirada` ante un 401 con token. También lee/guarda la sesión y revisa el vencimiento (`exp`) del JWT |

#### `data/`
| Archivo | Qué hace |
|---|---|
| `db.js` | Almacén en memoria conectado a la API: `cargar` (GET), `crear` (POST), `actualizar` (PUT), `eliminar` (DELETE); guarda por colección `{datos, cargando, cargado, error}` y avisa a React |
| `seed.js` | Contenido estático que no está en el modelo de la pauta: blogs y regiones/comunas |

#### `context/`
| Archivo | Qué hace |
|---|---|
| `AuthProvider.jsx` | Sesión JWT: login/registro contra la API, persistencia en `localStorage`, descarte de token vencido, cierre al vencer, renovación cada 15 min (`/auth/refresh`), cierre automático ante 401 |
| `CarritoProvider.jsx` | Carrito en `localStorage` (`{id, cantidad}`); calcula subtotales y total con los productos del backend y limita por stock |
| `contextos.js` | Crea `AuthContext` y `CarritoContext` |

#### `hooks/`
| Archivo | Qué hace |
|---|---|
| `useColeccion.js` | Devuelve una colección de `db` y la pide al backend la primera vez |
| `useCarga.js` | Estado de carga de una o más colecciones: `{cargando, error, reintentar}` |
| `useAuth.js`, `useCarrito.js` | Acceso a los contextos |
| `useFormulario.js` | Formularios controlados: valores, errores y envío solo si las reglas se cumplen |

#### `components/`
| Archivo | Qué hace |
|---|---|
| `RutaAdmin.jsx` | Guardián de rutas por rol: sin sesión → `/login`; cliente → tienda; vendedor en sección de admin → `/admin` |
| `Estados.jsx` | `Cargando`, `AlertaError`, `AlertaExito`, `EstadoVacio`, `EstadoCarga` (espera los datos), `EtiquetaEstado` y `EstadoBoleta` (ícono + texto + color) |
| `Icono.jsx` | Ícono de Google Material Symbols (decorativo, `aria-hidden`) |
| `Header.jsx` | Menú, buscador, carrito, sesión; botón "Admin" para admin y vendedor |
| `Footer.jsx`, `Logo.jsx` | Pie de página y logo (sin cambios) |
| `Producto.jsx`, `ListaProductos.jsx`, `ListaCategorias.jsx` | Tarjetas y grillas del catálogo (etiqueta "Oferta", estado vacío) |
| `CampoFormulario.jsx`, `CamposDireccion.jsx`, `FormularioEntidad.jsx` | Campos con error accesible (ícono + texto), región/comuna, formulario genérico (con modo solo lectura) |
| `ResumenOrden.jsx` | Datos y detalle de una boleta |

#### `layouts/`
| Archivo | Qué hace |
|---|---|
| `TiendaLayout.jsx` | Header + contenido + Footer |
| `AdminLayout.jsx` | Menú lateral con íconos filtrado por rol, barra superior con la sección, el usuario y su rol |

#### `pages/` (tienda)
| Archivo | Endpoint que consume |
|---|---|
| `Home.jsx`, `Productos.jsx`, `Categorias.jsx`, `Ofertas.jsx`, `DetalleProducto.jsx` | `GET /productos`, `GET /categorias` |
| `Carrito.jsx` | `GET /productos` (precios y stock vigentes) |
| `Login.jsx` | `POST /auth/login` |
| `Registro.jsx` | `POST /auth/registro` |
| `Checkout.jsx` | `POST /boletas` (exige sesión) y luego `GET /productos` |
| `PagoResultado.jsx` | `GET /boletas` |
| `Blogs.jsx`, `DetalleBlog.jsx`, `Nosotros.jsx`, `Contacto.jsx` | Contenido estático |

#### `pages/admin/` (panel)
| Archivo | Rol | Endpoint |
|---|---|---|
| `Dashboard.jsx` | Admin (el vendedor es enviado a Productos) | `GET /boletas`, `/productos`, `/usuarios` |
| `entidades.jsx` | — | Configuración de productos, categorías y usuarios (roles, columnas, campos, reglas) |
| `AdminEntidad.jsx` | Admin; vendedor solo productos (lectura) | `GET` + `DELETE` de la entidad |
| `AdminFormulario.jsx` | Admin (crear/editar); vendedor ve detalle de producto | `POST` / `PUT` de la entidad |
| `Ordenes.jsx`, `Boleta.jsx` | Admin y vendedor | `GET /boletas`, `GET /boletas` (detalle) |
| `ProductosCriticos.jsx` | Admin y vendedor | `GET /productos` |
| `HistorialCompras.jsx` | Admin | `GET /usuarios`, `GET /boletas` |
| `Reportes.jsx` | Admin | `GET /boletas` |
| `Perfil.jsx` | Admin | `PUT /usuarios/{id}` |

#### `utils/`
| Archivo | Qué hace |
|---|---|
| `validaciones.js` | Reglas de formularios (`requerido`, `correo`, `minimo`, `minimoSiHay`, `numeroNoNegativo`, `coincideCon`) |
| `formato.js` | `precioCLP` |
| `productos.js` | `precioFinal`, `enOferta`, `esCritico`, `filtrarProductos` |
| `reportes.js` | `resumenVentas` (solo boletas pagadas) |
| `roles.js` | `ROLES` y `ROLES_PANEL` |

#### `test/` (Jasmine + Karma, 68 pruebas)
`ayudas.jsx` (render con contextos simulados, `simularApi` para `fetch`, `tokenDePrueba`), y specs de
`db`, `AuthProvider` (sesión JWT), `Login`, `Registro`, `RutaAdmin` (roles), `PanelPorRol` (menú y modo lectura por rol), `Header`, `Carrito`,
`CarritoProvider`, `Producto`, `ListaCategorias`, `Contacto`, `productos` y `validaciones`.

---

## 5. Endpoints

Base: `http://localhost:8080/api/v1`. Swagger: `http://localhost:8080/swagger-ui.html`.
Error uniforme: `{ "estado": 404, "error": "Not Found", "mensaje": "El producto 999 no existe.", "campos": {} }`.

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión | 200, 400, 401 |
| POST | `/auth/registro` | Público | Crea un cliente y abre sesión | 201, 400, 409 |
| POST | `/auth/refresh` | Con token | Entrega un token nuevo | 200, 401 |
| GET | `/categorias` · `/categorias/{id}` | Público | Listar / obtener | 200, 400, 404 |
| POST | `/categorias` | Admin | Crear | 201, 400, 401, 403 |
| PUT | `/categorias/{id}` | Admin | Actualizar | 200, 400, 401, 403, 404 |
| DELETE | `/categorias/{id}` | Admin | Eliminar (no si tiene productos) | 204, 401, 403, 404, 409 |
| GET | `/productos` · `/productos/{id}` | Público | Listar / obtener | 200, 400, 404 |
| POST | `/productos` | Admin | Crear | 201, 400, 401, 403 |
| PUT | `/productos/{id}` | Admin | Actualizar | 200, 400, 401, 403, 404 |
| DELETE | `/productos/{id}` | Admin | Eliminar | 204, 401, 403, 404 |
| GET | `/usuarios` · `/usuarios/{id}` | Admin | Listar / obtener (sin clave) | 200, 401, 403, 404 |
| POST | `/usuarios` | Admin | Crear con rol | 201, 400, 401, 403, 409 |
| PUT | `/usuarios/{id}` | Admin | Actualizar (clave vacía = mantener) | 200, 400, 401, 403, 404, 409 |
| DELETE | `/usuarios/{id}` | Admin | Eliminar | 204, 401, 403, 404 |
| GET | `/boletas` | Admin, vendedor (todas) · cliente (suyas) | Listar | 200, 401 |
| GET | `/boletas/{id}` | Igual que arriba | Boleta con su detalle | 200, 401, 404 |
| POST | `/boletas` | Cliente, admin | Comprar | 201, 400, 401, 403, 409 |

### Ejemplos

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "correo": "camila@correo.cl", "clave": "Cliente123" }
```
```json
200 OK
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "usuario": { "id": 2, "nombre": "Camila", "apellidos": "Rojas", "correo": "camila@correo.cl",
               "rol": "cliente", "region": "Región Metropolitana de Santiago", "comuna": "Maipú",
               "calle": "Los Aromos 456" }
}
```
Con clave incorrecta: `401 { "estado": 401, "error": "Unauthorized", "mensaje": "Correo o contraseña incorrectos.", "campos": {} }`.

**Obtener un producto**
```http
GET /api/v1/productos/2
```
```json
200 OK
{ "id": 2, "nombre": "Alimento Gato Esterilizado 3 kg", "categoriaId": 2, "precio": 17970,
  "precioOferta": 14990, "stock": 16, "imagen": "/img/productos/comida-gato-esterilizado.png",
  "descripcion": "Alimento completo y balanceado para gatos adultos castrados o esterilizados.",
  "destacado": true }
```

**Crear producto (admin)**
```http
POST /api/v1/productos
Authorization: Bearer <token de admin>
Content-Type: application/json

{ "nombre": "Jaula para aves", "categoriaId": 3, "precio": 25000, "precioOferta": 0,
  "stock": 2, "imagen": "", "descripcion": "Jaula mediana" }
```
`201 Created` con el producto y su `id`. Con oferta ≥ precio:
`400 { "mensaje": "El precio de oferta debe ser menor que el precio normal." }`. Como vendedor: `403`. Sin token: `401`.

**Comprar (cliente)**
```http
POST /api/v1/boletas
Authorization: Bearer <token de cliente>
Content-Type: application/json

{ "nombre": "Camila", "apellidos": "Rojas", "correo": "camila@correo.cl",
  "calle": "Los Aromos 456", "region": "Región Metropolitana de Santiago", "comuna": "Maipú",
  "indicaciones": "", "medioPago": "Tarjeta de crédito",
  "items": [ { "productoId": 1, "cantidad": 1 }, { "productoId": 2, "cantidad": 2 } ] }
```
```json
201 Created
{ "id": 5, "fecha": "2026-11-20T21:03:23.152Z", "clienteId": 2, "estado": "Pagada", "total": 64980,
  "medioPago": "Tarjeta de crédito", "nombre": "Camila", "apellidos": "Rojas", "correo": "camila@correo.cl",
  "calle": "Los Aromos 456", "comuna": "Maipú", "region": "Región Metropolitana de Santiago", "indicaciones": "",
  "items": [
    { "productoId": 1, "nombre": "Alimento Premium Perro Adulto 20 kg", "precio": 35000, "cantidad": 1, "subtotal": 35000 },
    { "productoId": 2, "nombre": "Alimento Gato Esterilizado 3 kg", "precio": 14990, "cantidad": 2, "subtotal": 29980 } ] }
```
Sin stock: `409 { "mensaje": "Stock insuficiente para Jaula para aves: quedan 2 unidades." }`.

**Validación (400)**
```json
{ "estado": 400, "error": "Bad Request", "mensaje": "Hay datos inválidos.",
  "campos": { "clave": "La contraseña es obligatoria.", "correo": "El correo es obligatorio." } }
```
