import { RUTAS } from '../../config/rutas';

/** HU-31: dirección que abre el QR, la búsqueda pública marcada con su origen. */
export function urlAccesoQr(origen: string = window.location.origin): string {
  return `${origen}${RUTAS.buscar}?desde=qr`;
}
