/** DTOs de la capa de aplicación: datos planos que entran y salen de los casos de uso. */
import { Referencia } from '../../domain/entities/libro';
import {
  Direccion,
  OrdenLibros,
} from '../../domain/repositories/libro.repository';
import { Formato } from '../../domain/value-objects/formato';
import { TipoMaterial } from '../../domain/value-objects/tipo-material';

export interface CrearLibroInput {
  titulo: string;
  anioPublicacion?: number | null;
  idioma: string;
  isbn?: string | null;
  tipoMaterial?: TipoMaterial;
  formato?: Formato;
  enlaceDigital?: string | null;
  /** Ids de autores existentes, en el orden en que se muestran. */
  autorIds: string[];
  temaIds?: string[];
}

export type ActualizarLibroInput = Partial<CrearLibroInput>;

export interface ListarLibrosInput {
  pagina?: number;
  tamano?: number;
  texto?: string;
  idioma?: string;
  tipoMaterial?: TipoMaterial;
  formato?: Formato;
  autorId?: string;
  temaId?: string;
  anioDesde?: number;
  anioHasta?: number;
  ordenarPor?: OrdenLibros;
  direccion?: Direccion;
}

export interface BuscarLibrosInput {
  /** Título, autor o tema, en un solo campo. */
  q: string;
  pagina?: number;
  tamano?: number;
  /** HU-22: filtros que se combinan con la búsqueda de texto. */
  idioma?: string;
  tipoMaterial?: TipoMaterial;
  temaId?: string;
  anioDesde?: number;
  anioHasta?: number;
  soloDisponibles?: boolean;
  /** HU-22: ordenamiento (relevancia es el default para búsqueda). */
  ordenarPor?: 'relevancia' | OrdenLibros;
  direccion?: Direccion;
}

export interface LibroOutput {
  id: string;
  titulo: string;
  anioPublicacion: number | null;
  idioma: string;
  isbn: string | null;
  tipoMaterial: TipoMaterial;
  formato: Formato;
  enlaceDigital: string | null;
  autores: Referencia[];
  temas: Referencia[];
  creadoEn: string;
  actualizadoEn: string;
}

export type { Pagina } from './pagina.dto';
