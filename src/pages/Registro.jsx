// useState: hook de React para guardar datos que cambian (estado)
import { useState } from 'react';
// Link: ir a otra página sin recargar; useNavigate: cambiar de página desde el código
import { Link, useNavigate } from 'react-router-dom';
// Componentes propios del formulario: un campo suelto y el bloque de dirección
import CampoFormulario from '../components/CampoFormulario';
import CamposDireccion from '../components/CamposDireccion';
import { AlertaError } from '../components/Estados';
import Icono from '../components/Icono';
// Hooks propios: sesión compartida y manejo del formulario
import useAuth from '../hooks/useAuth';
import useFormulario from '../hooks/useFormulario';
// Reglas de validación que se usan en este formulario
import { coincideCon, correo, minimo, requerido } from '../utils/validaciones';

// Valores con que parte vacío el formulario de registro
// Hay un valor por cada campo del formulario
const INICIAL = {
  nombre: '',
  apellidos: '',
  correo: '',
  clave: '',
  confirmar: '',
  calle: '',
  region: '',
  comuna: '',
};
// Validaciones: clave de 6 letras mínimo y que coincidan
// confirmar debe ser igual al campo clave
const REGLAS = {
  nombre: [requerido],
  apellidos: [requerido],
  correo: [requerido, correo],
  clave: [requerido, minimo(6)],
  confirmar: [coincideCon('clave', 'Las contraseñas')],
  calle: [requerido],
  region: [requerido],
  comuna: [requerido],
};

// Página para crear una cuenta nueva
// Ruta: /registro
export default function Registro() {
  // Función que guarda el usuario nuevo
  // Viene del AuthProvider; devuelve (async) el usuario o null si el correo ya existe
  const { registrar } = useAuth();
  // Para mandar al usuario a otra página
  const navegar = useNavigate();
  // Se pone en true si el correo ya está registrado
  // Parte en false: el mensaje de error no se ve al entrar
  const [correoRepetido, setCorreoRepetido] = useState(false);
  // Error del servidor (por ejemplo, backend apagado) y estado de envío
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Maneja el formulario de registro
  const { valores, errores, cambiar, enviar } = useFormulario(
    INICIAL,
    REGLAS,
    // Saca "confirmar" porque no se guarda, solo era para validar
    // confirmar se renombra a _repetida (el _ indica que no se usa);
    // ...datos junta todos los demás campos
    async ({ confirmar: _repetida, ...datos }) => {
      setEnviando(true);
      setCorreoRepetido(false);
      setErrorServidor(null);
      try {
        // POST /api/v1/auth/registro: si se registró va al inicio; null = correo repetido
        if (await registrar(datos)) {
          navegar('/');
          return;
        }
        setCorreoRepetido(true);
      } catch (e) {
        setErrorServidor(e.message);
      }
      setEnviando(false);
    },
  );

  // Formulario centrado de media pantalla
  return (
    <section className="col-lg-6 mx-auto">
      <h1 className="section-title">Crear cuenta</h1>
      {/* noValidate apaga la validación del navegador; se usa la de useFormulario */}
      <form className="card card-body" onSubmit={enviar} noValidate>
        {/* Nombre y apellidos lado a lado */}
        <div className="row">
          <div className="col-md-6">
            <CampoFormulario
              etiqueta="Nombre"
              nombre="nombre"
              valor={valores.nombre}
              error={errores.nombre}
              onChange={cambiar}
            />
          </div>
          <div className="col-md-6">
            <CampoFormulario
              etiqueta="Apellidos"
              nombre="apellidos"
              valor={valores.apellidos}
              error={errores.apellidos}
              onChange={cambiar}
            />
          </div>
        </div>
        {/* Campo correo */}
        <CampoFormulario
          etiqueta="Correo electrónico"
          nombre="correo"
          tipo="email"
          valor={valores.correo}
          error={errores.correo}
          onChange={cambiar}
        />
        {/* Contraseña y su confirmación */}
        <div className="row">
          <div className="col-md-6">
            <CampoFormulario
              etiqueta="Contraseña"
              nombre="clave"
              tipo="password"
              valor={valores.clave}
              error={errores.clave}
              onChange={cambiar}
            />
          </div>
          <div className="col-md-6">
            <CampoFormulario
              etiqueta="Repetir contraseña"
              nombre="confirmar"
              tipo="password"
              valor={valores.confirmar}
              error={errores.confirmar}
              onChange={cambiar}
            />
          </div>
        </div>
        {/* Calle, región y comuna */}
        <CamposDireccion valores={valores} errores={errores} cambiar={cambiar} />
        {/* Error si ya hay una cuenta con ese correo */}
        {correoRepetido && <AlertaError mensaje="Ya existe una cuenta con ese correo." />}
        <AlertaError mensaje={errorServidor} />
        {/* Botón que envía el formulario */}
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icono nombre="person_add" />
          )}
          Crear cuenta
        </button>
        {/* Link para ir al login */}
        <p className="mt-3 mb-0 text-center">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </section>
  );
}
