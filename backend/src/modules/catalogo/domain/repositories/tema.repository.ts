import { Tema } from '../entities/tema';

/**
 * Interfaz (puerto) del repositorio de temas. Vive en el dominio;
 * la implementación con Prisma vive en infraestructura.
 */
export interface TemaRepository {
  guardar(tema: Tema): Promise<void>;
  buscarPorId(id: string): Promise<Tema | null>;
  buscarPorNombre(nombre: string): Promise<Tema | null>;
}

/** Token de inyección: el caso de uso pide la interfaz, el módulo provee la implementación. */
export const TEMA_REPOSITORY = Symbol('TEMA_REPOSITORY');
