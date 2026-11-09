/** Formato de un libro (HU-16). Los mismos valores que el enum Formato de la base de datos. */
export const Formato = {
  FISICO: 'FISICO',
  DIGITAL: 'DIGITAL',
  FISICO_Y_DIGITAL: 'FISICO_Y_DIGITAL',
} as const;

export type Formato = (typeof Formato)[keyof typeof Formato];

export const FORMATOS: readonly Formato[] = Object.values(Formato);

export function esFormato(valor: unknown): valor is Formato {
  return typeof valor === 'string' && (FORMATOS as string[]).includes(valor);
}
