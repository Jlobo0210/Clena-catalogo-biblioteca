import { describe, expect, it } from 'vitest';
import { construirUrlBusqueda, leerParametrosBusqueda } from './parametrosBusqueda';

describe('parametrosBusqueda', () => {
  it('construye la URL solo con lo necesario', () => {
    expect(construirUrlBusqueda()).toBe('/buscar');
    expect(construirUrlBusqueda({ q: '  soledad ' })).toBe('/buscar?q=soledad');
    expect(construirUrlBusqueda({ q: 'soledad', pagina: 1 })).toBe('/buscar?q=soledad');
    expect(construirUrlBusqueda({ q: 'soledad', pagina: 3, ambito: 'prensa' })).toBe(
      '/buscar?q=soledad&ambito=prensa&pagina=3',
    );
  });

  it('lee la página y descarta valores inválidos', () => {
    const leer = (consulta: string) => leerParametrosBusqueda(new URLSearchParams(consulta));
    expect(leer('q=x&pagina=4')).toEqual({ q: 'x', ambito: 'todo', pagina: 4 });
    expect(leer('pagina=0').pagina).toBe(1);
    expect(leer('pagina=dos').pagina).toBe(1);
    expect(leer('pagina=2.5').pagina).toBe(1);
    expect(leer('ambito=otro').ambito).toBe('todo');
  });
});
