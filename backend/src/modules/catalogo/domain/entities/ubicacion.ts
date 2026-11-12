import { ValidationError } from '../../../../shared/domain/domain-error';

/** Lugar físico de un ejemplar: sala → sección → estante (HU-17). */
export interface Lugar {
  sala: string;
  seccion: string;
  estante: string;
}

/** Límites de las columnas de la tabla ubicacion. */
export const LIMITES_LUGAR: Record<keyof Lugar, number> = {
  sala: 60,
  seccion: 60,
  estante: 30,
};

const NOMBRES: Record<keyof Lugar, string> = {
  sala: 'la sala',
  seccion: 'la sección',
  estante: 'el estante',
};

/** Valida y normaliza un lugar: sin espacios sobrantes, ninguna parte vacía ni demasiado larga. */
export function validarLugar(lugar: Lugar): Lugar {
  const limpio = {} as Lugar;
  for (const parte of Object.keys(LIMITES_LUGAR) as (keyof Lugar)[]) {
    const valor = (lugar[parte] ?? '').trim().replace(/\s+/g, ' ');
    if (!valor) {
      throw new ValidationError(`Indica ${NOMBRES[parte]}`);
    }
    if (valor.length > LIMITES_LUGAR[parte]) {
      throw new ValidationError(
        `El nombre de ${NOMBRES[parte]} no puede superar ${LIMITES_LUGAR[parte]} caracteres`,
      );
    }
    limpio[parte] = valor;
  }
  return limpio;
}

/** «Sala 1 · Sección Humanidades · Estante E-01». */
export function describirLugar({ estante, sala, seccion }: Lugar): string {
  return `${sala} · Sección ${seccion} · Estante ${estante}`;
}
