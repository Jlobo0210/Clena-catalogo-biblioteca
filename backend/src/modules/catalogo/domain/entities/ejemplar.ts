import { ValidationError } from '../../../../shared/domain/domain-error';
import {
  EstadoEjemplar,
  esEstadoEjemplar,
} from '../value-objects/estado-ejemplar';

export interface UbicacionProps {
  id: string;
  sala: string;
  seccion: string;
  estante: string;
  codigo: string;
}

export interface EjemplarProps {
  id: string;
  libroId: string;
  ubicacion: UbicacionProps;
  codigoInventario: string;
  estado: EstadoEjemplar;
  observaciones: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface DatosEjemplar {
  libroId: string;
  ubicacionId: string;
  codigoInventario: string;
  estado?: EstadoEjemplar;
  observaciones?: string | null;
}

export interface DatosActualizarEjemplar {
  ubicacionId?: string;
  codigoInventario?: string;
  estado?: EstadoEjemplar;
  observaciones?: string | null;
}

/**
 * Entidad Ejemplar (HU-17): copia física o digital de un libro en el catálogo.
 * Reglas:
 *  - R1: el código de inventario es obligatorio y de máximo 40 caracteres.
 *  - R2: el estado debe ser uno de los valores del enum EstadoEjemplar.
 *  - R3: las observaciones no pueden superar 500 caracteres.
 */
export class Ejemplar {
  static readonly CODIGO_MAX = 40;
  static readonly OBS_MAX = 500;

  private constructor(private props: EjemplarProps) {}

  static crear(
    id: string,
    datos: DatosEjemplar,
    ubicacion: UbicacionProps,
    ahora: Date = new Date(),
  ): Ejemplar {
    return new Ejemplar({
      id,
      libroId: datos.libroId,
      ubicacion,
      codigoInventario: Ejemplar.validarCodigo(datos.codigoInventario),
      estado: Ejemplar.validarEstado(datos.estado ?? 'DISPONIBLE'),
      observaciones: Ejemplar.validarObservaciones(datos.observaciones ?? null),
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** Reconstruye un ejemplar ya persistido (lo usa el mapper de infraestructura). */
  static reconstruir(props: EjemplarProps): Ejemplar {
    return new Ejemplar({ ...props });
  }

  actualizar(
    cambios: DatosActualizarEjemplar,
    ubicacion: UbicacionProps,
    ahora: Date = new Date(),
  ): void {
    this.props = {
      ...this.props,
      ubicacion,
      codigoInventario:
        cambios.codigoInventario !== undefined
          ? Ejemplar.validarCodigo(cambios.codigoInventario)
          : this.props.codigoInventario,
      estado:
        cambios.estado !== undefined
          ? Ejemplar.validarEstado(cambios.estado)
          : this.props.estado,
      observaciones:
        cambios.observaciones !== undefined
          ? Ejemplar.validarObservaciones(cambios.observaciones)
          : this.props.observaciones,
      actualizadoEn: ahora,
    };
  }

  get id(): string { return this.props.id; }
  get libroId(): string { return this.props.libroId; }
  get ubicacion(): UbicacionProps { return { ...this.props.ubicacion }; }
  get codigoInventario(): string { return this.props.codigoInventario; }
  get estado(): EstadoEjemplar { return this.props.estado; }
  get observaciones(): string | null { return this.props.observaciones; }
  get creadoEn(): Date { return this.props.creadoEn; }
  get actualizadoEn(): Date { return this.props.actualizadoEn; }

  get disponible(): boolean {
    return this.props.estado === 'DISPONIBLE';
  }

  private static validarCodigo(codigo: string): string {
    const limpio = (codigo ?? '').trim();
    if (limpio.length === 0) {
      throw new ValidationError('El código de inventario es obligatorio');
    }
    if (limpio.length > Ejemplar.CODIGO_MAX) {
      throw new ValidationError(
        `El código de inventario no puede superar ${Ejemplar.CODIGO_MAX} caracteres`,
      );
    }
    return limpio;
  }

  private static validarEstado(estado: string): EstadoEjemplar {
    if (!esEstadoEjemplar(estado)) {
      throw new ValidationError(
        `Estado inválido: «${estado}». Valores posibles: DISPONIBLE, PRESTADO, EN_REPARACION, PERDIDO`,
      );
    }
    return estado;
  }

  private static validarObservaciones(obs: string | null): string | null {
    if (obs === null || obs === undefined) return null;
    const limpio = obs.trim();
    if (limpio.length === 0) return null;
    if (limpio.length > Ejemplar.OBS_MAX) {
      throw new ValidationError(
        `Las observaciones no pueden superar ${Ejemplar.OBS_MAX} caracteres`,
      );
    }
    return limpio;
  }
}
