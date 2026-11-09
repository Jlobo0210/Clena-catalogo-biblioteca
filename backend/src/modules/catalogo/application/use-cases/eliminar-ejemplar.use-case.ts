import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/domain-error';
import { EjemplarRepository } from '../../domain/repositories/ejemplar.repository';

export class EliminarEjemplarUseCase {
  constructor(private readonly ejemplares: EjemplarRepository) {}

  async execute(libroId: string, ejemplarId: string): Promise<void> {
    const ejemplar = await this.ejemplares.buscarPorId(ejemplarId);
    if (!ejemplar || ejemplar.libroId !== libroId) {
      throw new NotFoundError('Ejemplar no encontrado');
    }
    if (await this.ejemplares.tienePrestamosActivos(ejemplarId)) {
      throw new ConflictError(
        'No se puede eliminar un ejemplar con préstamos activos',
      );
    }
    await this.ejemplares.eliminar(ejemplarId);
  }
}
