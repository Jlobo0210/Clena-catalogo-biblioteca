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
  /** HU-34: préstamos que la persona aún no ha devuelto (impiden eliminar la cuenta). */
  contarPrestamosSinDevolver(usuarioId: string): Promise<number>;
  /**
   * HU-34: guarda el usuario ya anonimizado y borra en la misma transacción lo que lo
   * identifica fuera de la tabla usuario (sesiones y suscripciones de disponibilidad).
   */
  guardarAnonimizado(usuario: Usuario): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
