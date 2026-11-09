import { NotFoundError } from '../../../../shared/domain/domain-error';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { LibroOutput } from '../dtos/libro.dto';
import { aLibroOutput } from './libro-comun';

/** HU-16: consultar un libro por su id. Es público. */
export class ObtenerLibroUseCase {
  constructor(private readonly libros: LibroRepository) {}

  async execute(id: string): Promise<LibroOutput> {
    const libro = await this.libros.buscarPorId(id);
    if (!libro) {
      throw new NotFoundError('Libro no encontrado');
    }
    return aLibroOutput(libro);
  }
}
