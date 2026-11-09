export const AMBITOS = [
  { id: 'todo', etiqueta: 'Todo el catálogo' },
  { id: 'libros', etiqueta: 'Libros de sala' },
  { id: 'archivo', etiqueta: 'Archivo Histórico' },
  { id: 'prensa', etiqueta: 'Hemeroteca y prensa' },
] as const;

export type AmbitoId = (typeof AMBITOS)[number]['id'];

export function esAmbitoId(valor: string): valor is AmbitoId {
  return AMBITOS.some((ambito) => ambito.id === valor);
}

export function etiquetaAmbito(id: AmbitoId): string {
  return AMBITOS.find((ambito) => ambito.id === id)?.etiqueta ?? 'Todo el catálogo';
}
