import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Rol, esRol } from '../../domain/value-objects/rol';
import { UsuarioOutput } from '../dtos/auth.dto';
import { aUsuarioOutput } from './usuario-output';

/**
 * HU-13: el administrador cambia el rol de un usuario.
 * Un administrador no puede cambiar su propio rol, para que el sistema nunca se quede sin administrador por error.
 */
export class CambiarRolUseCase {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async execute(input: {
    usuarioId: string;
    rol: Rol;
    solicitadoPor: string;
  }): Promise<UsuarioOutput> {
    if (!esRol(input.rol)) {
      throw new ValidationError('El rol no es válido');
    }
    if (input.usuarioId === input.solicitadoPor) {
      throw new ValidationError('No puedes cambiar tu propio rol');
    }
    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }
    usuario.cambiarRol(input.rol);
    await this.usuarios.guardar(usuario);
    return aUsuarioOutput(usuario);
  }
}
