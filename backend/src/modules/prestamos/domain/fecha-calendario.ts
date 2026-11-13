/**
 * Fechas de calendario («2026-11-24») en la hora de Colombia. La fecha límite de un préstamo
 * es un día, no un instante: se devuelve hasta el final de ese día en Barranquilla.
 */
const FORMATO_COLOMBIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MS_POR_DIA = 86_400_000;

/** Día de calendario en Colombia para un instante dado. */
export function fechaEnColombia(instante: Date): string {
  return FORMATO_COLOMBIA.format(instante);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      MS_POR_DIA,
  );
}
