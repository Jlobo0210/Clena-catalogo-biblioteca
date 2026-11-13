import { NotFoundError } from '../../../../shared/domain/domain-error';
import { AutorRepository } from '../../domain/repositories/autor.repository';
import { ActualizarAutorInput, AutorOutput } from '../dtos/autor.dto';
import { aAutorOutput } from './autor-comun';

/** HU-14: el personal edita el nombre de un autor. */
export class ActualizarAutorUseCase {
  constructor(
    private readonly autores: AutorRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string, input: ActualizarAutorInput): Promise<AutorOutput> {
    const autor = await this.autores.buscarPorId(id);
    if (!autor) {
      throw new NotFoundError('Autor no encontrado');
    }

    autor.renombrar(input.nombre ?? '', this.reloj());
    await this.autores.guardar(autor);
    return aAutorOutput(autor);
  }
}
