import { useState } from 'react';
import { AlertaError, AlertaExito } from '../../components/Estados';
import FormularioEntidad from '../../components/FormularioEntidad';
import db from '../../data/db';
import useAuth from '../../hooks/useAuth';
import { ENTIDADES } from './entidades';

// Mismo formulario que usuarios, sin el rol: el administrador no puede quitarse permisos a sí mismo
const camposPerfil = ENTIDADES.usuarios.campos([], true).filter((c) => c.nombre !== 'rol');
const { rol: _sinRol, ...reglasPerfil } = ENTIDADES.usuarios.reglas(true);

/** Edita los datos de la cuenta con sesión iniciada (PUT /usuarios/{id}). */
export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const [estado, setEstado] = useState({ enviando: false, guardado: false, error: null });
  const iniciales = Object.fromEntries(
    camposPerfil.map((c) => [c.nombre, c.nombre === 'clave' ? '' : usuario[c.nombre]]),
  );

  async function guardar(datos) {
    setEstado({ enviando: true, guardado: false, error: null });
    try {
      const actualizado = await db.actualizar('usuarios', usuario.id, { ...usuario, ...datos });
      actualizarUsuario(actualizado);
      setEstado({ enviando: false, guardado: true, error: null });
    } catch (e) {
      setEstado({ enviando: false, guardado: false, error: e.message });
    }
  }

  return (
    <div className="col-lg-8 col-xl-6">
      <h1 className="h3">Perfil</h1>
      <p className="text-secondary">Tus datos de acceso al panel.</p>
      <AlertaError mensaje={estado.error} />
      <div className="card card-body">
        <FormularioEntidad
          campos={camposPerfil}
          reglas={reglasPerfil}
          valoresIniciales={iniciales}
          onGuardar={guardar}
          enviando={estado.enviando}
          textoBoton="Guardar cambios"
        />
      </div>
      {estado.guardado && <AlertaExito>Perfil actualizado.</AlertaExito>}
    </div>
  );
}
