// Herramientas para probar hooks: act (ejecuta cambios), renderHook (dibuja un hook), waitFor (espera)
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthProvider';
import db from '../data/db';
import useAuth from '../hooks/useAuth';
import { CLAVE_SESION, EVENTO_SESION_EXPIRADA } from '../services/api';
import { simularApi, tokenDePrueba } from './ayudas';

describe('AuthProvider (sesión con JWT)', () => {
  const admin = { id: 1, nombre: 'Admin', correo: 'admin@pawpets.cl', rol: 'admin' };

  beforeEach(() => {
    localStorage.clear();
    db.reiniciar();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    db.reiniciar();
  });

  const montar = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

  it('login correcto: guarda { token, usuario } en localStorage y deja la sesión abierta', async () => {
    const token = tokenDePrueba(60);
    simularApi({
      'POST /auth/login': () => [{ token, usuario: admin }],
      'POST /auth/refresh': () => [{ token, usuario: admin }],
    });
    const { result } = montar();
    let usuario;
    await act(async () => {
      usuario = await result.current.iniciarSesion(' admin@pawpets.cl ', 'Admin123');
    });
    expect(usuario.rol).toBe('admin');
    expect(result.current.usuario.nombre).toBe('Admin');
    expect(JSON.parse(localStorage.getItem(CLAVE_SESION)).token).toBe(token);
  });

  it('credenciales incorrectas (401): devuelve null y no abre sesión', async () => {
    simularApi({ 'POST /auth/login': () => [{ mensaje: 'Correo o contraseña incorrectos.' }, 401] });
    const { result } = montar();
    let usuario;
    await act(async () => {
      usuario = await result.current.iniciarSesion('admin@pawpets.cl', 'mala');
    });
    expect(usuario).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('registrar con un correo repetido (409) devuelve null', async () => {
    simularApi({ 'POST /auth/registro': () => [{ mensaje: 'Ya existe' }, 409] });
    const { result } = montar();
    let respuesta;
    await act(async () => {
      respuesta = await result.current.registrar({ nombre: 'Otra', correo: 'ADMIN@pawpets.cl' });
    });
    expect(respuesta).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('la sesión sobrevive a recargar la página si el token sigue vigente', () => {
    const token = tokenDePrueba(30);
    simularApi({ 'POST /auth/refresh': () => [{ token, usuario: admin }] });
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario: admin }));
    const { result } = montar();
    expect(result.current.usuario.correo).toBe('admin@pawpets.cl');
  });

  it('un token vencido se descarta al abrir la página', () => {
    localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: tokenDePrueba(-5), usuario: admin }),
    );
    const { result } = montar();
    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('renueva el token al abrir la página (POST /auth/refresh)', async () => {
    const nuevo = tokenDePrueba(60, { nuevo: true });
    const fetch = simularApi({ 'POST /auth/refresh': () => [{ token: nuevo, usuario: admin }] });
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token: tokenDePrueba(10), usuario: admin }));
    montar();
    // waitFor reintenta mientras la función lance un error (el expect de Jasmine no lanza)
    const tokenGuardado = () => JSON.parse(localStorage.getItem(CLAVE_SESION)).token;
    await waitFor(() => {
      if (tokenGuardado() !== nuevo) throw new Error('Todavía no se renueva el token');
    });
    expect(tokenGuardado()).toBe(nuevo);
    const cabeceras = fetch.calls.mostRecent().args[1].headers;
    expect(cabeceras.Authorization).toMatch(/^Bearer /);
  });

  it('si el backend rechaza el token (evento de sesión expirada) o se cierra sesión, se borra todo', async () => {
    const token = tokenDePrueba(30);
    simularApi({ 'POST /auth/refresh': () => [{ token, usuario: admin }] });
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario: admin }));
    const { result } = montar();
    act(() => window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA)));
    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });
});
