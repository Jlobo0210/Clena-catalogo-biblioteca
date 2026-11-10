import { TemaRepository } from '../../domain/repositories/tema.repository';
import { ListarTemasInput, TemaOutput } from '../dtos/tema.dto';
import { Pagina } from '../dtos/pagina.dto';
import { aTemaOutput } from './tema-comun';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

/** HU-15: listado público de temas, paginado, con filtro por nombre y ordenamiento. */
export class ListarTemasUseCase {
  constructor(private readonly temas: TemaRepository) {}

  async execute(input: ListarTemasInput = {}): Promise<Pagina<TemaOutput>> {
    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );

    const { items, total } = await this.temas.listar({
      pagina,
      tamano,
      nombre: input.nombre?.trim() || undefined,
      ordenarPor: input.ordenarPor ?? 'nombre',
      direccion: input.direccion ?? 'asc',
    });
    const libros = await this.temas.contarLibrosPorTema(items.map((t) => t.id));
    return {
      items: items.map((t) => aTemaOutput(t, libros.get(t.id) ?? 0)),
      total,
      pagina,
      tamano,
    };
  }
}
