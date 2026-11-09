import { ValidationError } from '../../../../shared/domain/domain-error';

export interface AutorProps {
  id: string;
  nombre: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

/**
 * Entidad de dominio Autor (HU-14).
 * Reglas: el nombre es obligatorio, sin espacios sobrantes y de máximo 200 caracteres
 * (el mismo límite de la columna nombre en la base de datos).
 */
export class Autor {
  static readonly NOMBRE_MAX = 200;

  private constructor(private props: AutorProps) {}

  /** Crea un autor nuevo validando las reglas de negocio. */
  static crear(id: string, nombre: string, ahora: Date = new Date()): Autor {
    return new Autor({
      id,
      nombre: Autor.validarNombre(nombre),
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** Reconstruye un autor ya persistido (lo usa el mapper de infraestructura). */
  static reconstruir(props: AutorProps): Autor {
    return new Autor({ ...props });
  }

  renombrar(nombre: string, ahora: Date = new Date()): void {
    this.props.nombre = Autor.validarNombre(nombre);
    this.props.actualizadoEn = ahora;
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  get actualizadoEn(): Date {
    return this.props.actualizadoEn;
  }

  private static validarNombre(nombre: string): string {
    const limpio = (nombre ?? '').trim().replace(/\s+/g, ' ');
    if (limpio.length === 0) {
      throw new ValidationError('El nombre del autor es obligatorio');
    }
    if (limpio.length > Autor.NOMBRE_MAX) {
      throw new ValidationError(
        `El nombre del autor no puede superar ${Autor.NOMBRE_MAX} caracteres`,
      );
    }
    return limpio;
  }
}
