import Icono from './Icono';

/**
 * Campo de formulario con etiqueta, ayuda opcional y mensaje de error (clases Bootstrap).
 * tipo: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
 * opciones (solo select): [{ valor, texto }]
 * El error se muestra con borde rojo + ícono + texto, y queda asociado al campo (aria-describedby).
 */
export default function CampoFormulario({
  etiqueta,
  nombre,
  tipo = 'text',
  valor,
  error,
  ayuda,
  onChange,
  opciones,
  ...resto
}) {
  const clase = `${tipo === 'select' ? 'form-select' : 'form-control'} ${error ? 'is-invalid' : ''}`;
  const idError = `${nombre}-error`;
  const idAyuda = `${nombre}-ayuda`;
  const describe = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ') || undefined;
  const comunes = {
    id: nombre,
    name: nombre,
    value: valor ?? '',
    onChange,
    className: clase,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describe,
    ...resto,
  };

  let control;
  if (tipo === 'select') {
    control = (
      <select {...comunes}>
        <option value="">Selecciona una opción</option>
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.texto}
          </option>
        ))}
      </select>
    );
  } else if (tipo === 'textarea') {
    control = <textarea rows={3} {...comunes} />;
  } else {
    control = <input type={tipo} {...comunes} />;
  }

  return (
    <div className="mb-3">
      <label htmlFor={nombre} className="form-label fw-semibold">
        {etiqueta}
      </label>
      {control}
      {ayuda && !error && (
        <div id={idAyuda} className="form-text">
          {ayuda}
        </div>
      )}
      {error && (
        <div id={idError} className="invalid-feedback campo-error">
          <Icono nombre="error" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
