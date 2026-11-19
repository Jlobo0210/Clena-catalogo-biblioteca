import { SuscripcionDisponibilidad } from './suscripcion-disponibilidad.entity';

export const SUSCRIPCION_DISPONIBILIDAD_REPOSITORY = Symbol(
  'SUSCRIPCION_DISPONIBILIDAD_REPOSITORY',
);

export interface SuscripcionDisponibilidadRepository {
  buscarActiva(
    usuarioId: string,
    libroId: string,
  ): Promise<SuscripcionDisponibilidad | null>;

  buscarActivasPorLibro(libroId: string): Promise<SuscripcionDisponibilidad[]>;

  buscarPorId(id: string): Promise<SuscripcionDisponibilidad | null>;

  guardar(suscripcion: SuscripcionDisponibilidad): Promise<void>;

  actualizar(suscripcion: SuscripcionDisponibilidad): Promise<void>;
}
