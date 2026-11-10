import { Libro, Referencia } from '../entities/libro';
import { Formato } from '../value-objects/formato';
import { TipoMaterial } from '../value-objects/tipo-material';

export type OrdenLibros = 'titulo' | 'anio' | 'creadoEn';
export type Direccion = 'asc' | 'desc';

export interface FiltroLibros {
  pagina: number;
  tamano: number;
  /** Texto a buscar en el título. La búsqueda general es `buscar` (HU-20). */
  texto?: string;
  idioma?: string;
  tipoMaterial?: TipoMaterial;
  formato?: Formato;
  autorId?: string;
  temaId?: string;
  anioDesde?: number;
  anioHasta?: number;
  ordenarPor: OrdenLibros;
  direccion: Direccion;
}

/** Búsqueda simple (HU-20): un solo texto que se busca en título, autores y temas. */
export interface ConsultaBusqueda {
  /** Palabras ya normalizadas (minúsculas, sin repetir). Todas deben aparecer en el libro. */
  terminos: string[];
  /** El texto completo, para premiar los títulos que lo contienen tal cual. */
  frase: string;
  pagina: number;
  tamano: number;
}

/**
 * Interfaz (puerto) del repositorio de libros. Vive en el dominio;
 * la implementación con Prisma vive en infraestructura.
 */
export interface LibroRepository {
  guardar(libro: Libro): Promise<void>;
  buscarPorId(id: string): Promise<Libro | null>;
  buscarPorIsbn(isbn: string): Promise<Libro | null>;
  listar(filtro: FiltroLibros): Promise<{ items: Libro[]; total: number }>;
  /** Libros que contienen todos los términos, del más al menos relevante. */
  buscar(
    consulta: ConsultaBusqueda,
  ): Promise<{ items: Libro[]; total: number }>;
  eliminar(id: string): Promise<void>;
  contarEjemplares(libroId: string): Promise<number>;
  /** Devuelve los autores que existen entre los ids pedidos, en el mismo orden. */
  buscarAutores(ids: string[]): Promise<Referencia[]>;
  /** Devuelve los temas que existen entre los ids pedidos, en el mismo orden. */
  buscarTemas(ids: string[]): Promise<Referencia[]>;
}

/** Token de inyección: el caso de uso pide la interfaz, el módulo provee la implementación. */
export const LIBRO_REPOSITORY = Symbol('LIBRO_REPOSITORY');
