/**
 * Configuración de las entidades administrables. Cada una define:
 * - roles: quién la ve en el panel (el vendedor solo ve productos, en modo lectura);
 * - columnas de la tabla, campos del formulario y reglas de validación.
 * Las vistas AdminEntidad y AdminFormulario son genéricas y usan esta configuración.
 */
import { Link } from 'react-router-dom';
import { EtiquetaEstado } from '../../components/Estados';
import Icono from '../../components/Icono';
import { precioCLP } from '../../utils/formato';
import { esCritico } from '../../utils/productos';
import { ROLES } from '../../utils/roles';
import {
  correo,
  minimo,
  minimoSiHay,
  numeroNoNegativo,
  requerido,
} from '../../utils/validaciones';

export const ENTIDADES = {
  productos: {
    titulo: 'Productos',
    singular: 'producto',
    // Para los textos: "Nuevo producto", "Detalle del producto"
    nuevo: 'Nuevo',
    del: 'del',
    icono: 'inventory_2',
    roles: ['admin', 'vendedor'],
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
      ['precio', 'Precio', precioCLP],
      // El stock crítico se marca con color + ícono + texto
      [
        'stock',
        'Stock',
        (stock, fila) =>
          esCritico(fila) ? (
            <EtiquetaEstado tipo="alerta">{stock} · crítico</EtiquetaEstado>
          ) : (
            String(stock)
          ),
      ],
    ],
    inicial: { precioOferta: 0, destacado: false },
    campos: (categorias) => [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      {
        nombre: 'categoriaId',
        etiqueta: 'Categoría',
        tipo: 'select',
        numerico: true,
        opciones: categorias.map((c) => ({ valor: c.id, texto: c.nombre })),
      },
      { nombre: 'precio', etiqueta: 'Precio', tipo: 'number', numerico: true },
      {
        nombre: 'precioOferta',
        etiqueta: 'Precio de oferta (0 = sin oferta)',
        tipo: 'number',
        numerico: true,
      },
      { nombre: 'stock', etiqueta: 'Stock', tipo: 'number', numerico: true },
      { nombre: 'imagen', etiqueta: 'URL de la imagen (opcional)' },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' },
    ],
    reglas: () => ({
      nombre: [requerido],
      categoriaId: [requerido],
      precio: [numeroNoNegativo],
      precioOferta: [numeroNoNegativo],
      stock: [numeroNoNegativo],
      descripcion: [requerido],
    }),
    enlaces: [['/admin/productos/criticos', 'Productos críticos', 'warning']],
  },
  categorias: {
    titulo: 'Categorías',
    singular: 'categoría',
    nuevo: 'Nueva',
    del: 'de la',
    icono: 'category',
    roles: ['admin'],
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
    inicial: {},
    campos: () => [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'imagen', etiqueta: 'URL de la imagen' },
    ],
    reglas: () => ({ nombre: [requerido], imagen: [requerido] }),
  },
  usuarios: {
    titulo: 'Usuarios',
    singular: 'usuario',
    nuevo: 'Nuevo',
    del: 'del',
    icono: 'group',
    roles: ['admin'],
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
      ['correo', 'Correo'],
      ['rol', 'Rol', (rol) => <EtiquetaEstado icono="badge">{rol}</EtiquetaEstado>],
    ],
    inicial: { rol: 'cliente' },
    // editando = true: la contraseña es opcional (vacía = mantener la actual)
    campos: (_categorias, editando) => [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'apellidos', etiqueta: 'Apellidos' },
      { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email' },
      {
        nombre: 'clave',
        etiqueta: 'Contraseña',
        tipo: 'password',
        ayuda: editando
          ? 'Déjala vacía para mantener la contraseña actual.'
          : 'Mínimo 6 caracteres.',
      },
      {
        nombre: 'rol',
        etiqueta: 'Rol',
        tipo: 'select',
        opciones: ROLES.map((r) => ({ valor: r, texto: r })),
      },
    ],
    reglas: (editando) => ({
      nombre: [requerido],
      apellidos: [requerido],
      correo: [requerido, correo],
      clave: editando ? [minimoSiHay(6)] : [requerido, minimo(6)],
      rol: [requerido],
    }),
    accionesFila: (fila) => (
      <Link
        to={`/admin/usuarios/${fila.id}/historial`}
        className="btn btn-sm btn-outline-secondary"
      >
        <Icono nombre="history" />
        Historial
      </Link>
    ),
  },
};
