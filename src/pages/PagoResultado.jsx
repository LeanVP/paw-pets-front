import { Link, useParams } from 'react-router-dom';
import { EstadoCarga } from '../components/Estados';
import Icono from '../components/Icono';
import ResumenOrden from '../components/ResumenOrden';
import useColeccion from '../hooks/useColeccion';

/** Vista de compra exitosa (exito = true) o de pago con error (exito = false). */
export default function PagoResultado({ exito }) {
  return (
    <EstadoCarga colecciones={['boletas']}>
      <Resultado exito={exito} />
    </EstadoCarga>
  );
}

function Resultado({ exito }) {
  const { id } = useParams();
  // GET /boletas: el cliente solo recibe sus propias boletas
  const orden = useColeccion('boletas').find((b) => b.id === Number(id));

  if (!orden) return <p className="alert alert-warning">Orden no encontrada.</p>;
  return (
    <section className="col-lg-8 mx-auto card card-body">
      <div className={`resultado-pago ${exito ? 'resultado-ok' : 'resultado-error'}`}>
        <Icono nombre={exito ? 'check_circle' : 'cancel'} relleno />
        <h1 className="h3 mb-0">
          {exito
            ? `Se ha realizado la compra. Nro #${orden.id}`
            : `No se pudo realizar el pago. Nro #${orden.id}`}
        </h1>
      </div>
      <ResumenOrden orden={orden} />
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {exito ? (
          <button type="button" className="btn btn-danger" onClick={() => window.print()}>
            <Icono nombre="print" />
            Imprimir boleta
          </button>
        ) : (
          <Link to="/checkout" className="btn btn-success">
            <Icono nombre="replay" />
            Volver a realizar el pago
          </Link>
        )}
        <Link to="/" className="btn btn-outline-dark">
          <Icono nombre="home" />
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
