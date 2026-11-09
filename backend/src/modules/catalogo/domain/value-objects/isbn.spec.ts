import { ValidationError } from '../../../../shared/domain/domain-error';
import { Isbn } from './isbn';

describe('Isbn', () => {
  it('acepta un ISBN-13 con guiones y lo normaliza', () => {
    expect(Isbn.crear('978-0-306-40615-7').valor).toBe('9780306406157');
  });

  it('acepta un ISBN-10, incluida la X final en minúscula', () => {
    expect(Isbn.crear('0-306-40615-2').valor).toBe('0306406152');
    expect(Isbn.crear('0-8044-2957-x').valor).toBe('080442957X');
  });

  it.each(['9780306406158', '0306406153', '12345', 'abcdefghij', ''])(
    'rechaza «%s»',
    (valor) => {
      expect(() => Isbn.crear(valor)).toThrow(ValidationError);
    },
  );

  it('reconstruye un valor guardado sin validarlo', () => {
    expect(Isbn.reconstruir('123').valor).toBe('123');
  });
});
