import { NotFoundError } from '../../../../shared/domain/domain-error';
import { AutorRepository } from '../../domain/repositories/autor.repository';
import { AutorOutput } from '../dtos/autor.dto';
import { aAutorOutput } from './autor-comun';

/** HU-14: consultar un autor por su id. Es público. */
export class ObtenerAutorUseCase {
  constructor(private readonly autores: AutorRepository) {}

  async execute(id: string): Promise<AutorOutput> {
    const autor = await this.autores.buscarPorId(id);
    if (!autor) {
      throw new NotFoundError('Autor no encontrado');
    }
    return aAutorOutput(autor);
  }
}
