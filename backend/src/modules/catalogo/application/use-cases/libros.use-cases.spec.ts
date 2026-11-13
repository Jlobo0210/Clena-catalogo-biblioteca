import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { IdsSecuenciales } from '../../../../../test/fakes/auth.fakes';
import { LibrosEnMemoria } from '../../../../../test/fakes/catalogo.fakes';
import { Formato } from '../../domain/value-objects/formato';
import { TipoMaterial } from '../../domain/value-objects/tipo-material';
import { CrearLibroInput } from '../dtos/libro.dto';
import { ActualizarLibroUseCase } from './actualizar-libro.use-case';
import { CrearLibroUseCase } from './crear-libro.use-case';
import { EliminarLibroUseCase } from './eliminar-libro.use-case';
import { ListarLibrosUseCase } from './listar-libros.use-case';
import { ObtenerLibroUseCase } from './obtener-libro.use-case';

const AHORA = new Date('2026-11-08T10:00:00Z');
const reloj = () => AHORA;

function montar() {
  const libros = new LibrosEnMemoria()
    .conAutor('a-1', 'Gabriel García Márquez')
    .conAutor('a-2', 'Lucía Ramírez Peñaloza')
    .conTema('t-1', 'Literatura')
    .conTema('t-2', 'Historia');
  return {
    libros,
    crear: new CrearLibroUseCase(libros, new IdsSecuenciales(), reloj),
    obtener: new ObtenerLibroUseCase(libros),
    listar: new ListarLibrosUseCase(libros),
    actualizar: new ActualizarLibroUseCase(libros, reloj),
    eliminar: new EliminarLibroUseCase(libros),
  };
}

const nuevo: CrearLibroInput = {
  titulo: 'Cien años de soledad',
  idioma: 'es',
  anioPublicacion: 1967,
  isbn: '978-0-306-40615-7',
  autorIds: ['a-2', 'a-1'],
  temaIds: ['t-1'],
};

