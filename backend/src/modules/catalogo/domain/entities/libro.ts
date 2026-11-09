import { ValidationError } from '../../../../shared/domain/domain-error';
import { Formato, esFormato } from '../value-objects/formato';
import { Isbn } from '../value-objects/isbn';
import { TipoMaterial, esTipoMaterial } from '../value-objects/tipo-material';

/** Autor o tema asociado a un libro: solo lo necesario para mostrarlo. */
export interface Referencia {
  id: string;
  nombre: string;
}

export interface LibroProps {
  id: string;
  titulo: string;
  anioPublicacion: number | null;
  /** Código ISO 639-1 en minúscula (es, en, fr…). */
  idioma: string;
  isbn: Isbn | null;
  tipoMaterial: TipoMaterial;
  formato: Formato;
  enlaceDigital: string | null;
  /** En el orden en que se muestran (como en la portada). */
  autores: Referencia[];
  temas: Referencia[];
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Datos que se pueden fijar al crear o al editar un libro. */
export interface DatosLibro {
  titulo: string;
  anioPublicacion?: number | null;
  idioma: string;
  isbn?: string | null;
  tipoMaterial?: TipoMaterial;
  formato?: Formato;
  enlaceDigital?: string | null;
  autores: Referencia[];
  temas?: Referencia[];
}

type Normalizados = Omit<LibroProps, 'id' | 'creadoEn' | 'actualizadoEn'>;

/**
 * Entidad Libro (HU-16): la obra del catálogo, independiente de sus ejemplares físicos.
 * Reglas (docs/modelo-datos.md):
 *  - R1: tiene al menos un autor.
 *  - R2: el ISBN es opcional; si existe, es válido (la unicidad la verifica el caso de uso).
 *  - R3: un libro DIGITAL o FISICO_Y_DIGITAL lleva enlace de acceso; uno FISICO no lo lleva.
 */
export class Libro {
  static readonly TITULO_MAX = 300;
  static readonly ENLACE_MAX = 500;
  static readonly ANIO_MIN = 1000;

  private constructor(private props: LibroProps) {}

