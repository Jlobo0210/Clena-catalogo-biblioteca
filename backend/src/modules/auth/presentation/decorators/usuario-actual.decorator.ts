import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '../../domain/services/token-service';
import { RequestConUsuario } from '../guards/jwt-auth.guard';

/** Inyecta en el handler el usuario del access token: `@UsuarioActual() usuario: AccessTokenPayload`. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload | undefined =>
    ctx.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
