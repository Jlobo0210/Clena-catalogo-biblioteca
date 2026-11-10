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
    const tema = Tema.reconstruir({
      id: 'x',
      nombre: 'Arte',
      descripcion: null,
      creadoEn: fecha,
      actualizadoEn: fecha,
    });
    expect(tema.creadoEn).toEqual(fecha);
    expect(tema.nombre).toBe('Arte');
  });

  it('guarda una descripción opcional, sin espacios sobrantes', () => {
    const tema = Tema.crear(
      'id-1',
      'Arte',
      new Date(),
      '  Pintura y escultura ',
    );
    expect(tema.descripcion).toBe('Pintura y escultura');
    expect(Tema.crear('id-2', 'Música').descripcion).toBeNull();
  });

  it('rechaza una descripción de más de 500 caracteres', () => {
    expect(() =>
      Tema.crear('id-1', 'Arte', new Date(), 'a'.repeat(501)),
    ).toThrow(ValidationError);
  });

  it('describir y renombrar actualizan la fecha de modificación', () => {
    const creado = new Date('2026-11-01T10:00:00Z');
    const editado = new Date('2026-11-09T10:00:00Z');
    const tema = Tema.crear('id-1', 'Arte', creado, 'Pintura');
    tema.describir('   ', editado);
    expect(tema.descripcion).toBeNull();
    expect(tema.actualizadoEn).toEqual(editado);
    expect(tema.creadoEn).toEqual(creado);
  });
});
