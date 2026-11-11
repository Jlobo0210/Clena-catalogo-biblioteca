import { apiClient } from '../../../api/apiClient';
import type { PaginaPrestamos } from '../types';

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
