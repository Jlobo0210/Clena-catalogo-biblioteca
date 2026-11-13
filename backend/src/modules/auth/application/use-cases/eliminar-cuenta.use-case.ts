import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PasswordHasher } from '../../domain/services/password-hasher';
import { Rol } from '../../domain/value-objects/rol';

export interface EliminarCuentaInput {
  /** Se pide la contraseña para confirmar que es la persona dueña de la cuenta. */
  password: string;
}

/**
 * HU-34 (Ley 1581 de 2012): la persona elimina su cuenta y sus datos personales.
 * Reglas:
 *  - Confirma con su contraseña.
 *  - No puede tener préstamos sin devolver.
 *  - Una cuenta de administración no se elimina sola, para no dejar el sistema sin administración.
 *  - Los datos se anonimizan: el historial de préstamos se conserva sin identificar a la persona.
 */
export class EliminarCuentaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(usuarioId: string, input: EliminarCuentaInput): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario || usuario.anonimizadoEn !== null) {
      throw new NotFoundError('Usuario no encontrado');
    }
    if (usuario.rol === Rol.ADMINISTRADOR) {
      throw new ConflictError(
        'Una cuenta de administración no se puede eliminar desde aquí. Pide a otro administrador que te cambie el rol primero.',
      );
    }

    // 400 y no 401: un 401 haría que el frontend intente renovar la sesión.
    const ok =
      usuario.passwordHash !== null &&
      (await this.hasher.comparar(input.password ?? '', usuario.passwordHash));
    if (!ok) {
      throw new ValidationError('La contraseña no es correcta');
    }

    const sinDevolver = await this.usuarios.contarPrestamosSinDevolver(
      usuario.id,
    );
    if (sinDevolver > 0) {
      throw new ConflictError(
        `Tienes ${sinDevolver} préstamo(s) sin devolver. Devuélvelos en el mostrador de la biblioteca antes de eliminar tu cuenta.`,
      );
    }

    usuario.anonimizar(this.reloj());
    await this.usuarios.guardarAnonimizado(usuario);
  }
}
