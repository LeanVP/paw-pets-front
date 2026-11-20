# Guía completa de PawPets (Evaluación Parcial 3 – DSY1104)

Backend **Spring Boot + MongoDB Atlas + JWT** y frontend **React + Vite**.
Esta guía tiene cuatro partes: **(1)** cómo arrancar todo, **(2)** cómo funciona y se comunica, **(3)** qué hace cada archivo, **(4)** guía de defensa.

---

# PARTE 1 · Guía paso a paso para arrancar el proyecto

## 1.1 Lo que necesitas instalado
| Herramienta | Para qué | Cómo comprobar |
|---|---|---|
| JDK 21 | Ejecutar el backend (el `pom.xml` pide Java 21) | `java -version` |
| Node.js 20 o superior | Ejecutar el frontend | `node -v` |
| Git | Subir a GitHub | `git --version` |
| Cuenta en MongoDB Atlas | Base de datos en la nube (gratis) | — |

Maven **no** hace falta instalarlo: el backend trae `mvnw` (Maven Wrapper).

## 1.2 Crear la base de datos en MongoDB Atlas
> Los nombres de los botones de Atlas pueden cambiar un poco con el tiempo, pero los pasos son siempre estos.

1. Entra a **mongodb.com/atlas** y crea una cuenta (sirve "Sign up with Google").
2. **Create a deployment / Build a cluster** → elige el plan **Free (M0)** → proveedor y región cercanos (ej. AWS) → nombre `Cluster0` → crear.
3. **Usuario de base de datos** (menú *Security → Database Access* → *Add New Database User*):
   - Método: *Password*. Elige un usuario (ej. `pawpets`) y una contraseña **sin símbolos raros** (solo letras y números evita problemas).
   - Rol: *Read and write to any database*.
4. **Acceso de red** (menú *Security → Network Access* → *Add IP Address*):
   - Para desarrollo usa **Allow access from anywhere (0.0.0.0/0)** o *Add current IP address*.
   - Si después de un tiempo deja de conectar, casi siempre es porque tu IP cambió: vuelve a agregarla.
5. **Obtener la URL de conexión**: en *Database* (tu cluster) → botón **Connect** → **Drivers** → copia la cadena. Se ve así:
   ```
   mongodb+srv://pawpets:<password>@cluster0.abcde.mongodb.net/?appName=Cluster0
   ```
6. Reemplaza `<password>` por tu contraseña real y agrega el nombre de la base **`/pawpets`** antes del `?`:
   ```
   mongodb+srv://pawpets:MiClave123@cluster0.abcde.mongodb.net/pawpets?retryWrites=true&w=majority
   ```
   Si tu contraseña tiene caracteres como `@ : / ?` debes escribirlos codificados (`@` = `%40`). Por eso conviene una clave simple.

## 1.3 Configurar y arrancar el backend
1. Abre la carpeta del backend (`paw-pets-backend`).
2. Copia `.env.example` y llámalo **`.env`** (sin `.example`). Edítalo:
   ```
   MONGODB_URI=mongodb+srv://pawpets:MiClave123@cluster0.abcde.mongodb.net/pawpets?retryWrites=true&w=majority
   JWT_SECRET=una-frase-larga-y-secreta-de-al-menos-32-caracteres-pawpets
   ```
   - `.env` está en `.gitignore`: **nunca se sube a GitHub** (tu contraseña de Atlas no queda pública).
3. En una terminal dentro de la carpeta del backend:
   - Windows: `mvnw.cmd spring-boot:run`
   - Mac/Linux: `./mvnw spring-boot:run`
4. La primera vez descarga dependencias (tarda unos minutos). Cuando funcione verás en la consola:
   ```
   Categorías iniciales cargadas en MongoDB
   Productos iniciales cargados en MongoDB
   Usuarios iniciales cargados en MongoDB
   Started Application ...
   ```
   Esos mensajes salen **solo la primera vez** (si las colecciones están vacías). Los datos vienen de `src/main/resources/data/*.json`.
5. Comprueba en Atlas: *Database → Browse Collections* → base **pawpets** con `categorias`, `productos`, `usuarios` (y `boletas` cuando hagas la primera compra).

**Swagger:** abre `http://localhost:8080/swagger-ui.html`.

### Probar la seguridad en Swagger
1. Abre `Autenticación → POST /api/v1/auth/login` → *Try it out* → body:
   `{"correo":"admin@pawpets.cl","clave":"Admin123"}` → *Execute*.
2. Copia el valor de `token` de la respuesta.
3. Botón **Authorize** (arriba a la derecha) → pega el token → *Authorize*.
4. Ahora puedes probar endpoints protegidos (`POST /api/v1/productos`, `GET /api/v1/usuarios`...).
5. Prueba con el vendedor (`vendedor@pawpets.cl` / `Vendedor123`): `GET /api/v1/usuarios` responde **403**. Sin token responde **401**.

