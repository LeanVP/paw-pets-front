// Este archivo no es una prueba: tiene datos y funciones de apoyo que usan los .spec.jsx
// render: función de Testing Library que dibuja un componente en una página de prueba
import { render } from '@testing-library/react';
// MemoryRouter: router que guarda la URL en memoria (sirve en pruebas, sin navegador real)
import { MemoryRouter } from 'react-router-dom';
// Los contextos reales, para poder entregarles valores falsos
import { AuthContext, CarritoContext } from '../context/contextos';

/** Producto de ejemplo para las pruebas. */
// Datos inventados con la misma forma que un producto real (precio $10.000, sin oferta)
export const productoEjemplo = {
  id: 1,
  nombre: 'Alimento Perro',
  categoriaId: 1,
  precio: 10000,
  precioOferta: 0,
  stock: 10,
  imagen: 'https://ejemplo.cl/foto.jpg',
  descripcion: 'Descripción',
};

/** Renderiza dentro de un router en memoria y, opcionalmente, con contextos simulados (mocks). */
// Opciones: ruta inicial, sesión falsa y carrito falso
// ui = el componente a probar, por ejemplo <Header />
export function renderizar(ui, { ruta = '/', auth, carrito } = {}) {
  // Siempre envuelve en un router para que funcionen los links
  // initialEntries dice en qué URL parte la prueba
  let arbol = <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>;
  // Si se pasa carrito, lo agrega como contexto
  // Así el componente cree que hay un carrito, sin usar el CarritoProvider real
  if (carrito)
    arbol = <CarritoContext.Provider value={carrito}>{arbol}</CarritoContext.Provider>;
  // Si se pasa sesión, la agrega como contexto
  // Así el componente cree que hay una sesión, sin usar el AuthProvider real
  if (auth) arbol = <AuthContext.Provider value={auth}>{arbol}</AuthContext.Provider>;
  // Dibuja todo y devuelve las herramientas de Testing Library
  return render(arbol);
}

/** Productos de ejemplo con la forma que devuelve GET /api/v1/productos. */
export const productosPrueba = [
  { id: 1, nombre: 'Alimento Perro', categoriaId: 1, precio: 10000, precioOferta: 0, stock: 10, imagen: '', descripcion: 'd', destacado: true },
  { id: 2, nombre: 'Collar', categoriaId: 2, precio: 5000, precioOferta: 4000, stock: 5, imagen: '', descripcion: 'd', destacado: false },
  { id: 3, nombre: 'Juguete', categoriaId: 2, precio: 3000, precioOferta: 0, stock: 8, imagen: '', descripcion: 'd', destacado: false },
  { id: 5, nombre: 'Arena', categoriaId: 3, precio: 7000, precioOferta: 0, stock: 4, imagen: '', descripcion: 'd', destacado: false },
];

/**
 * Reemplaza fetch por una versión falsa: no hace falta backend para probar.
 * respuestas: { 'GET /api/v1/productos': [...], 'POST /api/v1/auth/login': { estado: 401, cuerpo: {...} } }
 * Devuelve el espía de Jasmine para poder revisar con qué se llamó.
 */
export function simularApi(respuestas) {
  return spyOn(window, 'fetch').and.callFake(async (url, opciones = {}) => {
    const clave = `${opciones.method ?? 'GET'} ${url}`;
    const definida = respuestas[clave];
    // Sin respuesta definida: error 404 con el mensaje de qué faltó
    if (definida === undefined) {
      return new Response(JSON.stringify({ mensaje: `Sin respuesta simulada: ${clave}` }), { status: 404 });
    }
    // Puede ser solo el cuerpo (200) o { estado, cuerpo }
    const { estado = 200, cuerpo = null } =
      definida && typeof definida === 'object' && 'estado' in definida ? definida : { cuerpo: definida };
    return new Response(estado === 204 ? null : JSON.stringify(cuerpo), { status: estado });
  });
}
