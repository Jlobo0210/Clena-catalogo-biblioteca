import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AccessTokenPayload,
  TOKEN_SERVICE,
} from '../../domain/services/token-service';
import type { TokenService } from '../../domain/services/token-service';

export type RequestConUsuario = Request & { usuario?: AccessTokenPayload };

/** Exige un access token válido en `Authorization: Bearer <token>`; si no, 401. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestConUsuario>();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }
    const payload = await this.tokens.verificarAccess(token);
    if (!payload) {
      throw new UnauthorizedException(
        'La sesión expiró o no es válida. Inicia sesión de nuevo',
      );
    }
    req.usuario = payload;
    return true;
  }
}
