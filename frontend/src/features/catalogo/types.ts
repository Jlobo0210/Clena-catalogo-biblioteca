export type TipoMaterial =
  | 'LIBRO'
  | 'REVISTA'
  | 'TESIS'
  | 'TRABAJO_DE_GRADO'
  | 'MATERIAL_AUDIOVISUAL'
  | 'OTRO';

export type FormatoMaterial = 'FISICO' | 'DIGITAL' | 'FISICO_Y_DIGITAL';

export interface Referencia {
  id: string;
  nombre: string;
}

export interface LibroDto {
  id: string;
  titulo: string;
  anioPublicacion: number | null;
  idioma: string;
  isbn: string | null;
  tipoMaterial: TipoMaterial;
  formato: FormatoMaterial;
  enlaceDigital: string | null;
  autores: Referencia[];
  temas: Referencia[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface PaginaLibrosDto {
  items: LibroDto[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface TemaDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  totalLibros: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PaginaTemasDto {
  items: TemaDto[];
  total: number;
  pagina: number;
  tamano: number;
}

export type EstadoEjemplar = 'DISPONIBLE' | 'PRESTADO' | 'EN_REPARACION' | 'PERDIDO';

export interface UbicacionDto {
  id: string;
  sala: string;
  seccion: string;
  estante: string;
  codigo: string;
}

export interface EjemplarDto {
  id: string;
  libroId: string;
  ubicacion: UbicacionDto;
  codigoInventario: string;
  estado: EstadoEjemplar;
  observaciones: string | null;
}

export interface DisponibilidadDto {
  libroId: string;
  totalEjemplares: number;
  disponibles: number;
  disponible: boolean;
}

export interface ListaEjemplaresDto {
  items: EjemplarDto[];
  disponibilidad: DisponibilidadDto;
}
