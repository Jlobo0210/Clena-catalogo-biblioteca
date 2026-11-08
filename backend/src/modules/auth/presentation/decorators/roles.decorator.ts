import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../domain/value-objects/rol';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
