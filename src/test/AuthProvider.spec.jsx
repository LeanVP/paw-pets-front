// act: espera a que React termine de actualizar; cleanup: limpia lo dibujado; renderHook: prueba un hook
import { act, cleanup, renderHook } from '@testing-library/react';
// El provider real de la sesión, que es lo que se prueba
import { AuthProvider } from '../context/AuthProvider';
import db from '../data/db';
import useAuth from '../hooks/useAuth';
import { simularApi } from './ayudas';

// Crea un JWT de mentira (solo importa el payload con "exp") para probar la expiración
function tokenFalso(minutos) {
  const payload = btoa(JSON.stringify({ sub: '2', exp: Math.floor(Date.now() / 1000) + minutos * 60 }));
  return `cabecera.${payload}.firma`;
}

const usuarioCliente = { id: 2, nombre: 'Camila', correo: 'camila@correo.cl', rol: 'cliente' };

// Pruebas de la sesión con JWT: login, registro, persistencia al recargar y cierre
describe('AuthProvider (sesión del usuario con JWT)', () => {
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

  it('iniciarSesion correcto guarda el token y el usuario en localStorage', async () => {
    simularApi({
      'POST /api/v1/auth/login': { token: tokenFalso(60), usuario: usuarioCliente },
    });
    const { result } = montar();
    let usuario;
    await act(async () => {
      usuario = await result.current.iniciarSesion('camila@correo.cl', 'Cliente123');
    });
    expect(usuario.rol).toBe('cliente');
    expect(result.current.usuario.nombre).toBe('Camila');
    expect(JSON.parse(localStorage.getItem('pawpets:sesion')).token).toContain('.');
  });

  it('iniciarSesion con credenciales incorrectas (401) devuelve null', async () => {
    simularApi({
      'POST /api/v1/auth/login': { estado: 401, cuerpo: { mensaje: 'Correo o contraseña incorrectos.' } },
    });
    const { result } = montar();
    let usuario;
    await act(async () => {
      usuario = await result.current.iniciarSesion('camila@correo.cl', 'mala');
    });
    expect(usuario).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('registrar con un correo repetido (409) devuelve null', async () => {
    simularApi({
      'POST /api/v1/auth/registro': { estado: 409, cuerpo: { mensaje: 'Ya existe una cuenta con ese correo.' } },
    });
    const { result } = montar();
    let respuesta;
    await act(async () => {
      respuesta = await result.current.registrar({ nombre: 'Otra', correo: 'camila@correo.cl', clave: '123456' });
    });
    expect(respuesta).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('la sesión sobrevive a una recarga: se lee de localStorage y se renueva el token', async () => {
    localStorage.setItem(
      'pawpets:sesion',
      JSON.stringify({ token: tokenFalso(30), usuario: usuarioCliente }),
    );
    const fetchFalso = simularApi({
      'POST /api/v1/auth/refresh': { token: tokenFalso(60), usuario: usuarioCliente },
    });
    let hook;
    await act(async () => {
      hook = montar();
    });
    // Sin volver a hacer login, el usuario ya está
    expect(hook.result.current.usuario.nombre).toBe('Camila');
    // Y al abrir la página se pidió un token nuevo
    expect(fetchFalso.calls.allArgs().some(([url]) => url === '/api/v1/auth/refresh')).toBeTrue();
  });

  it('un token vencido guardado en localStorage no abre sesión y se borra', () => {
    localStorage.setItem(
      'pawpets:sesion',
      JSON.stringify({ token: tokenFalso(-10), usuario: usuarioCliente }),
    );
    const { result } = montar();
    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem('pawpets:sesion')).toBeNull();
  });

  it('cerrarSesion borra la sesión', async () => {
    simularApi({
      'POST /api/v1/auth/login': { token: tokenFalso(60), usuario: usuarioCliente },
      'POST /api/v1/auth/refresh': { token: tokenFalso(60), usuario: usuarioCliente },
    });
    const { result } = montar();
    await act(async () => {
      await result.current.iniciarSesion('camila@correo.cl', 'Cliente123');
    });
    act(() => result.current.cerrarSesion());
    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem('pawpets:sesion')).toBeNull();
  });
});
