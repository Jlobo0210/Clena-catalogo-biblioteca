import type {
  SolicitudParticipacion,
  SolicitudRepository,
} from '../domain/solicitud';

export class RegistrarSolicitudUseCase {
  constructor(private readonly solicitudes: SolicitudRepository) {}

  async ejecutar(solicitud: SolicitudParticipacion): Promise<void> {
    await this.solicitudes.crear(solicitud);
  }
}
