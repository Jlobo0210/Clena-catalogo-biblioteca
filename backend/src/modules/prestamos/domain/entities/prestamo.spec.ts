import {
  ConflictError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { diasEntre, fechaEnColombia, sumarDias } from '../fecha-calendario';
import { diasRestantes, estadoPrestamo, Prestamo } from './prestamo';

const datos = {
  id: 'p-1',
  ejemplarId: 'e-1',
  usuarioId: 'u-1',
  registradoPorId: 's-1',
  diasPrestamo: 15,
};

describe('fecha de calendario en Colombia', () => {
  it('usa la hora de Colombia (UTC-5), no la del servidor', () => {
    // 10 nov a las 02:00 UTC todavía es 9 nov en Barranquilla.
    expect(fechaEnColombia(new Date('2026-11-10T02:00:00Z'))).toBe(
      '2026-11-09',
    );
    expect(fechaEnColombia(new Date('2026-11-10T05:00:00Z'))).toBe(
      '2026-11-10',
    );
  });

  it('suma días cruzando mes y año', () => {
    expect(sumarDias('2026-12-25', 15)).toBe('2027-01-09');
    expect(diasEntre('2026-11-10', '2026-11-25')).toBe(15);
    expect(diasEntre('2026-11-25', '2026-11-10')).toBe(-15);
  });
});

describe('Prestamo (dominio)', () => {
  it('calcula la fecha límite con el plazo, en hora de Colombia', () => {
    const p = Prestamo.prestar({
      ...datos,
      ahora: new Date('2026-11-10T03:00:00Z'), // 9 nov, 10 p. m. en Colombia
    });
    expect(p.fechaLimite).toBe('2026-11-24');
    expect(p.fechaDevolucion).toBeNull();
  });

  it('rechaza plazos fuera de 1 a 90 días', () => {
    for (const diasPrestamo of [0, 91, 1.5]) {
      expect(() =>
        Prestamo.prestar({ ...datos, diasPrestamo, ahora: new Date() }),
      ).toThrow(ValidationError);
    }
  });

  it('está ACTIVO hasta el final del día límite y VENCIDO al día siguiente', () => {
    const p = Prestamo.prestar({
      ...datos,
      ahora: new Date('2026-11-10T15:00:00Z'),
    });
    expect(p.fechaLimite).toBe('2026-11-25');
    expect(p.estado(new Date('2026-11-26T04:59:00Z'))).toBe('ACTIVO'); // 25 nov, 11:59 p. m.
    expect(p.estado(new Date('2026-11-26T05:00:00Z'))).toBe('VENCIDO');
  });

  it('se devuelve una sola vez', () => {
    const p = Prestamo.prestar({
      ...datos,
      ahora: new Date('2026-11-10T15:00:00Z'),
    });
    const devuelto = new Date('2026-11-12T15:00:00Z');
    p.devolver(devuelto);
    expect(p.fechaDevolucion).toEqual(devuelto);
    expect(p.estado(new Date('2027-01-01T00:00:00Z'))).toBe('DEVUELTO');
    expect(() => p.devolver()).toThrow(ConflictError);
  });

  it('calcula los días restantes y los de atraso', () => {
    const ahora = new Date('2026-11-20T15:00:00Z');
    expect(diasRestantes('2026-11-25', null, ahora)).toBe(5);
    expect(diasRestantes('2026-11-18', null, ahora)).toBe(-2);
    expect(diasRestantes('2026-11-18', new Date(), ahora)).toBeNull();
    expect(estadoPrestamo('2026-11-18', null, ahora)).toBe('VENCIDO');
  });
});
