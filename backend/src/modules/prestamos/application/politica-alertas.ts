/** HU-29: cuántos días antes de la fecha límite se envía el recordatorio (ALERTA_DIAS_ANTES). */
export interface PoliticaAlertas {
  diasAntes: number;
}

export const POLITICA_ALERTAS = Symbol('POLITICA_ALERTAS');

export const DIAS_ANTES_POR_DEFECTO = 2;
export const DIAS_ANTES_MAXIMO = 30;

/** Lee ALERTA_DIAS_ANTES (1 a 30); si falta o no es válido, usa 2 días. */
export function politicaAlertasDesdeEntorno(
  leer: (clave: string) => string | undefined,
): PoliticaAlertas {
  const valor = Number(leer('ALERTA_DIAS_ANTES'));
  const valido =
    Number.isInteger(valor) && valor >= 1 && valor <= DIAS_ANTES_MAXIMO;
  return { diasAntes: valido ? valor : DIAS_ANTES_POR_DEFECTO };
}
