// Link: componente de react-router para ir a otra página sin recargar
import { Link } from 'react-router-dom';
// useCarrito: hook propio para leer y cambiar el carrito compartido
import useCarrito from '../hooks/useCarrito';
// precioCLP: da formato de pesos chilenos a un número
import { precioCLP } from '../utils/formato';
// precioFinal: precio de oferta si hay, o el normal
import { precioFinal } from '../utils/productos';
import { EstadoCarga, EstadoVacio } from '../components/Estados';
import Icono from '../components/Icono';

// Página del carrito con los productos que eligió el usuario
// Ruta: /carrito
function ContenidoCarrito() {
  // Productos, total y acciones para modificar el carrito
  // Todo viene del CarritoProvider, así esta página no guarda estado propio
  const { items, total, cambiarCantidad, quitar, vaciar } = useCarrito();

  // Si el carrito está vacío, muestra un aviso
  // y un link para volver a los productos
  if (items.length === 0) {
    return (
      <EstadoVacio
        icono="shopping_cart"
        accion={
          <Link to="/productos" className="btn btn-primary">
            Ver productos
          </Link>
        }
      >
        Tu carrito está vacío.
      </EstadoVacio>
    );
  }

  // Si hay productos, muestra la tabla, el total y los botones
  return (
    <>
      <h1 className="section-title">Carrito de compras</h1>
      {/* Tabla con los productos del carrito */}
      {/* table-responsive permite moverla de lado en pantallas chicas */}
      <div className="card tabla-card table-responsive">
        <table className="table align-middle mb-0">
          {/* Títulos de las columnas */}
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Precio</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Subtotal</th>
              {/* Columna de los botones: el título está oculto, solo lo leen los lectores de pantalla */}
              <th scope="col">
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Una fila por cada producto */}
            {/* Cada item trae el producto completo, la cantidad y el subtotal */}
            {items.map(({ producto, cantidad, subtotal }) => (
              <tr key={producto.id}>
                <td>{producto.nombre}</td>
                <td>{precioCLP(precioFinal(producto))}</td>
                <td>
                  {/* Input para cambiar la cantidad, máximo el stock */}
                  {/* Al cambiarlo llama a cambiarCantidad con el número nuevo */}
                  {/* Number() porque el input entrega texto */}
                  <input
                    type="number"
                    className="form-control form-control-sm cantidad-input"
                    aria-label={`Cantidad de ${producto.nombre}`}
                    min={1}
                    max={producto.stock}
                    value={cantidad}
                    onChange={(e) => cambiarCantidad(producto.id, Number(e.target.value))}
                  />
                </td>
                <td>{precioCLP(subtotal)}</td>
                <td>
                  {/* Botón para sacar este producto del carrito */}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => quitar(producto.id)}
                  >
                    <Icono nombre="delete" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Total a pagar */}
      <p className="h4 text-end mt-3">Total: {precioCLP(total)}</p>
      {/* Botones para vaciar el carrito o ir a pagar */}
      <div className="d-flex justify-content-end gap-2">
        {/* Limpiar llama a vaciar y deja el carrito sin productos */}
        <button type="button" className="btn btn-secondary" onClick={vaciar}>
          <Icono nombre="remove_shopping_cart" />
          Limpiar
        </button>
        {/* Comprar ahora lleva a la página de pago */}
        <Link to="/checkout" className="btn btn-success">
          <Icono nombre="shopping_cart_checkout" />
          Comprar ahora
        </Link>
      </div>
    </>
  );
}

// Espera a que lleguen los datos del backend antes de dibujar (muestra Cargando… o el error)
export default function Carrito() {
  return (
    <EstadoCarga colecciones={['productos']}>
      <ContenidoCarrito />
    </EstadoCarga>
  );
}
