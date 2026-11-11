import { RUTAS } from '../../config/rutas';
import { esAmbitoId, type AmbitoId } from './ambitos';

export const PARAMETROS_BUSQUEDA = {
  texto: 'q',
  ambito: 'ambito',
  pagina: 'pagina',
} as const;

interface ParametrosParaConstruir {
  q?: string;
  ambito?: AmbitoId;
  pagina?: number;
}

export function construirUrlBusqueda({
  ambito = 'todo',
  pagina = 1,
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
  if (pagina > 1) {
    params.set(PARAMETROS_BUSQUEDA.pagina, String(pagina));
  }

  const consulta = params.toString();
  return consulta ? `${RUTAS.buscar}?${consulta}` : RUTAS.buscar;
}

export function leerParametrosBusqueda(params: URLSearchParams): {
  q: string;
  ambito: AmbitoId;
  pagina: number;
} {
  const ambito = params.get(PARAMETROS_BUSQUEDA.ambito) ?? 'todo';
  const pagina = Number(params.get(PARAMETROS_BUSQUEDA.pagina));

  return {
    q: params.get(PARAMETROS_BUSQUEDA.texto) ?? '',
    ambito: esAmbitoId(ambito) ? ambito : 'todo',
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
}
