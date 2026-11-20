/**
 * Cliente de la API REST del backend (usa fetch, como el hook del ejemplo del profesor).
 * - Todas las rutas parten en /api/v1; Vite las reenvía al backend (proxy en vite.config.js).
 * - Si hay sesión, agrega el header "Authorization: Bearer <token>" a cada petición.
 * - Si el backend responde 401 con una sesión abierta, avisa a la app para cerrarla.
 */

// Rutas base de la API (versionada)
const BASE = '/api/v1';
// Nombre con que se guarda la sesión en localStorage: { token, usuario }
export const CLAVE_SESION = 'pawpets:sesion';
// Evento que se dispara cuando el token ya no sirve
export const EVENTO_SESION_EXPIRADA = 'pawpets:sesion-expirada';

// Lee la sesión guardada (o null)
export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION)) ?? null;
  } catch {
    return null;
  }
}

// Guarda o borra la sesión
export function guardarSesion(sesion) {
  if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  else localStorage.removeItem(CLAVE_SESION);
}

// Función base: hace la petición, convierte la respuesta a JSON y lanza un Error si algo falla
async function pedir(metodo, ruta, cuerpo) {
  const sesion = leerSesion();
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    // fetch solo falla si no hay conexión con el servidor
    throw new Error('No se pudo conectar con el servidor.');
  }

  if (!respuesta.ok) {
    // El backend siempre responde { estado, error, mensaje, campos }
    const datos = await respuesta.json().catch(() => ({}));
    // 401 con sesión abierta = token vencido o inválido
    if (respuesta.status === 401 && sesion?.token) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    const error = new Error(datos.mensaje ?? `Error ${respuesta.status}`);
    error.estado = respuesta.status;
    throw error;
  }
  // 204 No Content (DELETE) no trae cuerpo
  return respuesta.status === 204 ? null : respuesta.json();
}

// Atajos por método HTTP
const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
  delete: (ruta) => pedir('DELETE', ruta),
};

export default api;
