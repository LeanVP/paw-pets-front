// Navigate: redirige a otra ruta; Outlet: muestra la ruta hija que corresponda
import { Navigate, Outlet } from 'react-router-dom';
// useAuth: hook propio para saber quién tiene la sesión iniciada
import useAuth from '../hooks/useAuth';
// Roles que pueden entrar al panel (Anexo 1: el cliente solo accede a la tienda)
import { ROLES_PANEL } from '../utils/roles';

/**
 * Guardián de rutas por rol. Recibe los roles permitidos.
 * - Sin sesión: va al login.
 * - Cliente (no es del panel): vuelve a la tienda.
 * - Vendedor en una sección solo de admin: vuelve al inicio del panel.
 * Esto mejora la experiencia, pero la seguridad real la impone el backend (401/403).
 */
export default function RutaAdmin({ roles = ['admin'] }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles.includes(usuario.rol)) return <Outlet />;
  return <Navigate to={ROLES_PANEL.includes(usuario.rol) ? '/admin' : '/'} replace />;
}
