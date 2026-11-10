export const ESTADOS_EJEMPLAR = [
  'DISPONIBLE',
  'PRESTADO',
  'EN_REPARACION',
  'PERDIDO',
] as const;

export type EstadoEjemplar = (typeof ESTADOS_EJEMPLAR)[number];

export function esEstadoEjemplar(v: unknown): v is EstadoEjemplar {
  return ESTADOS_EJEMPLAR.includes(v as EstadoEjemplar);
}
