import { ValidationError } from '../../../../shared/domain/domain-error';

/**
 * Política de contraseñas: 8 a 72 caracteres (bcrypt ignora lo que pase de 72 bytes),
 * con al menos una letra y un número.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function validarPassword(password: string): void {
  const p = password ?? '';
  if (p.length < PASSWORD_MIN || p.length > PASSWORD_MAX) {
    throw new ValidationError(
      `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`,
    );
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(p) || !/\d/.test(p)) {
    throw new ValidationError(
      'La contraseña debe tener al menos una letra y un número',
    );
  }
}
