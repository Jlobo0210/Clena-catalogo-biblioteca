import { ValidationError } from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { BuscarLibrosInput, LibroOutput } from '../dtos/libro.dto';
import { Pagina } from '../dtos/pagina.dto';
import { aLibroOutput } from './libro-comun';
import {
  TAMANO_PAGINA_MAXIMO,
  TAMANO_PAGINA_POR_DEFECTO,
} from './listar-libros.use-case';

export const BUSQUEDA_MIN = 2;
export const BUSQUEDA_MAX = 100;
export const TERMINOS_MAX = 10;

/**
 * HU-20: búsqueda simple y pública. El visitante escribe en un solo campo
 * el título, el autor o el tema; cada palabra debe aparecer en alguno de ellos
 * y los resultados salen del más al menos relevante.
 * HU-21: el repositorio compara sin tildes y tolera errores de escritura.
 * HU-22: los filtros (idioma, tipo, tema, año, disponibilidad) y el ordenamiento
 * se combinan con la búsqueda de texto.
 */
export class BuscarLibrosUseCase {
  constructor(private readonly libros: LibroRepository) {}

  async execute(input: BuscarLibrosInput): Promise<Pagina<LibroOutput>> {
    const frase = (input.q ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    if (frase.length < BUSQUEDA_MIN) {
      throw new ValidationError(
        `Escribe al menos ${BUSQUEDA_MIN} caracteres para buscar`,
      );
    }
    if (frase.length > BUSQUEDA_MAX) {
      throw new ValidationError(
        `La búsqueda no puede superar ${BUSQUEDA_MAX} caracteres`,
      );
    }
    const terminos = [...new Set(frase.split(' '))].slice(0, TERMINOS_MAX);

    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );

    // HU-22: ordenarPor='relevancia' (o sin especificar) usa el orden por relevancia
    // del SQL; cualquier otro valor fuerza orden determinista por título o año.
    const ordenarPor =
      input.ordenarPor === 'relevancia' || input.ordenarPor === undefined
        ? undefined
        : input.ordenarPor;

    const { items, total } = await this.libros.buscar({
      terminos,
      frase,
      pagina,
      tamano,
      idioma: input.idioma,
      tipoMaterial: input.tipoMaterial,
      temaId: input.temaId,
      anioDesde: input.anioDesde,
      anioHasta: input.anioHasta,
      soloDisponibles: input.soloDisponibles,
      ordenarPor,
      direccion: input.direccion,
    });
    return { items: items.map(aLibroOutput), total, pagina, tamano };
  }
}
