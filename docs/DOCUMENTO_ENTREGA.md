# Documento de entrega · PawPets (DSY1104 – Evaluación Parcial 3)

## 1. Resumen general

Se integró la tienda **PawPets** de punta a punta:

- **Backend nuevo** en Spring Boot 4.1.2 + Java 17 + Spring Data MongoDB (Atlas), con API REST versionada
  (`/api/v1`), documentada en Swagger, con lógica de negocio, manejo global de errores y seguridad con
  **Spring Security + JWT** y tres roles (administrador, vendedor, cliente).
- **Frontend React** (el de la Evaluación 2) conectado a la API: reemplaza la base simulada en `localStorage`
  por llamadas `fetch` centralizadas, sesión JWT persistente, restricciones por rol, estados de carga y error,
  y mejoras de diseño **sin cambiar la paleta ni el logo**.
- **VS Code** configurado para levantar y depurar todo, y **documentación** completa para instalar, entender
  y defender el proyecto.

Estado de las pruebas: **26/26** backend, **60/60** frontend, **65/65** casos de la API levantada,
flujos completos en el navegador con los 3 roles, **0 errores** en la consola y **0 errores de CORS**.

---

## 2. Cambios realizados

### Backend (`paw-pets-backend`) — antes era solo el esqueleto de Spring Initializr

| Archivo | Cambio | Por qué |
|---|---|---|
| `pom.xml` | `java.version` 21 → **17**; `groupId cl.duoc`, `artifactId paw-pets-backend`; dependencias Mongo, validación, security, oauth2-resource-server, springdoc 3.2.0; se quitaron etiquetas vacías | No compilaba con el JDK 17 (el del profesor); faltaban las dependencias de la pauta |
| Paquete `backend_paw_pets.cl.duoc` → **`cl.duoc.pawpets`** | Renombrado | Consistencia con `cl.duoc.catalogo` del profesor |
| `application.properties` | Puerto 8080, lectura de `.env`, URI de Mongo, JWT, CORS, ruta de Swagger | Configuración sin secretos en el código |
| `.env.example` (nuevo), `.gitignore` | Plantilla de secretos; `.env` ignorado | No subir credenciales |
| `model/` (5 clases) | Categoria, Producto, Usuario, Boleta, DetalleBoleta | Modelo de la Figura 1 |
| `repository/` (4) | `MongoRepository` + consultas derivadas | Acceso a Atlas |
| `service/` (5) | Reglas de negocio (ver `ARQUITECTURA.md`) | Lógica encapsulada y testeable |
| `controller/` (5) | Endpoints CRUD `/api/v1` con anotaciones de Swagger | API REST documentada |
| `dto/` (7) | Entradas validadas y salidas sin clave | Seguridad de los datos |
| `security/` (2) | JWT HS256 (generar, verificar, renovar), roles, BCrypt, 401/403 en JSON | Autenticación y autorización |
| `config/` (3) | CORS, Swagger (Authorize), carga inicial de datos | Integración y datos de prueba |
| `exception/` (6) | `@RestControllerAdvice` y excepciones por código HTTP | Errores uniformes |
| `resources/data/*.json` (nuevo) | Datos iniciales (los del frontend + usuario vendedor) | Base con datos al primer arranque |
| `ApplicationTests.java` → 6 clases de prueba | Se reemplazó la prueba que exigía conexión a Atlas por 26 pruebas unitarias | "Lógica testeada" (Anexo 1) |

### Frontend (`paw-pets-frontend`)

