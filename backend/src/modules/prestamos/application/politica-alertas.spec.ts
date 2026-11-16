import { fechaLarga, mensajeAlerta } from './mensajes-alerta';
import { politicaAlertasDesdeEntorno } from './politica-alertas';

describe('Política de alertas (HU-29)', () => {
  const con = (valor?: string) =>
    politicaAlertasDesdeEntorno((clave) =>
      clave === 'ALERTA_DIAS_ANTES' ? valor : undefined,
    );

  it('por defecto avisa 2 días antes', () => {
    expect(con(undefined)).toEqual({ diasAntes: 2 });
  });

  it('acepta de 1 a 30 días', () => {
    expect(con('1')).toEqual({ diasAntes: 1 });
    expect(con('5')).toEqual({ diasAntes: 5 });
    expect(con('30')).toEqual({ diasAntes: 30 });
  });

  it('ignora valores inválidos', () => {
    for (const valor of ['0', '-3', '31', '2.5', 'tres', '']) {
      expect(con(valor)).toEqual({ diasAntes: 2 });
    }
  });
});

describe('Mensajes de alerta (HU-29)', () => {
  const prestamo = {
    prestamoId: 'p-1',
    fechaLimite: '2026-11-25',
    usuario: { nombre: 'Ana Pérez', email: 'ana@clena.example' },
    libroTitulo: 'Rayuela',
    codigoInventario: 'INV-0002-1',
  };

  it('escribe la fecha completa en español', () => {
    expect(fechaLarga('2026-11-25')).toBe('miércoles 25 de noviembre de 2026');
    expect(fechaLarga('2027-01-01')).toBe('viernes 1 de enero de 2027');
  });

  it('el aviso de vencimiento cuenta los días de retraso', () => {
    const m = mensajeAlerta('VENCIMIENTO', prestamo, '2026-12-05');
    expect(m.para).toBe('ana@clena.example');
    expect(m.texto).toContain('lleva 10 días de retraso');
    expect(m.texto).toContain('Si ya lo devolviste, no tienes que hacer nada.');
  });
});
