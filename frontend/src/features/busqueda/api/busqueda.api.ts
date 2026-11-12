import { apiClient } from '../../../api/apiClient';
import type { PaginaLibrosDto } from '../../catalogo/types';

export interface FiltrosBusqueda {
  q: string;
  pagina?: number;
  tamano?: number;
  idioma?: string;
  tipoMaterial?: string;
  temaId?: string;
  anioDesde?: number;
  anioHasta?: number;
  soloDisponibles?: boolean;
  ordenarPor?: 'relevancia' | 'titulo' | 'anio';
  direccion?: 'asc' | 'desc';
}

export async function buscarLibros(
  filtros: FiltrosBusqueda,
  signal: AbortSignal,
): Promise<PaginaLibrosDto> {
  const params: Record<string, string | number | boolean> = { q: filtros.q };
  if (filtros.pagina !== undefined) params.pagina = filtros.pagina;
  if (filtros.tamano !== undefined) params.tamano = filtros.tamano;
  if (filtros.idioma) params.idioma = filtros.idioma;
  if (filtros.tipoMaterial) params.tipoMaterial = filtros.tipoMaterial;
  if (filtros.temaId) params.temaId = filtros.temaId;
  if (filtros.anioDesde !== undefined) params.anioDesde = filtros.anioDesde;
  if (filtros.anioHasta !== undefined) params.anioHasta = filtros.anioHasta;
  if (filtros.soloDisponibles) params.soloDisponibles = true;
  if (filtros.ordenarPor) params.ordenarPor = filtros.ordenarPor;
  if (filtros.direccion) params.direccion = filtros.direccion;

  const response = await apiClient.get<PaginaLibrosDto>('/libros/buscar', {
    params,
    signal,
  });
  return response.data;
}
