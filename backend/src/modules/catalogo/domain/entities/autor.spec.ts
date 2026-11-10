import { ValidationError } from '../../../../shared/domain/domain-error';
import { Autor } from './autor';

describe('Autor (dominio)', () => {
  it('crea un autor y normaliza los espacios del nombre', () => {
    const autor = Autor.crear('id-1', '  Gabriel   García Márquez ');
    expect(autor.id).toBe('id-1');
    expect(autor.nombre).toBe('Gabriel García Márquez');
    expect(autor.creadoEn).toBeInstanceOf(Date);
    expect(autor.actualizadoEn).toEqual(autor.creadoEn);
  });

  it('rechaza un nombre vacío', () => {
    expect(() => Autor.crear('id-1', '   ')).toThrow(ValidationError);
  });

  it('rechaza un nombre de más de 200 caracteres', () => {
    expect(() => Autor.crear('id-1', 'a'.repeat(201))).toThrow(ValidationError);
  });

  it('renombra validando las mismas reglas y actualiza la fecha', () => {
    const creado = new Date('2026-11-01T10:00:00Z');
    const editado = new Date('2026-11-09T10:00:00Z');
    const autor = Autor.crear('id-1', 'Gabriel García Márquez', creado);

    autor.renombrar(' Gabriel  García Márquez ', editado);

    expect(autor.nombre).toBe('Gabriel García Márquez');
    expect(autor.creadoEn).toEqual(creado);
    expect(autor.actualizadoEn).toEqual(editado);
    expect(() => autor.renombrar('')).toThrow(ValidationError);
  });

  it('reconstruye un autor persistido sin alterarlo', () => {
    const creado = new Date('2026-10-20T10:00:00Z');
    const actualizado = new Date('2026-10-21T10:00:00Z');
    const autor = Autor.reconstruir({
      id: 'x',
      nombre: 'María José Ibáñez',
      creadoEn: creado,
      actualizadoEn: actualizado,
    });

    expect(autor.id).toBe('x');
    expect(autor.nombre).toBe('María José Ibáñez');
    expect(autor.creadoEn).toEqual(creado);
    expect(autor.actualizadoEn).toEqual(actualizado);
  });
});