### Errores típicos del backend
| Mensaje | Causa y solución |
|---|---|
| `Could not resolve placeholder 'MONGODB_URI'` | No existe el archivo `.env` o está en otra carpeta. Debe estar junto al `pom.xml`. |
| `MongoTimeoutException` / `Timed out while waiting for a server` | Tu IP no está en *Network Access*, o la contraseña/URL está mal. |
| `Authentication failed` | Usuario o contraseña de la URL incorrectos (o contraseña con símbolos sin codificar). |
| `Port 8080 was already in use` | Otro programa usa el 8080. Cambia `server.port` en `application.properties` **y** el `proxy` de `vite.config.js` del frontend. |
| Error de Java "release version 21 not supported" | Tienes un JDK menor a 21. Instala JDK 21. |

## 1.4 Arrancar el frontend
1. Con el backend **encendido**, abre otra terminal en la carpeta `paw-pets-front`.
2. `npm install` (solo la primera vez).
3. `npm run dev` → abre `http://localhost:5173`.
4. Otros comandos: `npm run lint`, `npm run build`, `npm test` (Karma necesita Google Chrome instalado).

## 1.5 Cuentas de prueba
| Rol | Correo | Contraseña | Qué ve |
|---|---|---|---|
| Administrador | `admin@pawpets.cl` | `Admin123` | Todo el panel |
| Vendedor | `vendedor@pawpets.cl` | `Vendedor123` | Solo Productos y Órdenes (lectura) |
| Cliente | `camila@correo.cl` | `Cliente123` | Solo la tienda |

Para ver una **compra rechazada**: en el checkout elige "Tarjeta sin fondos (simula error)".

## 1.6 Subir a GitHub
Se entregan **dos repositorios públicos** (frontend y backend). Dentro de cada carpeta:
```
git init
git add .
git commit -m "feat: integración con MongoDB Atlas, JWT y roles"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/NOMBRE_DEL_REPO.git
git push -u origin main
```
Si el repositorio ya tiene contenido (por ejemplo, el esqueleto): usa `git pull origin main --allow-unrelated-histories` antes del `push`, o copia estos archivos dentro del clon del repositorio y haz `git add . && git commit && git push`.

**Antes de hacer `git add .`, comprueba que `.env` no aparece** en `git status`. Si por error subes la contraseña de Atlas, cámbiala en Atlas de inmediato.

Consejo para la nota de "colaboración": haz **varios commits con mensajes claros** (ej. `feat: modelo de datos`, `feat: login con JWT`, `feat: roles en el frontend`, `test: pruebas de BoletaService`), no un solo commit gigante. El docente preguntará por los cambios de GitHub.

---

# PARTE 2 · Cómo funciona y cómo se comunica

## 2.1 Visión general
```
 NAVEGADOR (React, :5173)                 BACKEND (Spring Boot, :8080)              MONGODB ATLAS
 ┌───────────────────────┐   fetch /api/v1   ┌───────────────────────────────┐    ┌───────────────┐
 │ Páginas + componentes │ ───────────────▶ │ Security (valida el JWT)       │    │ categorias    │
 │ AuthProvider (sesión) │   JSON + token    │  → Controller (recibe HTTP)    │    │ productos     │
 │ db.js (caché + API)   │ ◀─────────────── │  → Service (lógica de negocio) │ ─▶ │ usuarios      │
 │ services/api.js       │      JSON         │  → Repository (consulta Mongo) │    │ boletas       │
 └───────────────────────┘                   └───────────────────────────────┘    └───────────────┘
```
- El **frontend** nunca habla con Mongo: solo con la API REST.
- En desarrollo, Vite hace de intermediario: lo que el front pide a `/api/...` lo reenvía a `http://localhost:8080/api/...` (`vite.config.js`, igual que en el ejemplo del profesor). Por eso en el código del front solo se escribe `/api/v1/...`.
- El backend sigue las capas del profesor: **Controller → Service → Repository → Model**.

## 2.2 Modelo de datos (Figura 1 de la pauta)
| Tabla de la pauta | Colección en Mongo | Clase Java | Relación |
|---|---|---|---|
| USUARIO | `usuarios` | `Usuario` | 1 usuario → muchas boletas (`Boleta.clienteId`) |
| BOLETA | `boletas` | `Boleta` | contiene su detalle |
| DETALLE_BOLETA | (incrustado en `boletas.items`) | `DetalleBoleta` | muchas líneas por boleta; cada una referencia `productoId` |
| PRODUCTO | `productos` | `Producto` | pertenece a una categoría (`categoriaId`) |
| CATEGORIA | `categorias` | `Categoria` | 1 categoría → muchos productos |

- En MongoDB no hay `JOIN`. Las relaciones se guardan como **ids** (`categoriaId`, `clienteId`, `productoId`).
- El detalle de la boleta va **incrustado** (documento dentro del documento) porque siempre se lee junto con la boleta. Guarda copia del nombre y precio, así la boleta histórica no cambia si luego se edita el producto.
- El `id` numérico es el `_id` de Mongo (igual que usaba el front). Al crear, el servicio calcula `máximo id + 1`.
- Los **blogs** y las **regiones/comunas** no están en el modelo de la pauta; se quedaron como contenido estático del front (`src/data/contenido.js`).

