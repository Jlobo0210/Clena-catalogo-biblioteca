import { ValidationError } from '../../../../shared/domain/domain-error';

/** Objeto de valor Email: se guarda en minúscula y sin espacios (docs/modelo-datos.md). */
export class Email {
  static readonly MAX = 254;
  private static readonly FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(readonly valor: string) {}

  static crear(valor: string): Email {
    const limpio = (valor ?? '').trim().toLowerCase();
    if (!Email.FORMATO.test(limpio) || limpio.length > Email.MAX) {
      throw new ValidationError('El correo electrónico no es válido');
    }
    return new Email(limpio);
  }

  toString(): string {
    return this.valor;
  }
}
