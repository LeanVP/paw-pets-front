// Navigate: redirige a otra ruta; Outlet: muestra la ruta hija que corresponda
import { Navigate, Outlet } from 'react-router-dom';
// useAuth: hook propio para saber quién tiene la sesión iniciada
import useAuth from '../hooks/useAuth';

/** Protege rutas según el rol. Sin sesión va al login; con sesión pero sin permiso va a /admin. */
// Prop: roles = roles que pueden entrar (por defecto, solo admin)
// En App.jsx envuelve a las rutas /admin (admin y vendedor) y a las exclusivas del admin
export default function RutaAdmin({ roles = ['admin'] }) {
  // Usuario que tiene la sesión iniciada (o null si no hay nadie)
  const { usuario } = useAuth();
  // Sin sesión, o un cliente: al login
  if (!usuario || !['admin', 'vendedor'].includes(usuario.rol)) {
    return <Navigate to="/login" replace />;
  }
  // Con sesión de personal pero sin permiso para esta ruta: de vuelta al inicio del panel
  if (!roles.includes(usuario.rol)) return <Navigate to="/admin" replace />;
  // Tiene permiso: muestra la página pedida
  return <Outlet />;
}
