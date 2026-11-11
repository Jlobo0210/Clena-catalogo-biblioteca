import { UbicacionProps } from '../entities/ejemplar';
import { Lugar } from '../entities/ubicacion';

/**
 * Interfaz (puerto) del repositorio de ubicaciones (HU-25: el panel elige y crea estantes).
 * La implementación con Prisma vive en infraestructura.
 */
export interface UbicacionRepository {
  /** Todas las ubicaciones, ordenadas por sala, sección y estante. */
  listar(): Promise<UbicacionProps[]>;
  buscarPorLugar(lugar: Lugar): Promise<UbicacionProps | null>;
  /** Crea la ubicación con un código imprimible único (para el QR por estante de HU-31). */
  crear(lugar: Lugar): Promise<UbicacionProps>;
}

export const UBICACION_REPOSITORY = Symbol('UBICACION_REPOSITORY');
