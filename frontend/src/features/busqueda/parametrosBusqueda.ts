import { RUTAS } from '../../config/rutas';
import { esAmbitoId, type AmbitoId } from './ambitos';
import type { FiltrosBusqueda } from './api/busqueda.api';

export const PARAMETROS_BUSQUEDA = {
  texto: 'q',
  ambito: 'ambito',
  pagina: 'pagina',
  idioma: 'idioma',
  tipoMaterial: 'tipoMaterial',
  temaId: 'temaId',
  anioDesde: 'anioDesde',
  anioHasta: 'anioHasta',
  soloDisponibles: 'soloDisponibles',
  ordenarPor: 'ordenarPor',
  direccion: 'direccion',
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

/** HU-22: lee todos los filtros de la URL para reconstruir el estado de la búsqueda. */
export function leerFiltrosDeUrl(params: URLSearchParams): FiltrosBusqueda {
  const q = params.get(PARAMETROS_BUSQUEDA.texto) ?? '';
  const paginaRaw = Number(params.get(PARAMETROS_BUSQUEDA.pagina));
  const anioDesdeRaw = Number(params.get(PARAMETROS_BUSQUEDA.anioDesde));
  const anioHastaRaw = Number(params.get(PARAMETROS_BUSQUEDA.anioHasta));
  const ordenRaw = params.get(PARAMETROS_BUSQUEDA.ordenarPor);
  const dirRaw = params.get(PARAMETROS_BUSQUEDA.direccion);

  return {
    q,
    pagina: paginaRaw > 0 ? paginaRaw : 1,
    idioma: params.get(PARAMETROS_BUSQUEDA.idioma) ?? undefined,
    tipoMaterial: params.get(PARAMETROS_BUSQUEDA.tipoMaterial) ?? undefined,
    temaId: params.get(PARAMETROS_BUSQUEDA.temaId) ?? undefined,
    anioDesde: anioDesdeRaw > 0 ? anioDesdeRaw : undefined,
    anioHasta: anioHastaRaw > 0 ? anioHastaRaw : undefined,
    soloDisponibles:
      params.get(PARAMETROS_BUSQUEDA.soloDisponibles) === 'true',
    ordenarPor:
      ordenRaw === 'titulo' || ordenRaw === 'anio' || ordenRaw === 'relevancia'
        ? ordenRaw
        : 'relevancia',
    direccion: dirRaw === 'asc' ? 'asc' : 'desc',
  };
}

/** HU-22: construye la URL con todos los filtros activos para poder compartirla. */
export function construirUrlConFiltros(
  filtros: FiltrosBusqueda,
  pagina: number,
): string {
  const params = new URLSearchParams();
  if (filtros.q) params.set(PARAMETROS_BUSQUEDA.texto, filtros.q);
  if (pagina > 1) params.set(PARAMETROS_BUSQUEDA.pagina, String(pagina));
  if (filtros.idioma) params.set(PARAMETROS_BUSQUEDA.idioma, filtros.idioma);
  if (filtros.tipoMaterial)
    params.set(PARAMETROS_BUSQUEDA.tipoMaterial, filtros.tipoMaterial);
  if (filtros.temaId) params.set(PARAMETROS_BUSQUEDA.temaId, filtros.temaId);
  if (filtros.anioDesde !== undefined)
    params.set(PARAMETROS_BUSQUEDA.anioDesde, String(filtros.anioDesde));
  if (filtros.anioHasta !== undefined)
    params.set(PARAMETROS_BUSQUEDA.anioHasta, String(filtros.anioHasta));
  if (filtros.soloDisponibles)
    params.set(PARAMETROS_BUSQUEDA.soloDisponibles, 'true');
  if (filtros.ordenarPor && filtros.ordenarPor !== 'relevancia')
    params.set(PARAMETROS_BUSQUEDA.ordenarPor, filtros.ordenarPor);
  if (filtros.direccion && filtros.direccion !== 'desc')
    params.set(PARAMETROS_BUSQUEDA.direccion, filtros.direccion);
  return `${RUTAS.buscar}?${params.toString()}`;
}
