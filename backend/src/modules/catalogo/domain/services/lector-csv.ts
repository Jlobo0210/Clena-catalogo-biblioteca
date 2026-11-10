/** Una fila de datos del CSV, con su número de línea en el archivo (la cabecera es la línea 1). */
export interface FilaCsv {
  linea: number;
  /** Valores por nombre de columna (ya normalizado: minúsculas, sin tildes, espacios como _). */
  valores: Record<string, string>;
}

export interface ContenidoCsv {
  columnas: string[];
  filas: FilaCsv[];
}

/**
 * Puerto para leer un CSV sin depender de una librería concreta (HU-19).
 * La implementación vive en infraestructura. Si el archivo está mal formado,
 * lanza ValidationError indicando la línea.
 */
export interface LectorCsv {
  leer(contenido: string): ContenidoCsv;
}

export const LECTOR_CSV = Symbol('LECTOR_CSV');
