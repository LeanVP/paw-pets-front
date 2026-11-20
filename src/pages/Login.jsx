import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CampoFormulario from '../components/CampoFormulario';
import { AlertaError } from '../components/Estados';
import Icono from '../components/Icono';
import useAuth from '../hooks/useAuth';
import useFormulario from '../hooks/useFormulario';
import { ROLES_PANEL } from '../utils/roles';
import { correo, requerido } from '../utils/validaciones';

const REGLAS = { correo: [requerido, correo], clave: [requerido] };

/**
 * Inicio de sesión contra el backend (POST /api/v1/auth/login).
 * Admin y vendedor van al panel; el cliente vuelve a donde estaba (por ejemplo, el checkout).
 */
export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [credencialesInvalidas, setCredencialesInvalidas] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const { valores, errores, cambiar, enviar } = useFormulario(
    { correo: '', clave: '' },
    REGLAS,
    async ({ correo, clave }) => {
      setEnviando(true);
      setCredencialesInvalidas(false);
      setErrorServidor(null);
      try {
        const usuario = await iniciarSesion(correo, clave);
        if (!usuario) {
          setCredencialesInvalidas(true);
          setEnviando(false);
          return;
        }
        navegar(ROLES_PANEL.includes(usuario.rol) ? '/admin' : (state?.desde ?? '/'));
      } catch (e) {
        // Error que no es de credenciales: por ejemplo, el backend está apagado
        setErrorServidor(e.message);
        setEnviando(false);
      }
    },
  );

  return (
    <section className="col-md-7 col-lg-5 col-xl-4 mx-auto">
      <h1 className="section-title">Iniciar sesión</h1>
      {state?.desde && (
        <p className="text-secondary">Inicia sesión para continuar con tu compra.</p>
      )}
      <form className="card card-body" onSubmit={enviar} noValidate>
        <CampoFormulario
          etiqueta="Correo electrónico"
          nombre="correo"
          tipo="email"
          autoComplete="email"
          valor={valores.correo}
          error={errores.correo}
          onChange={cambiar}
        />
        <CampoFormulario
          etiqueta="Contraseña"
          nombre="clave"
          tipo="password"
          autoComplete="current-password"
          valor={valores.clave}
          error={errores.clave}
          onChange={cambiar}
        />
        {credencialesInvalidas && <AlertaError mensaje="Correo o contraseña incorrectos." />}
        <AlertaError mensaje={errorServidor} />
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icono nombre="login" />
          )}
          Entrar
        </button>
        <p className="mt-3 mb-0 text-center">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </section>
  );
}
