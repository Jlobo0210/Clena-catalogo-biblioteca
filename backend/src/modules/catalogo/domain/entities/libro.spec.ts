import { ValidationError } from '../../../../shared/domain/domain-error';
import { Formato } from '../value-objects/formato';
import { TipoMaterial } from '../value-objects/tipo-material';
import { DatosLibro, Libro } from './libro';

const AHORA = new Date('2026-11-08T10:00:00Z');
const autor = { id: 'a-1', nombre: 'Gabriel García Márquez' };

const datos = (cambios: Partial<DatosLibro> = {}): DatosLibro => ({
  titulo: 'Cien años de soledad',
  idioma: 'es',
  autores: [autor],
  ...cambios,
});

describe('Libro (HU-16)', () => {
  it('se crea con valores por defecto: libro físico, sin enlace', () => {
    const libro = Libro.crear('l-1', datos(), AHORA);

    expect(libro.tipoMaterial).toBe(TipoMaterial.LIBRO);
    expect(libro.formato).toBe(Formato.FISICO);
    expect(libro.enlaceDigital).toBeNull();
    expect(libro.isbn).toBeNull();
    expect(libro.anioPublicacion).toBeNull();
    expect(libro.admiteEjemplares).toBe(true);
    expect(libro.creadoEn).toEqual(AHORA);
    expect(libro.actualizadoEn).toEqual(AHORA);
  });

  it('normaliza título, idioma e ISBN', () => {
    const libro = Libro.crear(
      'l-1',
      datos({
        titulo: '  Cien   años de soledad ',
        idioma: ' ES ',
        isbn: '978-0-306-40615-7',
      }),
      AHORA,
    );
    expect(libro.titulo).toBe('Cien años de soledad');
    expect(libro.idioma).toBe('es');
    expect(libro.isbn?.valor).toBe('9780306406157');
  });

  it('R1: exige al menos un autor y quita autores y temas repetidos', () => {
    expect(() => Libro.crear('l-1', datos({ autores: [] }), AHORA)).toThrow(
      'Un libro debe tener al menos un autor',
    );
    const tema = { id: 't-1', nombre: 'Literatura' };
    const libro = Libro.crear(
      'l-1',
      datos({ autores: [autor, autor], temas: [tema, tema] }),
      AHORA,
    );
    expect(libro.autores).toEqual([autor]);
    expect(libro.temas).toEqual([tema]);
  });

  it('R3: un libro digital exige un enlace http(s)', () => {
    expect(() =>
      Libro.crear('l-1', datos({ formato: Formato.DIGITAL }), AHORA),
    ).toThrow('Un libro digital debe tener el enlace de acceso');
    expect(() =>
      Libro.crear(
        'l-1',
        datos({ formato: Formato.DIGITAL, enlaceDigital: 'ftp://x' }),
        AHORA,
      ),
    ).toThrow(ValidationError);

    const digital = Libro.crear(
      'l-1',
      datos({
        formato: Formato.DIGITAL,
        enlaceDigital: ' https://biblioteca.example/x ',
      }),
      AHORA,
    );
    expect(digital.enlaceDigital).toBe('https://biblioteca.example/x');
    expect(digital.admiteEjemplares).toBe(false);
  });

  it('R3: un libro físico no guarda enlace', () => {
    const libro = Libro.crear(
      'l-1',
      datos({ enlaceDigital: 'https://biblioteca.example/x' }),
      AHORA,
    );
    expect(libro.enlaceDigital).toBeNull();
  });

  it.each([
    [{ titulo: '   ' }, 'El título es obligatorio'],
    [{ titulo: 'x'.repeat(301) }, 'El título no puede superar 300 caracteres'],
    [{ idioma: 'esp' }, 'El idioma debe ser un código ISO 639-1'],
    [{ anioPublicacion: 999 }, 'El año de publicación debe estar entre'],
    [{ anioPublicacion: 2028 }, 'El año de publicación debe estar entre'],
    [{ anioPublicacion: 1990.5 }, 'El año de publicación debe estar entre'],
    [{ isbn: '123' }, 'El ISBN no es válido'],
    [{ formato: 'PAPEL' as Formato }, 'El formato no es válido'],
    [
      { tipoMaterial: 'COMIC' as TipoMaterial },
      'El tipo de material no es válido',
    ],
  ])('rechaza datos inválidos: %j', (cambios, mensaje) => {
    expect(() => Libro.crear('l-1', datos(cambios), AHORA)).toThrow(mensaje);
  });

  describe('actualizar', () => {
    const DESPUES = new Date('2026-11-09T10:00:00Z');

    it('cambia solo los campos enviados y actualiza la fecha', () => {
      const libro = Libro.crear(
        'l-1',
        datos({ anioPublicacion: 1967, isbn: '9780306406157' }),
        AHORA,
      );
      libro.actualizar({ titulo: 'Otro título' }, DESPUES);

      expect(libro.titulo).toBe('Otro título');
      expect(libro.anioPublicacion).toBe(1967);
      expect(libro.isbn?.valor).toBe('9780306406157');
      expect(libro.autores).toEqual([autor]);
      expect(libro.creadoEn).toEqual(AHORA);
      expect(libro.actualizadoEn).toEqual(DESPUES);
    });

    it('null quita el año y el ISBN', () => {
      const libro = Libro.crear(
        'l-1',
        datos({ anioPublicacion: 1967, isbn: '9780306406157' }),
        AHORA,
      );
      libro.actualizar({ anioPublicacion: null, isbn: null }, DESPUES);
      expect(libro.anioPublicacion).toBeNull();
      expect(libro.isbn).toBeNull();
    });

    it('al pasar a físico se borra el enlace digital', () => {
      const libro = Libro.crear(
        'l-1',
        datos({
          formato: Formato.FISICO_Y_DIGITAL,
          enlaceDigital: 'https://biblioteca.example/x',
        }),
        AHORA,
      );
      libro.actualizar({ formato: Formato.FISICO }, DESPUES);
      expect(libro.enlaceDigital).toBeNull();
    });

    it('vuelve a validar todo el libro', () => {
      const libro = Libro.crear('l-1', datos(), AHORA);
      expect(() =>
        libro.actualizar({ formato: Formato.DIGITAL }, DESPUES),
      ).toThrow('Un libro digital debe tener el enlace de acceso');
    });
  });
});
