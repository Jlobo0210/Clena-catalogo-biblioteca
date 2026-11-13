/** Puerto para el hash de contraseñas. La implementación (bcrypt) vive en infraestructura. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  comparar(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
