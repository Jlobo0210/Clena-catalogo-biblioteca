import { Prestamo } from '../entities/prestamo';

export type EstadoEjemplar =
  'DISPONIBLE' | 'PRESTADO' | 'EN_REPARACION' | 'PERDIDO';

/** Lo que el préstamo necesita saber del ejemplar (la gestión de ejemplares es HU-17). */
export interface EjemplarParaPrestamo {
  id: string;
  codigoInventario: string;
  estado: EstadoEjemplar;
  libroTitulo: string;
}

export interface UsuarioParaPrestamo {
  id: string;
  nombre: string;
  email: string;
}

/** Vista de lectura de un préstamo con los datos que muestra la API. */
export interface PrestamoDetalle {
  id: string;
  ejemplar: { id: string; codigoInventario: string };
  libro: { id: string; titulo: string };
  usuario: { id: string; nombre: string; email: string };
  registradoPor: { id: string; nombre: string };
  fechaPrestamo: Date;
  fechaLimite: string;
  fechaDevolucion: Date | null;
}

/** SIN_DEVOLVER incluye los vencidos. */
export type FiltroEstadoPrestamo = 'SIN_DEVOLVER' | 'VENCIDO' | 'DEVUELTO';
export type OrdenPrestamos = 'fechaPrestamo' | 'fechaLimite';

export interface FiltroPrestamos {
  pagina: number;
  tamano: number;
  /** Día de hoy en Colombia, para decidir qué está vencido. */
  hoy: string;
  estado?: FiltroEstadoPrestamo;
  usuarioId?: string;
  ejemplarId?: string;
  /** Rango de la fecha límite («YYYY-MM-DD»), ambos extremos incluidos (HU-36). */
  limiteDesde?: string;
  limiteHasta?: string;
  ordenarPor: OrdenPrestamos;
  direccion: 'asc' | 'desc';
}

/** HU-36: préstamos sin devolver, separados por urgencia. */
export interface ConteoPendientes {
  sinDevolver: number;
  /** La fecha límite ya pasó. */
  vencidos: number;
  /** La fecha límite está entre hoy y `avisoHasta`. */
  porVencer: number;
}

export interface PrestamoRepository {
  buscarEjemplar(
    ref: { id: string } | { codigoInventario: string },
  ): Promise<EjemplarParaPrestamo | null>;
  buscarUsuario(
    ref: { id: string } | { email: string },
  ): Promise<UsuarioParaPrestamo | null>;
  contarSinDevolverDeUsuario(usuarioId: string): Promise<number>;
  /**
   * Guarda el préstamo y marca el ejemplar como PRESTADO en una sola transacción.
   * Si el ejemplar dejó de estar disponible (otro préstamo simultáneo), lanza ConflictError.
   */
  registrar(prestamo: Prestamo): Promise<void>;
  buscarPorId(id: string): Promise<Prestamo | null>;
  /** Guarda la devolución y deja el ejemplar DISPONIBLE, en una sola transacción. */
  registrarDevolucion(prestamo: Prestamo): Promise<void>;
  buscarDetalle(id: string): Promise<PrestamoDetalle | null>;
  listar(
    filtro: FiltroPrestamos,
  ): Promise<{ items: PrestamoDetalle[]; total: number }>;
  contarPendientes(hoy: string, avisoHasta: string): Promise<ConteoPendientes>;
}

export const PRESTAMO_REPOSITORY = Symbol('PRESTAMO_REPOSITORY');
