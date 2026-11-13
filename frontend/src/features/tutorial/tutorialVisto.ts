/** HU-32: recuerda en este navegador si la persona ya vio (o saltó) el tutorial. */
export const CLAVE_TUTORIAL = 'clena.tutorialBusquedaVisto';

export function tutorialYaVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_TUTORIAL) === 'si';
  } catch {
    // Sin almacenamiento (modo privado estricto): no insistir en cada visita.
    return true;
  }
}

export function marcarTutorialVisto(): void {
  try {
    localStorage.setItem(CLAVE_TUTORIAL, 'si');
  } catch {
    // Sin almacenamiento: no pasa nada, el botón «Ver tutorial» sigue disponible.
  }
}
