// useEffect: pide los datos al montar; useSyncExternalStore: lee datos que viven fuera de React
import { useEffect, useSyncExternalStore } from 'react';
// db: almacén conectado a la API (data/db.js)
import db from '../data/db';

/**
 * Devuelve la lista de una colección y re-renderiza el componente cuando cambia.
 * La primera vez que alguien la usa, se pide al backend (GET).
 */
export default function useColeccion(coleccion) {
  useEffect(() => {
    db.cargar(coleccion);
  }, [coleccion]);
  return useSyncExternalStore(db.suscribir, () => db.listar(coleccion));
}
