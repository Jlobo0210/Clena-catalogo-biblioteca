import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { AutorRepository } from '../../domain/repositories/autor.repository';

/**
 * HU-14: el personal elimina un autor.
 * R10: no se puede borrar si tiene libros asociados; se responde 409 con un mensaje claro.
 */
export class EliminarAutorUseCase {
  constructor(private readonly autores: AutorRepository) {}

  async execute(id: string): Promise<void> {
    const autor = await this.autores.buscarPorId(id);
    if (!autor) {
      throw new NotFoundError('Autor no encontrado');
    }

    const libros = await this.autores.contarLibros(id);
    if (libros > 0) {
      throw new ConflictError(
        `No se puede eliminar «${autor.nombre}»: tiene ${libros} libro(s) asociado(s). Desvincúlalos primero.`,
      );
    }

    await this.autores.eliminar(id);
  }
}
