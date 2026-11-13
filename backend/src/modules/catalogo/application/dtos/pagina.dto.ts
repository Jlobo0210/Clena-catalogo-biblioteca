/** Forma común de toda respuesta paginada. */
export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}
