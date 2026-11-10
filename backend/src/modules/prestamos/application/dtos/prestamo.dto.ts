import type { EstadoPrestamo } from '../../domain/entities/prestamo';
import type {
  FiltroEstadoPrestamo,
  OrdenPrestamos,
} from '../../domain/repositories/prestamo.repository';

/** El ejemplar se indica por id o por código de inventario; el usuario, por id o por correo. */
export interface RegistrarPrestamoInput {
  ejemplarId?: string;
  codigoInventario?: string;
  usuarioId?: string;
  usuarioEmail?: string;
}

export interface ListarPrestamosInput {
  pagina?: number;
  tamano?: number;
  estado?: FiltroEstadoPrestamo;
  usuarioId?: string;
  ejemplarId?: string;
  ordenarPor?: OrdenPrestamos;
  direccion?: 'asc' | 'desc';
}

export interface PrestamoOutput {
  id: string;
  estado: EstadoPrestamo;
  fechaPrestamo: string;
  fechaLimite: string;
  fechaDevolucion: string | null;
  /** Días para el límite; negativo = días de atraso; null si ya se devolvió. */
  diasRestantes: number | null;
  ejemplar: { id: string; codigoInventario: string };
  libro: { id: string; titulo: string };
  usuario: { id: string; nombre: string; email: string };
  registradoPor: { id: string; nombre: string };
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}
