import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';
import { renderizar } from './ayudas';

describe('Página Login', () => {
  afterEach(cleanup);

  const escribir = (etiqueta, valor) =>
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });

  function enviar(correo, clave) {
    escribir('Correo electrónico', correo);
    escribir('Contraseña', clave);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  }

  // Login dentro de rutas, para comprobar a dónde redirige
  const conRutas = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<p>Panel</p>} />
      <Route path="/" element={<p>Tienda</p>} />
    </Routes>
  );

  it('estado del formulario: el campo refleja lo que escribe el usuario', () => {
    renderizar(<Login />, { auth: { iniciarSesion: () => null } });
    escribir('Correo electrónico', 'ana@correo.cl');
    expect(screen.getByLabelText('Correo electrónico').value).toBe('ana@correo.cl');
  });

  it('muestra errores de validación y no llama a iniciarSesion con campos vacíos', () => {
    const iniciarSesion = jasmine.createSpy('iniciarSesion');
    renderizar(<Login />, { auth: { iniciarSesion } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveSize(2);
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it('con credenciales incorrectas muestra la alerta de error (mock de autenticación)', async () => {
    const iniciarSesion = jasmine.createSpy('iniciarSesion').and.resolveTo(null);
    renderizar(<Login />, { auth: { iniciarSesion } });
    enviar('ana@correo.cl', 'mala');
    expect(iniciarSesion).toHaveBeenCalledWith('ana@correo.cl', 'mala');
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('incorrectos');
  });

  it('si el backend no responde muestra el mensaje del servidor', async () => {
    const iniciarSesion = jasmine
      .createSpy('iniciarSesion')
      .and.rejectWith(new Error('No se pudo conectar con el servidor.'));
    renderizar(<Login />, { auth: { iniciarSesion } });
    enviar('ana@correo.cl', 'clave');
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
  });

  it('un administrador o vendedor va al panel; un cliente a la tienda', async () => {
    const vendedor = jasmine.createSpy().and.resolveTo({ rol: 'vendedor' });
    renderizar(conRutas, { ruta: '/login', auth: { iniciarSesion: vendedor } });
    enviar('vendedor@pawpets.cl', 'Vendedor123');
    await waitFor(() => expect(screen.getByText('Panel')).toBeTruthy());
    cleanup();

    const cliente = jasmine.createSpy().and.resolveTo({ rol: 'cliente' });
    renderizar(conRutas, { ruta: '/login', auth: { iniciarSesion: cliente } });
    enviar('camila@correo.cl', 'Cliente123');
    await waitFor(() => expect(screen.getByText('Tienda')).toBeTruthy());
  });
});
