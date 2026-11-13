import {
  ConflictError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { diasEntre, fechaEnColombia, sumarDias } from '../fecha-calendario';

export type EstadoPrestamo = 'ACTIVO' | 'VENCIDO' | 'DEVUELTO';

export interface PrestamoProps {
  id: string;
  ejemplarId: string;
  usuarioId: string;
  registradoPorId: string;
  fechaPrestamo: Date;
  /** Día límite de devolución («YYYY-MM-DD», hora de Colombia). */
  fechaLimite: string;
  fechaDevolucion: Date | null;
}

export interface NuevoPrestamo {
  id: string;
  ejemplarId: string;
  usuarioId: string;
  registradoPorId: string;
  ahora: Date;
  diasPrestamo: number;
}

/**
 * Entidad de dominio Préstamo (HU-26).
 * Reglas: la fecha límite es la fecha del préstamo más el plazo (1 a 90 días);
 * un préstamo se devuelve una sola vez. La disponibilidad del ejemplar la verifica
 * el caso de uso y la garantiza el repositorio de forma atómica.
 */
export class Prestamo {
  static readonly DIAS_MAX = 90;

  private constructor(private readonly props: PrestamoProps) {}

  static prestar(datos: NuevoPrestamo): Prestamo {
    if (
      !Number.isInteger(datos.diasPrestamo) ||
      datos.diasPrestamo < 1 ||
      datos.diasPrestamo > Prestamo.DIAS_MAX
    ) {
      throw new ValidationError(
        `El plazo del préstamo debe estar entre 1 y ${Prestamo.DIAS_MAX} días`,
      );
    }
    return new Prestamo({
      id: datos.id,
      ejemplarId: datos.ejemplarId,
      usuarioId: datos.usuarioId,
      registradoPorId: datos.registradoPorId,
      fechaPrestamo: datos.ahora,
      fechaLimite: sumarDias(fechaEnColombia(datos.ahora), datos.diasPrestamo),
      fechaDevolucion: null,
    });
  }

  static reconstruir(props: PrestamoProps): Prestamo {
    return new Prestamo({ ...props });
  }

  devolver(ahora: Date = new Date()): void {
    if (this.props.fechaDevolucion) {
      throw new ConflictError('Este préstamo ya fue devuelto');
    }
    this.props.fechaDevolucion = ahora;
  }

  estado(ahora: Date = new Date()): EstadoPrestamo {
    return estadoPrestamo(
      this.props.fechaLimite,
      this.props.fechaDevolucion,
      ahora,
    );
  }

  get id(): string {
    return this.props.id;
  }
  get ejemplarId(): string {
    return this.props.ejemplarId;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
  get registradoPorId(): string {
    return this.props.registradoPorId;
  }
  get fechaPrestamo(): Date {
    return this.props.fechaPrestamo;
  }
  get fechaLimite(): string {
    return this.props.fechaLimite;
  }
  get fechaDevolucion(): Date | null {
    return this.props.fechaDevolucion;
  }
}

/** Vencido = sin devolver y ya pasó el día límite (en Colombia). */
export function estadoPrestamo(
  fechaLimite: string,
  fechaDevolucion: Date | null,
  ahora: Date,
): EstadoPrestamo {
  if (fechaDevolucion) return 'DEVUELTO';
  return fechaEnColombia(ahora) > fechaLimite ? 'VENCIDO' : 'ACTIVO';
}

/** Días que faltan para el límite (negativo = días de atraso); null si ya se devolvió. */
export function diasRestantes(
  fechaLimite: string,
  fechaDevolucion: Date | null,
  ahora: Date,
): number | null {
  if (fechaDevolucion) return null;
  return diasEntre(fechaEnColombia(ahora), fechaLimite);
}