## 2.3 Roles y permisos (se aplican en el BACKEND y también en el FRONTEND)
| Acción | Visitante | Cliente | Vendedor | Admin |
|---|:--:|:--:|:--:|:--:|
| Ver productos y categorías (tienda) | ✔ | ✔ | ✔ | ✔ |
| Comprar (`POST /boletas`) | ✘ | ✔ | ✘ | ✔ |
| Ver sus boletas | ✘ | ✔ (solo las suyas) | ✔ (todas) | ✔ (todas) |
| Panel: Productos (solo lectura) y Órdenes | ✘ | ✘ | ✔ | ✔ |
| Crear/editar/eliminar productos y categorías | ✘ | ✘ | ✘ | ✔ |
| Gestión de usuarios, reportes, dashboard, perfil | ✘ | ✘ | ✘ | ✔ |

**Idea clave para la defensa:** las restricciones del frontend (ocultar menús, redirigir) mejoran la experiencia, pero **la seguridad real está en el backend**: aunque alguien abra Postman y llame a la API, el servidor responde `401` (sin token) o `403` (sin permiso).

## 2.4 Flujo 1 – Login con JWT
1. El usuario escribe correo y clave en `Login.jsx`.
2. `useFormulario` valida los campos. Si están bien, llama a `iniciarSesion()` del `AuthProvider`.
3. `AuthProvider` hace `POST /api/v1/auth/login` con `{correo, clave}` (vía `services/api.js`).
4. Backend: `AuthController.login` → `AuthService.login`:
   - busca el usuario por correo en Mongo (`UsuarioRepository.findByCorreoIgnoreCase`);
   - compara la clave escrita con el **hash BCrypt** guardado (`PasswordEncoder.matches`);
   - si es correcta, `JwtService.generarToken` crea un **JWT firmado (HS256)** con: `sub` = id del usuario, `rol` (ADMIN/VENDEDOR/CLIENTE), `correo`, fecha de emisión y de expiración (60 min);
   - responde `{ token, usuario }` (el usuario **sin la clave**).
   - Si falla → `401 Correo o contraseña incorrectos.`
5. El `AuthProvider` guarda `{token, usuario}` en `localStorage` (`pawpets:sesion`) y en su estado. `Login.jsx` redirige: cliente a `/`, admin y vendedor a `/admin`.

## 2.5 Flujo 2 – Una petición protegida
1. Cada llamada a la API pasa por `services/api.js`, que agrega `Authorization: Bearer <token>`.
2. En el backend, Spring Security (`SecurityConfig`) revisa **antes de llegar al controlador**:
   - el `JwtDecoder` verifica la **firma** y que el token **no haya expirado**;
   - convierte el claim `rol` en la autoridad `ROLE_ADMIN` etc.;
   - compara con las reglas de `authorizeHttpRequests`. Sin token → `401`; token válido pero rol sin permiso → `403`.
3. Si pasa, el controlador llama al servicio y este al repositorio.
4. Si el backend responde `401` con sesión abierta, `api.js` dispara el evento `pawpets:sesion-expirada` y el `AuthProvider` cierra la sesión automáticamente.

## 2.6 Flujo 3 – Mostrar productos (lectura)
1. Una página (ej. `Productos.jsx`) llama `useColeccion('productos')`.
2. El hook, al montarse, ejecuta `db.cargar('productos')` → `GET /api/v1/productos` (público, no necesita token).
3. `ProductoController.listar` → `ProductoService.listar` → `ProductoRepository.findAll` → Mongo.
4. `db.js` guarda la lista en memoria y avisa a React (`useSyncExternalStore`), que redibuja la pantalla.

## 2.7 Flujo 4 – Comprar (lógica de negocio)
1. `Checkout.jsx` exige sesión. Envía `POST /api/v1/boletas` con los datos de envío, el medio de pago y **solo `productoId` + `cantidad`** de cada ítem. **No envía precios ni total.**
2. `BoletaService.crear` (backend):
   - busca cada producto en la base de datos;
   - valida que exista y que haya stock (si no → `409 Stock insuficiente...`);
   - calcula el precio (oferta si existe), subtotales y total **en el servidor**;
   - estado = `Rechazada` si el medio de pago es "Tarjeta sin fondos (simula error)", si no `Pagada`;
   - si está pagada, **descuenta el stock**;
   - guarda la boleta asociada al cliente del token y la devuelve (`201`).
3. El front, según `estado`, vacía el carrito y va a `/compra/exitosa/:id` o a `/compra/error/:id`.
- Por qué el servidor calcula el total: un usuario malintencionado podría modificar el precio en el navegador.

