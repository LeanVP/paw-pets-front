// De Testing Library: cleanup (limpia) y screen (busca en pantalla)
import { cleanup, screen } from '@testing-library/react';
// Routes y Route para armar un mapa de rutas pequeño solo para la prueba
import { Route, Routes } from 'react-router-dom';
// El componente que se prueba
import RutaAdmin from '../components/RutaAdmin';
// Función para dibujar con router y contextos falsos
import { renderizar } from './ayudas';

// Pruebas de la protección de las rutas del admin
describe('RutaAdmin (protección del panel)', () => {
  // Limpia la pantalla después de cada prueba
  afterEach(cleanup);

  // Rutas de prueba: un login y un panel protegido
  // Se usan textos simples en vez de las páginas reales
  const rutas = (
    <Routes>
      {/* Si RutaAdmin redirige, se verá este texto */}
      <Route path="/login" element={<p>Pantalla login</p>} />
      {/* /admin protegido por RutaAdmin; su hija se ve solo si pasa */}
      <Route path="/admin" element={<RutaAdmin />}>
        <Route index element={<p>Panel secreto</p>} />
      </Route>
    </Routes>
  );

  // Un cliente que entra a /admin termina en el login
  it('un cliente es redirigido al login', () => {
    // Parte en /admin con una sesión falsa de rol cliente
    renderizar(rutas, { ruta: '/admin', auth: { usuario: { rol: 'cliente' } } });
    // Comprueba que terminó en el login
    expect(screen.getByText('Pantalla login')).toBeTruthy();
    // Comprueba que no se ve el panel
    expect(screen.queryByText('Panel secreto')).toBeNull();
  });

  // Un admin sí puede ver el panel
  it('un administrador accede al panel', () => {
    // Parte en /admin con una sesión falsa de rol admin
    renderizar(rutas, { ruta: '/admin', auth: { usuario: { rol: 'admin' } } });
    // Comprueba que se ve el contenido protegido
    expect(screen.getByText('Panel secreto')).toBeTruthy();
  });

  // Estructura igual a la de App.jsx: /admin lo ven admin y vendedor; "usuarios" solo el admin
  const rutasPorRol = (
    <Routes>
      <Route path="/login" element={<p>Pantalla login</p>} />
      <Route path="/admin" element={<RutaAdmin roles={['admin', 'vendedor']} />}>
        <Route index element={<p>Inicio del panel</p>} />
        {/* Grupo exclusivo del admin */}
        <Route element={<RutaAdmin roles={['admin']} />}>
          <Route path="usuarios" element={<p>Solo administrador</p>} />
        </Route>
      </Route>
    </Routes>
  );

  it('un vendedor entra al panel', () => {
    renderizar(rutasPorRol, { ruta: '/admin', auth: { usuario: { rol: 'vendedor' } } });
    expect(screen.getByText('Inicio del panel')).toBeTruthy();
  });

  it('un vendedor no puede entrar a una ruta exclusiva del admin: vuelve al inicio del panel', () => {
    renderizar(rutasPorRol, { ruta: '/admin/usuarios', auth: { usuario: { rol: 'vendedor' } } });
    expect(screen.queryByText('Solo administrador')).toBeNull();
    expect(screen.getByText('Inicio del panel')).toBeTruthy();
  });

  it('un administrador sí entra a la ruta exclusiva', () => {
    renderizar(rutasPorRol, { ruta: '/admin/usuarios', auth: { usuario: { rol: 'admin' } } });
    expect(screen.getByText('Solo administrador')).toBeTruthy();
  });

  it('sin sesión va al login', () => {
    renderizar(rutasPorRol, { ruta: '/admin', auth: { usuario: null } });
    expect(screen.getByText('Pantalla login')).toBeTruthy();
  });
});
