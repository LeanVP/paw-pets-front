import useFormulario from '../hooks/useFormulario';
import CampoFormulario from './CampoFormulario';
import Icono from './Icono';

/**
 * Formulario genérico dirigido por configuración (lista de campos y reglas).
 * - Los campos marcados como numerico se convierten a número antes de guardar.
 * - soloLectura: muestra los datos sin poder editarlos (rol vendedor).
 * - enviando: desactiva el botón mientras el backend responde.
 * - erroresServidor: errores por campo que devolvió el backend (400).
 */
export default function FormularioEntidad({
  campos,
  reglas,
  valoresIniciales,
  onGuardar,
  textoBoton = 'Guardar',
  soloLectura = false,
  enviando = false,
  erroresServidor = {},
}) {
  const { valores, errores, cambiar, enviar } = useFormulario(
    valoresIniciales,
    reglas,
    (datos) => {
      const convertidos = { ...datos };
      campos
        .filter((c) => c.numerico)
        .forEach((c) => (convertidos[c.nombre] = Number(datos[c.nombre])));
      onGuardar(convertidos);
    },
  );

  return (
    <form onSubmit={enviar} noValidate>
      {/* fieldset disabled desactiva todos los campos de una vez */}
      <fieldset disabled={soloLectura || enviando}>
        {campos.map(({ nombre, etiqueta, tipo, opciones, ayuda }) => (
          <CampoFormulario
            key={nombre}
            nombre={nombre}
            etiqueta={etiqueta}
            tipo={tipo}
            opciones={opciones}
            ayuda={ayuda}
            valor={valores[nombre]}
            error={errores[nombre] || erroresServidor[nombre]}
            onChange={cambiar}
          />
        ))}
      </fieldset>
      {!soloLectura && (
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icono nombre="save" />
          )}
          {textoBoton}
        </button>
      )}
    </form>
  );
}
