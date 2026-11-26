import { ConflictError } from '../../../../shared/domain/domain-error';
import { SuscripcionDisponibilidad } from '../../domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';

export interface SuscribirseInput {
  usuarioId: string;
  libroId: string;
}

export interface SuscripcionOutput {
  id: string;
  usuarioId: string;
  libroId: string;
  creadoEn: string;
}

export class SuscribirseUseCase {
  constructor(
    private readonly suscripciones: SuscripcionDisponibilidadRepository,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: SuscribirseInput): Promise<SuscripcionOutput> {
    const { usuarioId, libroId } = input;

    const existente = await this.suscripciones.buscarActiva(usuarioId, libroId);
    if (existente) {
      throw new ConflictError(
        'Ya tienes una suscripción activa para este libro',
      );
    }

    const ahora = this.reloj();
    const suscripcion = new SuscripcionDisponibilidad(
      crypto.randomUUID(),
      usuarioId,
      libroId,
      null,
      null,
      ahora,
    );

    await this.suscripciones.guardar(suscripcion);

    return {
      id: suscripcion.id,
      usuarioId: suscripcion.usuarioId,
      libroId: suscripcion.libroId,
      creadoEn: suscripcion.creadoEn.toISOString(),
    };
  }
}
