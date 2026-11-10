import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Autor } from '../../domain/entities/autor';
import { AutorRepository } from '../../domain/repositories/autor.repository';
import { AutorOutput, CrearAutorInput } from '../dtos/autor.dto';
import { aAutorOutput } from './autor-comun';

/** HU-14: el personal registra un autor nuevo en el catálogo. */
export class CrearAutorUseCase {
  constructor(
    private readonly autores: AutorRepository,
    private readonly ids: IdGenerator,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: CrearAutorInput): Promise<AutorOutput> {
    const autor = Autor.crear(this.ids.generate(), input.nombre, this.reloj());

    await this.autores.guardar(autor);
    return aAutorOutput(autor);
  }
}
