import { ValidationError } from '../../../../shared/domain/domain-error';
import { CsvParseLector } from './csv-parse.lector';

const BOM = String.fromCharCode(0xfeff);

describe('CsvParseLector (HU-19)', () => {
  const lector = new CsvParseLector();

  it('lee un CSV con comas y normaliza los nombres de columna', () => {
    const { columnas, filas } = lector.leer(
      'Título, Autores ,Año publicación\nCien años de soledad,Gabriel García Márquez,1967\n',
    );
    expect(columnas).toEqual(['titulo', 'autores', 'ano_publicacion']);
    expect(filas).toEqual([
      {
        linea: 2,
        valores: {
          titulo: 'Cien años de soledad',
          autores: 'Gabriel García Márquez',
          ano_publicacion: '1967',
        },
      },
    ]);
  });

  it('acepta punto y coma (Excel en español), BOM, comillas y fin de línea de Windows', () => {
    const { filas } = lector.leer(
      `${BOM}titulo;autores\r\n"Historia; tomo 1";Ana Pérez\r\n`,
    );
    expect(filas[0].valores).toEqual({
      titulo: 'Historia; tomo 1',
      autores: 'Ana Pérez',
    });
  });

  it('ignora filas vacías y conserva el número de línea real', () => {
    const { filas } = lector.leer('titulo,autores\n\nA,X\n,\nB,Y\n');
    expect(filas.map((f) => [f.linea, f.valores.titulo])).toEqual([
      [3, 'A'],
      [5, 'B'],
    ]);
  });

  it('acepta filas con menos columnas que la cabecera', () => {
    const { filas } = lector.leer('titulo,autores,isbn\nA,X\n');
    expect(filas[0].valores).toEqual({ titulo: 'A', autores: 'X' });
  });

  it('rechaza un archivo vacío', () => {
    expect(() => lector.leer(`${BOM}  \n`)).toThrow('El archivo está vacío');
  });

  it('rechaza un CSV mal formado indicando la línea', () => {
    expect(() => lector.leer('titulo,autores\n"A sin cerrar,X\n')).toThrow(
      ValidationError,
    );
    expect(() => lector.leer('titulo,autores\n"A sin cerrar,X\n')).toThrow(
      /línea 2/,
    );
  });
});
