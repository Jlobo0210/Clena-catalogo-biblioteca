import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { IdsSecuenciales } from '../../../../../test/fakes/auth.fakes';
import { TemasEnMemoria } from '../../../../../test/fakes/catalogo.fakes';
import { ActualizarTemaUseCase } from './actualizar-tema.use-case';
import { CrearTemaUseCase } from './crear-tema.use-case';
import { EliminarTemaUseCase } from './eliminar-tema.use-case';
import { ListarTemasUseCase } from './listar-temas.use-case';
import { ObtenerTemaUseCase } from './obtener-tema.use-case';

const CREADO = new Date('2026-11-01T10:00:00Z');
const EDITADO = new Date('2026-11-09T10:00:00Z');

function montar() {
  const temas = new TemasEnMemoria();
  return {
    temas,
    crear: new CrearTemaUseCase(temas, new IdsSecuenciales(), () => CREADO),
    obtener: new ObtenerTemaUseCase(temas),
    listar: new ListarTemasUseCase(temas),
    actualizar: new ActualizarTemaUseCase(temas, () => EDITADO),
    eliminar: new EliminarTemaUseCase(temas),
  };
}

describe('CrearTemaUseCase (HU-15)', () => {
  it('guarda el tema, normaliza el nombre y devuelve un DTO plano', async () => {
    const s = montar();

    const tema = await s.crear.execute({
      nombre: '  Historia   del Caribe ',
      descripcion: ' Barranquilla y la región ',
    });

    expect(tema).toEqual({
      id: 'id-1',
      nombre: 'Historia del Caribe',
      descripcion: 'Barranquilla y la región',
      totalLibros: 0,
      creadoEn: CREADO.toISOString(),
      actualizadoEn: CREADO.toISOString(),
    });
    expect(s.temas.filas.size).toBe(1);
  });

  it('no permite temas repetidos (sin importar mayúsculas)', async () => {
    const s = montar();
    await s.crear.execute({ nombre: 'Literatura' });

    await expect(s.crear.execute({ nombre: 'LITERATURA' })).rejects.toThrow(
      ConflictError,
    );
    expect(s.temas.filas.size).toBe(1);
  });

  it('rechaza un nombre vacío', async () => {
    const s = montar();
    await expect(s.crear.execute({ nombre: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('ObtenerTemaUseCase', () => {
  it('devuelve el tema con su cantidad de libros, o 404', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Poesía' });
    s.temas.conLibros(id, 4);

    await expect(s.obtener.execute(id)).resolves.toMatchObject({
      id,
      totalLibros: 4,
    });
    await expect(s.obtener.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ListarTemasUseCase', () => {
  async function conVariosTemas() {
    const s = montar();
    const historia = await s.crear.execute({ nombre: 'Historia' });
    await s.crear.execute({ nombre: 'Arquitectura' });
    await s.crear.execute({ nombre: 'Literatura' });
    s.temas.conLibros(historia.id, 7);
    return s;
  }

  it('pagina, ordena por nombre por defecto e incluye los libros por tema', async () => {
    const s = await conVariosTemas();
    const pagina = await s.listar.execute({ tamano: 2 });

    expect(pagina).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
    expect(pagina.items.map((t) => [t.nombre, t.totalLibros])).toEqual([
      ['Arquitectura', 0],
      ['Historia', 7],
    ]);
  });

  it('filtra por nombre sin distinguir mayúsculas', async () => {
    const s = await conVariosTemas();
    await expect(
      s.listar.execute({ nombre: ' LITER ' }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ nombre: 'Literatura' }],
    });
  });

  it('ordena en orden descendente', async () => {
    const s = await conVariosTemas();
    const pagina = await s.listar.execute({ direccion: 'desc' });
    expect(pagina.items.map((t) => t.nombre)).toEqual([
      'Literatura',
      'Historia',
      'Arquitectura',
    ]);
  });

  it('ajusta página y tamaño fuera de rango', async () => {
    const s = await conVariosTemas();
    await expect(
      s.listar.execute({ pagina: 0, tamano: 1000 }),
    ).resolves.toMatchObject({ pagina: 1, tamano: 100 });
  });
});

describe('ActualizarTemaUseCase', () => {
  it('cambia nombre y descripción y actualiza la fecha de modificación', async () => {
    const s = montar();
    const { id } = await s.crear.execute({
      nombre: 'Historia',
      descripcion: 'x',
    });

    const tema = await s.actualizar.execute(id, {
      nombre: ' Historia  del Caribe ',
      descripcion: null,
    });

    expect(tema).toMatchObject({
      nombre: 'Historia del Caribe',
      descripcion: null,
      creadoEn: CREADO.toISOString(),
      actualizadoEn: EDITADO.toISOString(),
    });
  });

  it('solo cambia lo que se envía', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Historia' });

    await expect(
      s.actualizar.execute(id, { descripcion: 'Crónicas y archivo' }),
    ).resolves.toMatchObject({
      nombre: 'Historia',
      descripcion: 'Crónicas y archivo',
    });
  });

  it('no permite renombrar a un tema que ya existe, pero sí cambiar mayúsculas del propio', async () => {
    const s = montar();
    await s.crear.execute({ nombre: 'Literatura' });
    const { id } = await s.crear.execute({ nombre: 'Poesia' });

    await expect(
      s.actualizar.execute(id, { nombre: 'literatura' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      s.actualizar.execute(id, { nombre: 'POESIA' }),
    ).resolves.toMatchObject({ nombre: 'POESIA' });
  });

  it('devuelve 404 si el tema no existe', async () => {
    const s = montar();
    await expect(
      s.actualizar.execute('no-existe', { nombre: 'Nada' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('EliminarTemaUseCase', () => {
  it('elimina un tema sin libros', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Redes' });

    await s.eliminar.execute(id);

    expect(s.temas.filas.size).toBe(0);
  });

  it('R10: no elimina un tema con libros clasificados', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Redes' });
    s.temas.conLibros(id, 3);

    await expect(s.eliminar.execute(id)).rejects.toThrow(
      'tiene 3 libro(s) clasificado(s)',
    );
    expect(s.temas.filas.size).toBe(1);
  });

  it('devuelve 404 si el tema no existe', async () => {
    const s = montar();
    await expect(s.eliminar.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
