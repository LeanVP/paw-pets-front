/**
 * Ícono de Google Material Symbols (fuente cargada en index.html).
 * El nombre es el del catálogo https://fonts.google.com/icons (por ejemplo "shopping_cart").
 * aria-hidden: es decorativo, el texto que lo acompaña es el que leen los lectores de pantalla.
 */
export default function Icono({ nombre, relleno = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined icono ${relleno ? 'icono-relleno' : ''} ${className}`}
      aria-hidden="true"
    >
      {nombre}
    </span>
  );
}
