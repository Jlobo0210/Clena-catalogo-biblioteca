import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { TemaRepository } from '../../domain/repositories/tema.repository';

/**
 * HU-15: el personal elimina un tema.
 * R10: no se borra si tiene libros clasificados (en la base, LibroTema borra en cascada,
 * así que sin esta regla los libros perderían su tema sin aviso). Se responde 409.
 */
export class EliminarTemaUseCase {
  constructor(private readonly temas: TemaRepository) {}

  async execute(id: string): Promise<void> {
    const tema = await this.temas.buscarPorId(id);
    if (!tema) {
      throw new NotFoundError('Tema no encontrado');
    }

    const libros = await this.temas.contarLibros(id);
    if (libros > 0) {
      throw new ConflictError(
        `No se puede eliminar «${tema.nombre}»: tiene ${libros} libro(s) clasificado(s). Cámbialos de tema primero.`,
      );
    }

    await this.temas.eliminar(id);
  }
}
