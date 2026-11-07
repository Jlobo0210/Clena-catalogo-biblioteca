import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService } from '../../domain/services/token-service';

/** HU-12: cierra la sesión invalidando el refresh token. Es idempotente. */
export class CerrarSesionUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const registro = await this.refreshTokens.buscarPorHash(
      this.tokens.hashRefresh(refreshToken ?? ''),
    );
    if (registro && registro.revocadoEn === null) {
      await this.refreshTokens.revocar(registro.id, this.reloj());
    }
  }
}
