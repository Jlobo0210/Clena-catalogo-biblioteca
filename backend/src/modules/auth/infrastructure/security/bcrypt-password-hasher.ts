import { compare, hash } from 'bcryptjs';
import { PasswordHasher } from '../../domain/services/password-hasher';

/** Hash de contraseñas con bcrypt (HU-11). 10 rondas: ~70 ms por hash. */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rondas = 10) {}

  hash(password: string): Promise<string> {
    return hash(password, this.rondas);
  }

  comparar(password: string, passwordHash: string): Promise<boolean> {
    return compare(password, passwordHash);
  }
}
