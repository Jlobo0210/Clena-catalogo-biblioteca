import { NotFoundError } from '../../../../shared/domain/domain-error';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { TemaOutput } from '../dtos/tema.dto';
import { aTemaOutput } from './tema-comun';

/** HU-15: consulta pública de un tema, con la cantidad de libros que tiene. */
export class ObtenerTemaUseCase {
  constructor(private readonly temas: TemaRepository) {}

  async execute(id: string): Promise<TemaOutput> {
    const tema = await this.temas.buscarPorId(id);
    if (!tema) {
      throw new NotFoundError('Tema no encontrado');
    }
    return aTemaOutput(tema, await this.temas.contarLibros(id));
  }
}
