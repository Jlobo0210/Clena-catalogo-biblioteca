import { ValidationError } from '../../../../shared/domain/domain-error';

export interface TemaProps {
  id: string;
  nombre: string;
  creadoEn: Date;
}

/**
 * Entidad de dominio Tema. Ejemplo de referencia de la estructura (HU-05);
 * HU-15 la completa con el CRUD.
 * Reglas: el nombre es obligatorio, sin espacios sobrantes y de máximo 120 caracteres.
 */
export class Tema {
  static readonly NOMBRE_MAX = 120;

  private constructor(private readonly props: TemaProps) {}

  /** Crea un tema nuevo validando las reglas de negocio. */
  static crear(id: string, nombre: string, ahora: Date = new Date()): Tema {
    return new Tema({
      id,
      nombre: Tema.validarNombre(nombre),
      creadoEn: ahora,
    });
  }

  /** Reconstruye un tema ya persistido (lo usa el mapper de infraestructura). */
  static reconstruir(props: TemaProps): Tema {
    return new Tema({ ...props });
  }

  renombrar(nombre: string): void {
    this.props.nombre = Tema.validarNombre(nombre);
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

  private static validarNombre(nombre: string): string {
    const limpio = (nombre ?? '').trim().replace(/\s+/g, ' ');
    if (limpio.length === 0) {
      throw new ValidationError('El nombre del tema es obligatorio');
    }
    if (limpio.length > Tema.NOMBRE_MAX) {
      throw new ValidationError(
        `El nombre del tema no puede superar ${Tema.NOMBRE_MAX} caracteres`,
      );
    }
    return limpio;
  }
}
