import { apiClient } from '../../../api/apiClient';
import type { LibroDto, ListaEjemplaresDto, PaginaLibrosDto } from '../types';

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

/** Búsqueda simple por título, autor o tema, tolerante a errores (HU-20, HU-21). */
export async function buscarLibros(
  consulta: { q: string; pagina: number; tamano: number },
  signal: AbortSignal,
): Promise<PaginaLibrosDto> {
  const response = await apiClient.get<PaginaLibrosDto>('/libros/buscar', {
    params: consulta,
    signal,
  });

  return response.data;
}

export async function obtenerLibro(id: string, signal: AbortSignal): Promise<LibroDto> {
  const response = await apiClient.get<LibroDto>(`/libros/${encodeURIComponent(id)}`, {
    signal,
  });

  return response.data;
}

/** Ejemplares con su ubicación física y la disponibilidad del libro (HU-17). */
export async function listarEjemplares(
  libroId: string,
  signal: AbortSignal,
): Promise<ListaEjemplaresDto> {
  const response = await apiClient.get<ListaEjemplaresDto>(
    `/libros/${encodeURIComponent(libroId)}/ejemplares`,
    { signal },
  );

  return response.data;
}
