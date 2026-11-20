# PawPets – Frontend React (Evaluaciones Parciales 2 y 3, DSY1104)

Tienda online de mascotas migrada de HTML a **React + Vite + Bootstrap**, con pruebas
unitarias en **Jasmine + Karma**. Sigue la estructura del `proyectoCero` del profesor.

## Cómo ejecutarlo

```sh
# Antes: encender el backend (ver su README) en http://localhost:8080
npm install
npm run dev          # sitio en http://localhost:5173
npm test             # Jasmine + Karma (necesita Google Chrome instalado)
npm run lint
npm run build
```

Cuentas de prueba: administrador `admin@pawpets.cl` / `Admin123`; vendedor `vendedor@pawpets.cl` / `Vendedor123`; cliente `camila@correo.cl` / `Cliente123`.
Para probar el **pago con error**, en el checkout elige el medio de pago "Tarjeta sin fondos (simula error)".

## Organización (cada carpeta tiene una sola responsabilidad)

| Ruta              | Contenido                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `src/App.jsx`     | Mapa de navegación (react-router): vistas de la tienda y del administrador (Figuras 3 y 10). |
| `src/pages/`      | Una vista por pantalla de la tienda. `src/pages/admin/`: vistas del panel.                   |
| `src/components/` | Componentes reutilizables: `Producto`, `ListaProductos`, `Header`, `CampoFormulario`, etc.   |
| `src/layouts/`    | `TiendaLayout` (header + footer) y `AdminLayout` (menú lateral).                             |
| `src/context/`    | `AuthProvider` (sesión) y `CarritoProvider` (carrito). Los hooks están en `src/hooks/`.      |
| `src/data/`       | `db.js` (almacén en memoria conectado a la API: **CRUD**) y `contenido.js` (blogs y regiones). |
| `src/services/`   | `api.js`: cliente `fetch` de la API REST (`/api/v1`) con el token JWT.                       |
| `src/utils/`      | Funciones puras: validaciones, formato de precios, filtros, reportes.                        |
| `src/test/`       | Pruebas unitarias (`*.spec.jsx`).                                                            |

## Dónde está cada punto de la rúbrica

- **Framework JS bien estructurado (IE2.1.1 / IE2.1.3):** React 19 + Vite; todas las vistas del diagrama de flujo.
- **Props y estados (IE2.1.2 / IE2.1.4):**
  - Props: `Producto` recibe sus datos y `onAgregar`; `ListaProductos` recibe `productos`.
  - Estado local (`useState`): `Producto` (imagen fallida), `Header` (menú móvil), `DetalleProducto` (cantidad).
  - Estado compartido (Context): sesión y carrito.
  - Formularios controlados con el hook `useFormulario` + reglas de `utils/validaciones.js`.
- **Bootstrap responsive:** grilla (`row`/`col-*`), `navbar-expand-xl`, `table-responsive`, `form-control`, etc. La paleta de PawPets sobrescribe las variables de Bootstrap en `src/index.css`.
- **Archivo de datos + CRUD + persistencia:** `src/data/db.js` (`listar`, `obtener`, `crear`, `actualizar`, `eliminar`). `useColeccion` conecta `db` con React para que la interfaz se actualice sola.
- **Pruebas unitarias (IE2.2.1 / IE2.2.2):** 48 pruebas en 13 archivos de `src/test/`.
- **Proceso de testeo (IE2.3.1 / IE2.3.2):**
  - Configuración del entorno: `karma.conf.cjs` (Jasmine + webpack + Babel + Istanbul).
  - Mocks: `jasmine.createSpy` (callbacks, `iniciarSesion`, `cerrarSesion`), contextos simulados (`src/test/ayudas.jsx`) y `spyOn(Storage.prototype, 'setItem')`.
  - Cobertura: se genera en `coverage/html/index.html` al ejecutar `npm test`.

## Notas

- Las contraseñas se guardan en texto plano en localStorage **solo porque `db.js` simula una base de datos**; con backend real irían cifradas.
- La cobertura mide solo los archivos que las pruebas importan (25 de `src/`). Los otros 27 (varias páginas, el panel admin, los layouts, `App.jsx` y `main.jsx`) no aparecen en el reporte. El detalle está en `docs/cobertura-testing.md`.
- Las imágenes de categorías y productos están dentro del proyecto, en `public/img/categorias` y `public/img/productos`. Si un producto no tiene imagen se muestra el cuadro "Imagen no disponible" (en la tarjeta del producto también aparece si la imagen no carga).


## Conexión con el backend (Evaluación Parcial 3)

- La API vive en `http://localhost:8080/api/v1`. En desarrollo, `vite.config.js` reenvía `/api` hacia el backend.
- **Sesión:** login real con JWT. El token y el usuario se guardan en `localStorage` (`pawpets:sesion`), se renuevan cada 15 min y la sesión se cierra sola si el backend responde 401.
- **Roles:** `admin` (todo), `vendedor` (solo Productos y Órdenes, en lectura) y `cliente` (solo la tienda). Ver `RutaAdmin`, `AdminLayout` y `AdminEntidad`.
- **Compra:** el checkout exige sesión y envía solo ids y cantidades; el backend calcula precios, valida stock y descuenta stock.
- Guía completa (cómo arrancar, cómo funciona, defensa): `docs/GUIA_COMPLETA_PAWPETS.md`.
- Nota: `docs/cobertura-testing.md` corresponde a la entrega anterior (datos en localStorage).
