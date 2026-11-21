import { cleanup, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import RutaAdmin from '../components/RutaAdmin';
import db from '../data/db';
import AdminLayout from '../layouts/AdminLayout';
import AdminEntidad from '../pages/admin/AdminEntidad';
import { ROLES_PANEL } from '../utils/roles';
import { productosEjemplo, renderizar } from './ayudas';

/**
 * Restricciones de acceso en el frontend según el rol (IE3.3.3 y Anexo 1):
 * - Administrador: acceso total (todas las secciones y acciones de edición).
 * - Vendedor: solo ve Órdenes y Productos, y los productos en modo lectura.
 * - Cliente: solo accede a la tienda.
 * Se usan las mismas rutas que App.jsx, con RutaAdmin + AdminLayout + AdminEntidad reales.
 */
describe('Panel de administración según el rol (Anexo 1)', () => {
  const cerrarSesion = jasmine.createSpy('cerrarSesion');
  const usuarios = {
    admin: { id: 1, nombre: 'Ana', apellidos: 'Admin', rol: 'admin' },
    vendedor: { id: 2, nombre: 'Valentina', apellidos: 'Soto', rol: 'vendedor' },
    cliente: { id: 3, nombre: 'Camila', apellidos: 'Rojas', rol: 'cliente' },
  };

  const rutas = (
    <Routes>
      <Route path="/" element={<p>Tienda</p>} />
      <Route path="/login" element={<p>Pantalla login</p>} />
      <Route path="/admin" element={<RutaAdmin roles={ROLES_PANEL} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<p>Inicio del panel</p>} />
          <Route path="ordenes" element={<p>Listado de órdenes</p>} />
          <Route element={<RutaAdmin roles={['admin']} />}>
            <Route path="reportes" element={<p>Reportes de ventas</p>} />
            <Route path=":entidad/nuevo" element={<p>Formulario nuevo</p>} />
          </Route>
          <Route path=":entidad" element={<AdminEntidad />} />
        </Route>
      </Route>
    </Routes>
  );

  const entrar = (rol, ruta) =>
    renderizar(rutas, { ruta, auth: { usuario: usuarios[rol], cerrarSesion } });

  const menu = () =>
    Array.from(document.querySelectorAll('nav[aria-label="Administración"] a')).map((a) =>
      a.textContent.trim(),
    );

  beforeEach(() => {
    db.reiniciar();
    db.establecer('productos', productosEjemplo);
    db.establecer('categorias', [{ id: 1, nombre: 'Perros', imagen: '/p.jpg' }]);
    db.establecer('usuarios', Object.values(usuarios));
  });

  afterEach(() => {
    cleanup();
    db.reiniciar();
  });

  describe('Administrador', () => {
    it('ve todas las secciones del menú', () => {
      entrar('admin', '/admin');
      expect(menu()).toEqual([
        jasmine.stringContaining('Dashboard'),
        jasmine.stringContaining('Órdenes'),
        jasmine.stringContaining('Productos'),
        jasmine.stringContaining('Categorías'),
        jasmine.stringContaining('Usuarios'),
        jasmine.stringContaining('Reportes'),
        jasmine.stringContaining('Perfil'),
      ]);
    });

    it('puede crear, editar y eliminar productos', async () => {
      entrar('admin', '/admin/productos');
      expect(await screen.findByText('Nuevo producto')).toBeTruthy();
      expect(screen.getAllByText('Editar').length).toBe(productosEjemplo.length);
      expect(screen.getAllByText('Eliminar').length).toBe(productosEjemplo.length);
      expect(screen.queryByText(/modo lectura/)).toBeNull();
    });

    it('entra a secciones exclusivas como Usuarios y Reportes', async () => {
      entrar('admin', '/admin/usuarios');
      expect(await screen.findByText('Valentina')).toBeTruthy();
      cleanup();
      entrar('admin', '/admin/reportes');
      expect(screen.getByText('Reportes de ventas')).toBeTruthy();
    });
  });

  describe('Vendedor', () => {
    it('solo ve Órdenes y Productos en el menú', () => {
      entrar('vendedor', '/admin/ordenes');
      const opciones = menu();
      expect(opciones.length).toBe(2);
      expect(opciones[0]).toContain('Órdenes');
      expect(opciones[1]).toContain('Productos');
      expect(screen.getByText('Listado de órdenes')).toBeTruthy();
    });

    it('ve los productos en modo lectura: sin Nuevo, Editar ni Eliminar', async () => {
      entrar('vendedor', '/admin/productos');
      expect(await screen.findByText(/modo lectura/)).toBeTruthy();
      expect(screen.getAllByText('Ver detalle').length).toBe(productosEjemplo.length);
      expect(screen.queryByText('Nuevo producto')).toBeNull();
      expect(screen.queryByText('Editar')).toBeNull();
      expect(screen.queryByText('Eliminar')).toBeNull();
    });

    it('si escribe la URL de Usuarios, Categorías, Reportes o crear producto, vuelve al panel', () => {
      for (const ruta of [
        '/admin/usuarios',
        '/admin/categorias',
        '/admin/reportes',
        '/admin/productos/nuevo',
      ]) {
        entrar('vendedor', ruta);
        expect(screen.queryByText('Valentina')).withContext(ruta).toBeNull();
        expect(screen.queryByText('Reportes de ventas')).withContext(ruta).toBeNull();
        expect(screen.queryByText('Formulario nuevo')).withContext(ruta).toBeNull();
        expect(screen.getByText('Inicio del panel')).withContext(ruta).toBeTruthy();
        cleanup();
      }
    });
  });

  describe('Cliente', () => {
    it('no puede entrar a ninguna ruta del panel: vuelve a la tienda', () => {
      for (const ruta of ['/admin', '/admin/ordenes', '/admin/productos', '/admin/usuarios']) {
        entrar('cliente', ruta);
        expect(screen.getByText('Tienda')).withContext(ruta).toBeTruthy();
        expect(menu().length).withContext(ruta).toBe(0);
        cleanup();
      }
    });
  });

  it('sin sesión iniciada, el panel envía al login', () => {
    renderizar(rutas, { ruta: '/admin/productos', auth: { usuario: null } });
    expect(screen.getByText('Pantalla login')).toBeTruthy();
  });
});
