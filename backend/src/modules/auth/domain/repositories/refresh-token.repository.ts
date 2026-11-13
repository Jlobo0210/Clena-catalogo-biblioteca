import { RefreshToken } from '../entities/refresh-token';

export interface RefreshTokenRepository {
  guardar(token: RefreshToken): Promise<void>;
  buscarPorHash(tokenHash: string): Promise<RefreshToken | null>;
  revocar(id: string, cuando: Date): Promise<void>;
  /** Revoca todas las sesiones de un usuario (p. ej. si se reutiliza un refresh token ya revocado). */
  revocarTodosDe(usuarioId: string, cuando: Date): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
