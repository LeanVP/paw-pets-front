/**
 * Cliente de la API REST del backend (único lugar del frontend que hace peticiones HTTP).
 * - URL base desde la variable de entorno VITE_API_URL (archivo .env, ver .env.example).
 * - Agrega el token JWT de la sesión en el header Authorization.
 * - Convierte las respuestas de error del backend ({ estado, error, mensaje, campos }) en ErrorApi.
 * - Si el backend responde 401 a una petición con token, avisa que la sesión expiró.
 */

// import.meta.env lo completa Vite con las variables VITE_* del .env.
// El ?. evita un error cuando el código corre fuera de Vite (pruebas con Karma).
const URL_BASE = (import.meta.env?.VITE_API_URL ?? 'http://localhost:8080/api/v1').replace(
  /\/$/,
  '',
);

/** Nombre con que se guarda la sesión { token, usuario } en localStorage. */
export const CLAVE_SESION = 'pawpets:sesion';
/** Evento que avisa al AuthProvider que el backend rechazó el token. */
export const EVENTO_SESION_EXPIRADA = 'pawpets:sesion-expirada';

/** Error de la API con el código HTTP y los errores por campo (si los hay). */
export class ErrorApi extends Error {
  constructor(mensaje, estado, campos = {}) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos;
  }
}

// ---------- Sesión guardada en el navegador ----------

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

/**
 * Lee el vencimiento (exp) del JWT. El payload es la parte del medio del token, en base64url.
 * Solo sirve para no usar un token muerto: la validación real (firma) la hace el backend.
 */
export function vencimientoToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

export const tokenVigente = (token) => Boolean(token) && vencimientoToken(token) > Date.now();

// ---------- Peticiones ----------

async function pedir(metodo, ruta, cuerpo) {
  const cabeceras = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  const token = leerSesion()?.token;
  if (tokenVigente(token)) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(URL_BASE + ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    // fetch solo falla así cuando no hay conexión con el servidor (apagado, CORS, sin red).
    throw new ErrorApi(
      'No se pudo conectar con el servidor. Revisa que el backend esté encendido.',
      0,
    );
  }

  // 204 No Content (por ejemplo, al eliminar): no hay cuerpo que leer.
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && cabeceras.Authorization) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    throw new ErrorApi(
      datos?.mensaje ?? `Error ${respuesta.status} del servidor.`,
      respuesta.status,
      datos?.campos ?? {},
    );
  }
  return datos;
}

const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, cuerpo = {}) => pedir('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
  eliminar: (ruta) => pedir('DELETE', ruta),
};

export default api;
