/** Reglas configurables de préstamo (variables PRESTAMO_DIAS y PRESTAMO_MAX_ACTIVOS). */
export interface PoliticaPrestamos {
  diasPrestamo: number;
  maxSinDevolverPorUsuario: number;
}

export const POLITICA_PRESTAMOS = Symbol('POLITICA_PRESTAMOS');

export const POLITICA_POR_DEFECTO: PoliticaPrestamos = {
  diasPrestamo: 15,
  maxSinDevolverPorUsuario: 3,
};

/** Lee la política de las variables de entorno; si faltan o no son válidas, usa los valores por defecto. */
export function politicaDesdeEntorno(
  leer: (clave: string) => string | undefined,
): PoliticaPrestamos {
  const entero = (clave: string, defecto: number) => {
    const valor = Number(leer(clave));
    return Number.isInteger(valor) && valor > 0 ? valor : defecto;
  };
  return {
    diasPrestamo: entero('PRESTAMO_DIAS', POLITICA_POR_DEFECTO.diasPrestamo),
    maxSinDevolverPorUsuario: entero(
      'PRESTAMO_MAX_ACTIVOS',
      POLITICA_POR_DEFECTO.maxSinDevolverPorUsuario,
    ),
  };
}
