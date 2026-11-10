/** DTOs de la capa de aplicación: datos planos que entran y salen de los casos de uso. */
import { OrdenTemas } from '../../domain/repositories/tema.repository';

export interface CrearTemaInput {
  nombre: string;
  descripcion?: string | null;
}

export type ActualizarTemaInput = Partial<CrearTemaInput>;

export interface ListarTemasInput {
  pagina?: number;
  tamano?: number;
  nombre?: string;
  ordenarPor?: OrdenTemas;
  direccion?: 'asc' | 'desc';
}

export interface TemaOutput {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** Libros clasificados en el tema. */
  totalLibros: number;
  creadoEn: string;
  actualizadoEn: string;
}
