import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PasswordHasher } from '../../domain/services/password-hasher';
import { IniciarSesionInput, SesionOutput } from '../dtos/auth.dto';
import { EmisorSesion } from './emisor-sesion';

/** Mismo mensaje para correo inexistente y contraseña errada: no revela qué correos tienen cuenta. */
export const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

/** HU-12: inicio de sesión. Devuelve access token y refresh token. */
export class IniciarSesionUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
    private readonly emisor: EmisorSesion,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: IniciarSesionInput): Promise<SesionOutput> {
    const email = (input.email ?? '').trim().toLowerCase();
    const usuario = await this.usuarios.buscarPorEmail(email);
    if (!usuario || !usuario.puedeIniciarSesion) {
      throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
    }
    const ok = await this.hasher.comparar(
      input.password ?? '',
      usuario.passwordHash as string,
    );
    if (!ok) {
      throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
    }
    return this.emisor.emitir(usuario, this.reloj());
  }
}
