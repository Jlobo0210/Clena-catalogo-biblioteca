import { rutaTema } from '../../config/rutas';
import { PARAMETROS_BUSQUEDA } from '../busqueda/parametrosBusqueda';

/**
 * HU-35: filtros de la página de una categoría. Son los mismos de la búsqueda (HU-22),
 * menos el texto y el orden por relevancia, que solo tienen sentido cuando se busca algo.
 */
export interface FiltrosCategoria {
  idioma?: string;
  tipoMaterial?: string;
  anioDesde?: number;
  anioHasta?: number;
  soloDisponibles: boolean;
  ordenarPor: 'titulo' | 'anio';
}

const P = PARAMETROS_BUSQUEDA;

function anio(valor: string | null): number | undefined {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Lee los filtros y la página de la URL; los mismos nombres de parámetro que la búsqueda. */
export function leerFiltrosCategoria(params: URLSearchParams): {
  filtros: FiltrosCategoria;
  pagina: number;
} {
  const pagina = Number(params.get(P.pagina));
  return {
    filtros: {
      idioma: params.get(P.idioma) || undefined,
      tipoMaterial: params.get(P.tipoMaterial) || undefined,
      anioDesde: anio(params.get(P.anioDesde)),
      anioHasta: anio(params.get(P.anioHasta)),
      soloDisponibles: params.get(P.soloDisponibles) === 'true',
      ordenarPor: params.get(P.ordenarPor) === 'anio' ? 'anio' : 'titulo',
    },
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
}

/** URL de la categoría con los filtros activos, para poder compartirla o volver a ella. */
export function construirUrlCategoria(
  temaId: string,
  filtros: FiltrosCategoria,
  pagina = 1,
): string {
  const params = new URLSearchParams();
  if (filtros.tipoMaterial) params.set(P.tipoMaterial, filtros.tipoMaterial);
  if (filtros.idioma) params.set(P.idioma, filtros.idioma);
  if (filtros.anioDesde !== undefined) params.set(P.anioDesde, String(filtros.anioDesde));
  if (filtros.anioHasta !== undefined) params.set(P.anioHasta, String(filtros.anioHasta));
  if (filtros.soloDisponibles) params.set(P.soloDisponibles, 'true');
  if (filtros.ordenarPor === 'anio') params.set(P.ordenarPor, 'anio');
  if (pagina > 1) params.set(P.pagina, String(pagina));
  const consulta = params.toString();
  return consulta ? `${rutaTema(temaId)}?${consulta}` : rutaTema(temaId);
}

export function hayFiltrosActivos(f: FiltrosCategoria): boolean {
  return Boolean(
    f.idioma || f.tipoMaterial || f.anioDesde || f.anioHasta || f.soloDisponibles,
  );
}