## 2.7b Sesión en el frontend (rúbrica IE3.3.2 / IE3.3.5)
- **Persistencia tras recargar:** al abrir la página, `AuthProvider` lee `localStorage`. Si el token existe y no está vencido, la sesión continúa sin pedir login.
- **Vencimiento:** la función `vigente()` lee el campo `exp` del JWT; si ya venció, borra la sesión. (Es solo para no mostrar una sesión muerta: quien valida de verdad es el backend.)
- **Renovación:** al abrir la página y cada 15 minutos, llama `POST /api/v1/auth/refresh`; el backend, con un token todavía válido, entrega uno nuevo y los datos actualizados del usuario.
- **Cierre:** `cerrarSesion()` borra `localStorage` y vacía los datos cargados (`db.reiniciar()`).
- **Honestidad sobre seguridad:** guardar el JWT en `localStorage` es lo más simple y cumple "persistir tras recargar", pero queda expuesto si hubiera un ataque XSS. La alternativa más segura serían cookies `HttpOnly`, que requieren más configuración. Mitigaciones usadas: token de vida corta (60 min), renovación, cierre automático ante 401 y que React escapa el contenido por defecto.

## 2.8 Restricciones de acceso en el frontend (IE3.3.3 / IE3.3.6)
- `RutaAdmin` (componente guardián): recibe los roles permitidos. Sin sesión → `/login`. Con sesión pero sin permiso → `/admin`.
- En `App.jsx` hay **dos niveles**: `/admin` permite `['admin','vendedor']` y, dentro, un grupo con `RutaAdmin roles={['admin']}` para Categorías, Usuarios, Reportes, Perfil, formularios, etc.
- `AdminLayout` filtra el menú: el vendedor solo ve **Órdenes** y **Productos**.
- `AdminEntidad` oculta "Nuevo", "Editar" y "Eliminar" al vendedor y le muestra "Ver detalle".
- `AdminInicio`: el admin ve el Dashboard; el vendedor es enviado a Productos.
- `Header`: el botón del panel aparece solo para admin y vendedor.

---

# PARTE 3 · Qué hace cada archivo

## 3.1 BACKEND (`paw-pets-backend`)

### Raíz
| Archivo | Qué hace |
|---|---|
| `pom.xml` | Dependencias: `webmvc` (API REST), `data-mongodb` (Mongo), `security` + `oauth2-resource-server` (seguridad y JWT con Nimbus), `validation` (@NotBlank, @Min…), `springdoc` (Swagger, versión del profesor), `lombok`, pruebas. |
| `.env.example` | Plantilla de secretos. Se copia a `.env` (no se sube). |
| `.gitignore` | Ignora `target/`, `.env`, archivos del IDE. |
| `mvnw`, `mvnw.cmd`, `.mvn/` | Maven Wrapper: compila sin instalar Maven. |

### `src/main/resources`
| Archivo | Qué hace |
|---|---|
| `application.properties` | Puerto 8080; lee `.env`; define `spring.mongodb.uri`, el secreto y la duración del JWT, y el origen CORS permitido. |
| `data/categorias.json`, `productos.json`, `usuarios.json` | Datos iniciales (los mismos que tenía el front en `seed.js`, más el usuario vendedor). Las claves van en texto plano **solo aquí** y se cifran al cargarlas. |

### `Application.java`
Punto de entrada (`@SpringBootApplication`). Escanea todos los paquetes de abajo.

### `model/` — las colecciones de Mongo
| Clase | Descripción |
|---|---|
| `Categoria` | `id, nombre, imagen`. `@Document("categorias")`. |
| `Producto` | `id, nombre, categoriaId, precio, precioOferta (0 = sin oferta), stock, imagen, descripcion, destacado`. |
| `Usuario` | `id, nombre, apellidos, correo, clave (hash BCrypt), rol, region, comuna, calle`. Nunca se devuelve directo. |
| `Boleta` | Una compra: `id, fecha, clienteId, datos de envío, medioPago, items, total, estado`. |
| `DetalleBoleta` | Una línea: `productoId, nombre, precio, cantidad, subtotal`. Va dentro de `Boleta.items`. |
(Lombok `@Getter/@Setter` genera los getters y setters al compilar.)

### `repository/` — acceso a Mongo
Interfaces que extienden `MongoRepository<Entidad, Integer>`: Spring crea la implementación sola (`findAll`, `findById`, `save`, `deleteById`…). Métodos extra por nombre:
- `findTopByOrderByIdDesc()` → el último registro (para calcular el siguiente id).
- `ProductoRepository.existsByCategoriaId` → ¿la categoría tiene productos?
- `UsuarioRepository.findByCorreoIgnoreCase / existsByCorreoIgnoreCase` → buscar por correo.
- `BoletaRepository.findByClienteId` → compras de un cliente.

### `service/` — lógica de negocio
| Clase | Reglas que implementa |
|---|---|
| `CategoriaService` | CRUD; **no deja eliminar** una categoría con productos (409). |
| `ProductoService` | CRUD; valida que la **categoría exista** y que la **oferta sea menor al precio** (400). Conserva `destacado` si no viene. |
| `UsuarioService` | CRUD de usuarios (admin); correo único (409); **cifra** la clave; al editar, clave vacía = mantener. |
| `AuthService` | `login` (verifica hash), `registro` (siempre crea **cliente**, correo único), `refrescar` (token nuevo). |
| `BoletaService` | `crear` (compra completa: precios, stock, estado, descuento de stock), `listar` y `obtener` según rol (un cliente solo ve las suyas; las ajenas dan 404). |

