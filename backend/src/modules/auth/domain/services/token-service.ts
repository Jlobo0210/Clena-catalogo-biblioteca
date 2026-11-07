import { Rol } from '../value-objects/rol';

/** Lo que viaja dentro del access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  rol: Rol;
}

/** Puerto para emitir y verificar tokens. La implementación (JWT) vive en infraestructura. */
export interface TokenService {
  /** Firma un access token de vida corta. */
  firmarAccess(payload: AccessTokenPayload): Promise<string>;
  /** Devuelve el payload si el token es válido y no expiró; si no, null. */
  verificarAccess(token: string): Promise<AccessTokenPayload | null>;
  /** Segundos de vida del access token. */
  readonly accessTtlSegundos: number;
  /** Días de vida del refresh token. */
  readonly refreshTtlDias: number;
  /** Genera un refresh token opaco y aleatorio. */
  generarRefresh(): string;
  /** Hash determinista del refresh token, para guardarlo y buscarlo. */
  hashRefresh(token: string): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
