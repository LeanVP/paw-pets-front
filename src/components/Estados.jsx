/**
 * Estados de una vista que consume la API: cargando, error, vacío, y la etiqueta de estado.
 * Cada estado se comunica con ícono + texto + color (nunca solo con color).
 */
import useCarga from '../hooks/useCarga';
import Icono from './Icono';

/** Indicador de carga accesible (role="status" lo anuncia el lector de pantalla). */
export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="estado-bloque" role="status">
      <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

/** Mensaje de error con su ícono. Si el backend envió errores por campo, los lista. */
export function AlertaError({ mensaje, campos, onReintentar }) {
  if (!mensaje) return null;
  const lista = Object.values(campos ?? {});
  return (
    <div className="alert alert-danger alerta-paw" role="alert">
      <Icono nombre="error" />
      <div className="flex-grow-1">
        <p className="mb-0">{mensaje}</p>
        {lista.length > 0 && (
          <ul className="mb-0 mt-1 ps-3">
            {lista.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>
        )}
      </div>
      {onReintentar && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReintentar}>
          <Icono nombre="refresh" /> Reintentar
        </button>
      )}
    </div>
  );
}

/** Mensaje de confirmación (por ejemplo, "Perfil actualizado"). */
export function AlertaExito({ children }) {
  return (
    <p className="alert alert-success alerta-paw" role="status">
      <Icono nombre="check_circle" />
      <span>{children}</span>
    </p>
  );
}

/** Estado vacío: ícono grande, mensaje y una acción opcional. */
export function EstadoVacio({ icono = 'inventory_2', children, accion }) {
  return (
    <div className="estado-vacio">
      <Icono nombre={icono} className="estado-vacio-icono" />
      <p className="mb-0">{children}</p>
      {accion}
    </div>
  );
}

/**
 * Muestra "Cargando…" o el error (con Reintentar) mientras las colecciones llegan del backend;
 * cuando están listas, dibuja el contenido.
 */
export function EstadoCarga({ colecciones, children }) {
  const { cargando, error, reintentar } = useCarga(...colecciones);
  if (error) return <AlertaError mensaje={error} onReintentar={reintentar} />;
  if (cargando) return <Cargando />;
  return children;
}

const TIPOS = {
  ok: 'check_circle',
  error: 'cancel',
  alerta: 'warning',
  info: 'info',
  neutro: 'label',
};

/** Etiqueta de estado (píldora): tipo = ok | error | alerta | info | neutro. */
export function EtiquetaEstado({ tipo = 'neutro', icono, children }) {
  return (
    <span className={`etiqueta etiqueta-${tipo}`}>
      <Icono nombre={icono ?? TIPOS[tipo]} />
      {children}
    </span>
  );
}

/** Etiqueta para el estado de una boleta: Pagada (verde) o Rechazada (rojo). */
export function EstadoBoleta({ estado }) {
  return <EtiquetaEstado tipo={estado === 'Pagada' ? 'ok' : 'error'}>{estado}</EtiquetaEstado>;
}
