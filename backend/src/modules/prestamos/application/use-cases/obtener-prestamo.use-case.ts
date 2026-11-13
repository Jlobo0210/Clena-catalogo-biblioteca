import { NotFoundError } from '../../../../shared/domain/domain-error';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import { PrestamoOutput } from '../dtos/prestamo.dto';
import { aPrestamoOutput } from './prestamo-output';

export class ObtenerPrestamoUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string): Promise<PrestamoOutput> {
    const detalle = await this.prestamos.buscarDetalle(id);
    if (!detalle) {
      throw new NotFoundError('Préstamo no encontrado');
    }
    return aPrestamoOutput(detalle, this.reloj());
  }
}
