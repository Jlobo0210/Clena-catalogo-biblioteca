/**
 * Refresh token emitido a un usuario. Solo se guarda el hash del token, nunca el token.
 * Rotación: cada uso revoca el token y emite uno nuevo (HU-12).
 */
export interface RefreshToken {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiraEn: Date;
  revocadoEn: Date | null;
}

export function refreshTokenVigente(token: RefreshToken, ahora: Date): boolean {
  return (
    token.revocadoEn === null && token.expiraEn.getTime() > ahora.getTime()
  );
}
