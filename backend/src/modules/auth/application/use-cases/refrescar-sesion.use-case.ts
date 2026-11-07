import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { refreshTokenVigente } from '../../domain/entities/refresh-token';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { TokenService } from '../../domain/services/token-service';
import { SesionOutput } from '../dtos/auth.dto';
import { EmisorSesion } from './emisor-sesion';

export const SESION_INVALIDA =
  'La sesión expiró o no es válida. Inicia sesión de nuevo';

/**
 * HU-12: renueva la sesión con rotación del refresh token (el usado se revoca y se emite otro).
 * Si llega un refresh token ya revocado, alguien lo está reutilizando: se cierran todas
 * las sesiones de ese usuario.
 */
export class RefrescarSesionUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly tokens: TokenService,
    private readonly emisor: EmisorSesion,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(refreshToken: string): Promise<SesionOutput> {
    const ahora = this.reloj();
    const registro = await this.refreshTokens.buscarPorHash(
      this.tokens.hashRefresh(refreshToken ?? ''),
    );
    if (!registro) {
      throw new UnauthorizedError(SESION_INVALIDA);
    }
    if (registro.revocadoEn !== null) {
      await this.refreshTokens.revocarTodosDe(registro.usuarioId, ahora);
      throw new UnauthorizedError(SESION_INVALIDA);
    }
    if (!refreshTokenVigente(registro, ahora)) {
      throw new UnauthorizedError(SESION_INVALIDA);
    }

    const usuario = await this.usuarios.buscarPorId(registro.usuarioId);
    if (!usuario || !usuario.puedeIniciarSesion) {
      throw new UnauthorizedError(SESION_INVALIDA);
    }

    await this.refreshTokens.revocar(registro.id, ahora);
    return this.emisor.emitir(usuario, ahora);
  }
}