  static crear(id: string, datos: DatosLibro, ahora: Date = new Date()): Libro {
    return new Libro({
      id,
      ...Libro.normalizar(datos, ahora),
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** Reconstruye un libro ya persistido (lo usa el mapper de infraestructura). */
  static reconstruir(props: LibroProps): Libro {
    return new Libro({ ...props });
  }

  /** Aplica solo los cambios recibidos y vuelve a validar el libro completo. */
  actualizar(cambios: Partial<DatosLibro>, ahora: Date = new Date()): void {
    const actual = this.props;
    const datos: DatosLibro = {
      titulo: cambios.titulo ?? actual.titulo,
      idioma: cambios.idioma ?? actual.idioma,
      tipoMaterial: cambios.tipoMaterial ?? actual.tipoMaterial,
      formato: cambios.formato ?? actual.formato,
      autores: cambios.autores ?? actual.autores,
      temas: cambios.temas ?? actual.temas,
      // En estos tres, null significa «quitar el valor».
      anioPublicacion:
        cambios.anioPublicacion !== undefined
          ? cambios.anioPublicacion
          : actual.anioPublicacion,
      isbn:
        cambios.isbn !== undefined
          ? cambios.isbn
          : (actual.isbn?.valor ?? null),
      enlaceDigital:
        cambios.enlaceDigital !== undefined
          ? cambios.enlaceDigital
          : actual.enlaceDigital,
    };
    this.props = {
      ...actual,
      ...Libro.normalizar(datos, ahora),
      actualizadoEn: ahora,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get anioPublicacion(): number | null {
    return this.props.anioPublicacion;
  }
  get idioma(): string {
    return this.props.idioma;
  }
  get isbn(): Isbn | null {
    return this.props.isbn;
  }
  get tipoMaterial(): TipoMaterial {
    return this.props.tipoMaterial;
  }
  get formato(): Formato {
    return this.props.formato;
  }
  get enlaceDigital(): string | null {
    return this.props.enlaceDigital;
  }
  get autores(): Referencia[] {
    return [...this.props.autores];
  }
  get temas(): Referencia[] {
    return [...this.props.temas];
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }
  get actualizadoEn(): Date {
    return this.props.actualizadoEn;
  }

  /** Un libro solo digital no tiene ejemplares físicos (R3). */
  get admiteEjemplares(): boolean {
    return this.props.formato !== Formato.DIGITAL;
  }

  private static normalizar(datos: DatosLibro, ahora: Date): Normalizados {
    const formato = datos.formato ?? Formato.FISICO;
    if (!esFormato(formato)) {
      throw new ValidationError('El formato no es válido');
    }
    const tipoMaterial = datos.tipoMaterial ?? TipoMaterial.LIBRO;
    if (!esTipoMaterial(tipoMaterial)) {
      throw new ValidationError('El tipo de material no es válido');
    }
    return {
      titulo: Libro.validarTitulo(datos.titulo),
      anioPublicacion: Libro.validarAnio(datos.anioPublicacion ?? null, ahora),
      idioma: Libro.validarIdioma(datos.idioma),
      isbn: datos.isbn?.trim() ? Isbn.crear(datos.isbn) : null,
      tipoMaterial,
      formato,
      enlaceDigital: Libro.validarEnlace(datos.enlaceDigital ?? null, formato),
      autores: Libro.validarAutores(datos.autores),
      temas: Libro.sinRepetidos(datos.temas ?? []),
    };
  }

  private static validarTitulo(titulo: string): string {
    const limpio = (titulo ?? '').trim().replace(/\s+/g, ' ');
    if (limpio.length === 0) {
      throw new ValidationError('El título es obligatorio');
    }
    if (limpio.length > Libro.TITULO_MAX) {
      throw new ValidationError(
        `El título no puede superar ${Libro.TITULO_MAX} caracteres`,
      );
    }
    return limpio;
  }

  private static validarAnio(anio: number | null, ahora: Date): number | null {
    if (anio === null) return null;
    const maximo = ahora.getFullYear() + 1;
    if (!Number.isInteger(anio) || anio < Libro.ANIO_MIN || anio > maximo) {
      throw new ValidationError(
        `El año de publicación debe estar entre ${Libro.ANIO_MIN} y ${maximo}`,
      );
    }
    return anio;
  }

  private static validarIdioma(idioma: string): string {
    const limpio = (idioma ?? '').trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(limpio)) {
      throw new ValidationError(
        'El idioma debe ser un código ISO 639-1 de dos letras (por ejemplo «es»)',
      );
    }
    return limpio;
  }

  private static validarEnlace(
    enlace: string | null,
    formato: Formato,
  ): string | null {
    // Un libro solo físico no guarda enlace, aunque antes haya tenido uno.
    if (formato === Formato.FISICO) return null;
    const limpio = enlace?.trim() ?? '';
    if (limpio.length === 0) {
      throw new ValidationError(
        'Un libro digital debe tener el enlace de acceso',
      );
    }
    if (!/^https?:\/\/\S+$/i.test(limpio) || limpio.length > Libro.ENLACE_MAX) {
      throw new ValidationError(
        `El enlace digital debe ser una URL http(s) de máximo ${Libro.ENLACE_MAX} caracteres`,
      );
    }
    return limpio;
  }

  private static validarAutores(autores: Referencia[]): Referencia[] {
    const unicos = Libro.sinRepetidos(autores ?? []);
    if (unicos.length === 0) {
      throw new ValidationError('Un libro debe tener al menos un autor');
    }
    return unicos;
  }

  /** Quita referencias repetidas conservando el orden. */
  private static sinRepetidos(referencias: Referencia[]): Referencia[] {
    const vistos = new Set<string>();
    return referencias.filter((r) => {
      if (vistos.has(r.id)) return false;
      vistos.add(r.id);
      return true;
    });
  }
}
