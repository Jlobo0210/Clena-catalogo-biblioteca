import { ConflictError } from '../../../../shared/domain/domain-error';
import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Usuario } from '../../domain/entities/usuario';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PasswordHasher } from '../../domain/services/password-hasher';
import { Email } from '../../domain/value-objects/email';
import { validarPassword } from '../../domain/value-objects/password';
import { AVISO_PRIVACIDAD } from '../aviso-privacidad';
import { RegistrarUsuarioInput, SesionOutput } from '../dtos/auth.dto';
import { EmisorSesion } from './emisor-sesion';

/**
 * HU-11: registro de un usuario público con aceptación explícita del aviso de privacidad.
 * Solo pide nombre, correo y contraseña (datos mínimos). Devuelve la sesión ya iniciada.
 */
export class RegistrarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
    private readonly emisor: EmisorSesion,
    private readonly ids: IdGenerator,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  async execute(input: RegistrarUsuarioInput): Promise<SesionOutput> {
    const email = Email.crear(input.email);
    validarPassword(input.password);

    if (await this.usuarios.buscarPorEmail(email.valor)) {
      throw new ConflictError(
        'Ya existe una cuenta con ese correo electrónico',
      );
    }

    const ahora = this.reloj();
    const usuario = Usuario.registrarPublico({
      id: this.ids.generate(),
      nombre: input.nombre,
      email,
      passwordHash: await this.hasher.hash(input.password),
      aceptaAvisoPrivacidad: input.aceptaAvisoPrivacidad,
      versionAvisoPrivacidad: AVISO_PRIVACIDAD.version,
      ahora,
    });
    await this.usuarios.guardar(usuario);
    return this.emisor.emitir(usuario, ahora);
  }
}
