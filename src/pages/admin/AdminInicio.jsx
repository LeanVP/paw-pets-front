// Navigate: redirige a otra ruta
import { Navigate } from 'react-router-dom';
// useAuth: hook propio para saber el rol del usuario
import useAuth from '../../hooks/useAuth';
import Dashboard from './Dashboard';

/** Página de /admin: el admin ve el Dashboard; el vendedor va directo a Productos. */
export default function AdminInicio() {
  const { usuario } = useAuth();
  return usuario.rol === 'admin' ? <Dashboard /> : <Navigate to="/admin/productos" replace />;
}