| Archivo | Cambio | Por qué |
|---|---|---|
| `src/services/api.js` (nuevo) | Cliente `fetch` único, `VITE_API_URL`, token, errores, aviso de 401 | Integración REST centralizada |
| `.env.example` / `.env` (nuevos), `.gitignore` | `VITE_API_URL`; `.env` ignorado | URL del backend por variable de entorno |
| `src/data/db.js` | De base simulada en `localStorage` a almacén conectado a la API (misma interfaz) | Integración sin reescribir todas las vistas |
| `src/data/seed.js` | Solo quedan blogs y regiones | Categorías, productos y usuarios vienen del backend |
| `src/hooks/useColeccion.js`, `useCarga.js` (nuevo) | Pide los datos y expone carga/error | Estados de carga y error |
| `src/context/AuthProvider.jsx` | Login/registro reales, JWT, persistencia, vencimiento, renovación, cierre ante 401; ya no descarga la lista de usuarios | Sesión segura (IE3.3.2) |
| `src/components/RutaAdmin.jsx`, `src/App.jsx`, `src/utils/roles.js` (nuevo) | Rutas protegidas por rol (admin / vendedor) | Restricciones (IE3.3.3) |
| `src/layouts/AdminLayout.jsx` | Menú filtrado por rol con íconos + barra superior | Rol vendedor y diseño |
| `src/pages/admin/entidades.jsx`, `AdminEntidad.jsx`, `AdminFormulario.jsx` | Roles por entidad, modo lectura del vendedor, clave opcional al editar, errores del backend, guardado asíncrono | Rol vendedor; corrección de la clave visible |
| `src/pages/admin/Perfil.jsx` | Sin campo rol; clave opcional | El admin no puede quitarse permisos |
| `Dashboard`, `Ordenes`, `Boleta`, `Reportes`, `HistorialCompras`, `ProductosCriticos` | Colección `boletas`, estados de carga, etiquetas de estado | Coherencia con la Figura 1 |
| `src/pages/Login.jsx`, `Registro.jsx` | Asíncronos, errores del servidor, redirección por rol y vuelta al checkout | Integración |
| `src/pages/Checkout.jsx`, `PagoResultado.jsx` | Exige sesión; envía solo ids y cantidades; muestra errores (stock); vendedor no compra | Lógica en el servidor; modelo USUARIO→BOLETA |
| `Home`, `Productos`, `Categorias`, `Ofertas`, `DetalleProducto`, `Carrito` | Esperan los datos del backend (`EstadoCarga`) | Sin listas vacías engañosas |
| `src/components/Estados.jsx`, `Icono.jsx` (nuevos), `CampoFormulario.jsx`, `FormularioEntidad.jsx`, `Producto.jsx`, `ListaProductos.jsx`, `Header.jsx` | Estados, íconos, errores accesibles, modo lectura | Diseño y accesibilidad |
| `src/utils/validaciones.js` | Regla `minimoSiHay` | Clave opcional al editar |
| `src/index.css`, `index.html` | Tokens de diseño y estilos; fuente Material Symbols | Mejoras de diseño (paleta intacta) |
| `src/test/*` | 48 → **60** pruebas: `fetch` simulado, sesión JWT, roles | Pruebas al día |
| `README.md` | Actualizado a la Evaluación 3 | Documentación |

### Raíz del proyecto

| Archivo | Qué es |
|---|---|
| `paw-pets.code-workspace`, `.vscode/extensions.json`, `tasks.json`, `launch.json` | VS Code: abrir ambos proyectos, tareas para levantar/probar, depuración del backend |
| `README.md`, `docs/*.md` | Documentación |
| `docs/capturas/` | Capturas usadas en el manual y en la documentación de integración |
| `docs/pruebas/` | Script de pruebas de la API (`probar_api.mjs`) y resultados de las tres suites |

---

## 3. Mejoras (y su impacto)