### `controller/` — endpoints REST (`/api/v1/...`)
Reciben la petición HTTP, validan el cuerpo con `@Valid`, llaman al servicio y devuelven JSON. Cada método lleva anotaciones Swagger (`@Operation`, `@ApiResponse`).
`AuthController`, `CategoriaController`, `ProductoController`, `UsuarioController`, `BoletaController`.

### `dto/` — formas de los datos que entran y salen
`LoginRequest`, `RegistroRequest`, `UsuarioRequest`, `CategoriaRequest`, `ProductoRequest`, `BoletaRequest`, `ItemBoletaRequest` (entrada, con validaciones) y `UsuarioResponse`, `AuthResponse` (salida; **sin clave**). Son `record` de Java.

### `security/`
| Clase | Qué hace |
|---|---|
| `SecurityConfig` | Reglas de acceso por ruta/rol, sesión **stateless**, validación del JWT (`JwtDecoder` HS256), firma (`JwtEncoder`), BCrypt, CORS y conversión del claim `rol` → `ROLE_...`. |
| `JwtService` | Genera el token con `sub`, `rol`, `correo`, `iat`, `exp`. |

### `config/`
| Clase | Qué hace |
|---|---|
| `OpenApiConfig` | Título de Swagger y el botón **Authorize** (esquema Bearer JWT). |
| `DataSeeder` | Al arrancar, si una colección está vacía, la llena con los JSON de `data/`. Cifra las claves. |

### `exception/`
`RecursoNoEncontradoException` (404), `ConflictoException` (409), `SolicitudInvalidaException` (400), `CredencialesInvalidasException` (401) y `GlobalExceptionHandler` (`@RestControllerAdvice`: convierte cualquier excepción, incluidas las validaciones, en un JSON uniforme `ErrorRespuesta {estado, error, mensaje, campos}`).

### `src/test/java` — pruebas unitarias (JUnit 5 + Mockito)
`JwtServiceTest` (firma válida, firma ajena rechazada, token vencido rechazado), `AuthServiceTest`, `ProductoServiceTest`, `CategoriaServiceTest`, `BoletaServiceTest` (precio de oferta, stock, pago rechazado, un cliente no ve boletas ajenas). Se ejecutan con `./mvnw test` y **no necesitan Mongo**.

## 3.2 FRONTEND (`paw-pets-front`)

### Archivos NUEVOS o REESCRITOS en esta etapa
| Archivo | Qué cambió |
|---|---|
| `src/services/api.js` | **Nuevo.** Cliente `fetch`: base `/api/v1`, agrega el token, convierte errores en `Error(mensaje)`, avisa si hay 401. Guarda/lee la sesión de `localStorage`. |
| `src/data/db.js` | **Reescrito.** Antes simulaba una BD en `localStorage`; ahora es un almacén en memoria que se llena con la API (`cargar`) y cuyas operaciones `crear/actualizar/eliminar` llaman a `POST/PUT/DELETE`. |
| `src/data/contenido.js` | **Nuevo.** Blogs y regiones (antes en `seed.js`, que se eliminó). |
| `src/hooks/useColeccion.js` | Al montar, pide la colección al backend y se suscribe a los cambios. |
| `src/context/AuthProvider.jsx` | **Reescrito.** Login/registro reales, JWT en `localStorage`, expiración, renovación, cierre ante 401. |
| `src/components/RutaAdmin.jsx` | Ahora recibe `roles`. |
| `src/pages/admin/AdminInicio.jsx` | **Nuevo.** Dashboard para admin; redirección a Productos para vendedor. |
| `src/App.jsx` | Rutas por rol (admin / vendedor). |
| `src/layouts/AdminLayout.jsx` | Menú filtrado por rol. |
| `src/pages/Login.jsx`, `Registro.jsx` | Llamadas asíncronas, error de servidor, redirección por rol. |
| `src/pages/Checkout.jsx` | Envía la compra al backend; exige sesión; muestra errores del servidor. |
| `src/pages/PagoResultado.jsx`, `admin/Boleta.jsx`, `Ordenes.jsx`, `Dashboard.jsx`, `Reportes.jsx`, `HistorialCompras.jsx` | Usan la colección `boletas` del backend. |
| `src/pages/admin/AdminEntidad.jsx` | Botones según rol; muestra el error del backend al eliminar. |
| `src/pages/admin/AdminFormulario.jsx`, `Perfil.jsx` | Guardan en el backend, muestran errores; la contraseña es opcional al editar. |
| `src/pages/admin/entidades.jsx` | Se agregó el rol `vendedor`. |
| `src/utils/validaciones.js` | Nueva regla `minimoSiHay`. |
| `src/components/Header.jsx` | El botón del panel lo ven admin y vendedor. |
| `vite.config.js` | `proxy` de `/api` hacia `http://localhost:8080`. |
| `src/test/*` | Pruebas actualizadas para la API (`simularApi` en `ayudas.jsx`), nuevas pruebas de sesión JWT y roles. |

