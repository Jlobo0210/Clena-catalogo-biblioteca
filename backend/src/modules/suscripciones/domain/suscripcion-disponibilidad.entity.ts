import { ConflictError } from '../../../shared/domain/domain-error';

export class SuscripcionDisponibilidad {
  constructor(
    readonly id: string,
    readonly usuarioId: string,
    readonly libroId: string,
    public notificadaEn: Date | null,
    public canceladaEn: Date | null,
    readonly creadoEn: Date,
  ) {}

  get activa(): boolean {
    return !this.notificadaEn && !this.canceladaEn;
  }

  cancelar(ahora: Date): void {
    if (!this.activa) {
      throw new ConflictError('La suscripción ya no está activa');
    }
    this.canceladaEn = ahora;
  }

  marcarNotificada(ahora: Date): void {
    this.notificadaEn = ahora;
  }
}
