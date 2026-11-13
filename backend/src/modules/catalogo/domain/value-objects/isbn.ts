import { ValidationError } from '../../../../shared/domain/domain-error';

/**
 * ISBN-10 o ISBN-13 normalizado: sin guiones ni espacios y con la X final en mayúscula.
 * Se valida el dígito de control (docs/modelo-datos.md).
 */
export class Isbn {
  private constructor(readonly valor: string) {}

  static crear(valor: string): Isbn {
    const limpio = (valor ?? '').replace(/[\s-]/g, '').toUpperCase();
    if (!Isbn.esIsbn10(limpio) && !Isbn.esIsbn13(limpio)) {
      throw new ValidationError(
        'El ISBN no es válido: debe ser un ISBN-10 o ISBN-13 con dígito de control correcto',
      );
    }
    return new Isbn(limpio);
  }

  /** Reconstruye un ISBN ya guardado, sin volver a validarlo. */
  static reconstruir(valor: string): Isbn {
    return new Isbn(valor);
  }

  private static esIsbn10(v: string): boolean {
    if (!/^\d{9}[\dX]$/.test(v)) return false;
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      const digito = v[i] === 'X' ? 10 : Number(v[i]);
      suma += digito * (10 - i);
    }
    return suma % 11 === 0;
  }

  private static esIsbn13(v: string): boolean {
    if (!/^\d{13}$/.test(v)) return false;
    const suma = [...v].reduce(
      (total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 1 : 3),
      0,
    );
    return suma % 10 === 0;
  }
}
