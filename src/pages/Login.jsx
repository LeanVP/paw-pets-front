// useState: hook de React para guardar datos que cambian (estado)
import { useState } from 'react';
// Link: ir a otra página sin recargar; useNavigate: cambiar de página desde el código
import { Link, useNavigate } from 'react-router-dom';
// CampoFormulario: componente propio que dibuja un campo con etiqueta y error
import CampoFormulario from '../components/CampoFormulario';
// Hooks propios: sesión compartida y manejo del formulario
import useAuth from '../hooks/useAuth';
import useFormulario from '../hooks/useFormulario';
// Reglas de validación que se usan en este formulario
import { correo, requerido } from '../utils/validaciones';

// Validaciones: correo válido y contraseña obligatoria
const REGLAS = { correo: [requerido, correo], clave: [requerido] };

// Página para iniciar sesión
// Ruta: /login
export default function Login() {
  // Función que revisa correo y contraseña
  // Viene del AuthProvider
  const { iniciarSesion } = useAuth();
  // Para mandar al usuario a otra página
  const navegar = useNavigate();
  // Es true si el correo o la clave están mal
  // Parte en false: el mensaje de error no se ve al entrar
  const [credencialesInvalidas, setCredencialesInvalidas] = useState(false);
  // Mensaje si el servidor no responde (backend apagado, etc.)
  const [errorServidor, setErrorServidor] = useState('');

  // Maneja el formulario de login
  // Parte con correo y clave vacíos
  const { valores, errores, cambiar, enviar } = useFormulario(
    { correo: '', clave: '' },
    REGLAS,
    // Se ejecuta solo si pasó las validaciones; recibe lo escrito
    async ({ correo, clave }) => {
      setErrorServidor('');
      try {
        // Pide el login al backend (await espera la respuesta)
        // Devuelve el usuario si existe, o null si no
        const usuario = await iniciarSesion(correo, clave);
        // Admin y vendedor van al panel, cliente al inicio; si no, error
        if (usuario) {
          navegar(usuario.rol === 'cliente' ? '/' : '/admin');
        } else setCredencialesInvalidas(true);
      } catch (error) {
        setErrorServidor(error.message);
      }
    },
  );

  // Formulario angosto y centrado
  return (
    <section className="col-md-6 col-lg-4 mx-auto">
      <h1 className="section-title">Iniciar sesión</h1>
      {/* Formulario con correo y contraseña */}
      {/* noValidate apaga la validación del navegador; se usa la de useFormulario */}
      <form className="card card-body shadow-sm" onSubmit={enviar} noValidate>
        {/* Campo correo */}
        <CampoFormulario
          etiqueta="Correo electrónico"
          nombre="correo"
          tipo="email"
          valor={valores.correo}
          error={errores.correo}
          onChange={cambiar}
        />
        {/* Campo contraseña; tipo password esconde lo que se escribe */}
        <CampoFormulario
          etiqueta="Contraseña"
          nombre="clave"
          tipo="password"
          valor={valores.clave}
          error={errores.clave}
          onChange={cambiar}
        />
        {/* Error si los datos no coinciden con ninguna cuenta */}
        {/* role="alert" hace que los lectores de pantalla lo lean altiro */}
        {credencialesInvalidas && (
          <p className="alert alert-danger" role="alert">
            Correo o contraseña incorrectos.
          </p>
        )}
        {/* Error si el servidor no responde */}
        {errorServidor && (
          <p className="alert alert-danger" role="alert">
            {errorServidor}
          </p>
        )}
        {/* Botón que envía el formulario */}
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
        {/* Link para ir a crear una cuenta */}
        <p className="mt-3 mb-0 text-center">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </section>
  );
}
