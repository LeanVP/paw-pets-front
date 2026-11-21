# PawPets – Frontend React (Evaluación Parcial 3, DSY1104)

Tienda online de mascotas en **React + Vite + Bootstrap**, conectada a la API REST del backend
[paw-pets-backend](https://github.com/LeanVP/paw-pets-backend) (Spring Boot + MongoDB Atlas + JWT).
Pruebas unitarias con **Jasmine + Karma**.

## Cómo ejecutarlo

Necesita el backend encendido en `http://localhost:8080`.

```sh
copy .env.example .env   # VITE_API_URL=http://localhost:8080/api/v1
npm install
npm run dev              # sitio en http://localhost:5173
npm test                 # 68 pruebas Jasmine + Karma (necesita Google Chrome)
npm run lint
npm run build
```

Cuentas de prueba: administrador `admin@pawpets.cl` / `Admin123`; vendedor `vendedor@pawpets.cl` /
`Vendedor123`; cliente `camila@correo.cl` / `Cliente123`.
Para probar un **pago rechazado**, en el checkout elige "Tarjeta sin fondos (simula error)".

## Organización

| Ruta | Contenido |
|---|---|
| `src/App.jsx` | Rutas de la tienda y del panel, protegidas por rol |
| `src/services/api.js` | Único cliente HTTP (`fetch`): URL de `VITE_API_URL`, token JWT y errores |
| `src/data/db.js` | Almacén de datos conectado a la API (GET, POST, PUT, DELETE) con estados de carga y error |
| `src/data/seed.js` | Contenido estático: blogs y regiones/comunas |
| `src/context/` | `AuthProvider` (sesión JWT) y `CarritoProvider` (carrito en `localStorage`) |
| `src/hooks/` | `useColeccion`, `useCarga`, `useAuth`, `useCarrito`, `useFormulario` |
| `src/components/` | Componentes reutilizables: `Producto`, `Header`, `RutaAdmin`, `Estados`, `Icono`, campos de formulario |
| `src/layouts/` | `TiendaLayout` y `AdminLayout` (menú lateral por rol) |
| `src/pages/` | Vistas de la tienda; `src/pages/admin/`: vistas del panel |
| `src/utils/` | Validaciones, formato de precios, productos, reportes y roles |
| `src/test/` | 68 pruebas (`*.spec.jsx`) con `fetch` simulado |

## Roles en el frontend

- **Administrador:** todo el panel (Dashboard, Órdenes, Productos, Categorías, Usuarios, Reportes, Perfil).
- **Vendedor:** solo Productos (lectura, "Ver detalle") y Órdenes. No puede comprar.
- **Cliente:** solo la tienda; para pagar debe iniciar sesión.

Las restricciones del frontend guían al usuario; la seguridad real está en el backend (401/403).

## Diseño

La paleta de PawPets (`src/index.css`) y el logo se mantienen. Se agregaron tokens de diseño (radios, sombras,
bordes, espaciados), íconos de Google Material Symbols y estados accesibles (ícono + texto + color).

Documentación completa (instalación, arquitectura, guía de defensa): carpeta [`docs/`](docs/).
