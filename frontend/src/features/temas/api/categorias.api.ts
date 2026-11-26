import { apiClient } from '../../../api/apiClient';
import type { PaginaLibrosDto, TemaDto } from '../../catalogo/types';
import type { FiltrosCategoria } from '../parametrosCategoria';

/** HU-35: datos de una categoría (tema) para el encabezado de su página. */
export async function obtenerTema(id: string, signal: AbortSignal): Promise<TemaDto> {
  const response = await apiClient.get<TemaDto>(`/temas/${encodeURIComponent(id)}`, {
    signal,
  });
  return response.data;
}

/** HU-35: libros de una categoría con los mismos filtros de la búsqueda (GET /libros?temaId=…). */
export async function listarLibrosDeTema(
  temaId: string,
  filtros: FiltrosCategoria,
  paginacion: { pagina: number; tamano: number },
  signal: AbortSignal,
): Promise<PaginaLibrosDto> {
  const params: Record<string, string | number | boolean> = {
    temaId,
    pagina: paginacion.pagina,
    tamano: paginacion.tamano,
    ordenarPor: filtros.ordenarPor,
    direccion: filtros.ordenarPor === 'anio' ? 'desc' : 'asc',
  };
  if (filtros.idioma) params.idioma = filtros.idioma;
  if (filtros.tipoMaterial) params.tipoMaterial = filtros.tipoMaterial;
  if (filtros.anioDesde !== undefined) params.anioDesde = filtros.anioDesde;
  if (filtros.anioHasta !== undefined) params.anioHasta = filtros.anioHasta;
  if (filtros.soloDisponibles) params.soloDisponibles = true;

  const response = await apiClient.get<PaginaLibrosDto>('/libros', { params, signal });
  return response.data;
}
