# Guía de defensa · PawPets (presentación individual)

> Según el Anexo 1, la presentación dura hasta **15 minutos + 5 de preguntas** y **cada estudiante responde
> por todo el sistema**. El docente pregunta por el código y por los cambios en GitHub.
> Practica mostrando el código, no solo diciéndolo.

---

## 1. Antes de presentar (checklist)

- [ ] Backend encendido (`Started Application`) y conectado a Atlas.
- [ ] Frontend encendido (`npm run dev`) en <http://localhost:5173>.
- [ ] Atlas abierto en *Browse Collections* (base `pawpets`).
- [ ] IP actual agregada en Atlas → *Network Access* (si presentas desde otra red).
- [ ] Swagger abierto en <http://localhost:8080/swagger-ui.html>.
- [ ] Chrome con DevTools → pestaña **Network** lista.
- [ ] Internet disponible (los íconos se cargan desde Google Fonts).
- [ ] En VS Code, abiertos: `SecurityConfig`, `JwtService`, `BoletaService`, `GlobalExceptionHandler`,
      `AuthProvider.jsx`, `services/api.js`, `App.jsx`, `RutaAdmin.jsx`.
- [ ] Repositorios públicos con commits claros; ningún `.env` subido.

---

## 2. Guion (10 minutos; se estira a 15 con la demo completa)

| Min | Qué mostrar | Qué decir (resumen) |
|---|---|---|
| 0–1 | `docs/ARQUITECTURA.md` (diagrama) | "PawPets es una tienda de mascotas: frontend React que consume una API REST en Spring Boot, con datos en MongoDB Atlas y seguridad con JWT y tres roles." |
| 1–2 | Atlas → colecciones + tabla del modelo | "Las 5 tablas de la Figura 1 quedan en 4 colecciones: el detalle de la boleta va incrustado. Las relaciones son ids." |
| 2–4 | Carpetas del backend + `BoletaService` | "Capas como en el proyecto del profesor: controller, service, repository, model. La lógica de la compra está en el servicio: el servidor calcula precios y total, valida y descuenta stock." |
| 4–5 | Swagger | "Todos los endpoints están versionados en `/api/v1` y documentados con springdoc. Ejecuto login, copio el token y lo pego en Authorize." |
| 5–7 | Sitio: comprar como cliente + pestaña Network | "El front usa `fetch` desde un solo servicio (`api.js`). En Network se ve el preflight CORS, el `POST /boletas` con el header Authorization y la respuesta 201." |
| 7–8 | `SecurityConfig` + `JwtService` | "El token se firma con HS256. En cada petición el `JwtDecoder` valida la firma y el vencimiento; el claim `rol` se convierte en `ROLE_ADMIN`, etc. Sin token, 401; sin permiso, 403." |
| 8–9 | `AuthProvider.jsx` + F5 | "La sesión `{token, usuario}` vive en localStorage, por eso sobrevive al recargar. Un token vencido se descarta; se renueva cada 15 minutos; un 401 cierra la sesión." |
| 9–10 | Login como vendedor y como cliente | "`RutaAdmin` y el menú filtran por rol: el vendedor solo ve Productos (lectura) y Órdenes. Si fuerzo la URL `/admin/usuarios`, me devuelve; y en Swagger el backend responde 403." |

**Cierre (una frase):** "El frontend guía al usuario según su rol, pero la seguridad real la impone el backend con el JWT firmado."

---

## 3. Orden sugerido para la demo en vivo

1. **Tienda como visitante:** inicio → productos (filtro por categoría) → detalle → agregar al carrito.
2. **Checkout sin sesión:** pide iniciar sesión (el carrito se conserva).
3. **Login como cliente** (`camila@correo.cl` / `Cliente123`) → vuelve al checkout con los datos cargados.
4. **Pago rechazado:** medio "Tarjeta sin fondos (simula error)" → página de error (no descuenta stock).
5. **Pago exitoso:** con tarjeta de crédito → boleta. Mostrar en **Atlas** el documento nuevo en `boletas`
   y el stock descontado en `productos`.
6. **F5** en cualquier página: la sesión sigue.
7. **Network:** mostrar `POST /api/v1/boletas` → 201, header `Authorization: Bearer ...`.
8. **Login como vendedor** (`vendedor@pawpets.cl` / `Vendedor123`): menú con 2 secciones, "modo lectura",
   "Ver detalle" con campos bloqueados. Escribir `/admin/usuarios` en la barra → vuelve a Productos.