| Mejora | Impacto |
|---|---|
| Precios, total y stock calculados en el servidor | Seguridad: el navegador no puede alterar el monto |
| Validación con `@Valid` + errores por campo | Usabilidad: mensajes claros; datos consistentes |
| Errores en JSON uniforme y mostrados en pantalla | Usabilidad: el usuario sabe qué pasó (por ejemplo, "Stock insuficiente…") |
| Caché de colecciones en `db.js` (sin repetir GET) | Rendimiento: menos peticiones |
| Estados de carga, vacío y error con "Reintentar" | Usabilidad: ninguna pantalla queda en blanco o engañosa |
| Tokens de diseño (radios, sombras, bordes, espacios) | Consistencia visual y mantenimiento |
| Tarjetas con borde y sombra suave; hover en productos y accesos | Jerarquía visual sobre el fondo crema |
| Íconos Material Symbols en botones, menú, KPI y estados | Reconocimiento rápido de acciones |
| Estados con ícono + texto + color (Pagada/Rechazada, stock crítico, Oferta, Sin stock) | Accesibilidad: no dependen solo del color |
| Campos con borde visible, foco naranjo, error con ícono y `aria-describedby` | Accesibilidad y claridad en formularios |
| Panel con barra superior (sección, usuario, rol) y menú lateral fijo | Orientación; "Cerrar sesión" siempre visible |
| Pie de página siempre al fondo; botones del encabezado sin cortes | Orden visual |
| Impresión de boleta sin menú ni botones | Boleta limpia al imprimir |
| `prefers-reduced-motion` respetado | Accesibilidad |

---

## 4. Integraciones

| Integración | Detalle |
|---|---|
| Backend ↔ MongoDB Atlas | Spring Data MongoDB; URI en `.env` (`MONGODB_URI`) |
| Frontend ↔ Backend | `fetch` vía `services/api.js`; URL en `VITE_API_URL`; CORS para `http://localhost:5173` |
| Autenticación JWT | Login/registro/refresh; `Authorization: Bearer` en cada petición |
| Swagger | `/swagger-ui.html` y `/v3/api-docs` con 11 rutas y botón Authorize |
| VS Code | Workspace, tareas y depuración |

---

## 5. Checklist de requisitos

### Pauta (situación evaluativa 1 y 2)

| Requisito | Estado | Evidencia |
|---|:-:|---|
| Backend conectado a BD con lógica de negocio y modelos (IE3.1.1/3.1.2) | ✅ | `service/`, `model/`, 26 pruebas |
| CRUD REST con Spring Boot en Swagger (IE3.2.1/3.2.3) | ✅ | `controller/`, Swagger (captura 30) |
| Integración frontend–backend por API REST (IE3.2.2/3.2.4) | ✅ | `api.js`, `db.js`, Network sin errores |
| Autenticación con roles y JWT: generación, verificación y renovación (IE3.3.1/3.3.4) | ✅ | `SecurityConfig`, `JwtService`, `/auth/refresh` |
| Sesión persistente y segura en el frontend (IE3.3.2/3.3.5) | ✅ | `AuthProvider.jsx`, prueba de F5 |
| Restricciones de acceso por rol en el frontend (IE3.3.3/3.3.6) | ✅ | `RutaAdmin`, vendedor en modo lectura |

### Anexo 1

| Requisito | Estado |
|---|:-:|
| Proyecto Spring Boot con dependencias de BD y seguridad | ✅ |
| Conexión a la base de datos | ✅ (verificado con MongoDB local; **conexión a Atlas pendiente**, ver sección 6) |
| Entidades y relaciones de la Figura 1 | ✅ |
| Repositorios y servicios | ✅ |
| Lógica de negocio encapsulada y testeada | ✅ |
| Controladores CRUD + versionado de rutas | ✅ |
| Swagger | ✅ |
| Frontend con fetch/axios | ✅ (fetch) |
| Spring Security + JWT + roles | ✅ |
| Roles Administrador / Vendedor / Cliente con sus accesos | ✅ |
| Repositorio GitHub con commits claros | ❌ Pendiente: commits preparados a nombre de LeanVP; falta el push (sin permiso de escritura) |
| Documento ERS | ✅ `entrega/ERS_PawPets.docx` |
| Manual de usuario con pantallazos | ✅ `entrega/Manual_de_usuario_PawPets.docx` |
| Documentación de APIs (Anexo 3) | ✅ `entrega/Documentacion_APIs_PawPets.xlsx` |
| Documento APIs e integración (Anexo 2) | ✅ `entrega/Documentacion_APIs_e_Integracion_PawPets.docx` |
| Proyectos comprimidos | ✅ `entrega/*.zip` (sin `node_modules`, `target` ni `.env`) |

### Prompts de trabajo

