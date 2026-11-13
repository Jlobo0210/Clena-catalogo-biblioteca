import { ValidationError } from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { LibroOutput, ListarLibrosInput, Pagina } from '../dtos/libro.dto';
import { aLibroOutput } from './libro-comun';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

/** HU-16: listado público de libros, paginado, con filtros y ordenamiento. */
export class ListarLibrosUseCase {
  constructor(private readonly libros: LibroRepository) {}

  async execute(input: ListarLibrosInput = {}): Promise<Pagina<LibroOutput>> {
    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );
    if (
      input.anioDesde !== undefined &&
      input.anioHasta !== undefined &&
      input.anioDesde > input.anioHasta
    ) {
      throw new ValidationError(
        'El año inicial no puede ser mayor que el año final',
      );
    }

    const { items, total } = await this.libros.listar({
      pagina,
      tamano,
      texto: input.texto?.trim() || undefined,
      idioma: input.idioma?.trim().toLowerCase() || undefined,
      tipoMaterial: input.tipoMaterial,
      formato: input.formato,
      autorId: input.autorId,
      temaId: input.temaId,
      anioDesde: input.anioDesde,
      anioHasta: input.anioHasta,
      ordenarPor: input.ordenarPor ?? 'titulo',
      direccion: input.direccion ?? 'asc',
    });
    return { items: items.map(aLibroOutput), total, pagina, tamano };
  }
}