### Archivos que NO cambiaron (ya estaban bien)
- `src/components/`: `Producto`, `ListaProductos`, `ListaCategorias`, `Header`, `Footer`, `Logo`, `CampoFormulario`, `CamposDireccion`, `FormularioEntidad`, `ResumenOrden`: piezas visuales reutilizables.
- `src/context/CarritoProvider.jsx`: el carrito vive en el navegador (`localStorage`) hasta pagar.
- `src/hooks/`: `useAuth`, `useCarrito`, `useFormulario`.
- `src/layouts/TiendaLayout.jsx`: header + footer de la tienda.
- `src/pages/`: Home, Productos, Categorias, Ofertas, DetalleProducto, Carrito, Blogs, DetalleBlog, Nosotros, Contacto.
- `src/pages/admin/`: ProductosCriticos, Reportes (cálculo en `utils/reportes.js`).
- `src/utils/`: `formato.js`, `productos.js`, `reportes.js`.

---

# PARTE 4 · Endpoints (resumen para el documento de APIs)
Todos bajo `/api/v1`. Formato de error: `{estado, error, mensaje, campos}`.

| Método | Ruta | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| POST | `/auth/login` | Público | Devuelve token + usuario | 200, 400, 401 |
| POST | `/auth/registro` | Público | Crea cliente y devuelve token | 201, 400, 409 |
| POST | `/auth/refresh` | Token válido | Token nuevo | 200, 401 |
| GET | `/categorias`, `/categorias/{id}` | Público | Listar / obtener | 200, 404 |
| POST, PUT, DELETE | `/categorias`, `/categorias/{id}` | Admin | Crear / editar / eliminar | 201/200/204, 400, 403, 404, 409 |
| GET | `/productos`, `/productos/{id}` | Público | Listar / obtener | 200, 404 |
| POST, PUT, DELETE | `/productos`, `/productos/{id}` | Admin | Crear / editar / eliminar | 201/200/204, 400, 403, 404 |
| GET, POST, PUT, DELETE | `/usuarios`, `/usuarios/{id}` | Admin | CRUD de usuarios | 200/201/204, 400, 403, 404, 409 |
| GET | `/boletas` | Admin, Vendedor (todas); Cliente (las suyas) | Listar | 200, 401 |
| GET | `/boletas/{id}` | igual | Boleta con su detalle | 200, 404 |
| POST | `/boletas` | Cliente, Admin | Comprar | 201, 400, 403, 409 |

Ejemplo de login:
```
POST /api/v1/auth/login
{ "correo": "admin@pawpets.cl", "clave": "Admin123" }
→ 200 { "token": "eyJhbGciOi...", "usuario": { "id":1, "nombre":"...", "rol":"admin", ... } }
```
Ejemplo de compra:
```
POST /api/v1/boletas   (Authorization: Bearer <token de cliente>)
{ "nombre":"Camila","apellidos":"Rojas","correo":"camila@correo.cl","calle":"Calle 1",
  "region":"Región Metropolitana de Santiago","comuna":"Santiago","indicaciones":"",
  "medioPago":"Tarjeta de débito","items":[{"productoId":1,"cantidad":2}] }
→ 201 { "id":1, "estado":"Pagada", "total":29980, "items":[...] }
```

---

# PARTE 5 · Guía de defensa (presentación individual, 15 min + 5 de preguntas)

> En la defensa **cada integrante responde por todo el sistema** (aunque trabajaste solo). El docente pregunta por el código y por los cambios de GitHub. Practica mostrando el código, no solo diciéndolo.

## 5.1 Guion sugerido (15 minutos)
| Min | Qué mostrar | Qué decir |
|---|---|---|
| 0–1 | Diagrama de la sección 2.1 | "PawPets: tienda con frontend React y backend Spring Boot que guarda en MongoDB Atlas, comunicados por API REST y protegidos con JWT." |
| 1–3 | Atlas (colecciones) + modelo (tabla 2.2) | Modelo de 5 tablas de la pauta en Mongo: relaciones por id, detalle incrustado. |
| 3–5 | Carpetas del backend | Capas Controller → Service → Repository → Model; ejemplo con `BoletaService`: reglas de negocio. |
| 5–7 | Swagger | Mostrar endpoints; ejecutar login, Authorize y un POST de producto. |
| 7–9 | Frontend en el navegador + pestaña *Network* | Mostrar una llamada `GET /api/v1/productos` y el header `Authorization` en una protegida. |
| 9–11 | `AuthService`, `JwtService`, `SecurityConfig` | Cómo se genera, firma y valida el token; roles. |
| 11–13 | `AuthProvider` + recargar la página con F5 | La sesión persiste; token con expiración y renovación. |
| 13–15 | Login como vendedor y como cliente | Qué menús aparecen; probar en Swagger que el vendedor recibe 403 en `/usuarios`. |

**Demo de seguridad impactante:** entra como vendedor, copia la URL `/admin/usuarios` en el navegador → te redirige. Luego muestra en Swagger/Postman que aun así el backend responde 403.

## 5.2 Respuestas listas por indicador de la rúbrica

