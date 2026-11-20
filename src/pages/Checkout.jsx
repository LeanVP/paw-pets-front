import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CampoFormulario from '../components/CampoFormulario';
import CamposDireccion from '../components/CamposDireccion';
import { AlertaError, EstadoCarga, EstadoVacio } from '../components/Estados';
import Icono from '../components/Icono';
import db from '../data/db';
import useAuth from '../hooks/useAuth';
import useCarrito from '../hooks/useCarrito';
import useFormulario from '../hooks/useFormulario';
import { precioCLP } from '../utils/formato';
import { correo, requerido } from '../utils/validaciones';

const MEDIO_RECHAZADO = 'Tarjeta sin fondos (simula error)';
const MEDIOS = ['Tarjeta de débito', 'Tarjeta de crédito', MEDIO_RECHAZADO].map((m) => ({
  valor: m,
  texto: m,
}));
const REGLAS = {
  nombre: [requerido],
  apellidos: [requerido],
  correo: [requerido, correo],
  calle: [requerido],
  region: [requerido],
  comuna: [requerido],
  medioPago: [requerido],
};

/**
 * Finalizar compra. Exige sesión (la boleta queda asociada al usuario, Figura 1).
 * Envía al backend solo { productoId, cantidad }: el servidor calcula precios y total,
 * valida y descuenta el stock y decide si el pago queda Pagada o Rechazada.
 */
export default function Checkout() {
  const { usuario } = useAuth();
  const { items } = useCarrito();

  if (!usuario) {
    return (
      <section className="col-lg-6 mx-auto">
        <h1 className="section-title">Finalizar compra</h1>
        <EstadoVacio
          icono="lock"
          accion={
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <Link to="/login" state={{ desde: '/checkout' }} className="btn btn-primary">
                <Icono nombre="login" />
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-outline-dark">
                <Icono nombre="person_add" />
                Crear cuenta
              </Link>
            </div>
          }
        >
          Para pagar debes iniciar sesión. Tu carrito se mantiene guardado.
        </EstadoVacio>
      </section>
    );
  }

  if (usuario.rol === 'vendedor') {
    return (
      <AlertaError mensaje="El perfil vendedor puede consultar productos y órdenes, pero no realizar compras." />
    );
  }

  return (
    <EstadoCarga colecciones={['productos']}>
      {items.length === 0 ? (
        <EstadoVacio
          icono="shopping_cart"
          accion={
            <Link to="/productos" className="btn btn-primary">
              Ver productos
            </Link>
          }
        >
          No hay productos para pagar.
        </EstadoVacio>
      ) : (
        <FormularioPago usuario={usuario} />
      )}
    </EstadoCarga>
  );
}

function FormularioPago({ usuario }) {
  const { items, total, vaciar } = useCarrito();
  const navegar = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const inicial = {
    nombre: usuario.nombre ?? '',
    apellidos: usuario.apellidos ?? '',
    correo: usuario.correo ?? '',
    calle: usuario.calle ?? '',
    region: usuario.region ?? '',
    comuna: usuario.comuna ?? '',
    indicaciones: '',
    medioPago: '',
  };

  const { valores, errores, cambiar, enviar } = useFormulario(inicial, REGLAS, async (datos) => {
    setEnviando(true);
    setError(null);
    try {
      // POST /api/v1/boletas
      const boleta = await db.crear('boletas', {
        ...datos,
        items: items.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad })),
      });
      // El stock cambió en el backend: se vuelve a pedir el catálogo
      db.recargar('productos');
      if (boleta.estado === 'Pagada') {
        navegar(`/compra/exitosa/${boleta.id}`);
        vaciar();
      } else {
        navegar(`/compra/error/${boleta.id}`);
      }
    } catch (e) {
      // Por ejemplo, 409 "Stock insuficiente..."
      setError(e.message);
      setEnviando(false);
    }
  });

  return (
    <section className="col-lg-8 mx-auto">
      <h1 className="section-title">Finalizar compra</h1>
      <form className="card card-body" onSubmit={enviar} noValidate>
        <p className="h5 text-end">Total a pagar: {precioCLP(total)}</p>
        <h2 className="h5">Información del cliente</h2>
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
        <CampoFormulario
          etiqueta="Correo electrónico"
          nombre="correo"
          tipo="email"
          valor={valores.correo}
          error={errores.correo}
          onChange={cambiar}
        />
        <h2 className="h5">Dirección de entrega</h2>
        <CamposDireccion valores={valores} errores={errores} cambiar={cambiar} />
        <CampoFormulario
          etiqueta="Indicaciones para la entrega (opcional)"
          nombre="indicaciones"
          tipo="textarea"
          valor={valores.indicaciones}
          onChange={cambiar}
        />
        <CampoFormulario
          etiqueta="Medio de pago"
          nombre="medioPago"
          tipo="select"
          opciones={MEDIOS}
          valor={valores.medioPago}
          error={errores.medioPago}
          onChange={cambiar}
        />
        <AlertaError mensaje={error} />
        <button type="submit" className="btn btn-success" disabled={enviando}>
          {enviando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icono nombre="lock" />
          )}
          Pagar ahora {precioCLP(total)}
        </button>
      </form>
    </section>
  );
}
