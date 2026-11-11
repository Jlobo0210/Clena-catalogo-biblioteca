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

export interface FiltroPrestamosPersonal extends FiltroMisPrestamos {
  usuarioId?: string;
  ejemplarId?: string;
}

/** HU-26 (personal): historial de préstamos con filtros. */
export async function listarPrestamos(filtro: FiltroPrestamosPersonal = {}): Promise<PaginaPrestamos> {
  const { data } = await apiClient.get<PaginaPrestamos>('/prestamos', { params: filtro });
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
