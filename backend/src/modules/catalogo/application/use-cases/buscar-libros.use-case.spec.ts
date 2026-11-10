import { ValidationError } from '../../../../shared/domain/domain-error';
import { IdsSecuenciales } from '../../../../../test/fakes/auth.fakes';
import { LibrosEnMemoria } from '../../../../../test/fakes/catalogo.fakes';
import { BuscarLibrosUseCase } from './buscar-libros.use-case';
import { CrearLibroUseCase } from './crear-libro.use-case';

async function montar() {
  const libros = new LibrosEnMemoria()
    .conAutor('a-1', 'Gabriel García Márquez')
    .conAutor('a-2', 'Lucía Ramírez')
    .conTema('t-1', 'Literatura')
    .conTema('t-2', 'Historia');
  const crear = new CrearLibroUseCase(libros, new IdsSecuenciales());
  for (const datos of [
    { titulo: 'Cien años de soledad', autorIds: ['a-1'], temaIds: ['t-1'] },
    { titulo: 'El otoño del patriarca', autorIds: ['a-1'], temaIds: ['t-1'] },
    {
      titulo: 'Historia de la literatura',
      autorIds: ['a-2'],
      temaIds: ['t-2'],
    },
    { titulo: 'Atlas histórico', autorIds: ['a-2'], temaIds: ['t-2'] },
  ]) {
    await crear.execute({ ...datos, idioma: 'es' });
  }
  return { libros, buscar: new BuscarLibrosUseCase(libros) };
}

const titulos = (r: { items: { titulo: string }[] }) =>
  r.items.map((l) => l.titulo);

describe('BuscarLibrosUseCase (HU-20)', () => {
  it('busca por título', async () => {
    const { buscar } = await montar();
    expect(titulos(await buscar.execute({ q: 'soledad' }))).toEqual([
      'Cien años de soledad',
    ]);
  });

  it('busca por autor, sin distinguir mayúsculas', async () => {
    const { buscar } = await montar();
    expect(titulos(await buscar.execute({ q: 'MÁRQUEZ' }))).toEqual([
      'Cien años de soledad',
      'El otoño del patriarca',
    ]);
  });

  it('busca por tema', async () => {
    const { buscar } = await montar();
    const r = await buscar.execute({ q: 'historia' });
    // «Historia de la literatura» lo tiene en el título y en el tema: va primero.
    expect(titulos(r)).toEqual([
      'Historia de la literatura',
      'Atlas histórico',
    ]);
  });

  it('exige que todas las palabras aparezcan (en título, autor o tema)', async () => {
    const { buscar } = await montar();
    expect(titulos(await buscar.execute({ q: 'cien márquez' }))).toEqual([
      'Cien años de soledad',
    ]);
    expect((await buscar.execute({ q: 'cien ramírez' })).total).toBe(0);
  });

  it('ordena por relevancia: el título pesa más que el tema', async () => {
    const { buscar } = await montar();
    expect(titulos(await buscar.execute({ q: 'literatura' }))).toEqual([
      'Historia de la literatura',
      'Cien años de soledad',
      'El otoño del patriarca',
    ]);
  });

  it('normaliza espacios y mayúsculas y quita palabras repetidas', async () => {
    const { libros } = await montar();
    const spy = jest.spyOn(libros, 'buscar');
    await new BuscarLibrosUseCase(libros).execute({
      q: '  Cien   CIEN  años ',
    });
    expect(spy).toHaveBeenCalledWith({
      terminos: ['cien', 'años'],
      frase: 'cien cien años',
      pagina: 1,
      tamano: 20,
    });
  });

  it('pagina los resultados y ajusta valores fuera de rango', async () => {
    const { buscar } = await montar();
    const r = await buscar.execute({ q: 'márquez', pagina: 2, tamano: 1 });
    expect(r).toMatchObject({ total: 2, pagina: 2, tamano: 1 });
    expect(titulos(r)).toEqual(['El otoño del patriarca']);

    const ajustada = await buscar.execute({
      q: 'márquez',
      pagina: 0,
      tamano: 1000,
    });
    expect(ajustada).toMatchObject({ pagina: 1, tamano: 100 });
  });

  it.each(['', ' ', 'a', 'x'.repeat(101)])(
    'rechaza una búsqueda de longitud inválida: «%s»',
    async (q) => {
      const { buscar } = await montar();
      await expect(buscar.execute({ q })).rejects.toBeInstanceOf(
        ValidationError,
      );
    },
  );
});
