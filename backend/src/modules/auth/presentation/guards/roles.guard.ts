import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../domain/value-objects/rol';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestConUsuario } from './jwt-auth.guard';

/** Bloquea con 403 si el rol del usuario no está entre los permitidos por @Roles (HU-13). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permitidos || permitidos.length === 0) {
      return true; // basta con estar autenticado
    }
    const { usuario } = context.switchToHttp().getRequest<RequestConUsuario>();
    if (!usuario || !permitidos.includes(usuario.rol)) {
      throw new ForbiddenException('Tu rol no tiene permiso para esta acción');
    }
    return true;
  }
}
