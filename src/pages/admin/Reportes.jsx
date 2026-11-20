import { EstadoCarga, EstadoVacio } from '../../components/Estados';
import Icono from '../../components/Icono';
import useColeccion from '../../hooks/useColeccion';
import { precioCLP } from '../../utils/formato';
import { resumenVentas } from '../../utils/reportes';

/** Reporte de ventas calculado desde las boletas (solo administrador). */
export default function Reportes() {
  return (
    <>
      <h1 className="h3">Reportes</h1>
      <p className="text-secondary">Solo cuentan las compras pagadas.</p>
      <EstadoCarga colecciones={['boletas']}>
        <Resumen />
      </EstadoCarga>
    </>
  );
}

function Resumen() {
  const { ventasTotales, ordenesPagadas, ordenesRechazadas, porProducto } = resumenVentas(
    useColeccion('boletas'),
  );
  return (
    <>
      <div className="row g-3 mb-4">
        {[
          ['Ventas totales', precioCLP(ventasTotales), 'payments'],
          ['Órdenes pagadas', ordenesPagadas, 'check_circle'],
          ['Pagos rechazados', ordenesRechazadas, 'cancel'],
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
      <h2 className="h5">Ventas por producto</h2>
      {porProducto.length === 0 ? (
        <EstadoVacio icono="bar_chart">Aún no hay ventas registradas.</EstadoVacio>
      ) : (
        <div className="card tabla-card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Unidades</th>
                  <th scope="col">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {porProducto.map((p) => (
                  <tr key={p.nombre}>
                    <td>{p.nombre}</td>
                    <td>{p.unidades}</td>
                    <td>{precioCLP(p.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="small text-secondary mt-3 mb-0">
        <Icono nombre="info" /> Las órdenes rechazadas no suman ventas ni descuentan stock.
      </p>
    </>
  );
}
