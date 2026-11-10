import { NotFoundError } from '../../../../shared/domain/domain-error';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { ActualizarTemaInput, TemaOutput } from '../dtos/tema.dto';
import { aTemaOutput, asegurarNombreLibre } from './tema-comun';

/** HU-15: el personal edita el nombre o la descripción de un tema. */
export class ActualizarTemaUseCase {
  constructor(
    private readonly temas: TemaRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string, input: ActualizarTemaInput): Promise<TemaOutput> {
    const tema = await this.temas.buscarPorId(id);
    if (!tema) {
      throw new NotFoundError('Tema no encontrado');
    }

    const ahora = this.reloj();
    if (input.nombre !== undefined) {
      tema.renombrar(input.nombre, ahora);
      await asegurarNombreLibre(this.temas, tema);
    }
    if (input.descripcion !== undefined) {
      tema.describir(input.descripcion, ahora);
    }

    await this.temas.guardar(tema);
    return aTemaOutput(tema, await this.temas.contarLibros(id));
  }
}
