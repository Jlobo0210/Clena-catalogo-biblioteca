import { apiClient } from '../../../api/apiClient';

export interface SuscripcionOutput {
  id: string;
  usuarioId: string;
  libroId: string;
  creadoEn: string;
}

/** HU-30: suscribirse para recibir aviso de disponibilidad del libro. */
export async function suscribirse(libroId: string): Promise<SuscripcionOutput> {
  const response = await apiClient.post<SuscripcionOutput>(
    `/libros/${encodeURIComponent(libroId)}/suscripcion`,
  );
  return response.data;
}

/** HU-30: cancelar la suscripción activa. */
export async function cancelarSuscripcion(
  libroId: string,
  suscripcionId: string,
): Promise<void> {
  await apiClient.delete(
    `/libros/${encodeURIComponent(libroId)}/suscripcion/${encodeURIComponent(suscripcionId)}`,
  );
}
