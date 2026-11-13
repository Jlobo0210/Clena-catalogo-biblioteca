import { Injectable } from '@nestjs/common';
import { CsvError, parse } from 'csv-parse/sync';
import { ValidationError } from '../../../../shared/domain/domain-error';
import {
  ContenidoCsv,
  FilaCsv,
  LectorCsv,
} from '../../domain/services/lector-csv';

/**
 * Lector de CSV con la librería csv-parse (HU-19).
 * - Acepta coma o punto y coma como separador (Excel en español usa «;»).
 * - Ignora el BOM que agrega Excel, las filas vacías y los espacios alrededor de cada valor.
 * - Normaliza los nombres de columna: «Año Publicación» → «ano_publicacion», «Título» → «titulo».
 */
@Injectable()
export class CsvParseLector implements LectorCsv {
  leer(contenido: string): ContenidoCsv {
    const texto = contenido.replace(/^\uFEFF/, '');
    if (!texto.trim()) {
      throw new ValidationError('El archivo está vacío');
    }
    let columnas: string[] = [];
    let registros: {
      record: Record<string, string>;
      info: { lines: number };
    }[];
    try {
      registros = parse(texto, {
        delimiter: detectarSeparador(texto),
        columns: (cabecera: string[]) => {
          columnas = cabecera.map(normalizarColumna);
          return columnas;
        },
        info: true,
        skip_empty_lines: true,
        skip_records_with_empty_values: true,
        relax_column_count: true,
        trim: true,
      }) as typeof registros;
    } catch (error) {
      if (error instanceof CsvError) {
        const linea = (error as CsvError & { lines?: number }).lines;
        throw new ValidationError(
          `El archivo no es un CSV válido${linea ? ` (línea ${linea})` : ''}: ${error.message}`,
        );
      }
      throw error;
    }

    const filas: FilaCsv[] = registros.map(({ record, info }) => ({
      linea: info.lines,
      valores: record,
    }));
    return { columnas, filas };
  }
}

/** El separador es el que más aparece en la primera línea (la cabecera). */
function detectarSeparador(texto: string): string {
  const cabecera = texto.split(/\r?\n/, 1)[0];
  const comas = cabecera.split(',').length;
  const puntoYComa = cabecera.split(';').length;
  return puntoYComa > comas ? ';' : ',';
}

function normalizarColumna(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}
