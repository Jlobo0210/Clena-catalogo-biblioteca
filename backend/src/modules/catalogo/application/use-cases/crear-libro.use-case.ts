import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Libro } from '../../domain/entities/libro';
import { LibroRepository } from '../../domain/repositories/libro.repository';
import { CrearLibroInput, LibroOutput } from '../dtos/libro.dto';
import {
  aLibroOutput,
  asegurarIsbnUnico,
  resolverAutores,
  resolverTemas,
} from './libro-comun';

/** HU-16: el personal registra un libro con sus autores y temas. */
export class CrearLibroUseCase {
  constructor(
    private readonly libros: LibroRepository,
    private readonly ids: IdGenerator,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: CrearLibroInput): Promise<LibroOutput> {
    const autores = await resolverAutores(this.libros, input.autorIds ?? []);
    const temas = await resolverTemas(this.libros, input.temaIds ?? []);

    const libro = Libro.crear(
      this.ids.generate(),
      { ...input, autores, temas },
      this.reloj(),
    );
    await asegurarIsbnUnico(this.libros, libro);

    await this.libros.guardar(libro);
    return aLibroOutput(libro);
  }
}
