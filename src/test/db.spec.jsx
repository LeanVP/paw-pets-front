// db: almacén del frontend conectado a la API REST
import db from '../data/db';
import { productosEjemplo, simularApi } from './ayudas';

// Todas las pruebas usan fetch simulado: no se necesita el backend encendido
describe('Almacén de datos (db) conectado a la API', () => {
  beforeEach(() => db.reiniciar());
  afterEach(() => db.reiniciar());

  it('cargar hace GET a la API y guarda la lista; una colección inexistente da error', async () => {
    const fetch = simularApi({ 'GET /productos': productosEjemplo });
    await db.cargar('productos');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(db.listar('productos').length).toBe(3);
    expect(db.estado('productos').cargado).toBeTrue();
    expect(() => db.listar('inexistente')).toThrowError(/desconocida/);
  });

  it('no repite la petición si la colección ya está cargada (salvo recargar)', async () => {
    const fetch = simularApi({ 'GET /productos': productosEjemplo });
    await db.cargar('productos');
    await db.cargar('productos');
    expect(fetch).toHaveBeenCalledTimes(1);
    await db.recargar('productos');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('si el backend falla guarda el mensaje de error', async () => {
    simularApi({ 'GET /productos': () => [{ mensaje: 'Ocurrió un error' }, 500] });
    await db.cargar('productos');
    expect(db.estado('productos').error).toBe('Ocurrió un error');
    expect(db.estado('productos').cargando).toBeFalse();
  });

  it('crear hace POST y agrega la respuesta del backend (con su id) a la lista', async () => {
    db.establecer('categorias', [{ id: 1, nombre: 'Perros', imagen: '/p.jpg' }]);
    const fetch = simularApi({
      'POST /categorias': (cuerpo) => [{ ...cuerpo, id: 2 }, 201],
    });
    const nueva = await db.crear('categorias', { nombre: 'Aves', imagen: '/a.jpg' });
    expect(nueva.id).toBe(2);
    expect(db.obtener('categorias', 2).nombre).toBe('Aves');
    expect(fetch.calls.mostRecent().args[1].method).toBe('POST');
  });

  it('actualizar (PUT) y eliminar (DELETE) cambian solo el registro indicado', async () => {
    db.establecer('productos', productosEjemplo);
    simularApi({
      'PUT /productos/1': (cuerpo) => [{ ...cuerpo, id: 1 }],
      'DELETE /productos/2': () => [null, 204],
    });
    await db.actualizar('productos', 1, { ...productosEjemplo[0], stock: 99 });
    expect(db.obtener('productos', 1).stock).toBe(99);
    expect(db.obtener('productos', 5).stock).not.toBe(99);
    await db.eliminar('productos', 2);
    expect(db.obtener('productos', 2)).toBeUndefined();
  });

  it('avisa a los suscriptores en cada cambio (mock) y olvida los datos privados al cambiar de sesión', () => {
    const aviso = jasmine.createSpy('aviso');
    const cancelar = db.suscribir(aviso);
    db.establecer('boletas', [{ id: 1 }]);
    expect(aviso).toHaveBeenCalledTimes(1);
    db.olvidarPrivadas();
    expect(db.listar('boletas')).toEqual([]);
    cancelar();
    db.establecer('boletas', [{ id: 2 }]);
    expect(aviso).toHaveBeenCalledTimes(2);
  });
});
