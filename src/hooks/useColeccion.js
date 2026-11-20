// useEffect: hook para hacer algo después de dibujar; useSyncExternalStore: lee datos que viven fuera de React
import { useEffect, useSyncExternalStore } from 'react';
// db: almacén de datos conectado al backend (data/db.js)
import db from '../data/db';

/** Devuelve una colección y la trae del backend al montar el componente. */
// Parámetro: coleccion = nombre, por ejemplo 'productos' o 'boletas'
export default function useColeccion(coleccion) {
  // Al montar, pide los datos más recientes a la API (si falla, queda la lista vacía)
  useEffect(() => {
    db.cargar(coleccion).catch(() => {});
  }, [coleccion]);
  // Escucha a db y relee la colección cuando cambia
  return useSyncExternalStore(db.suscribir, () => db.listar(coleccion));
}
