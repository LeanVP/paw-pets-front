// useEffect: hook para hacer algo después de dibujar; useState: hook de estado
import { useEffect, useState } from 'react';
// db: almacén de datos; se vacía al cerrar sesión para no dejar datos de otro usuario
import db from '../data/db';
// api: llamadas al backend; el resto son funciones para guardar y leer la sesión
import api, { EVENTO_SESION_EXPIRADA, guardarSesion, leerSesion } from '../services/api';
// AuthContext: el contexto que este Provider llena con datos
import { AuthContext } from './contextos';

// Cada cuánto se renueva el token mientras hay sesión (15 minutos)
const RENOVAR_CADA_MS = 15 * 60 * 1000;

// Dice si el token guardado todavía no vence. El JWT tiene 3 partes separadas por puntos
// y la del medio (payload) trae "exp", la fecha de vencimiento en segundos.
// OJO: esto solo evita mostrar una sesión vencida; quien realmente valida el token es el backend.
function vigente(sesion) {
  if (!sesion?.token) return false;
  try {
    const payload = JSON.parse(
      atob(sesion.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Lee la sesión guardada al abrir la página; si está vencida la borra
function sesionInicial() {
  const guardada = leerSesion();
  if (vigente(guardada)) return guardada;
  guardarSesion(null);
  return null;
}

/** Comparte con toda la app quién tiene la sesión iniciada (login real con JWT). */
// Prop: children = toda la app que va adentro
export function AuthProvider({ children }) {
  // Sesión = { token, usuario }. Parte con lo guardado en localStorage: así sobrevive a recargar la página
  const [sesion, setSesion] = useState(sesionInicial);
  const usuario = sesion?.usuario ?? null;
  const haySesion = Boolean(sesion);

  // Guarda la sesión que entregó el backend (login, registro o refresh)
  function abrirSesion(respuesta) {
    guardarSesion(respuesta);
    setSesion(respuesta);
  }

  // Borra la sesión y los datos cargados
  function cerrarSesion() {
    guardarSesion(null);
    setSesion(null);
    db.reiniciar();
  }

  /** Devuelve el usuario si las credenciales son correctas; null si son incorrectas. */
  async function iniciarSesion(correo, clave) {
    try {
      const respuesta = await api.post('/auth/login', { correo: correo.trim(), clave });
      abrirSesion(respuesta);
      return respuesta.usuario;
    } catch (error) {
      // 401 = correo o clave mal; cualquier otro error (servidor caído) se informa aparte
      if (error.estado === 401) return null;
      throw error;
    }
  }

  /** Crea un cliente nuevo y abre su sesión. Devuelve null si el correo ya existe. */
  async function registrar(datos) {
    try {
      const respuesta = await api.post('/auth/registro', {
        ...datos,
        correo: datos.correo.trim(),
      });
      abrirSesion(respuesta);
      return respuesta.usuario;
    } catch (error) {
      // 409 = el correo ya está registrado
      if (error.estado === 409) return null;
      throw error;
    }
  }

  // Pide un token nuevo (y los datos actualizados del usuario) usando el token actual
  async function renovarSesion() {
    abrirSesion(await api.post('/auth/refresh'));
  }

  // Mientras hay sesión: renueva el token al abrir la página y cada 15 minutos,
  // y cierra la sesión si el backend avisa que el token ya no sirve (401)
  useEffect(() => {
    if (!haySesion) return undefined;
    const cerrar = () => cerrarSesion();
    window.addEventListener(EVENTO_SESION_EXPIRADA, cerrar);
    renovarSesion().catch(() => {});
    const reloj = setInterval(() => renovarSesion().catch(() => {}), RENOVAR_CADA_MS);
    return () => {
      window.removeEventListener(EVENTO_SESION_EXPIRADA, cerrar);
      clearInterval(reloj);
    };
    // Solo depende de si hay sesión o no (no de cada renovación)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [haySesion]);

  // Lo que se dibuja: el Provider con los datos y, adentro, toda la app
  return (
    // value es lo que reciben los componentes al usar useAuth()
    <AuthContext.Provider
      value={{ usuario, iniciarSesion, registrar, cerrarSesion, renovarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}
