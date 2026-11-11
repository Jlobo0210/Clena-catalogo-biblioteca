import type { EstadoEjemplar, FormatoMaterial, TipoMaterial } from './types';

/** Textos para mostrar los valores del catálogo a los visitantes. */

export const NOMBRE_TIPO_MATERIAL: Record<TipoMaterial, string> = {
  LIBRO: 'Libro',
  REVISTA: 'Revista',
  TESIS: 'Tesis',
  TRABAJO_DE_GRADO: 'Trabajo de grado',
  MATERIAL_AUDIOVISUAL: 'Material audiovisual',
  OTRO: 'Otro material',
};

export const NOMBRE_FORMATO: Record<FormatoMaterial, string> = {
  FISICO: 'En sala',
  DIGITAL: 'Digital',
  FISICO_Y_DIGITAL: 'En sala y digital',
};

export const NOMBRE_ESTADO_EJEMPLAR: Record<EstadoEjemplar, string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  EN_REPARACION: 'En reparación',
  PERDIDO: 'No disponible',
};

const nombresIdioma = new Intl.DisplayNames(['es'], { type: 'language' });

/** «es» → «Español». Si el código no se reconoce, se muestra tal cual. */
export function nombreIdioma(codigo: string): string {
  try {
    const nombre = nombresIdioma.of(codigo);
    return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : codigo;
  } catch {
    return codigo;
  }
}

/** «Gabriel García Márquez, Ana Pérez». */
export function listaNombres(referencias: { nombre: string }[]): string {
  return referencias.map((r) => r.nombre).join(', ');
}
