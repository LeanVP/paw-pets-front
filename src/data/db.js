/**
 * Almacén de datos del frontend, conectado a la API REST.
 * - Guarda en memoria cada colección que entrega el backend (caché compartida por toda la app).
 * - cargar() hace GET; crear/actualizar/eliminar hacen POST/PUT/DELETE y actualizan la caché.
 * - Por cada colección guarda también si está cargando y si hubo un error.
 * - Avisa a los suscriptores (hooks useColeccion/useCarga) para que React redibuje.
 * Los blogs no están en el modelo de la pauta: son contenido estático (seed.js).
 */
import api from '../services/api';
import { blogs } from './seed';

// Ruta de la API de cada colección
const RUTAS = {
  categorias: '/categorias',
  productos: '/productos',
  usuarios: '/usuarios',
  boletas: '/boletas',
};
// Colecciones que dependen del usuario conectado (se olvidan al cambiar de sesión)
const PRIVADAS = ['usuarios', 'boletas'];

const VACIO = [];
const INICIAL = { datos: VACIO, cargando: false, cargado: false, error: null };
const ESTATICAS = { blogs: { ...INICIAL, datos: blogs, cargado: true } };

// estados[coleccion] = { datos, cargando, cargado, error }
const estados = {};
const suscriptores = new Set();

function avisar() {
  suscriptores.forEach((funcion) => funcion());
}

function ruta(coleccion) {
  if (!RUTAS[coleccion]) throw new Error(`Colección desconocida: ${coleccion}`);
  return RUTAS[coleccion];
}

// Reemplaza el estado por uno nuevo (objeto nuevo = React detecta el cambio) y avisa
function fijar(coleccion, cambios) {
  estados[coleccion] = { ...db.estado(coleccion), ...cambios };
  avisar();
}

const db = {
  /** Estado completo de una colección: { datos, cargando, cargado, error }. */
  estado(coleccion) {
    if (ESTATICAS[coleccion]) return ESTATICAS[coleccion];
    ruta(coleccion);
    return estados[coleccion] ?? INICIAL;
  },

  listar(coleccion) {
    return this.estado(coleccion).datos;
  },

  /** Busca por id. Number(id) porque el id puede venir como texto desde la URL. */
  obtener(coleccion, id) {
    return this.listar(coleccion).find((item) => item.id === Number(id));
  },

  /** GET a la API. No repite la petición si ya se cargó o si está en curso (salvo forzar). */
  async cargar(coleccion, { forzar = false } = {}) {
    if (ESTATICAS[coleccion]) return;
    const actual = this.estado(coleccion);
    if (actual.cargando || (actual.cargado && !forzar)) return;
    fijar(coleccion, { cargando: true, error: null });
    try {
      const datos = await api.get(ruta(coleccion));
      fijar(coleccion, { datos, cargando: false, cargado: true });
    } catch (error) {
      fijar(coleccion, { cargando: false, error: error.message });
    }
  },

  recargar(coleccion) {
    return this.cargar(coleccion, { forzar: true });
  },

  /** POST: crea en el backend y agrega la respuesta (con su id) a la caché. */
  async crear(coleccion, datos) {
    const nuevo = await api.post(ruta(coleccion), datos);
    if (this.estado(coleccion).cargado) {
      fijar(coleccion, { datos: [...this.listar(coleccion), nuevo] });
    }
    return nuevo;
  },

  /** PUT: actualiza en el backend y reemplaza el registro en la caché. */
  async actualizar(coleccion, id, datos) {
    const actualizado = await api.put(`${ruta(coleccion)}/${id}`, datos);
    fijar(coleccion, {
      datos: this.listar(coleccion).map((item) =>
        item.id === actualizado.id ? actualizado : item,
      ),
    });
    return actualizado;
  },

  /** DELETE: elimina en el backend y lo saca de la caché. */
  async eliminar(coleccion, id) {
    await api.eliminar(`${ruta(coleccion)}/${id}`);
    fijar(coleccion, {
      datos: this.listar(coleccion).filter((item) => item.id !== Number(id)),
    });
  },

  /** Carga datos directamente (pruebas unitarias). */
  establecer(coleccion, datos) {
    fijar(coleccion, { datos, cargando: false, cargado: true, error: null });
  },

  /** Permite que un componente se entere de los cambios; devuelve la función para cancelar. */
  suscribir(funcion) {
    suscriptores.add(funcion);
    return () => suscriptores.delete(funcion);
  },

  /** Olvida los datos del usuario anterior (al iniciar o cerrar sesión). */
  olvidarPrivadas() {
    PRIVADAS.forEach((coleccion) => delete estados[coleccion]);
    avisar();
  },

  /** Vacía toda la caché (pruebas). */
  reiniciar() {
    Object.keys(estados).forEach((coleccion) => delete estados[coleccion]);
    avisar();
  },
};

export default db;
