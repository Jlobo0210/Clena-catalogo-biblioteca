import { AutorRepository } from '../../domain/repositories/autor.repository';
import { AutorOutput, ListarAutoresInput } from '../dtos/autor.dto';
import { Pagina } from '../dtos/pagina.dto';
import { aAutorOutput } from './autor-comun';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

/** HU-14: listado público de autores, paginado, con filtro por nombre y ordenamiento. */
export class ListarAutoresUseCase {
  constructor(private readonly autores: AutorRepository) {}

  async execute(input: ListarAutoresInput = {}): Promise<Pagina<AutorOutput>> {
    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );

    const { items, total } = await this.autores.listar({
      pagina,
      tamano,
      nombre: input.nombre?.trim() || undefined,
      ordenarPor: input.ordenarPor ?? 'nombre',
      direccion: input.direccion ?? 'asc',
    });
    return { items: items.map(aAutorOutput), total, pagina, tamano };
  }
}
