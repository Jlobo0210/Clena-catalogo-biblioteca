/** DTOs de la capa de aplicación para la importación del catálogo (HU-19). */

export interface ErrorFila {
  /** Número de línea en el archivo (la cabecera es la línea 1). */
  fila: number;
  errores: string[];
}

export interface ReporteImportacion {
  totalFilas: number;
  /** Columnas del archivo que no son de la plantilla: no se importan. */
  columnasIgnoradas: string[];
  filasImportadas: number;
  filasConError: number;
  librosCreados: number;
  /** Filas cuyo libro ya existía (mismo ISBN, o mismo título y autores). */
  librosExistentes: number;
  ejemplaresCreados: number;
  /** Ejemplares que ya estaban registrados con ese código en el mismo libro. */
  ejemplaresExistentes: number;
  autoresCreados: number;
  temasCreados: number;
  ubicacionesCreadas: number;
  errores: ErrorFila[];
}
