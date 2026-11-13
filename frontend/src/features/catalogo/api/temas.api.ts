import { apiClient } from '../../../api/apiClient';
import type { PaginaTemasDto } from '../types';

export async function listarTemas(signal: AbortSignal): Promise<PaginaTemasDto> {
  const response = await apiClient.get<PaginaTemasDto>('/temas', {
    params: { tamano: 100, ordenarPor: 'nombre', direccion: 'asc' },
    signal,
  });

  return response.data;
}
