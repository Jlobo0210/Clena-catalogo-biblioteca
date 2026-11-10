import { Tema } from '../entities/tema';

export type OrdenTemas = 'nombre' | 'creadoEn';

export interface FiltroTemas {
  pagina: number;
  tamano: number;
  /** Texto a buscar en el nombre. */
  nombre?: string;
  ordenarPor: OrdenTemas;
  direccion: 'asc' | 'desc';
}

/**
 * Interfaz (puerto) del repositorio de temas. Vive en el dominio;
 * la implementación con Prisma vive en infraestructura.
 */
export interface TemaRepository {
  guardar(tema: Tema): Promise<void>;
  buscarPorId(id: string): Promise<Tema | null>;
  /** Búsqueda exacta sin distinguir mayúsculas (evita temas repetidos). */
  buscarPorNombre(nombre: string): Promise<Tema | null>;
  listar(filtro: FiltroTemas): Promise<{ items: Tema[]; total: number }>;
  eliminar(id: string): Promise<void>;
  /** Cantidad de libros clasificados en el tema; impide borrarlo (R10). */
  contarLibros(temaId: string): Promise<number>;
  /** Cantidad de libros por tema, para mostrarla en el listado. */
  contarLibrosPorTema(temaIds: string[]): Promise<Map<string, number>>;
}

/** Token de inyección: el caso de uso pide la interfaz, el módulo provee la implementación. */
export const TEMA_REPOSITORY = Symbol('TEMA_REPOSITORY');
