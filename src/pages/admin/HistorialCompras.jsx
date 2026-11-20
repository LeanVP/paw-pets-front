import { Link, useParams } from 'react-router-dom';
import { EstadoCarga, EstadoVacio } from '../../components/Estados';
import Icono from '../../components/Icono';
import useColeccion from '../../hooks/useColeccion';
import { precioCLP } from '../../utils/formato';

/** Compras pagadas de un usuario (solo administrador). */
export default function HistorialCompras() {
  return (
    <EstadoCarga colecciones={['usuarios', 'boletas']}>
      <Historial />
    </EstadoCarga>
  );
}

function Historial() {
  const { id } = useParams();
  const usuario = useColeccion('usuarios').find((u) => u.id === Number(id));
  const compras = useColeccion('boletas').filter(
    (o) => o.clienteId === Number(id) && o.estado === 'Pagada',
  );

  if (!usuario) return <p className="alert alert-warning">Usuario no encontrado.</p>;
  return (
    <>
      <Link to="/admin/usuarios" className="enlace-volver">
        <Icono nombre="arrow_back" />
        Volver a usuarios
      </Link>
      <h1 className="h3 mt-2">
        Historial de compras de {usuario.nombre} {usuario.apellidos}
      </h1>
      {compras.length === 0 ? (
        <EstadoVacio icono="shopping_bag">Este usuario aún no tiene compras.</EstadoVacio>
      ) : (
        <ul className="list-group lista-paw">
          {compras.map((o) => (
            <li className="list-group-item d-flex justify-content-between" key={o.id}>
              <Link to={`/admin/ordenes/${o.id}`}>
                Orden #{o.id} · {new Date(o.fecha).toLocaleDateString('es-CL')}
              </Link>
              <strong>{precioCLP(o.total)}</strong>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
