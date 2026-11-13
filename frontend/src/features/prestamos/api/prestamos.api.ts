import { apiClient } from '../../../api/apiClient';
import type { PaginaPrestamos, Prestamo } from '../types';

export interface FiltroMisPrestamos {
  estado?: 'SIN_DEVOLVER' | 'VENCIDO' | 'DEVUELTO';
  ordenarPor?: 'fechaPrestamo' | 'fechaLimite';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  tamano?: number;
}

/** HU-27: préstamos del usuario con sesión iniciada. */
export async function obtenerMisPrestamos(filtro: FiltroMisPrestamos = {}): Promise<PaginaPrestamos> {
  const { data } = await apiClient.get<PaginaPrestamos>('/prestamos/mios', { params: filtro });
  return data;
}

/** POR_VENCER (HU-36): sin devolver y con la fecha límite en los próximos días de aviso. */
export type EstadoSeguimiento = 'SIN_DEVOLVER' | 'VENCIDO' | 'POR_VENCER' | 'DEVUELTO';

export interface FiltroPrestamosPersonal extends Omit<FiltroMisPrestamos, 'estado'> {
  estado?: EstadoSeguimiento;
  usuarioId?: string;
  ejemplarId?: string;
  /** Rango de la fecha límite («YYYY-MM-DD»), ambos extremos incluidos (HU-36). */
  limiteDesde?: string;
  limiteHasta?: string;
  diasAviso?: number;
}

/** HU-26 (personal): historial de préstamos con filtros. HU-36: vencidos y próximos a vencer. */
export async function listarPrestamos(
  filtro: FiltroPrestamosPersonal = {},
  signal?: AbortSignal,
): Promise<PaginaPrestamos> {
  const { data } = await apiClient.get<PaginaPrestamos>('/prestamos', { params: filtro, signal });
  return data;
}

export interface ResumenPrestamos {
  /** Hoy en Colombia («YYYY-MM-DD»). */
  hoy: string;
  diasAviso: number;
  sinDevolver: number;
  vencidos: number;
  porVencer: number;
}

/** HU-36 (personal): cuántos préstamos están sin devolver, vencidos y próximos a vencer. */
export async function obtenerResumenPrestamos(signal?: AbortSignal): Promise<ResumenPrestamos> {
  const { data } = await apiClient.get<ResumenPrestamos>('/prestamos/resumen', { signal });
  return data;
}

/** HU-26 (personal): prestar un ejemplar disponible. */
export async function registrarPrestamo(datos: { codigoInventario: string; usuarioEmail: string }): Promise<Prestamo> {
  const { data } = await apiClient.post<Prestamo>('/prestamos', datos);
  return data;
}

/** HU-26 (personal): registrar la devolución; el ejemplar vuelve a estar disponible. */
export async function registrarDevolucion(id: string): Promise<Prestamo> {
  const { data } = await apiClient.post<Prestamo>(`/prestamos/${id}/devolucion`);
  return data;
}
