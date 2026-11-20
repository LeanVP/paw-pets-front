import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertaError, EstadoCarga } from '../../components/Estados';
import FormularioEntidad from '../../components/FormularioEntidad';
import Icono from '../../components/Icono';
import db from '../../data/db';
import useAuth from '../../hooks/useAuth';
import useColeccion from '../../hooks/useColeccion';
import { ENTIDADES } from './entidades';

/**
 * Crea (/nuevo) o edita (/:id) un registro de la entidad indicada en la URL.
 * El vendedor ve el mismo formulario en modo lectura ("Ver detalle").
 */
export default function AdminFormulario() {
  const { entidad } = useParams();
  const { usuario } = useAuth();
  const config = ENTIDADES[entidad];
  if (!config) return <p className="alert alert-warning">Sección no encontrada.</p>;
  if (!config.roles.includes(usuario.rol)) return <Navigate to="/admin" replace />;
  return (
    <EstadoCarga colecciones={[entidad, 'categorias']}>
      <Formulario entidad={entidad} config={config} soloLectura={usuario.rol !== 'admin'} />
    </EstadoCarga>
  );
}

function Formulario({ entidad, config, soloLectura }) {
  const { id } = useParams();
  const navegar = useNavigate();
  const categorias = useColeccion('categorias');
  const existente = useColeccion(entidad).find((item) => item.id === Number(id));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});

  if (id && !existente) return <p className="alert alert-warning">Registro no encontrado.</p>;

  const editando = Boolean(existente);
  const campos = config.campos(categorias, editando);
  const valoresIniciales = Object.fromEntries(
    campos.map((c) => [c.nombre, existente?.[c.nombre] ?? config.inicial[c.nombre] ?? '']),
  );

  async function guardar(datos) {
    setEnviando(true);
    setError(null);
    setErroresCampos({});
    try {
      // Al editar se envía el registro completo con los cambios encima
      // (así no se pierden campos que este formulario no muestra, como la dirección del usuario).
      if (editando) await db.actualizar(entidad, existente.id, { ...existente, ...datos });
      else await db.crear(entidad, { ...config.inicial, ...datos });
      navegar(`/admin/${entidad}`);
    } catch (e) {
      setError(e.message);
      setErroresCampos(e.campos ?? {});
      setEnviando(false);
    }
  }

  let titulo = `${config.nuevo} ${config.singular}`;
  if (soloLectura) titulo = `Detalle ${config.del} ${config.singular}`;
  else if (editando) titulo = `Editar ${config.singular}`;

  return (
    <div className="col-lg-8 col-xl-6">
      <Link to={`/admin/${entidad}`} className="enlace-volver">
        <Icono nombre="arrow_back" />
        Volver a {config.titulo.toLowerCase()}
      </Link>
      <h1 className="h3 mt-2">{titulo}</h1>
      <AlertaError mensaje={error} />
      <div className="card card-body">
        <FormularioEntidad
          key={id ?? 'nuevo'}
          campos={campos}
          reglas={config.reglas(editando)}
          valoresIniciales={valoresIniciales}
          onGuardar={guardar}
          soloLectura={soloLectura}
          enviando={enviando}
          erroresServidor={erroresCampos}
        />
      </div>
    </div>
  );
}
