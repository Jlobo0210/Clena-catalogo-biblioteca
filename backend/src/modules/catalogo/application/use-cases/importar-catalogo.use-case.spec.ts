import {
  ValidationError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { ImportadorEnMemoria } from '../../../../../test/fakes/importacion.fakes';
import { FilaCatalogo } from '../../domain/repositories/importador-catalogo';
import { CsvParseLector } from '../../infrastructure/csv/csv-parse.lector';
import {
  COLUMNAS_CATALOGO,
  ImportarCatalogoUseCase,
  MAX_FILAS,
  plantillaCsv,
} from './importar-catalogo.use-case';

const CABECERA = COLUMNAS_CATALOGO.join(',');

function montar() {
  const importador = new ImportadorEnMemoria();
  const importar = new ImportarCatalogoUseCase(
    new CsvParseLector(),
    importador,
  );
  return { importador, importar };
}

/** Arma una fila a partir de los valores por columna. */
function fila(
  valores: Partial<Record<(typeof COLUMNAS_CATALOGO)[number], string>>,
) {
  return COLUMNAS_CATALOGO.map((c) => valores[c] ?? '').join(',');
}

const csv = (...filas: string[]) => [CABECERA, ...filas].join('\n');

describe('ImportarCatalogoUseCase (HU-19)', () => {
  it('la plantilla trae la cabecera y filas de ejemplo que se importan sin errores', async () => {
    const { importar } = montar();
    expect(plantillaCsv().split('\r\n')[0]).toBe(CABECERA);

    const reporte = await importar.execute(plantillaCsv());
    expect(reporte).toMatchObject({
      totalFilas: 2,
      filasImportadas: 2,
      filasConError: 0,
      librosCreados: 2,
      ejemplaresCreados: 1,
      autoresCreados: 3,
      temasCreados: 3,
      ubicacionesCreadas: 1,
      columnasIgnoradas: [],
      errores: [],
    });
  });

  it('informa las columnas que no son de la plantilla', async () => {
    const { importar } = montar();
    const reporte = await importar.execute(
      'titulo,autores,idioma,Año publicación,observaciones\nA,Ana,es,1990,x\n',
    );
    expect(reporte.columnasIgnoradas).toEqual([
      'ano_publicacion',
      'observaciones',
    ]);
    expect(reporte.filasImportadas).toBe(1);
  });

  it('crea autores y temas nuevos y normaliza los datos del libro', async () => {
    const { importar, importador } = montar();
    await importar.execute(
      csv(
        fila({
          titulo: '  Cien   años de soledad ',
          autores: 'Gabriel García Márquez | Otro Autor',
          idioma: 'ES',
          temas: 'Literatura|literatura|Novela',
          isbn: '978-0-306-40615-7',
          tipo_material: 'libro',
          formato: 'Físico y digital',
          enlace_digital: 'https://biblioteca.example/cien',
          anio_publicacion: '1967',
        }),
      ),
    );
    const guardada: FilaCatalogo = importador.libros[0].fila;
    expect(guardada).toEqual({
      libro: {
        titulo: 'Cien años de soledad',
        anioPublicacion: 1967,
        idioma: 'es',
        isbn: '9780306406157',
        tipoMaterial: 'LIBRO',
        formato: 'FISICO_Y_DIGITAL',
        enlaceDigital: 'https://biblioteca.example/cien',
      },
      autores: ['Gabriel García Márquez', 'Otro Autor'],
      temas: ['Literatura', 'Novela'],
      ejemplar: null,
    });
  });

  it('no duplica libros por ISBN: las filas siguientes agregan ejemplares', async () => {
    const { importar } = montar();
    const comun = {
      titulo: 'Cien años de soledad',
      autores: 'Gabriel García Márquez',
      idioma: 'es',
      isbn: '9780306406157',
      sala: 'Sala 1',
      seccion: 'Humanidades',
      estante: 'E-01',
    };
    const reporte = await importar.execute(
      csv(
        fila({ ...comun, codigo_inventario: 'INV-1' }),
        fila({ ...comun, codigo_inventario: 'INV-2', estado: 'en reparación' }),
      ),
    );
    expect(reporte).toMatchObject({
      librosCreados: 1,
      librosExistentes: 1,
      ejemplaresCreados: 2,
      ubicacionesCreadas: 1,
    });
  });

  it('volver a importar el mismo archivo no duplica nada', async () => {
    const { importar } = montar();
    const archivo = csv(
      fila({
        titulo: 'Sin ISBN',
        autores: 'Ana Pérez',
        idioma: 'es',
        codigo_inventario: 'INV-9',
        sala: 'Sala 2',
        seccion: 'Ingeniería',
        estante: 'E-02',
      }),
    );
    await importar.execute(archivo);
    const segunda = await importar.execute(archivo);
    expect(segunda).toMatchObject({
      filasImportadas: 1,
      librosCreados: 0,
      librosExistentes: 1,
      ejemplaresCreados: 0,
      ejemplaresExistentes: 1,
      autoresCreados: 0,
    });
  });

  it('informa los errores de cada fila con su número de línea y sigue con las demás', async () => {
    const { importar } = montar();
    const reporte = await importar.execute(
      csv(
        fila({ titulo: 'Bien', autores: 'Ana', idioma: 'es' }),
        fila({ titulo: '', autores: '', idioma: 'español', isbn: '123' }),
        fila({
          titulo: 'Año raro',
          autores: 'Ana',
          idioma: 'es',
          anio_publicacion: 'mil',
          formato: 'papel',
        }),
        fila({
          titulo: 'Digital',
          autores: 'Ana',
          idioma: 'es',
          formato: 'digital',
          enlace_digital: 'https://biblioteca.example/d',
          codigo_inventario: 'INV-5',
          sala: 'S',
          seccion: 'S',
          estante: 'E',
        }),
        fila({
          titulo: 'Prestado',
          autores: 'Ana',
          idioma: 'es',
          codigo_inventario: 'INV-6',
          sala: 'S',
          seccion: 'S',
          estante: 'E',
          estado: 'prestado',
        }),
        fila({ titulo: 'Sin código', autores: 'Ana', idioma: 'es', sala: 'S' }),
        fila({
          titulo: 'Sin estante',
          autores: 'Ana',
          idioma: 'es',
          codigo_inventario: 'INV-7',
          sala: 'S',
          seccion: 'S',
        }),
      ),
    );

    expect(reporte).toMatchObject({
      totalFilas: 7,
      filasImportadas: 1,
      filasConError: 6,
    });
    expect(reporte.errores.map((e) => e.fila)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(reporte.errores[0].errores).toEqual([
      'Un libro debe tener al menos un autor',
    ]);
    expect(reporte.errores[1].errores).toEqual([
      'anio_publicacion debe ser un año (número entero); llegó «mil»',
    ]);
    expect(reporte.errores[2].errores[0]).toMatch(/solo digital/);
    expect(reporte.errores[3].errores[0]).toMatch(/PRESTADO/);
    expect(reporte.errores[4].errores[0]).toMatch(/codigo_inventario/);
    expect(reporte.errores[5].errores[0]).toMatch(/estante/);
  });

  it('valida el libro con las reglas de la entidad', async () => {
    const { importar } = montar();
    const reporte = await importar.execute(
      csv(
        fila({ titulo: 'X', autores: 'Ana', idioma: 'es', formato: 'papel' }),
      ),
      // formato inválido: lo rechaza Libro.crear
    );
    expect(reporte.errores[0].errores).toEqual(['El formato no es válido']);
  });

  it('un código de inventario de otro libro solo hace fallar su fila', async () => {
    const { importar } = montar();
    const ubicacion = { sala: 'S', seccion: 'S', estante: 'E' };
    const reporte = await importar.execute(
      csv(
        fila({
          titulo: 'A',
          autores: 'Ana',
          idioma: 'es',
          codigo_inventario: 'INV-1',
          ...ubicacion,
        }),
        fila({
          titulo: 'B',
          autores: 'Ana',
          idioma: 'es',
          codigo_inventario: 'INV-1',
          ...ubicacion,
        }),
        fila({ titulo: 'C', autores: 'Ana', idioma: 'es' }),
      ),
    );
    expect(reporte).toMatchObject({ filasImportadas: 2, filasConError: 1 });
    expect(reporte.errores).toEqual([
      {
        fila: 3,
        errores: ['El código de inventario INV-1 ya pertenece a otro libro'],
      },
    ]);
  });

  it('un error inesperado al guardar no se oculta', async () => {
    const { importar, importador } = montar();
    jest
      .spyOn(importador, 'importarFila')
      .mockRejectedValueOnce(new Error('se cayó la base'));
    await expect(
      importar.execute(
        csv(fila({ titulo: 'A', autores: 'Ana', idioma: 'es' })),
      ),
    ).rejects.toThrow('se cayó la base');
  });

  it('los errores de dominio al guardar se informan en la fila', async () => {
    const { importar, importador } = montar();
    jest
      .spyOn(importador, 'importarFila')
      .mockRejectedValueOnce(new NotFoundError('algo no existe'));
    const reporte = await importar.execute(
      csv(fila({ titulo: 'A', autores: 'Ana', idioma: 'es' })),
    );
    expect(reporte.errores).toEqual([{ fila: 2, errores: ['algo no existe'] }]);
  });

  it.each([
    [
      'sin columnas obligatorias',
      'titulo,isbn\nA,1\n',
      'Faltan columnas obligatorias: autores, idioma',
    ],
    ['sin filas', `${CABECERA}\n`, 'El archivo no tiene filas con datos'],
  ])('rechaza el archivo %s', async (_caso, contenido, mensaje) => {
    const { importar } = montar();
    await expect(importar.execute(contenido)).rejects.toThrow(mensaje);
  });

  it(`rechaza más de ${MAX_FILAS} filas`, async () => {
    const { importar } = montar();
    const filas = Array.from({ length: MAX_FILAS + 1 }, (_, i) =>
      fila({ titulo: `Libro ${i}`, autores: 'Ana', idioma: 'es' }),
    );
    await expect(importar.execute(csv(...filas))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
