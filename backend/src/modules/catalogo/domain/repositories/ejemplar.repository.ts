import { Ejemplar } from '../entities/ejemplar';
import { UbicacionProps } from '../entities/ejemplar';

/**
 * Interfaz (puerto) del repositorio de ejemplares.
 * Vive en el dominio; la implementación con Prisma vive en infraestructura.
 */
export interface EjemplarRepository {
  guardar(ejemplar: Ejemplar): Promise<void>;
  buscarPorId(id: string): Promise<Ejemplar | null>;
  buscarPorCodigo(codigoInventario: string): Promise<Ejemplar | null>;
  listarPorLibro(libroId: string): Promise<Ejemplar[]>;
  eliminar(id: string): Promise<void>;
  contarDisponiblesPorLibro(libroId: string): Promise<number>;
  buscarUbicacionPorId(id: string): Promise<UbicacionProps | null>;
  listarUbicaciones(): Promise<UbicacionProps[]>;
  tienePrestamosActivos(ejemplarId: string): Promise<boolean>;
}

export const EJEMPLAR_REPOSITORY = Symbol('EJEMPLAR_REPOSITORY');
