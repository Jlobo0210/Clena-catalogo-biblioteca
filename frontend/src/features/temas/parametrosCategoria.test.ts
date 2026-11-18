import { describe, expect, it } from 'vitest';
import {
  construirUrlCategoria,
  hayFiltrosActivos,
  leerFiltrosCategoria,
} from './parametrosCategoria';

describe('parámetros de la categoría (HU-35)', () => {
  it('sin parámetros: página 1, orden por título y sin filtros', () => {
    expect(leerFiltrosCategoria(new URLSearchParams())).toEqual({
      filtros: { soloDisponibles: false, ordenarPor: 'titulo' },
      pagina: 1,
    });
  });

  it('ignora valores inválidos', () => {
    const { filtros, pagina } = leerFiltrosCategoria(
      new URLSearchParams('pagina=-3&anioDesde=abc&ordenarPor=relevancia&soloDisponibles=si'),
    );
    expect(pagina).toBe(1);
    expect(filtros).toEqual({ soloDisponibles: false, ordenarPor: 'titulo' });
  });

  it('ida y vuelta: lo que se escribe en la URL se vuelve a leer igual', () => {
    const filtros = {
      idioma: 'es',
      tipoMaterial: 'REVISTA',
      anioDesde: 1950,
      anioHasta: 1980,
      soloDisponibles: true,
      ordenarPor: 'anio' as const,
    };
    const url = construirUrlCategoria('t-1', filtros, 4);
    expect(url).toBe(
      '/temas/t-1?tipoMaterial=REVISTA&idioma=es&anioDesde=1950&anioHasta=1980&soloDisponibles=true&ordenarPor=anio&pagina=4',
    );
    const [, consulta] = url.split('?');
    expect(leerFiltrosCategoria(new URLSearchParams(consulta))).toEqual({ filtros, pagina: 4 });
  });

  it('sin filtros la URL es la de la categoría', () => {
    expect(construirUrlCategoria('t 1', { soloDisponibles: false, ordenarPor: 'titulo' })).toBe(
      '/temas/t%201',
    );
  });

  it('el orden no cuenta como filtro activo', () => {
    expect(hayFiltrosActivos({ soloDisponibles: false, ordenarPor: 'anio' })).toBe(false);
    expect(hayFiltrosActivos({ soloDisponibles: true, ordenarPor: 'titulo' })).toBe(true);
    expect(hayFiltrosActivos({ idioma: 'es', soloDisponibles: false, ordenarPor: 'titulo' })).toBe(
      true,
    );
  });
});