| Requisito | Estado |
|---|:-:|
| No cambiar colores ni logo | ✅ (paleta de `index.css` y `Logo.jsx` intactos) |
| `.env` / `.env.example` en ambos proyectos; `.gitignore` con `.env`, `target/`, `node_modules/` | ✅ |
| CORS configurado | ✅ |
| Llamadas a la API centralizadas | ✅ |
| Estados de carga y error | ✅ |
| Workspace, extensiones, tareas y depuración en VS Code | ✅ |
| README, guía de instalación, arquitectura y guía de defensa | ✅ |
| Commits a nombre de LeanVP sin mención a Claude | ✅ preparados · push ❌ pendiente de permiso |

---

## 6. Resultado de las pruebas

| Prueba | Resultado |
|---|---|
| Backend `mvnw.cmd test` | ✅ **26/26** (`docs/pruebas/resultado_pruebas_backend.txt`) |
| Backend compila y levanta (`spring-boot:run`) | ✅ `Started Application`; datos iniciales cargados |
| API levantada: 65 casos (éxito y error por rol, 400/401/403/404/405/409, CORS, Swagger) | ✅ **65/65** (`docs/pruebas/resultado_pruebas_api.txt`) |
| Frontend `npm test` | ✅ **60/60**; cobertura 90,7 % sentencias · 80,9 % ramas · 85,5 % funciones · 91,5 % líneas |
| Frontend `npm run lint` / `npm run build` | ✅ sin avisos / compila |
| Navegador: compra cliente (login → checkout → boleta), pago rechazado, F5, cambio de rol en localStorage, vendedor (lectura y bloqueo de rutas), admin (CRUD, 409, reportes, historial, perfil) | ✅ |
| Pestaña Network | ✅ todas 200/201/204; preflight CORS 200 |
| Consola del navegador | ✅ sin errores ni advertencias |
| Móvil (390 px) y escritorio (1920 px) | ✅ sin desplazamiento horizontal; tablas desplazables dentro de su tarjeta |
| Conexión a MongoDB Atlas | ⏳ **Pendiente**: las pruebas se hicieron con un MongoDB 8.0 local en Docker (mismo driver y misma configuración, solo cambia la URI del `.env`). Falta repetir el arranque con la URI de Atlas |

**Problemas encontrados y corregidos durante las pruebas**

- El backend no compilaba (Java 21 en el `pom.xml` con JDK 17) → `java.version=17`.
- Una prueba de sesión pasaba o fallaba según el orden: el `expect` de Jasmine no lanza error y `waitFor` no reintentaba → la condición ahora lanza un error hasta cumplirse.
- La prueba de la API asumía un stock fijo → ahora compara con el stock leído antes de la compra.
- Textos de botones del encabezado partidos en dos líneas, buscador cortado, pie de página flotando, botones del menú del panel fuera de la vista y "Nuevo categoría" → corregidos.

---

## 7. Recomendaciones a futuro (no implementadas por estar fuera del alcance)

- **Despliegue en la nube** (material 3.3.1 Azure y 3.3.2 AWS EC2): es referencial y no lo exige la pauta.
- **Stock atómico** con una actualización condicional en MongoDB o una transacción, para compras simultáneas.
- **Ids con secuencias atómicas** (o `ObjectId`) en lugar de máximo + 1.
- **Token en cookie `HttpOnly`** y refresh token separado de larga duración, en vez de `localStorage`.
- **Pruebas de integración** contra una base real (por ejemplo Testcontainers) y pruebas E2E del frontend.
- **Paginación** en el catálogo y en las tablas del panel.
- **Íconos locales** (sin depender de internet) si la presentación es sin conexión.

---

## 8. Cómo levantar todo

Ver `docs/GUIA_INSTALACION.md`. Resumen:

```powershell
cd paw-pets-backend;  copy .env.example .env   # completar MONGODB_URI y JWT_SECRET
.\mvnw.cmd spring-boot:run                      # :8080
cd ..\paw-pets-frontend; copy .env.example .env
npm install; npm run dev                        # :5173
```

En VS Code: `paw-pets.code-workspace` → *Terminal → Ejecutar tarea → Levantar todo (backend + frontend)*.
