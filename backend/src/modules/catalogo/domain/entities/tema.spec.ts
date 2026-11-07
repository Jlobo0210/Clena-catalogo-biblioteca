import { ValidationError } from '../../../../shared/domain/domain-error';
import { Tema } from './tema';

describe('Tema (dominio)', () => {
  it('crea un tema y normaliza los espacios del nombre', () => {
    const tema = Tema.crear('id-1', '  Historia   del  Caribe ');
    expect(tema.id).toBe('id-1');
    expect(tema.nombre).toBe('Historia del Caribe');
    expect(tema.creadoEn).toBeInstanceOf(Date);
  });

  it('rechaza un nombre vacío', () => {
    expect(() => Tema.crear('id-1', '   ')).toThrow(ValidationError);
  });

  it('rechaza un nombre de más de 120 caracteres', () => {
    expect(() => Tema.crear('id-1', 'a'.repeat(121))).toThrow(ValidationError);
  });

  it('renombra validando las mismas reglas', () => {
    const tema = Tema.crear('id-1', 'Poesía');
    tema.renombrar(' Poesía colombiana ');
    expect(tema.nombre).toBe('Poesía colombiana');
    expect(() => tema.renombrar('')).toThrow(ValidationError);
  });

  it('reconstruye un tema persistido sin alterarlo', () => {
    const fecha = new Date('2026-10-20T10:00:00Z');
    const tema = Tema.reconstruir({ id: 'x', nombre: 'Arte', creadoEn: fecha });
    expect(tema.creadoEn).toEqual(fecha);
    expect(tema.nombre).toBe('Arte');
  });
});
