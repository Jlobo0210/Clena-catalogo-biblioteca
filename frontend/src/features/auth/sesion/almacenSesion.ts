/**
 * Dónde vive la sesión en el navegador.
 *
 * - El access token (15 min) solo se guarda en memoria.
 * - El refresh token se guarda en sessionStorage: sobrevive a recargar la página,
 *   pero se borra al cerrar la pestaña. En una terminal de sala compartida es lo más
 *   seguro; además «Reiniciar la terminal» cierra la sesión.
 */
const CLAVE_REFRESH = 'clena.refreshToken';

let accessToken: string | null = null;

export const almacenSesion = {
  obtenerAccessToken: () => accessToken,

  obtenerRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_REFRESH);
    } catch {
      return null;
    }
  },

  guardar(nuevoAccess: string, nuevoRefresh: string) {
    accessToken = nuevoAccess;
    try {
      sessionStorage.setItem(CLAVE_REFRESH, nuevoRefresh);
    } catch {
      // Sin almacenamiento (modo privado estricto): la sesión dura hasta recargar.
    }
  },

  limpiar() {
    accessToken = null;
    try {
      sessionStorage.removeItem(CLAVE_REFRESH);
    } catch {
      // nada que limpiar
    }
  },
};