9. **Login como admin** (`admin@pawpets.cl` / `Admin123`): Dashboard, crear/editar producto, intentar
   eliminar "Alimentos Perro" → mensaje 409 del backend, Reportes.
10. **Swagger:** `GET /api/v1/usuarios` sin Authorize → 401; con token de vendedor → 403; con token de admin → 200.

---

## 4. Conceptos clave explicados simple

| Concepto | Explicación para la defensa |
|---|---|
| **Spring Boot** | Framework de Java que arma una aplicación lista para ejecutar, con servidor web incluido y configuración automática. Uso `@RestController`, `@Service`, `@Repository` y Spring inyecta las dependencias por el constructor. |
| **Maven** | Gestor de dependencias y de construcción de Java. Las dependencias están en `pom.xml`. El *wrapper* (`mvnw.cmd`) descarga Maven solo, por eso no hay que instalarlo. |
| **REST** | Estilo de API sobre HTTP: cada recurso tiene una URL (`/api/v1/productos`) y el verbo indica la acción: GET leer, POST crear (201), PUT actualizar, DELETE eliminar (204). Responde JSON y códigos de estado. |
| **Versionado de API** | Las rutas parten en `/api/v1`. Si cambia el contrato se crea `/api/v2` sin romper a los clientes que usan v1. |
| **Swagger / OpenAPI** | springdoc lee los controladores y sus anotaciones (`@Operation`, `@ApiResponse`, `@Schema`) y genera documentación interactiva para probar la API. |
| **MongoDB / NoSQL** | Base de documentos JSON (BSON) agrupados en colecciones, sin esquema fijo ni JOIN. Las relaciones se modelan con ids o documentos incrustados. |
| **MongoDB Atlas** | MongoDB administrado en la nube. El backend se conecta con la URI `mongodb+srv://...` que está en el `.env`. |
| **Spring Data MongoDB** | `MongoRepository` entrega `findAll`, `save`, `findById`, `deleteById`... y crea consultas a partir del nombre del método (`findByCorreoIgnoreCase`). |
| **CORS** | El navegador bloquea llamadas entre orígenes distintos (5173 → 8080) salvo que el servidor lo permita. `CorsConfig` autoriza el origen del frontend; antes de un POST con token el navegador manda un *preflight* `OPTIONS`. |
| **Variables de entorno** | Valores que cambian por equipo o son secretos (URI de Atlas, clave JWT, URL de la API) van en `.env`, que no se sube a GitHub. Se versiona solo `.env.example`. |
| **Arquitectura en capas** | Controller (HTTP) → Service (reglas de negocio) → Repository (datos) → Model (documentos). Cada capa tiene una responsabilidad y se puede probar por separado. |
| **JWT** | Token de tres partes (cabecera.payload.firma). El payload lleva `sub` (id), `rol`, `exp`. La firma HS256 con la clave secreta impide modificarlo. |
| **BCrypt** | Algoritmo de hash con sal para contraseñas: no se puede revertir; para validar se usa `matches`. |
| **Stateless** | El servidor no guarda sesiones: cada petición trae su token. Por eso se desactiva CSRF (no hay cookies de sesión). |
| **`@RestControllerAdvice`** | Manejo global de excepciones: cada error se convierte en un JSON uniforme con su código HTTP. |
| **DTO** | Objetos de entrada/salida distintos del modelo, para no exponer datos (la clave) ni aceptar campos peligrosos (precios en la compra). |

---

## 5. Cómo se cumple cada criterio de la pauta

