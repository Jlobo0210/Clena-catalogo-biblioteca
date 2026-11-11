import { describe, expect, it } from 'vitest';
import type { Prestamo } from './types';
import { formatearDia, textoPlazo, urgenciaDe } from './urgencia';

const base: Prestamo = {
  id: 'p-1',
  estado: 'ACTIVO',
  fechaPrestamo: '2026-11-10T15:00:00.000Z',
  fechaLimite: '2026-11-25',
  fechaDevolucion: null,
  diasRestantes: 10,
  ejemplar: { id: 'e-1', codigoInventario: 'INV-0000-1' },
  libro: { id: 'l-1', titulo: 'Cien años de soledad' },
  usuario: { id: 'u-1', nombre: 'Ana', email: 'ana@example.com' },
  registradoPor: { id: 's-1', nombre: 'Personal' },
};

const con = (cambios: Partial<Prestamo>): Prestamo => ({ ...base, ...cambios });

describe('urgencia de un préstamo', () => {
  it.each([
    [10, 'al-dia', 'Vence en 10 días'],
    [3, 'proximo', 'Vence en 3 días'],
    [1, 'proximo', 'Vence mañana'],
    [0, 'proximo', 'Vence hoy'],
    [-1, 'vencido', 'Vencido hace 1 día'],
    [-4, 'vencido', 'Vencido hace 4 días'],
  ] as const)('con %i días restantes es «%s» y dice «%s»', (dias, urgencia, texto) => {
    const p = con({ diasRestantes: dias });
    expect(urgenciaDe(p)).toBe(urgencia);
    expect(textoPlazo(p)).toBe(texto);
  });

  it('un préstamo devuelto no es urgente', () => {
    const p = con({ estado: 'DEVUELTO', diasRestantes: null, fechaDevolucion: '2026-11-12T15:00:00.000Z' });
    expect(urgenciaDe(p)).toBe('devuelto');
    expect(textoPlazo(p)).toBe('Devuelto');
  });

  it('muestra el día límite sin correrse por la zona horaria', () => {
    expect(formatearDia('2026-11-25')).toMatch(/25 de noviembre de 2026/);
  });
});