describe('CrearLibroUseCase (HU-16)', () => {
  it('registra el libro con sus autores en orden y sus temas', async () => {
    const s = montar();
    const libro = await s.crear.execute(nuevo);

    expect(libro).toMatchObject({
      id: 'id-1',
      titulo: 'Cien años de soledad',
      isbn: '9780306406157',
      tipoMaterial: TipoMaterial.LIBRO,
      formato: Formato.FISICO,
      creadoEn: AHORA.toISOString(),
    });
    expect(libro.autores.map((a) => a.id)).toEqual(['a-2', 'a-1']);
    expect(libro.temas).toEqual([{ id: 't-1', nombre: 'Literatura' }]);
    expect(s.libros.filas.size).toBe(1);
  });

  it('rechaza autores o temas que no existen', async () => {
    const s = montar();
    await expect(
      s.crear.execute({ ...nuevo, autorIds: ['a-1', 'a-9'] }),
    ).rejects.toThrow('No existen estos autores: a-9');
    await expect(
      s.crear.execute({ ...nuevo, temaIds: ['t-9'] }),
    ).rejects.toThrow('No existen estos temas: t-9');
    expect(s.libros.filas.size).toBe(0);
  });

  it('exige al menos un autor', async () => {
    const s = montar();
    await expect(
      s.crear.execute({ ...nuevo, autorIds: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('R2: no permite repetir un ISBN', async () => {
    const s = montar();
    await s.crear.execute(nuevo);
    await expect(
      s.crear.execute({ ...nuevo, titulo: 'Otro', isbn: '9780306406157' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('permite varios libros sin ISBN', async () => {
    const s = montar();
    await s.crear.execute({ ...nuevo, isbn: null });
    await s.crear.execute({ ...nuevo, isbn: undefined, titulo: 'Otro' });
    expect(s.libros.filas.size).toBe(2);
  });
});

describe('ObtenerLibroUseCase', () => {
  it('devuelve el libro o 404', async () => {
    const s = montar();
    const { id } = await s.crear.execute(nuevo);
    await expect(s.obtener.execute(id)).resolves.toMatchObject({ id });
    await expect(s.obtener.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ListarLibrosUseCase', () => {
  async function conVariosLibros() {
    const s = montar();
    await s.crear.execute({ ...nuevo, isbn: null });
    await s.crear.execute({
      ...nuevo,
      isbn: null,
      titulo: 'Atlas de historia',
      idioma: 'en',
      anioPublicacion: 2001,
      autorIds: ['a-2'],
      temaIds: ['t-2'],
    });
    await s.crear.execute({
      ...nuevo,
      isbn: null,
      titulo: 'Bitácora digital',
      anioPublicacion: null,
      formato: Formato.DIGITAL,
      enlaceDigital: 'https://biblioteca.example/bitacora',
      tipoMaterial: TipoMaterial.REVISTA,
    });
    return s;
  }

  it('pagina y ordena por título por defecto', async () => {
    const s = await conVariosLibros();
    const pagina = await s.listar.execute({ tamano: 2 });

    expect(pagina).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
    expect(pagina.items.map((l) => l.titulo)).toEqual([
      'Atlas de historia',
      'Bitácora digital',
    ]);
  });

  it('ajusta página y tamaño fuera de rango', async () => {
    const s = await conVariosLibros();
    const pagina = await s.listar.execute({ pagina: 0, tamano: 1000 });
    expect(pagina).toMatchObject({ pagina: 1, tamano: 100 });
  });

  it('combina filtros', async () => {
    const s = await conVariosLibros();
    const titulos = async (input: Parameters<typeof s.listar.execute>[0]) =>
      (await s.listar.execute(input)).items.map((l) => l.titulo);

    expect(await titulos({ idioma: 'EN' })).toEqual(['Atlas de historia']);
    expect(await titulos({ autorId: 'a-1', temaId: 't-1' })).toEqual([
      'Bitácora digital',
      'Cien años de soledad',
    ]);
    expect(await titulos({ formato: Formato.DIGITAL })).toEqual([
      'Bitácora digital',
    ]);
    expect(await titulos({ tipoMaterial: TipoMaterial.REVISTA })).toEqual([
      'Bitácora digital',
    ]);
    expect(await titulos({ texto: '  cien ' })).toEqual([
      'Cien años de soledad',
    ]);
    expect(
      await titulos({
        anioDesde: 1960,
        anioHasta: 2010,
        ordenarPor: 'anio',
        direccion: 'desc',
      }),
    ).toEqual(['Atlas de historia', 'Cien años de soledad']);
  });

  it('rechaza un rango de años invertido', async () => {
    const s = montar();
    await expect(
      s.listar.execute({ anioDesde: 2020, anioHasta: 1990 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('ActualizarLibroUseCase', () => {
  it('cambia solo los campos enviados y reemplaza autores y temas', async () => {
    const s = montar();
    const { id } = await s.crear.execute(nuevo);

    const libro = await s.actualizar.execute(id, {
      titulo: 'Cien años de soledad (edición conmemorativa)',
      autorIds: ['a-1'],
      temaIds: [],
    });

    expect(libro.titulo).toBe('Cien años de soledad (edición conmemorativa)');
    expect(libro.isbn).toBe('9780306406157');
    expect(libro.autores.map((a) => a.id)).toEqual(['a-1']);
    expect(libro.temas).toEqual([]);
  });

  it('devuelve 404 si el libro no existe', async () => {
    const s = montar();
    await expect(
      s.actualizar.execute('no-existe', { titulo: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('R2: no permite tomar el ISBN de otro libro, pero sí conservar el propio', async () => {
    const s = montar();
    await s.crear.execute(nuevo);
    const otro = await s.crear.execute({ ...nuevo, isbn: null });

    await expect(
      s.actualizar.execute(otro.id, { isbn: '9780306406157' }),
    ).rejects.toBeInstanceOf(ConflictError);

    const primero = [...s.libros.filas.values()][0];
    await expect(
      s.actualizar.execute(primero.id, { isbn: '978-0-306-40615-7' }),
    ).resolves.toMatchObject({ isbn: '9780306406157' });
  });

  it('R3: no deja pasar a solo digital un libro con ejemplares', async () => {
    const s = montar();
    const { id } = await s.crear.execute(nuevo);
    s.libros.ejemplares.set(id, 2);

    await expect(
      s.actualizar.execute(id, {
        formato: Formato.DIGITAL,
        enlaceDigital: 'https://biblioteca.example/x',
      }),
    ).rejects.toThrow('El libro tiene ejemplares físicos');

    await expect(
      s.actualizar.execute(id, {
        formato: Formato.FISICO_Y_DIGITAL,
        enlaceDigital: 'https://biblioteca.example/x',
      }),
    ).resolves.toMatchObject({ formato: Formato.FISICO_Y_DIGITAL });
  });
});

describe('EliminarLibroUseCase', () => {
  it('elimina un libro sin ejemplares', async () => {
    const s = montar();
    const { id } = await s.crear.execute(nuevo);
    await s.eliminar.execute(id);
    expect(s.libros.filas.size).toBe(0);
  });

  it('no elimina un libro con ejemplares', async () => {
    const s = montar();
    const { id } = await s.crear.execute(nuevo);
    s.libros.ejemplares.set(id, 1);
    await expect(s.eliminar.execute(id)).rejects.toThrow(
      'tiene 1 ejemplar(es)',
    );
    expect(s.libros.filas.size).toBe(1);
  });

  it('devuelve 404 si el libro no existe', async () => {
    const s = montar();
    await expect(s.eliminar.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
