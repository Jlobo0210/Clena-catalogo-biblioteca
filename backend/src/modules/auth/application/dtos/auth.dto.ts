/** DTOs de la capa de aplicación: datos planos que entran y salen de los casos de uso. */
import { Rol } from '../../domain/value-objects/rol';

export interface RegistrarUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  aceptaAvisoPrivacidad: boolean;
}

export interface IniciarSesionInput {
  email: string;
  password: string;
}

export interface UsuarioOutput {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  consentimientoPrivacidadEn: string;
  versionAvisoPrivacidad: string;
  creadoEn: string;
}

export interface SesionOutput {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Segundos de vida del access token. */
  expiresIn: number;
  usuario: UsuarioOutput;
}

export interface ListarUsuariosInput {
  pagina?: number;
  tamano?: number;
  rol?: Rol;
  texto?: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}