### IE3.1.2 – Backend con base de datos, lógica de negocio y modelos (12 %)
- **¿Cómo se conecta a la base de datos?** Con `spring-boot-starter-data-mongodb`. La URL de Atlas está en `.env` y `application.properties` la lee con `spring.mongodb.uri=${MONGODB_URI}`. Los repositorios extienden `MongoRepository`.
- **¿Por qué MongoDB si el enunciado menciona bases relacionales (MySQL, Oracle Cloud o Firebase)?** Porque el docente entregó el proyecto de ejemplo `BackendMongoSitioFull` con MongoDB, y Atlas es gratis y en la nube. Los datos de la tienda (por ejemplo, una boleta con su lista de productos) calzan bien como documentos. **Antes de la defensa confirma con tu docente que MongoDB Atlas es aceptable**, porque el Anexo 1 habla de base "relacional".
- **¿Cómo modelaste las relaciones?** Por ids; el detalle de boleta va incrustado.
- **¿Qué lógica de negocio hay?** Compra (precios del servidor, stock, estado, descuento de stock), oferta menor al precio, categoría con productos no se elimina, correo único, registro solo crea clientes, un cliente solo ve sus boletas.
- **¿Para qué sirve el `DataSeeder`?** Carga datos iniciales solo si la colección está vacía.

### IE3.2.3 – API REST con Spring Boot y Swagger (12 %)
- **¿Qué hace cada capa?** Controller recibe HTTP y valida; Service tiene las reglas; Repository habla con Mongo.
- **¿Qué verbos usas?** GET (leer), POST (crear, 201), PUT (actualizar), DELETE (eliminar, 204).
- **¿Qué es el versionado?** Las rutas parten en `/api/v1`; si cambia el contrato, se crea `/api/v2` sin romper a los clientes existentes.
- **¿Cómo documentaste?** `springdoc-openapi` genera Swagger en `/swagger-ui.html`; cada método tiene `@Operation` y `@ApiResponse`; `OpenApiConfig` agrega el botón Authorize.
- **¿Cómo manejas errores?** `GlobalExceptionHandler` (`@RestControllerAdvice`, como la diapositiva de `@ControllerAdvice`) devuelve JSON uniforme con el código HTTP correcto.
- **¿Para qué los DTO?** Para no exponer entidades: por ejemplo `UsuarioResponse` no incluye la clave, y `BoletaRequest` no acepta precios.
- **¿Qué es `@Valid`?** Activa las validaciones (`@NotBlank`, `@Min`, `@Email`) del record; si fallan, 400 con el detalle por campo.

### IE3.2.4 – Integración backend–frontend (10 %)
- **¿Cómo se comunican?** El front usa `fetch` (en `services/api.js`) contra `/api/v1/...`. Vite hace proxy a `localhost:8080`, así no hay problemas de CORS en desarrollo; igual el backend tiene CORS configurado para `http://localhost:5173`.
- **¿Cuál es el flujo de datos?** Página → `useColeccion` → `db.cargar` → `api.get` → Controller → Service → Repository → Mongo → JSON → caché de `db.js` → React redibuja.
- **¿Cómo aseguraste una comunicación eficiente?** Se envía solo lo necesario (ids y cantidades en la compra); caché en memoria compartida; errores con mensaje claro; 401 cierra sesión automáticamente.
- **¿Qué es CORS y por qué importa?** El navegador bloquea llamadas entre orígenes distintos (puertos 5173 y 8080) si el servidor no lo permite. `SecurityConfig` autoriza el origen del front.
- **¿Qué hace `db.js` ahora?** Es un caché + cliente de API: `cargar` (GET), `crear` (POST), `actualizar` (PUT), `eliminar` (DELETE); notifica a React con `useSyncExternalStore`.

### IE3.3.4 – Autenticación con roles y JWT (10 %)
- **¿Qué es un JWT?** Un texto con 3 partes (cabecera, payload, firma). El payload lleva `sub` (id), `rol`, `exp`. La firma (HS256 con `JWT_SECRET`) impide modificarlo.
- **¿Cómo se verifica?** `JwtDecoder` valida la firma y la expiración en cada petición; si falla → 401.
- **¿Cómo se aplican los roles?** El claim `rol` se convierte en `ROLE_ADMIN`…; `SecurityConfig` usa `hasRole`/`hasAnyRole` por ruta.
- **¿Dónde se guardan las contraseñas?** Cifradas con BCrypt (hash con sal); nunca en texto plano ni en las respuestas.
- **¿Qué pasa si el token vence?** El backend responde 401 y el front cierra la sesión. Antes de eso el front renueva el token cada 15 minutos con `/auth/refresh`.
- **¿Por qué `csrf` desactivado y sesión stateless?** Porque la autenticación va en un header con token, no en cookies de sesión.
- **¿Puede alguien registrarse como admin?** No: `AuthService.registro` fuerza el rol `cliente`; solo un admin crea usuarios con otros roles.

### IE3.3.5 – Gestión de sesión en el frontend (8 %)
- Sesión `{token, usuario}` en `localStorage` → sobrevive a F5. `vigente()` revisa `exp`. Renovación periódica. `cerrarSesion` limpia todo. Evento `pawpets:sesion-expirada` ante 401.
- **Riesgo conocido:** `localStorage` es accesible por JavaScript (XSS). Alternativa: cookie `HttpOnly`. Se explican las mitigaciones (sección 2.7b).

