import { apiClient } from '../../../api/apiClient';
import type { LibroDto } from '../types';

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

export async function obtenerLibro(id: string, signal: AbortSignal): Promise<LibroDto> {
  const response = await apiClient.get<LibroDto>(`/libros/${id}`, { signal });
  return response.data;
}
