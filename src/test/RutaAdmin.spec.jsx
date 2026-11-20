import { cleanup, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import RutaAdmin from '../components/RutaAdmin';
import { renderizar } from './ayudas';

describe('RutaAdmin (restricciones de acceso por rol)', () => {
  afterEach(cleanup);

  // Rutas de prueba: /admin para admin y vendedor; /admin/usuarios solo admin
  const rutas = (
    <Routes>
      <Route path="/" element={<p>Tienda</p>} />
      <Route path="/login" element={<p>Pantalla login</p>} />
      <Route path="/admin" element={<RutaAdmin roles={['admin', 'vendedor']} />}>
        <Route index element={<p>Inicio del panel</p>} />
        <Route element={<RutaAdmin roles={['admin']} />}>
          <Route path="usuarios" element={<p>Gestión de usuarios</p>} />
        </Route>
      </Route>
    </Routes>
  );

  it('sin sesión redirige al login', () => {
    renderizar(rutas, { ruta: '/admin', auth: { usuario: null } });
    expect(screen.getByText('Pantalla login')).toBeTruthy();
  });

  it('un cliente no entra al panel: vuelve a la tienda', () => {
    renderizar(rutas, { ruta: '/admin', auth: { usuario: { rol: 'cliente' } } });
    expect(screen.getByText('Tienda')).toBeTruthy();
    expect(screen.queryByText('Inicio del panel')).toBeNull();
  });

  it('el vendedor entra al panel, pero no a una sección solo de admin', () => {
    renderizar(rutas, { ruta: '/admin', auth: { usuario: { rol: 'vendedor' } } });
    expect(screen.getByText('Inicio del panel')).toBeTruthy();
    cleanup();
    renderizar(rutas, { ruta: '/admin/usuarios', auth: { usuario: { rol: 'vendedor' } } });
    expect(screen.queryByText('Gestión de usuarios')).toBeNull();
    expect(screen.getByText('Inicio del panel')).toBeTruthy();
  });

  it('un administrador accede a todo el panel', () => {
    renderizar(rutas, { ruta: '/admin/usuarios', auth: { usuario: { rol: 'admin' } } });
    expect(screen.getByText('Gestión de usuarios')).toBeTruthy();
  });
});
