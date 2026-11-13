/** DTOs de la capa de aplicación: datos planos que entran y salen de los casos de uso. */
import { OrdenAutores } from '../../domain/repositories/autor.repository';

export interface CrearAutorInput {
  nombre: string;
}

export type ActualizarAutorInput = Partial<CrearAutorInput>;

export interface ListarAutoresInput {
  pagina?: number;
  tamano?: number;
  nombre?: string;
  ordenarPor?: OrdenAutores;
  direccion?: 'asc' | 'desc';
}

export interface AutorOutput {
  id: string;
  nombre: string;
  creadoEn: string;
  actualizadoEn: string;
}
