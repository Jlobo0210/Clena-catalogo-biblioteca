export type TipoParticipacion =
  'LIBRO' | 'SUGERENCIA' | 'QUEJA' | 'FELICITACION';

export interface SolicitudParticipacion {
  tipo: TipoParticipacion;
  titulo?: string;
  autor?: string;
  mensaje?: string;
  nombre?: string;
  correo?: string;
}

export const SOLICITUD_REPOSITORY = Symbol('SOLICITUD_REPOSITORY');
export interface SolicitudRepository {
  crear(solicitud: SolicitudParticipacion): Promise<void>;
}
