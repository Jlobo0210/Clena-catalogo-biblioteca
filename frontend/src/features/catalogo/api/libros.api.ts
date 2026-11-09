import { apiClient } from '../../../api/apiClient';

interface RespuestaConteoLibros {
  total: number;
}

export async function contarLibros(signal: AbortSignal): Promise<number> {
  const response = await apiClient.get<RespuestaConteoLibros>('/libros', {
    params: { tamano: 1 },
    signal,
  });

  return response.data.total;
}
