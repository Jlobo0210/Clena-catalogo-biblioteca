import { NotFoundError } from '../../../../shared/domain/domain-error';
import { PrestamoRepository } from '../../domain/repositories/prestamo.repository';
import { PrestamoOutput } from '../dtos/prestamo.dto';
import { aPrestamoOutput } from './prestamo-output';

/**
 * HU-26: el personal registra la devolución. El ejemplar vuelve a DISPONIBLE
 * y el préstamo queda en el historial con su fecha de devolución.
 */
export class RegistrarDevolucionUseCase {
  constructor(
    private readonly prestamos: PrestamoRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string): Promise<PrestamoOutput> {
    const prestamo = await this.prestamos.buscarPorId(id);
    if (!prestamo) {
      throw new NotFoundError('Préstamo no encontrado');
    }

    const ahora = this.reloj();
    prestamo.devolver(ahora);
    await this.prestamos.registrarDevolucion(prestamo);

    const detalle = await this.prestamos.buscarDetalle(id);
    if (!detalle) {
      throw new NotFoundError('Préstamo no encontrado');
    }
    return aPrestamoOutput(detalle, ahora);
  }
}
