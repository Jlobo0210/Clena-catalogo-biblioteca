import { politicaDesdeEntorno } from './politica-prestamos';

describe('politicaDesdeEntorno', () => {
  it('lee las variables y usa valores por defecto si faltan o no son válidas', () => {
    expect(politicaDesdeEntorno(() => undefined)).toEqual({
      diasPrestamo: 15,
      maxSinDevolverPorUsuario: 3,
    });
    const env: Record<string, string> = {
      PRESTAMO_DIAS: '8',
      PRESTAMO_MAX_ACTIVOS: 'muchos',
    };
    expect(politicaDesdeEntorno((k) => env[k])).toEqual({
      diasPrestamo: 8,
      maxSinDevolverPorUsuario: 3,
    });
  });
});
