import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';

/**
 * HU-16: el personal elimina un libro.
 * Si tiene ejemplares, primero hay que darlos de baja (la base lo impide con RESTRICT).
 */
export class EliminarLibroUseCase {
  constructor(private readonly libros: LibroRepository) {}

  async execute(id: string): Promise<void> {
    const libro = await this.libros.buscarPorId(id);
    if (!libro) {
      throw new NotFoundError('Libro no encontrado');
    }
    const ejemplares = await this.libros.contarEjemplares(id);
    if (ejemplares > 0) {
      throw new ConflictError(
        `No se puede eliminar «${libro.titulo}»: tiene ${ejemplares} ejemplar(es). Dalos de baja primero.`,
      );
    }
    await this.libros.eliminar(id);
  }
}
