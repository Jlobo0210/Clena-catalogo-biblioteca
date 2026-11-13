import { ValidationError } from '../../../../shared/domain/domain-error';
import { Email } from '../value-objects/email';
import { Rol } from '../value-objects/rol';

export interface UsuarioProps {
  id: string;
  nombre: string;
  email: Email;
  /** null si la cuenta fue anonimizada o aún no tiene contraseña. */
  passwordHash: string | null;
  rol: Rol;
  consentimientoPrivacidadEn: Date;
  versionAvisoPrivacidad: string;
  anonimizadoEn: Date | null;
  creadoEn: Date;
}

/**
 * Entidad Usuario (HU-11, HU-13).
 * Reglas:
 *  - Nadie se registra sin aceptar el aviso de privacidad (Ley 1581 de 2012): se guarda fecha y versión.
 *  - Quien se registra por su cuenta siempre es PUBLICO; solo un administrador cambia roles.
 *  - Un usuario anonimizado no puede iniciar sesión.
 */
export class Usuario {
  static readonly NOMBRE_MAX = 120;

  private constructor(private readonly props: UsuarioProps) {}

  static registrarPublico(datos: {
    id: string;
    nombre: string;
    email: Email;
    passwordHash: string;
    aceptaAvisoPrivacidad: boolean;
    versionAvisoPrivacidad: string;
    ahora: Date;
  }): Usuario {
    if (datos.aceptaAvisoPrivacidad !== true) {
      throw new ValidationError(
        'Debes aceptar el aviso de privacidad para crear la cuenta',
      );
    }
    return new Usuario({
      id: datos.id,
      nombre: Usuario.validarNombre(datos.nombre),
      email: datos.email,
      passwordHash: datos.passwordHash,
      rol: Rol.PUBLICO,
      consentimientoPrivacidadEn: datos.ahora,
      versionAvisoPrivacidad: datos.versionAvisoPrivacidad,
      anonimizadoEn: null,
      creadoEn: datos.ahora,
    });
  }

  static reconstruir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  cambiarRol(nuevo: Rol): void {
    this.props.rol = nuevo;
  }

  get puedeIniciarSesion(): boolean {
    return (
      this.props.anonimizadoEn === null && this.props.passwordHash !== null
    );
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): string | null {
    return this.props.passwordHash;
  }
  get rol(): Rol {
    return this.props.rol;
  }
  get consentimientoPrivacidadEn(): Date {
    return this.props.consentimientoPrivacidadEn;
  }
  get versionAvisoPrivacidad(): string {
    return this.props.versionAvisoPrivacidad;
  }
  get anonimizadoEn(): Date | null {
    return this.props.anonimizadoEn;
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  private static validarNombre(nombre: string): string {
    const limpio = (nombre ?? '').trim().replace(/\s+/g, ' ');
    if (limpio.length === 0) {
      throw new ValidationError('El nombre es obligatorio');
    }
    if (limpio.length > Usuario.NOMBRE_MAX) {
      throw new ValidationError(
        `El nombre no puede superar ${Usuario.NOMBRE_MAX} caracteres`,
      );
    }
    return limpio;
  }
}
