import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, CarritoContext } from '../context/contextos';

/** Producto de ejemplo para las pruebas. */
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

/** Catálogo de prueba (lo que respondería GET /productos). */
export const productosEjemplo = [
  productoEjemplo,
  { ...productoEjemplo, id: 2, nombre: 'Arena Gato', precio: 5000, precioOferta: 4000, stock: 3 },
  { ...productoEjemplo, id: 5, nombre: 'Collar', precio: 3000, stock: 4 },
];

/** Renderiza dentro de un router en memoria y, opcionalmente, con contextos simulados (mocks). */
export function renderizar(ui, { ruta = '/', auth, carrito } = {}) {
  let arbol = <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>;
  if (carrito)
    arbol = <CarritoContext.Provider value={carrito}>{arbol}</CarritoContext.Provider>;
  if (auth) arbol = <AuthContext.Provider value={auth}>{arbol}</AuthContext.Provider>;
  return render(arbol);
}

/**
 * Crea un JWT de prueba (sin firma real) con el vencimiento indicado en minutos.
 * El frontend solo lee "exp"; la firma la valida el backend.
 */
export function tokenDePrueba(minutos = 60, datos = {}) {
  const base64 = (objeto) =>
    btoa(JSON.stringify(objeto)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  return `${base64({ alg: 'HS256' })}.${base64({ sub: '1', exp, ...datos })}.firma`;
}

/** Respuesta HTTP falsa, como la que entrega fetch. */
export function respuestaJson(cuerpo, estado = 200) {
  return Promise.resolve(
    new Response(cuerpo === null ? null : JSON.stringify(cuerpo), {
      status: estado,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/**
 * Reemplaza window.fetch por un mock (spy de Jasmine).
 * rutas: { 'GET /productos': [..] } o { 'POST /auth/login': (cuerpo) => [respuesta, estado] }.
 * Devuelve el spy para revisar con qué se llamó.
 */
export function simularApi(rutas) {
  return spyOn(window, 'fetch').and.callFake((url, opciones = {}) => {
    const metodo = opciones.method ?? 'GET';
    const ruta = String(url).replace(/^.*\/api\/v1/, '');
    const clave = `${metodo} ${ruta}`;
    if (!(clave in rutas)) return respuestaJson({ mensaje: `Sin mock para ${clave}` }, 404);
    const definida = rutas[clave];
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined;
    const [datos, estado = 200] =
      typeof definida === 'function' ? definida(cuerpo, opciones) : [definida];
    return respuestaJson(datos, estado);
  });
}
