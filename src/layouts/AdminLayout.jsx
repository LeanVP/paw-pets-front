import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { EtiquetaEstado } from '../components/Estados';
import Icono from '../components/Icono';
import Logo from '../components/Logo';
import useAuth from '../hooks/useAuth';

// [ruta, etiqueta, ícono Material Symbols, roles que la ven]
const SECCIONES = [
  ['/admin', 'Dashboard', 'dashboard', ['admin']],
  ['/admin/ordenes', 'Órdenes', 'receipt_long', ['admin', 'vendedor']],
  ['/admin/productos', 'Productos', 'inventory_2', ['admin', 'vendedor']],
  ['/admin/categorias', 'Categorías', 'category', ['admin']],
  ['/admin/usuarios', 'Usuarios', 'group', ['admin']],
  ['/admin/reportes', 'Reportes', 'bar_chart', ['admin']],
  ['/admin/perfil', 'Perfil', 'person', ['admin']],
];

/**
 * Panel de administración: menú lateral (apilado en móvil), barra superior y contenido.
 * El menú se filtra por rol: el vendedor solo ve Órdenes y Productos (Anexo 1).
 */
export default function AdminLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const secciones = SECCIONES.filter(([, , , roles]) => roles.includes(usuario.rol));
  // Sección actual: la ruta más larga que coincide con la URL (para la barra superior)
  const actual = [...SECCIONES]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([ruta]) => pathname === ruta || pathname.startsWith(`${ruta}/`));

  return (
    <div className="container-fluid">
      <div className="row">
        <aside className="col-md-3 col-lg-2 admin-menu py-3">
          <Link to={secciones[0][0]} className="d-block mb-3 text-decoration-none">
            <Logo />
          </Link>
          <nav className="nav nav-pills flex-md-column gap-1" aria-label="Administración">
            {secciones.map(([ruta, etiqueta, icono]) => (
              <NavLink key={ruta} to={ruta} end={ruta === '/admin'} className="nav-link">
                <Icono nombre={icono} />
                {etiqueta}
              </NavLink>
            ))}
          </nav>
          <div className="admin-menu-pie">
            <Link to="/" className="btn btn-dark">
              <Icono nombre="storefront" />
              Tienda
            </Link>
            <Link to="/" className="btn btn-danger" onClick={cerrarSesion}>
              <Icono nombre="logout" />
              Cerrar sesión
            </Link>
          </div>
        </aside>
        <div className="col-md-9 col-lg-10 px-0">
          <header className="admin-barra">
            <p className="admin-barra-ruta mb-0">
              <Icono nombre={actual?.[2] ?? 'dashboard'} />
              {actual?.[1] ?? 'Panel'}
            </p>
            <div className="d-flex align-items-center gap-2">
              <span className="small">
                {usuario.nombre} {usuario.apellidos}
              </span>
              <EtiquetaEstado tipo="info" icono="badge">
                {usuario.rol}
              </EtiquetaEstado>
            </div>
          </header>
          <main className="admin-contenido">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
