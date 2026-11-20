import { Link, useParams } from 'react-router-dom';
import { EstadoBoleta, EstadoCarga } from '../../components/Estados';
import Icono from '../../components/Icono';
import ResumenOrden from '../../components/ResumenOrden';
import useColeccion from '../../hooks/useColeccion';

/** Detalle de una boleta (BOLETA + DETALLE_BOLETA) desde el panel. */
export default function Boleta() {
  return (
    <EstadoCarga colecciones={['boletas']}>
      <Detalle />
    </EstadoCarga>
  );
}

function Detalle() {
  const { id } = useParams();
  const orden = useColeccion('boletas').find((b) => b.id === Number(id));

  if (!orden) return <p className="alert alert-warning">Orden no encontrada.</p>;
  return (
    <>
      <Link to="/admin/ordenes" className="enlace-volver">
        <Icono nombre="arrow_back" />
        Volver a órdenes
      </Link>
      <section className="card card-body mt-2">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <h1 className="h3 mb-0">Boleta N° {orden.id}</h1>
          <EstadoBoleta estado={orden.estado} />
          <span className="text-secondary ms-auto small">
            {new Date(orden.fecha).toLocaleString('es-CL')} · {orden.medioPago}
          </span>
        </div>
        <ResumenOrden orden={orden} />
      </section>
    </>
  );
}
