// db: el almacén de datos conectado al backend, que es lo que se prueba
import db from '../data/db';
// simularApi: fetch falso para probar sin backend
import { simularApi } from './ayudas';

// Pruebas del almacén de datos (db) con CRUD contra una API simulada
describe('Almacén de datos (db) conectado a la API', () => {
  // Deja la memoria vacía antes y después de cada prueba
  beforeEach(() => db.reiniciar());
  afterEach(() => db.reiniciar());

  const categorias = [
    { id: 1, nombre: 'Perros', imagen: '' },
    { id: 2, nombre: 'Gatos', imagen: '' },
  ];

  // Antes de cargar no hay datos y los nombres inválidos fallan
  it('listar entrega una lista vacía antes de cargar y rechaza colecciones inexistentes', () => {
    expect(db.listar('productos')).toEqual([]);
    expect(() => db.listar('inexistente')).toThrowError(/desconocida/);
  });

  // cargar hace GET a la ruta correcta y guarda el resultado
  it('cargar trae la colección con GET', async () => {
    const fetchFalso = simularApi({ 'GET /api/v1/categorias': categorias });
    await db.cargar('categorias');
    expect(fetchFalso.calls.mostRecent().args[0]).toBe('/api/v1/categorias');
    expect(db.listar('categorias')).toHaveSize(2);
    expect(db.obtener('categorias', 2).nombre).toBe('Gatos');
  });

  // crear envía POST y agrega el registro que devolvió el backend (con su id)
  it('crear hace POST y agrega el registro con el id que asignó el backend', async () => {
    simularApi({
      'GET /api/v1/categorias': categorias,
      'POST /api/v1/categorias': { id: 3, nombre: 'Aves', imagen: '' },
    });
    await db.cargar('categorias');
    const nueva = await db.crear('categorias', { nombre: 'Aves', imagen: '' });
    expect(nueva.id).toBe(3);
    expect(db.listar('categorias')).toHaveSize(3);
  });

  // actualizar envía PUT y reemplaza el registro
  it('actualizar hace PUT y reemplaza el registro', async () => {
    simularApi({
      'GET /api/v1/categorias': categorias,
      'PUT /api/v1/categorias/1': { id: 1, nombre: 'Canes', imagen: '' },
    });
    await db.cargar('categorias');
    await db.actualizar('categorias', 1, { nombre: 'Canes', imagen: '' });
    expect(db.obtener('categorias', 1).nombre).toBe('Canes');
    expect(db.obtener('categorias', 2).nombre).toBe('Gatos');
  });

  // eliminar envía DELETE y saca el registro
  it('eliminar hace DELETE y saca el registro', async () => {
    simularApi({
      'GET /api/v1/categorias': categorias,
      'DELETE /api/v1/categorias/1': { estado: 204 },
    });
    await db.cargar('categorias');
    await db.eliminar('categorias', 1);
    expect(db.obtener('categorias', 1)).toBeUndefined();
    expect(db.listar('categorias')).toHaveSize(1);
  });

  // Si el backend rechaza la operación, el error llega y los datos no cambian
  it('si el backend responde con error, lanza el mensaje y no modifica los datos', async () => {
    simularApi({
      'GET /api/v1/categorias': categorias,
      'DELETE /api/v1/categorias/1': {
        estado: 409,
        cuerpo: { mensaje: 'No se puede eliminar la categoría: tiene productos asociados.' },
      },
    });
    await db.cargar('categorias');
    let mensaje = '';
    try {
      await db.eliminar('categorias', 1);
    } catch (error) {
      mensaje = error.message;
    }
    expect(mensaje).toContain('tiene productos');
    expect(db.listar('categorias')).toHaveSize(2);
  });
});
