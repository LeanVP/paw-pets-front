import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertaError, EstadoCarga, EstadoVacio } from '../../components/Estados';
import Icono from '../../components/Icono';
import db from '../../data/db';
import useAuth from '../../hooks/useAuth';
import useColeccion from '../../hooks/useColeccion';
import { ENTIDADES } from './entidades';

/**
 * Listado de una entidad (productos, categorías o usuarios).
 * Admin: Nuevo, Editar y Eliminar. Vendedor: solo "Ver detalle" (lectura).
 */
export default function AdminEntidad() {
  const { entidad } = useParams();
  const { usuario } = useAuth();
  const config = ENTIDADES[entidad];
  if (!config) return <p className="alert alert-warning">Sección no encontrada.</p>;
  // Una entidad que el rol no puede ver: vuelve al inicio del panel
  if (!config.roles.includes(usuario.rol)) return <Navigate to="/admin" replace />;
  return (
    <EstadoCarga colecciones={[entidad]}>
      <Listado entidad={entidad} config={config} esAdmin={usuario.rol === 'admin'} />
    </EstadoCarga>
  );
}

function Listado({ entidad, config, esAdmin }) {
  const filas = useColeccion(entidad);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  // DELETE en el backend; si lo rechaza (por ejemplo, categoría con productos) muestra el motivo
  async function eliminar(id) {
    setError(null);
    setEliminando(id);
    try {
      await db.eliminar(entidad, id);
    } catch (e) {
      setError(e.message);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1 className="h3 mb-1">{config.titulo}</h1>
          <p className="text-secondary mb-0">
            {filas.length} {filas.length === 1 ? 'registro' : 'registros'}
            {!esAdmin && ' · modo lectura'}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {config.enlaces?.map(([ruta, texto, icono]) => (
            <Link key={ruta} to={ruta} className="btn btn-outline-dark">
              <Icono nombre={icono} />
              {texto}
            </Link>
          ))}
          {esAdmin && (
            <Link to={`/admin/${entidad}/nuevo`} className="btn btn-primary">
              <Icono nombre="add" />
              {config.nuevo} {config.singular}
            </Link>
          )}
        </div>
      </div>
      <AlertaError mensaje={error} />
      {filas.length === 0 ? (
        <EstadoVacio icono={config.icono}>Aún no hay {config.titulo.toLowerCase()}.</EstadoVacio>
      ) : (
        <div className="card tabla-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  {config.columnas.map(([campo, etiqueta]) => (
                    <th scope="col" key={campo}>
                      {etiqueta}
                    </th>
                  ))}
                  <th scope="col" className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => (
                  <tr key={fila.id}>
                    {config.columnas.map(([campo, , formato = String]) => (
                      <td key={campo}>{formato(fila[campo], fila)}</td>
                    ))}
                    <td>
                      <div className="d-flex flex-wrap gap-1 justify-content-end">
                        <Link
                          to={`/admin/${entidad}/${fila.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <Icono nombre={esAdmin ? 'edit' : 'visibility'} />
                          {esAdmin ? 'Editar' : 'Ver detalle'}
                        </Link>
                        {esAdmin && config.accionesFila?.(fila)}
                        {esAdmin && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={eliminando === fila.id}
                            onClick={() => eliminar(fila.id)}
                          >
                            <Icono nombre="delete" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