| Indicador | Cómo se cumple | Archivos que lo demuestran |
|---|---|---|
| **IE3.1.1 / IE3.1.2** Backend con BD, lógica de negocio y modelos (8 % + 12 %) | Spring Boot + Spring Data MongoDB conectado a Atlas por `.env`. Modelo de la Figura 1. Reglas: precios y total en el servidor, stock, pago rechazado, oferta < precio, categoría con productos no se elimina, correo único, registro solo como cliente | `model/*`, `repository/*`, `service/BoletaService.java`, `service/ProductoService.java`, `application.properties`, `DataSeeder.java`, tests de servicios |
| **IE3.2.1 / IE3.2.3** API REST CRUD documentada en Swagger (8 % + 12 %) | CRUD completo de categorías, productos y usuarios; boletas crear/listar/obtener; rutas `/api/v1`; códigos 200/201/204/400/401/403/404/409; `@Operation`/`@ApiResponse`; botón Authorize | `controller/*`, `config/OpenApiConfig.java`, `exception/GlobalExceptionHandler.java`, Swagger UI |
| **IE3.2.2 / IE3.2.4** Integración frontend–backend (6 % + 10 %) | `fetch` centralizado, URL por `VITE_API_URL`, CORS, almacén `db.js`, estados de carga/error, solo se envían ids y cantidades | `services/api.js`, `data/db.js`, `hooks/useColeccion.js`, `hooks/useCarga.js`, `components/Estados.jsx`, `config/CorsConfig.java` |
| **IE3.3.1 / IE3.3.4** Autenticación con roles y JWT (6 % + 10 %) | Spring Security stateless; JWT HS256 con `exp` e `iss`; generación (`JwtService`), verificación (`JwtDecoder`) y **renovación** (`/auth/refresh`); roles admin/vendedor/cliente por ruta; BCrypt | `security/SecurityConfig.java`, `security/JwtService.java`, `service/AuthService.java`, `JwtServiceTest`, `AuthServiceTest` |
| **IE3.3.2 / IE3.3.5** Sesión en el frontend (6 % + 8 %) | `{token, usuario}` en localStorage (sobrevive F5); descarte del token vencido; cierre al vencer; renovación cada 15 min; cierre ante 401; el rol que vale es el del token | `context/AuthProvider.jsx`, `services/api.js`, `test/AuthProvider.spec.jsx` |
| **IE3.3.3 / IE3.3.6** Restricciones en el frontend (6 % + 8 %) | `RutaAdmin` con roles, rutas anidadas, menú filtrado, botones ocultos, modo lectura del vendedor, checkout exige sesión, vendedor no compra | `components/RutaAdmin.jsx`, `App.jsx`, `layouts/AdminLayout.jsx`, `pages/admin/entidades.jsx`, `AdminEntidad.jsx`, `AdminFormulario.jsx`, `test/RutaAdmin.spec.jsx` |

---

## 6. Preguntas probables y respuestas

1. **¿Por qué MongoDB si el Anexo 1 habla de base relacional?**
   Porque el material del curso incluye el ejemplo `BackendMongoSitioFull` del profesor con MongoDB y Atlas.
   El modelo de la Figura 1 se respeta: cada tabla es una colección (o un documento incrustado) y las
   relaciones se guardan con ids. Una boleta con su detalle calza naturalmente como documento.
2. **¿Dónde está la lógica de negocio?** En `service/`. Ejemplo: `BoletaService.crear` busca los productos,
   valida stock, calcula precios con oferta, decide si el pago se aprueba y descuenta el stock.
3. **¿Por qué el total lo calcula el servidor?** Porque el navegador se puede manipular: si el front enviara el
   precio, alguien podría pagar $1. El `BoletaRequest` ni siquiera tiene campos de precio.
4. **¿Qué es un JWT y qué lleva el tuyo?** Cabecera, payload y firma. El payload tiene `sub` (id), `rol`,
   `correo`, `iat`, `exp` (60 min) e `iss`. La firma HS256 usa `JWT_SECRET`.
5. **¿Cómo se verifica el token?** `SecurityConfig` define un `JwtDecoder` que en cada petición valida la firma,
   el vencimiento y el emisor. Si falla, responde 401 en JSON.
6. **¿Cómo se aplican los roles?** El claim `rol` se convierte en `ROLE_ADMIN`, `ROLE_VENDEDOR` o `ROLE_CLIENTE`
   y `authorizeHttpRequests` usa `hasRole`/`hasAnyRole` por ruta y método. Además `BoletaService` filtra:
   un cliente solo ve sus boletas.
7. **¿Cómo se renueva el token?** `POST /api/v1/auth/refresh` con un token vigente entrega uno nuevo. El front lo
   llama al abrir la página y cada 15 minutos.
8. **¿Qué pasa si edito el rol en localStorage a "admin"?** El menú podría cambiar un instante, pero el rol
   real va dentro del token firmado: el backend responde 403 y además al recargar el refresh devuelve el rol
   verdadero y la app redirige. (Lo probé en la demo.)