### IE3.3.6 – Restricciones de acceso en el frontend (8 %)
- `RutaAdmin` con roles, rutas anidadas en `App.jsx`, menú filtrado en `AdminLayout`, botones ocultos en `AdminEntidad`, redirección en `AdminInicio`. Ejemplos: el vendedor no ve Usuarios, Categorías, Reportes ni los botones de editar; el cliente no ve el panel.
- **Pregunta trampa: "¿Eso es seguro?"** El frontend solo guía al usuario; la seguridad real la impone el backend con 401/403.

## 5.3 Preguntas "trampa" frecuentes
1. **¿Qué pasa si borro el token del localStorage?** Se pierde la sesión; al recargar pide login. Las rutas protegidas del front redirigen y el backend rechaza con 401.
2. **¿Y si edito el rol en localStorage a "admin"?** El menú del front cambiaría, pero toda acción real falla con 403 porque el rol que cuenta es el del **token firmado**, y no se puede modificar sin la clave secreta.
3. **¿Por qué el total lo calcula el servidor?** Para que nadie manipule precios desde el navegador.
4. **¿Qué es `@Document`?** Marca la clase como colección de Mongo. **`@Id`**: el campo que es `_id`.
5. **¿Qué hace `@RestController` vs `@Controller`?** `@RestController` devuelve datos (JSON) directamente en el cuerpo.
6. **¿Qué hace Lombok?** Genera getters/setters en compilación para no escribirlos.
7. **¿Qué es inyección de dependencias?** Spring entrega los objetos que una clase necesita (repositorios, servicios) por su constructor.
8. **¿Por qué `.env` y no poner la URL en `application.properties`?** Para no publicar credenciales en un repositorio público.
9. **¿Qué pasa si dos usuarios compran al mismo tiempo el último producto?** Es una limitación: la validación de stock no es atómica. Mejora futura: operación atómica o transacción.
10. **¿Por qué el `id` es un número y no un `ObjectId`?** Para mantener los ids que ya usaba el front; el servicio calcula máximo + 1. En producción se usarían ObjectId o secuencias atómicas.
11. **¿Qué hace `useSyncExternalStore`?** Permite que React lea datos que viven fuera de él (`db.js`) y se redibuje cuando cambian.
12. **¿Qué es el proxy de Vite?** Reenvía `/api` al backend en desarrollo. En producción se necesitaría un servidor web o configurar la URL del backend.
13. **¿Cómo pruebas el backend?** Pruebas unitarias JUnit/Mockito (`./mvnw test`) y manualmente con Swagger/Postman.
14. **¿Cómo pruebas el frontend?** Jasmine + Karma (`npm test`) con `fetch` simulado; incluyen sesión JWT, roles y CRUD.

## 5.4 Checklist antes de presentar
- [ ] Backend encendido y conectado a Atlas (consola sin errores).
- [ ] Frontend encendido (`npm run dev`) y probado con los 3 roles.
- [ ] Swagger abierto con un token ya pegado en *Authorize*.
- [ ] Atlas abierto en *Browse Collections*.
- [ ] IP actual agregada en *Network Access* (si presentas desde otra red, vuelve a agregarla).
- [ ] Repositorios públicos con commits claros; `.env` **no** está subido.
- [ ] Sabes explicar de memoria los flujos 2.4 a 2.7.
- [ ] Tienes a mano el código de: `SecurityConfig`, `JwtService`, `AuthService`, `BoletaService`, `AuthProvider`, `api.js`, `db.js`, `App.jsx`.

## 5.5 Checklist de entregables (Anexo 1 y pauta)
| Entregable | Estado |
|---|---|
| Enlace GitHub público frontend / backend | Debes subirlos (sección 1.6) |
| Proyecto frontend y backend comprimidos | ✔ (`.zip` entregados; recuerda excluir `node_modules`, `target` y `.env`) |
| Swagger con endpoints CRUD | ✔ |
| Documento ERS | **Pendiente** (hay que redactarlo) |
| Manual de usuario con pantallazos | **Pendiente** (necesitas capturas de tu pantalla) |
| Documentación de APIs (Anexo 3, Excel) | Parte 4 de esta guía sirve como base |
| Documento de APIs e Integración (Anexo 2) | Partes 2 y 4 de esta guía sirven como base |
| Pruebas y resultado de comunicación | Pruebas unitarias incluidas; agrega capturas de Swagger/Postman |

---

# PARTE 6 · Limitaciones y mejoras posibles (di esto con honestidad si te preguntan)
- El stock no se descuenta de forma atómica (posible condición de carrera con compras simultáneas).
- Los ids se calculan como máximo + 1; con mucha concurrencia podrían colisionar.
- No hay endpoint para modificar boletas (no lo pide la pauta; una boleta no debería editarse).
- El JWT está en `localStorage` (ver 2.7b).
- No hay pruebas de integración contra Mongo real; las pruebas del backend usan mocks.
- El refresh usa el mismo token vigente (no hay un refresh token separado de larga duración).
