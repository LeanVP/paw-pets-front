// useState: hook de React para guardar datos que cambian (estado)
import { useState } from 'react';
// Link: ir a otra página sin recargar; useParams: leer el :id de la URL
import { Link, useParams } from 'react-router-dom';
// Hooks propios: carrito compartido y colecciones de db
import useCarrito from '../hooks/useCarrito';
import useColeccion from '../hooks/useColeccion';
// precioCLP: da formato de pesos chilenos a un número
import { precioCLP } from '../utils/formato';
// enOferta: dice si tiene oferta; precioFinal: precio que se cobra
import { enOferta, precioFinal } from '../utils/productos';
import { EstadoCarga, EtiquetaEstado } from '../components/Estados';
import Icono from '../components/Icono';

// Página con toda la información de un producto
// Ruta: /productos/:id
function ContenidoDetalleProducto() {
  // Saca el id del producto desde la URL
  const { id } = useParams();
  // Busca el producto que tiene ese id
  // Number(id) porque en la URL el id es texto
  const producto = useColeccion('productos').find((p) => p.id === Number(id));
  // Función para agregar al carrito
  const { agregar } = useCarrito();
  // Cantidad que el usuario quiere comprar, parte en 1
  // setCantidad la cambia cuando el usuario escribe en el input
  const [cantidad, setCantidad] = useState(1);
  // Dice si ya se agregó al carrito, para mostrar aviso
  // Parte en false: el aviso no se ve hasta apretar el botón
  const [agregado, setAgregado] = useState(false);
  // Si la foto no carga se muestra el reemplazo (igual que en la tarjeta del producto)
  const [imagenFallo, setImagenFallo] = useState(false);

  // Si el producto no existe, muestra un aviso
  // (por ejemplo si alguien escribe /productos/999)
  if (!producto) {
    return (
      <p className="alert alert-warning">
        Producto no encontrado. <Link to="/productos">Volver al catálogo</Link>
      </p>
    );
  }

  // Agrega la cantidad elegida al carrito y muestra el aviso
  function agregarAlCarrito() {
    // agregar viene del CarritoProvider; él revisa que no pase el stock
    agregar(producto.id, cantidad);
    // Cambia el estado para que aparezca el mensaje "Producto agregado"
    setAgregado(true);
  }

  // Dos columnas: imagen a la izquierda y datos a la derecha (en pantallas medianas)
  return (
    <div className="row g-4">
      {/* Columna de la imagen, o un reemplazo si no tiene */}
      <div className="col-md-6">
        {/* Si producto.imagen tiene algo se muestra la foto; si no, el cuadro de reemplazo */}
        {producto.imagen?.trim() && !imagenFallo ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="img-fluid detalle-imagen"
            onError={() => setImagenFallo(true)}
          />
        ) : (
          <div className="producto-placeholder detalle-imagen">
            <Icono nombre="hide_image" />
            Imagen no disponible
          </div>
        )}
      </div>
      {/* Columna con los datos del producto */}
      <div className="col-md-6">
        <h1 className="h2">{producto.nombre}</h1>
        {/* Precio: si está en oferta, muestra el normal tachado */}
        <p className="h4">
          {enOferta(producto) && (
            <span className="text-decoration-line-through text-secondary me-2">
              {precioCLP(producto.precio)}
            </span>
          )}
          {precioCLP(precioFinal(producto))}
        </p>
        {/* Descripción y stock del producto */}
        <p>{producto.descripcion}</p>
        <p>
          {producto.stock > 0 ? (
            <EtiquetaEstado tipo="ok" icono="inventory_2">
              Stock disponible: {producto.stock}
            </EtiquetaEstado>
          ) : (
            <EtiquetaEstado tipo="error">Sin stock</EtiquetaEstado>
          )}
        </p>
        {/* Elegir cantidad y botón para agregar al carrito */}
        <div className="d-flex gap-2 align-items-center mb-3">
          {/* htmlFor="cantidad" conecta la etiqueta con el input de id "cantidad" */}
          <label htmlFor="cantidad" className="form-label mb-0">
            Cantidad
          </label>
          {/* La cantidad queda entre 1 y el stock disponible */}
          {/* Math.max(1, ...) cambia 0 o negativos por 1; Math.min(stock, ...) no deja pasar el stock */}
          <input
            id="cantidad"
            type="number"
            className="form-control w-auto"
            min={1}
            max={producto.stock}
            value={cantidad}
            onChange={(e) =>
              setCantidad(Math.min(producto.stock, Math.max(1, Number(e.target.value))))
            }
          />
          {/* Se desactiva si no queda stock */}
          <button
            type="button"
            className="btn btn-primary"
            disabled={producto.stock === 0}
            onClick={agregarAlCarrito}
          >
            <Icono nombre="add_shopping_cart" />
            Agregar al carrito
          </button>
        </div>
        {/* Aviso que aparece después de agregar al carrito */}
        {agregado && (
          <p className="alert alert-success alerta-paw" role="status">
            <Icono nombre="check_circle" />
            Producto agregado. <Link to="/carrito">Ver carrito</Link>
          </p>
        )}
      </div>
    </div>
  );
}

// Espera a que lleguen los datos del backend antes de dibujar (muestra Cargando… o el error)
export default function DetalleProducto() {
  return (
    <EstadoCarga colecciones={['productos']}>
      <ContenidoDetalleProducto />
    </EstadoCarga>
  );
}