9. **¿Dónde guardas las contraseñas?** Como hash BCrypt en `usuarios.clave`. Nunca se devuelven: la API responde
   `UsuarioResponse`, que no tiene clave.
10. **¿Puede alguien registrarse como admin?** No. `AuthService.registrar` siempre asigna `cliente`; solo un admin
    puede crear vendedores o admins.
11. **¿Por qué `localStorage` y no cookies?** Es la forma más simple de que la sesión sobreviva al F5. El riesgo es
    XSS; lo mitigo con token de vida corta, renovación, cierre ante 401 y que React escapa el contenido. La
    alternativa más segura serían cookies `HttpOnly`.
12. **¿Qué es CORS y dónde lo configuraste?** Es la política del navegador para llamadas entre orígenes. Está en
    `CorsConfig` (como en la guía 3.2.2) y Spring Security la usa con `.cors(...)`. Un origen no permitido recibe 403.
13. **¿Cómo manejas los errores?** `GlobalExceptionHandler` con `@RestControllerAdvice` convierte excepciones en
    `{estado, error, mensaje, campos}`. El front muestra `mensaje` con `AlertaError`.
14. **¿Por qué usaste DTO?** Para no exponer la clave y para no aceptar campos que el cliente no debe controlar
    (precios, total, rol en el registro).
15. **¿Cómo pruebas el backend?** 43 pruebas (`mvnw.cmd test`), sin necesitar Atlas: 29 unitarias (JUnit 5 + Mockito)
    de los servicios y de JWT, y 14 de **integración** con MockMvc que pasan por controladores, Spring Security,
    JWT, CORS y validación (401 sin token, 403 por rol, token vencido/manipulado, CRUD completo, 409). JaCoCo
    deja el reporte de cobertura en `target/site/jacoco/index.html`; además se probó cada endpoint levantado (65 casos de éxito y de error, ver
    `DOCUMENTO_ENTREGA.md`) y se puede repetir en Swagger o Postman.
16. **¿Cómo pruebas el frontend?** 68 pruebas Jasmine + Karma, con `fetch` simulado: sesión JWT, roles, CRUD de
    `db.js`, formularios y carrito. `PanelPorRol.spec.jsx` comprueba qué ve cada rol: el admin todo el menú, el
    vendedor solo Órdenes y Productos en modo lectura, y el cliente vuelve a la tienda.
17. **¿Por qué el `.env` no está en GitHub?** Porque tiene la contraseña de Atlas y la clave del JWT. Está en
    `.gitignore`; se sube solo `.env.example`.
18. **¿Por qué una boleta no tiene PUT ni DELETE?** Una boleta emitida es un documento de venta: no debería
    modificarse. Por eso solo se crea y se consulta (si se llama a PUT responde 405).
19. **¿Qué pasa si dos clientes compran el último producto al mismo tiempo?** Es una limitación conocida: la
    validación de stock no es atómica. La mejora sería una actualización condicional atómica en Mongo
    (`stock >= cantidad`) o una transacción.
20. **¿Cómo se ejecuta todo en VS Code?** `paw-pets.code-workspace` + tarea "Levantar todo"; el backend se depura
    con la configuración "Depurar backend (Spring Boot)" y puntos de interrupción.

---

## 7. Si algo falla durante la demo

| Problema | Qué hacer |
|---|---|
| El backend no conecta a Atlas (timeout) | Atlas → *Network Access* → **Add Current IP Address**; esperar 1 minuto y reiniciar el backend |
| El sitio dice "No se pudo conectar con el servidor" | Revisar que el backend esté encendido en el 8080 y que `VITE_API_URL` sea `http://localhost:8080/api/v1` |
| Error de CORS en la consola | Abrir el sitio en `http://localhost:5173` (no 127.0.0.1) o ajustar `CORS_ORIGIN` |
| `Port 8080 was already in use` | Cerrar el programa que usa el puerto (otro backend, Docker) |
| La sesión se cerró sola | El token venció o el backend se reinició con otro `JWT_SECRET`: volver a iniciar sesión |
| Los íconos aparecen como texto | Sin internet; seguir la demo (todo funciona igual) |
| Sin internet en la sala | Mostrar la demo con capturas de `docs/capturas/` y explicar el código; las pruebas (`mvnw.cmd test`, `npm test`) funcionan sin red |
| Swagger da 401 | Falta pegar el token en **Authorize** (sin la palabra "Bearer") |
