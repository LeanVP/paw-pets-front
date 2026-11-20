import { Link } from 'react-router-dom';
import { EstadoCarga, EstadoVacio, EtiquetaEstado } from '../../components/Estados';
import Icono from '../../components/Icono';
import useColeccion from '../../hooks/useColeccion';
import { esCritico, UMBRAL_CRITICO } from '../../utils/productos';

/** Productos con poco stock (admin y vendedor). */
export default function ProductosCriticos() {
  return (
    <>
      <Link to="/admin/productos" className="enlace-volver">
        <Icono nombre="arrow_back" />
        Volver a productos
      </Link>
      <h1 className="h3 mt-2">Productos críticos</h1>
      <p className="text-secondary">
        Productos con stock igual o menor a {UMBRAL_CRITICO} unidades.
      </p>
      <EstadoCarga colecciones={['productos']}>
        <Lista />
      </EstadoCarga>
    </>
  );
}

function Lista() {
  const criticos = useColeccion('productos').filter(esCritico);
  if (criticos.length === 0) {
    return <EstadoVacio icono="task_alt">No hay productos con stock crítico.</EstadoVacio>;
  }
  return (
    <ul className="list-group lista-paw">
      {criticos.map((p) => (
        <li
          className="list-group-item d-flex justify-content-between align-items-center gap-2"
          key={p.id}
        >
          {p.nombre}
          <EtiquetaEstado tipo="alerta">Stock: {p.stock}</EtiquetaEstado>
        </li>
      ))}
    </ul>
  );
}
