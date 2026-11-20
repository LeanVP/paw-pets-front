import { Link, Navigate } from 'react-router-dom';
import { EstadoCarga } from '../../components/Estados';
import Icono from '../../components/Icono';
import useAuth from '../../hooks/useAuth';
import useColeccion from '../../hooks/useColeccion';

const ACCESOS = [
  ['/admin/ordenes', 'Órdenes', 'Seguimiento de las compras realizadas.', 'receipt_long'],
  ['/admin/productos', 'Productos', 'Inventario y detalle de productos.', 'inventory_2'],
  ['/admin/categorias', 'Categorías', 'Organiza los productos por categoría.', 'category'],
  ['/admin/usuarios', 'Usuarios', 'Gestión de cuentas y roles.', 'group'],
  ['/admin/reportes', 'Reportes', 'Ventas e inventario crítico.', 'bar_chart'],
  ['/admin/perfil', 'Perfil', 'Tu información de cuenta.', 'person'],
];

/** Inicio del panel: el admin ve el Dashboard; el vendedor no tiene dashboard y va a Productos. */
export default function Dashboard() {
  const { usuario } = useAuth();
  if (usuario.rol !== 'admin') return <Navigate to="/admin/productos" replace />;
  return (
    <>
      <h1 className="h3">Dashboard</h1>
      <p className="text-secondary">Resumen general de la tienda.</p>
      <EstadoCarga colecciones={['boletas', 'productos', 'usuarios']}>
        <Indicadores />
      </EstadoCarga>
      <h2 className="h5 mt-4 mb-3">Accesos rápidos</h2>
      <div className="row g-3">
        {ACCESOS.map(([ruta, titulo, texto, icono]) => (
          <div className="col-sm-6 col-xl-4" key={ruta}>
            <Link to={ruta} className="card card-acceso h-100 text-reset text-decoration-none">
              <div className="card-body d-flex gap-3 align-items-start">
                <span className="icono-caja">
                  <Icono nombre={icono} />
                </span>
                <div>
                  <h3 className="h6 mb-1">{titulo}</h3>
                  <p className="mb-0 text-secondary small">{texto}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

function Indicadores() {
  const compras = useColeccion('boletas').filter((o) => o.estado === 'Pagada').length;
  const productos = useColeccion('productos').length;
  const usuarios = useColeccion('usuarios').length;
  return (
    <div className="row g-3">
      {[
        ['Compras pagadas', compras, 'shopping_bag'],
        ['Productos', productos, 'inventory_2'],
        ['Usuarios', usuarios, 'group'],
      ].map(([titulo, valor, icono]) => (
        <div className="col-md-4" key={titulo}>
          <div className="card kpi h-100">
            <div className="card-body">
              <span className="icono-caja">
                <Icono nombre={icono} />
              </span>
              <div>
                <p className="kpi-titulo">{titulo}</p>
                <p className="kpi-valor">{valor}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
