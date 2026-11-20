import { Link } from 'react-router-dom';
import { EstadoBoleta, EstadoCarga, EstadoVacio } from '../../components/Estados';
import Icono from '../../components/Icono';
import useColeccion from '../../hooks/useColeccion';
import { precioCLP } from '../../utils/formato';

/** Lista de boletas (GET /boletas). La ven el administrador y el vendedor. */
export default function Ordenes() {
  return (
    <>
      <h1 className="h3">Órdenes y boletas</h1>
      <p className="text-secondary">Compras realizadas en la tienda, pagadas y rechazadas.</p>
      <EstadoCarga colecciones={['boletas']}>
        <Tabla />
      </EstadoCarga>
    </>
  );
}

function Tabla() {
  const ordenes = useColeccion('boletas');
  if (ordenes.length === 0) {
    return <EstadoVacio icono="receipt_long">Aún no hay órdenes.</EstadoVacio>;
  }
  return (
    <div className="card tabla-card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">N°</th>
              <th scope="col">Fecha</th>
              <th scope="col">Cliente</th>
              <th scope="col">Total</th>
              <th scope="col">Estado</th>
              <th scope="col" className="text-end">
                Boleta
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => (
              <tr key={o.id}>
                <th scope="row">{o.id}</th>
                <td>{new Date(o.fecha).toLocaleDateString('es-CL')}</td>
                <td>
                  {o.nombre} {o.apellidos}
                </td>
                <td>{precioCLP(o.total)}</td>
                <td>
                  <EstadoBoleta estado={o.estado} />
                </td>
                <td className="text-end">
                  <Link to={`/admin/ordenes/${o.id}`} className="btn btn-sm btn-outline-primary">
                    <Icono nombre="visibility" />
                    Ver boleta
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
