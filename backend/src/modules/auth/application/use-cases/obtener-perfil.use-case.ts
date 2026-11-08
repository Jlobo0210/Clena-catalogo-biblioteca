import { NotFoundError } from '../../../../shared/domain/domain-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { UsuarioOutput } from '../dtos/auth.dto';
import { aUsuarioOutput } from './usuario-output';

/** Datos del usuario que inició sesión (GET /auth/me). */
export class ObtenerPerfilUseCase {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async execute(usuarioId: string): Promise<UsuarioOutput> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return aUsuarioOutput(usuario);
  }
}
