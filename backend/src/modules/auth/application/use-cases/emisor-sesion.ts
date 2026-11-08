import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Usuario } from '../../domain/entities/usuario';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService } from '../../domain/services/token-service';
import { SesionOutput } from '../dtos/auth.dto';
import { aUsuarioOutput } from './usuario-output';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Emite el par access + refresh token para un usuario y guarda el hash del refresh. */
export class EmisorSesion {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly ids: IdGenerator,
  ) {}

  async emitir(usuario: Usuario, ahora: Date): Promise<SesionOutput> {
    const accessToken = await this.tokens.firmarAccess({
      sub: usuario.id,
      email: usuario.email.valor,
      rol: usuario.rol,
    });
    const refreshToken = this.tokens.generarRefresh();
    await this.refreshTokens.guardar({
      id: this.ids.generate(),
      usuarioId: usuario.id,
      tokenHash: this.tokens.hashRefresh(refreshToken),
      expiraEn: new Date(
        ahora.getTime() + this.tokens.refreshTtlDias * MS_POR_DIA,
      ),
      revocadoEn: null,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokens.accessTtlSegundos,
      usuario: aUsuarioOutput(usuario),
    };
  }
}
