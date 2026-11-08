import { Usuario } from '../entities/usuario';
import { Rol } from '../value-objects/rol';

export interface FiltroUsuarios {
  pagina: number;
  tamano: number;
  rol?: Rol;
  /** Texto a buscar en nombre o correo. */
  texto?: string;
}

export interface UsuarioRepository {
  guardar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(filtro: FiltroUsuarios): Promise<{ items: Usuario[]; total: number }>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
