import type { Prestamo } from './types';

/** Con esta cantidad de días o menos, el préstamo se resalta como «próximo a vencer». */
export const DIAS_AVISO = 3;

export type Urgencia = 'vencido' | 'proximo' | 'al-dia' | 'devuelto';

export function urgenciaDe(p: Prestamo): Urgencia {
  if (p.fechaDevolucion || p.diasRestantes === null) return 'devuelto';
  if (p.diasRestantes < 0) return 'vencido';
  if (p.diasRestantes <= DIAS_AVISO) return 'proximo';
  return 'al-dia';
}

const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`;

/** Texto corto del plazo, para leer de un vistazo (no depende solo del color). */
export function textoPlazo(p: Prestamo): string {
  const dias = p.diasRestantes;
  if (p.fechaDevolucion || dias === null) return 'Devuelto';
  if (dias < 0) return `Vencido hace ${plural(-dias, 'día')}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Vence en ${plural(dias, 'día')}`;
}

const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const FORMATO_INSTANTE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Bogota',
});

/** «2026-11-25» → «miércoles, 25 de noviembre de 2026». */
export function formatearDia(fecha: string): string {
  return FORMATO_DIA.format(new Date(`${fecha}T00:00:00Z`));
}

export function formatearInstante(iso: string): string {
  return FORMATO_INSTANTE.format(new Date(iso));
}
