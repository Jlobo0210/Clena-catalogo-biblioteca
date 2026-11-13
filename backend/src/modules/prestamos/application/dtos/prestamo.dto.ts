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

/** POR_VENCER (HU-36): sin devolver y con la fecha límite entre hoy y los próximos `diasAviso` días. */
export type EstadoConsultaPrestamo = FiltroEstadoPrestamo | 'POR_VENCER';

export interface ListarPrestamosInput {
  pagina?: number;
  tamano?: number;
  estado?: EstadoConsultaPrestamo;
  usuarioId?: string;
  ejemplarId?: string;
  /** Rango de la fecha límite («YYYY-MM-DD»), ambos extremos incluidos. */
  limiteDesde?: string;
  limiteHasta?: string;
  /** Días que cuentan como «próximo a vencer» (por defecto 3). */
  diasAviso?: number;
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
  /** Días de retraso (0 si está al día); null si ya se devolvió. */
  diasRetraso: number | null;
  ejemplar: { id: string; codigoInventario: string };
  libro: { id: string; titulo: string };
  usuario: { id: string; nombre: string; email: string };
  registradoPor: { id: string; nombre: string };
}

/** HU-36: resumen para el seguimiento de devoluciones. */
export interface ResumenPrestamosOutput {
  /** Día de hoy en Colombia («YYYY-MM-DD»). */
  hoy: string;
  diasAviso: number;
  sinDevolver: number;
  vencidos: number;
  porVencer: number;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}
