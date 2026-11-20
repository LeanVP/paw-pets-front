import { useEffect, useSyncExternalStore } from 'react';
import db from '../data/db';

/**
 * Estado de carga de una o más colecciones: { cargando, error, reintentar }.
 * cargando = alguna todavía no llega del backend; error = el mensaje del primer error.
 */
export default function useCarga(...colecciones) {
  const clave = colecciones.join(',');

  useEffect(() => {
    clave.split(',').forEach((coleccion) => db.cargar(coleccion));
  }, [clave]);

  // El "resumen" es un texto (comparable por valor) para que React no redibuje de más.
  const resumen = useSyncExternalStore(db.suscribir, () => {
    const estados = clave.split(',').map((coleccion) => db.estado(coleccion));
    const cargando = estados.some((e) => e.cargando || (!e.cargado && !e.error));
    const error = estados.find((e) => e.error)?.error ?? '';
    return `${cargando ? 1 : 0}${error}`;
  });

  return {
    cargando: resumen[0] === '1',
    error: resumen.slice(1) || null,
    reintentar: () => clave.split(',').forEach((coleccion) => db.recargar(coleccion)),
  };
}
