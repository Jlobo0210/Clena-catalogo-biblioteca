import { NotFoundError } from '../../../../shared/domain/domain-error';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';
import { EjemplarOutput } from '../dtos/ejemplar.dto';
import { aEjemplarOutput } from './ejemplar-comun';

export class ObtenerEjemplarUseCase {
  constructor(private readonly ejemplares: EjemplarRepository) {}

  async execute(libroId: string, ejemplarId: string): Promise<EjemplarOutput> {
    const ejemplar = await this.ejemplares.buscarPorId(ejemplarId);
    if (!ejemplar || ejemplar.libroId !== libroId) {
      throw new NotFoundError('Ejemplar no encontrado');
    }
    return aEjemplarOutput(ejemplar);
  }
}
