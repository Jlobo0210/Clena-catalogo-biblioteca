import { Autor } from '../entities/autor';

export type OrdenAutores = 'nombre' | 'creadoEn';

export interface FiltroAutores {
  pagina: number;
  tamano: number;
  /** Texto a buscar en el nombre. */
  nombre?: string;
  ordenarPor: OrdenAutores;
  direccion: 'asc' | 'desc';
}

/**
 * Interfaz (puerto) del repositorio de autores. Vive en el dominio;
 * la implementación con Prisma vive en infraestructura.
 */
export interface AutorRepository {
  guardar(autor: Autor): Promise<void>;
  buscarPorId(id: string): Promise<Autor | null>;
  listar(filtro: FiltroAutores): Promise<{ items: Autor[]; total: number }>;
  eliminar(id: string): Promise<void>;
  /** Cantidad de libros que referencian al autor; impide borrarlo (R10). */
  contarLibros(autorId: string): Promise<number>;
}

/** Token de inyección: el caso de uso pide la interfaz, el módulo provee la implementación. */
export const AUTOR_REPOSITORY = Symbol('AUTOR_REPOSITORY');
