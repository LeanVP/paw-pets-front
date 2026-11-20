// Hooks de React: estado, efectos y funciones estables
import { useCallback, useEffect, useState } from 'react';
// db: se olvidan los datos privados (usuarios, boletas) al cambiar de sesión
import db from '../data/db';
// api: cliente REST y utilidades de la sesión guardada
import api, {
  borrarSesion,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  leerSesion,
  tokenVigente,
  vencimientoToken,
} from '../services/api';
// AuthContext: el contexto que este Provider llena con datos
import { AuthContext } from './contextos';

/** Cada cuánto se pide un token nuevo al backend mientras la página está abierta. */
const RENOVAR_CADA_MS = 15 * 60 * 1000;

// Sesión guardada solo si su token todavía no vence
function sesionInicial() {
  const guardada = leerSesion();
  if (guardada && tokenVigente(guardada.token)) return guardada;
  borrarSesion();
  return null;
}

/**
 * Sesión del usuario con JWT:
 * - Persistencia: { token, usuario } en localStorage, así la sesión sobrevive a recargar (F5).
 * - Vencimiento: al abrir la página se descarta un token vencido, y se cierra la sesión justo cuando vence.
 * - Renovación: al abrir la página y cada 15 minutos se pide un token nuevo (POST /auth/refresh).
 * - Si el backend responde 401 (token inválido o vencido), la sesión se cierra sola.
 * El rol que vale es el del token firmado: cambiarlo en localStorage no da permisos en el backend.
 */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(sesionInicial);

  // Guarda la sesión y olvida los datos del usuario anterior
  const abrirSesion = useCallback((nueva) => {
    guardarSesion(nueva);
    db.olvidarPrivadas();
    setSesion(nueva);
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    db.olvidarPrivadas();
    setSesion(null);
  }, []);

  /** Devuelve el usuario si las credenciales son correctas; null si no (401). */
  async function iniciarSesion(correo, clave) {
    try {
      const respuesta = await api.post('/auth/login', { correo: correo.trim(), clave });
      abrirSesion(respuesta);
      return respuesta.usuario;
    } catch (error) {
      if (error.estado === 401) return null;
      throw error;
    }
  }

  /** Crea un cliente y abre su sesión. Devuelve null si el correo ya existe (409). */
  async function registrar(datos) {
    try {
      const respuesta = await api.post('/auth/registro', { ...datos, correo: datos.correo.trim() });
      abrirSesion(respuesta);
      return respuesta.usuario;
    } catch (error) {
      if (error.estado === 409) return null;
      throw error;
    }
  }

  /** Actualiza los datos del usuario conectado (por ejemplo, después de editar el perfil). */
  const actualizarUsuario = useCallback((usuario) => {
    setSesion((actual) => {
      const nueva = { ...actual, usuario };
      guardarSesion(nueva);
      return nueva;
    });
  }, []);

  const hayToken = Boolean(sesion?.token);
  const token = sesion?.token;

  // Renovación del token: al abrir la página y cada 15 minutos
  useEffect(() => {
    if (!hayToken) return undefined;
    const renovar = () =>
      api
        .post('/auth/refresh')
        .then((nueva) => {
          guardarSesion(nueva);
          setSesion(nueva);
        })
        .catch(() => {}); // si falla por 401, el evento de sesión expirada cierra la sesión
    renovar();
    const intervalo = setInterval(renovar, RENOVAR_CADA_MS);
    return () => clearInterval(intervalo);
  }, [hayToken]);

  // Cierra la sesión justo cuando vence el token (si no se alcanzó a renovar)
  useEffect(() => {
    if (!token) return undefined;
    const restante = vencimientoToken(token) - Date.now();
    const temporizador = setTimeout(cerrarSesion, Math.max(restante, 0));
    return () => clearTimeout(temporizador);
  }, [token, cerrarSesion]);

  // El cliente de la API avisa cuando el backend rechaza el token (401)
  useEffect(() => {
    window.addEventListener(EVENTO_SESION_EXPIRADA, cerrarSesion);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, cerrarSesion);
  }, [cerrarSesion]);

  return (
    <AuthContext.Provider
      value={{
        usuario: sesion?.usuario ?? null,
        iniciarSesion,
        registrar,
        cerrarSesion,
        actualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
