import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { ActualizarLibroInput, LibroOutput } from '../dtos/libro.dto';
import {
  aLibroOutput,
  asegurarIsbnUnico,
  resolverAutores,
  resolverTemas,
} from './libro-comun';

/**
 * HU-16: el personal edita un libro. Solo cambia los campos enviados;
 * si llegan autorIds o temaIds, reemplazan la lista completa.
 */
export class ActualizarLibroUseCase {
  constructor(
    private readonly libros: LibroRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string, input: ActualizarLibroInput): Promise<LibroOutput> {
    const libro = await this.libros.buscarPorId(id);
    if (!libro) {
      throw new NotFoundError('Libro no encontrado');
    }

    const { autorIds, temaIds, ...campos } = input;
    libro.actualizar(
      {
        ...campos,
        autores: autorIds
          ? await resolverAutores(this.libros, autorIds)
          : undefined,
        temas: temaIds ? await resolverTemas(this.libros, temaIds) : undefined,
      },
      this.reloj(),
    );

    // R3: un libro solo digital no puede tener ejemplares físicos.
    if (
      !libro.admiteEjemplares &&
      (await this.libros.contarEjemplares(libro.id)) > 0
    ) {
      throw new ConflictError(
        'El libro tiene ejemplares físicos: dalos de baja antes de cambiarlo a formato solo digital',
      );
    }
    await asegurarIsbnUnico(this.libros, libro);

    await this.libros.guardar(libro);
    return aLibroOutput(libro);
  }
}
