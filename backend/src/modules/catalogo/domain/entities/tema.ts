import { ValidationError } from '../../../../shared/domain/domain-error';

export interface TemaProps {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

/**
 * Entidad de dominio Tema (HU-15): clasifica los libros para la búsqueda y la exploración por tema.
 * Reglas: el nombre es obligatorio, sin espacios sobrantes y de máximo 120 caracteres;
 * la descripción es opcional y de máximo 500 caracteres.
 */
export class Tema {
  static readonly NOMBRE_MAX = 120;
  static readonly DESCRIPCION_MAX = 500;

  private constructor(private readonly props: TemaProps) {}

  /** Crea un tema nuevo validando las reglas de negocio. */
  static crear(
    id: string,
    nombre: string,
    ahora: Date = new Date(),
    descripcion: string | null = null,
  ): Tema {
    return new Tema({
      id,
      nombre: Tema.validarNombre(nombre),
      descripcion: Tema.validarDescripcion(descripcion),
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** Reconstruye un tema ya persistido (lo usa el mapper de infraestructura). */
  static reconstruir(props: TemaProps): Tema {
    return new Tema({ ...props });
  }

  renombrar(nombre: string, ahora: Date = new Date()): void {
    this.props.nombre = Tema.validarNombre(nombre);
    this.props.actualizadoEn = ahora;
  }

  /** null o texto vacío borran la descripción. */
  describir(descripcion: string | null, ahora: Date = new Date()): void {
    this.props.descripcion = Tema.validarDescripcion(descripcion);
    this.props.actualizadoEn = ahora;
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get descripcion(): string | null {
    return this.props.descripcion;
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
      throw new ValidationError('El nombre del tema es obligatorio');
    }
    if (limpio.length > Tema.NOMBRE_MAX) {
      throw new ValidationError(
        `El nombre del tema no puede superar ${Tema.NOMBRE_MAX} caracteres`,
      );
    }
    return limpio;
  }

  private static validarDescripcion(
    descripcion: string | null | undefined,
  ): string | null {
    const limpia = (descripcion ?? '').trim();
    if (limpia.length === 0) return null;
    if (limpia.length > Tema.DESCRIPCION_MAX) {
      throw new ValidationError(
        `La descripción del tema no puede superar ${Tema.DESCRIPCION_MAX} caracteres`,
      );
    }
    return limpia;
  }
}
