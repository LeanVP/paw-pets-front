/**
 * Almacén de datos del frontend, conectado al backend (reemplaza al antiguo localStorage).
 * - Mantiene en memoria una copia de cada colección que llega de la API.
 * - cargar() trae la colección con GET; crear/actualizar/eliminar llaman a POST/PUT/DELETE
 *   y recién cuando el backend responde actualizan la copia y avisan a React.
 * - useColeccion usa listar() y suscribir() para que las pantallas se redibujen solas.
 */
import api from '../services/api';

// Colección del frontend -> ruta de la API
const RUTAS = {
  categorias: '/categorias',
  productos: '/productos',
  usuarios: '/usuarios',
  boletas: '/boletas',
};
// Funciones que hay que avisar cuando cambian los datos
const suscriptores = new Set();
// Copia en memoria de cada colección (referencia estable mientras no cambie)
const cache = {};
// Lista vacía compartida: así listar() devuelve siempre la misma referencia antes de cargar
const VACIA = [];

function validar(coleccion) {
  if (!RUTAS[coleccion]) throw new Error(`Colección desconocida: ${coleccion}`);
}

// Guarda en memoria y avisa a todos
function guardar(coleccion, datos) {
  cache[coleccion] = datos;
  suscriptores.forEach((avisar) => avisar());
}

const db = {
  // Devuelve la copia en memoria (lista vacía si todavía no se ha cargado)
  listar(coleccion) {
    validar(coleccion);
    return cache[coleccion] ?? VACIA;
  },

  // Busca un elemento por id en la copia en memoria
  obtener(coleccion, id) {
    return this.listar(coleccion).find((item) => item.id === Number(id));
  },

  // READ: pide la colección al backend y la guarda
  async cargar(coleccion) {
    validar(coleccion);
    guardar(coleccion, await api.get(RUTAS[coleccion]));
  },

  // CREATE: el backend asigna el id y devuelve el registro creado
  async crear(coleccion, datos) {
    validar(coleccion);
    const nuevo = await api.post(RUTAS[coleccion], datos);
    guardar(coleccion, [...this.listar(coleccion), nuevo]);
    return nuevo;
  },

  // UPDATE: el backend devuelve el registro ya actualizado
  async actualizar(coleccion, id, cambios) {
    validar(coleccion);
    const actualizado = await api.put(`${RUTAS[coleccion]}/${id}`, cambios);
    guardar(
      coleccion,
      this.listar(coleccion).map((item) => (item.id === Number(id) ? actualizado : item)),
    );
    return actualizado;
  },

  // DELETE: si el backend lo permite, lo saca de la copia
  async eliminar(coleccion, id) {
    validar(coleccion);
    await api.delete(`${RUTAS[coleccion]}/${id}`);
    guardar(
      coleccion,
      this.listar(coleccion).filter((item) => item.id !== Number(id)),
    );
  },

  // Permite que un componente se entere de los cambios; devuelve la función para cancelar
  suscribir(avisar) {
    suscriptores.add(avisar);
    return () => suscriptores.delete(avisar);
  },

  // Olvida todo lo cargado (se usa al cerrar sesión y en las pruebas)
  reiniciar() {
    Object.keys(cache).forEach((coleccion) => delete cache[coleccion]);
    suscriptores.forEach((avisar) => avisar());
  },
};

export default db;
