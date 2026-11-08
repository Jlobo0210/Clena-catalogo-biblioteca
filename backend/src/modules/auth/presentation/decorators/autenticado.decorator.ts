import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../../../shared/presentation/http/error-response';
import { Rol } from '../../domain/value-objects/rol';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Protege un controlador o un endpoint. Uso en cualquier módulo:
 *
 *   @Autenticado()                                  // cualquier usuario con sesión
 *   @Autenticado(Rol.PERSONAL, Rol.ADMINISTRADOR)   // solo esos roles; los demás reciben 403
 *
 * Sin token o con token vencido: 401. Lo documenta solo en Swagger (candado y respuestas 401/403).
 */
export function Autenticado(...roles: Rol[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Sin sesión o token vencido',
      type: ErrorResponse,
    }),
    ...(roles.length
      ? [
          ApiForbiddenResponse({
            description: `Solo para: ${roles.join(', ')}`,
            type: ErrorResponse,
          }),
        ]
      : []),
  );
}
