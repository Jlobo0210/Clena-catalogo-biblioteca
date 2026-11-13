import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { IdsSecuenciales } from '../../../../../test/fakes/auth.fakes';
import { AutoresEnMemoria } from '../../../../../test/fakes/catalogo.fakes';
import { ActualizarAutorUseCase } from './actualizar-autor.use-case';
import { CrearAutorUseCase } from './crear-autor.use-case';
import { EliminarAutorUseCase } from './eliminar-autor.use-case';
import { ListarAutoresUseCase } from './listar-autores.use-case';
import { ObtenerAutorUseCase } from './obtener-autor.use-case';

const CREADO = new Date('2026-11-01T10:00:00Z');
const EDITADO = new Date('2026-11-09T10:00:00Z');

function montar() {
  const autores = new AutoresEnMemoria();
  return {
    autores,
    crear: new CrearAutorUseCase(autores, new IdsSecuenciales(), () => CREADO),
    obtener: new ObtenerAutorUseCase(autores),
    listar: new ListarAutoresUseCase(autores),
    actualizar: new ActualizarAutorUseCase(autores, () => EDITADO),
    eliminar: new EliminarAutorUseCase(autores),
  };
}

describe('CrearAutorUseCase (HU-14)', () => {
  it('guarda el autor, normaliza el nombre y devuelve un DTO plano', async () => {
    const s = montar();

    const autor = await s.crear.execute({
      nombre: '  Gabriel   García Márquez ',
    });

    expect(autor).toMatchObject({
      id: 'id-1',
      nombre: 'Gabriel García Márquez',
      creadoEn: CREADO.toISOString(),
      actualizadoEn: CREADO.toISOString(),
    });
    expect(s.autores.filas.size).toBe(1);
  });

  it('rechaza un nombre vacío', async () => {
    const s = montar();
    await expect(s.crear.execute({ nombre: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(s.autores.filas.size).toBe(0);
  });
});

describe('ObtenerAutorUseCase', () => {
  it('devuelve el autor o 404', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'María José Ibáñez' });

    await expect(s.obtener.execute(id)).resolves.toMatchObject({ id });
    await expect(s.obtener.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('ListarAutoresUseCase', () => {
  async function conVariosAutores() {
    const s = montar();
    await s.crear.execute({ nombre: 'Andrés Núñez Castaño' });
    await s.crear.execute({ nombre: 'Gabriel García Márquez' });
    await s.crear.execute({ nombre: 'María José Ibáñez' });
    return s;
  }

  it('pagina y ordena por nombre por defecto', async () => {
    const s = await conVariosAutores();
    const pagina = await s.listar.execute({ tamano: 2 });

    expect(pagina).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
    expect(pagina.items.map((a) => a.nombre)).toEqual([
      'Andrés Núñez Castaño',
      'Gabriel García Márquez',
    ]);
  });

  it('filtra por nombre sin distinguir mayúsculas', async () => {
    const s = await conVariosAutores();

    await expect(
      s.listar.execute({ nombre: '  garcía ' }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ nombre: 'Gabriel García Márquez' }],
    });
    await expect(s.listar.execute({ nombre: 'MARÍA' })).resolves.toMatchObject({
      total: 1,
    });
  });

  it('ordena por nombre en orden descendente', async () => {
    const s = await conVariosAutores();
    const pagina = await s.listar.execute({
      ordenarPor: 'nombre',
      direccion: 'desc',
    });

    expect(pagina.items.map((a) => a.nombre)).toEqual([
      'María José Ibáñez',
      'Gabriel García Márquez',
      'Andrés Núñez Castaño',
    ]);
  });

  it('ajusta página y tamaño fuera de rango', async () => {
    const s = await conVariosAutores();
    const pagina = await s.listar.execute({ pagina: 0, tamano: 1000 });

    expect(pagina).toMatchObject({ pagina: 1, tamano: 100 });
  });
});

describe('ActualizarAutorUseCase', () => {
  it('cambia el nombre y actualiza la fecha de modificación', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Gabriel Garcia Marquez' });

    const autor = await s.actualizar.execute(id, {
      nombre: ' Gabriel  García Márquez ',
    });

    expect(autor).toMatchObject({
      id,
      nombre: 'Gabriel García Márquez',
      creadoEn: CREADO.toISOString(),
      actualizadoEn: EDITADO.toISOString(),
    });
    expect(s.autores.filas.get(id)?.nombre).toBe('Gabriel García Márquez');
  });

  it('devuelve 404 si el autor no existe', async () => {
    const s = montar();
    await expect(
      s.actualizar.execute('no-existe', { nombre: 'Nadie' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exige un nombre válido', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'María José Ibáñez' });

    await expect(s.actualizar.execute(id, {})).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('EliminarAutorUseCase', () => {
  it('elimina un autor sin libros asociados', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Andrés Núñez Castaño' });

    await s.eliminar.execute(id);

    expect(s.autores.filas.size).toBe(0);
  });

  it('R10: no elimina un autor con libros asociados', async () => {
    const s = montar();
    const { id } = await s.crear.execute({ nombre: 'Andrés Núñez Castaño' });
    s.autores.conLibros(id, 2);

    await expect(s.eliminar.execute(id)).rejects.toBeInstanceOf(ConflictError);
    await expect(s.eliminar.execute(id)).rejects.toThrow(
      'tiene 2 libro(s) asociado(s)',
    );
    expect(s.autores.filas.size).toBe(1);
  });

  it('devuelve 404 si el autor no existe', async () => {
    const s = montar();
    await expect(s.eliminar.execute('no-existe')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
