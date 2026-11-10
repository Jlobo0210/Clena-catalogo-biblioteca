import { RUTAS } from '../../config/rutas';
import { esAmbitoId, type AmbitoId } from './ambitos';

export const PARAMETROS_BUSQUEDA = {
  texto: 'q',
  ambito: 'ambito',
} as const;

interface ParametrosParaConstruir {
  q?: string;
  ambito?: AmbitoId;
}

export function construirUrlBusqueda({
  ambito = 'todo',
  q = '',
}: ParametrosParaConstruir = {}): string {
  const params = new URLSearchParams();
  const texto = q.trim();

  if (texto) {
    params.set(PARAMETROS_BUSQUEDA.texto, texto);
  }
  if (ambito !== 'todo') {
    params.set(PARAMETROS_BUSQUEDA.ambito, ambito);
  }

  const consulta = params.toString();
  return consulta ? `${RUTAS.buscar}?${consulta}` : RUTAS.buscar;
}

export function leerParametrosBusqueda(params: URLSearchParams): {
  q: string;
  ambito: AmbitoId;
} {
  const ambito = params.get(PARAMETROS_BUSQUEDA.ambito) ?? 'todo';

  return {
    q: params.get(PARAMETROS_BUSQUEDA.texto) ?? '',
    ambito: esAmbitoId(ambito) ? ambito : 'todo',
  };
}
