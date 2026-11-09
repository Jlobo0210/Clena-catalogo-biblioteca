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
