import { apiClient } from '../../../api/apiClient';
import type { TemaDto } from '../../catalogo/types';

/** Gestión del catálogo para el personal (HU-25). Requiere sesión de PERSONAL o ADMINISTRADOR. */

export interface AutorDto {
  id: string;
  nombre: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

export type OrdenNombre = 'nombre' | 'creadoEn';
export type Direccion = 'asc' | 'desc';

export interface FiltroListado {
  pagina: number;
  tamano: number;
  nombre?: string;
  ordenarPor: OrdenNombre;
  direccion: Direccion;
}

export interface DatosAutor {
  nombre: string;
}

export interface DatosTema {
  nombre: string;
  descripcion: string | null;
}

export async function listarAutores(filtro: FiltroListado, signal: AbortSignal): Promise<Pagina<AutorDto>> {
  const response = await apiClient.get<Pagina<AutorDto>>('/autores', { params: filtro, signal });
  return response.data;
}

export async function crearAutor(datos: DatosAutor): Promise<AutorDto> {
  return (await apiClient.post<AutorDto>('/autores', datos)).data;
}

export async function actualizarAutor(id: string, datos: DatosAutor): Promise<AutorDto> {
  return (await apiClient.patch<AutorDto>(`/autores/${encodeURIComponent(id)}`, datos)).data;
}

export async function eliminarAutor(id: string): Promise<void> {
  await apiClient.delete(`/autores/${encodeURIComponent(id)}`);
}

export async function listarTemasPaginados(filtro: FiltroListado, signal: AbortSignal): Promise<Pagina<TemaDto>> {
  const response = await apiClient.get<Pagina<TemaDto>>('/temas', { params: filtro, signal });
  return response.data;
}

export async function crearTema(datos: DatosTema): Promise<TemaDto> {
  return (await apiClient.post<TemaDto>('/temas', datos)).data;
}

export async function actualizarTema(id: string, datos: DatosTema): Promise<TemaDto> {
  return (await apiClient.patch<TemaDto>(`/temas/${encodeURIComponent(id)}`, datos)).data;
}

export async function eliminarTema(id: string): Promise<void> {
  await apiClient.delete(`/temas/${encodeURIComponent(id)}`);
}

/** Reporte de la importación CSV (HU-19). */
export interface ReporteImportacion {
  totalFilas: number;
  columnasIgnoradas: string[];
  filasImportadas: number;
  filasConError: number;
  librosCreados: number;
  librosExistentes: number;
  ejemplaresCreados: number;
  ejemplaresExistentes: number;
  autoresCreados: number;
  temasCreados: number;
  ubicacionesCreadas: number;
  errores: { fila: number; errores: string[] }[];
}

/** Hasta 1000 filas, a unas 30 por segundo: se da más tiempo que el límite general del cliente. */
const TIEMPO_IMPORTACION_MS = 120_000;

export async function importarCatalogo(archivo: File): Promise<ReporteImportacion> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  const response = await apiClient.post<ReporteImportacion>('/importaciones/libros', formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: TIEMPO_IMPORTACION_MS,
  });
  return response.data;
}

/** La plantilla requiere sesión, así que se descarga con el cliente (que envía el token) y no con un enlace. */
export async function descargarPlantilla(): Promise<Blob> {
  const response = await apiClient.get<Blob>('/importaciones/plantilla', { responseType: 'blob' });
  return response.data;
}
