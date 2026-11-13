/** Tipos de material del catálogo (HU-16). Los mismos valores que el enum TipoMaterial de la base de datos. */
export const TipoMaterial = {
  LIBRO: 'LIBRO',
  REVISTA: 'REVISTA',
  TESIS: 'TESIS',
  TRABAJO_DE_GRADO: 'TRABAJO_DE_GRADO',
  MATERIAL_AUDIOVISUAL: 'MATERIAL_AUDIOVISUAL',
  OTRO: 'OTRO',
} as const;

export type TipoMaterial = (typeof TipoMaterial)[keyof typeof TipoMaterial];

export const TIPOS_MATERIAL: readonly TipoMaterial[] =
  Object.values(TipoMaterial);

export function esTipoMaterial(valor: unknown): valor is TipoMaterial {
  return (
    typeof valor === 'string' && (TIPOS_MATERIAL as string[]).includes(valor)
  );
}
