import { NotFoundError } from '../../../../shared/domain/domain-error';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';

export class CancelarSuscripcionUseCase {
  constructor(
    private readonly suscripciones: SuscripcionDisponibilidadRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(id: string, usuarioId: string): Promise<void> {
    const suscripcion = await this.suscripciones.buscarPorId(id);
    if (!suscripcion || suscripcion.usuarioId !== usuarioId) {
      throw new NotFoundError('Suscripción no encontrada');
    }

    const ahora = this.reloj();
    suscripcion.cancelar(ahora);
    await this.suscripciones.actualizar(suscripcion);
  }
}
