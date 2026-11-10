import { RUTAS } from '../../config/rutas';
import type { Usuario } from './types';

/** A dónde ir después de iniciar sesión: a la página que pidió, o a la de su rol. */
export function destinoTrasIngreso(usuario: Usuario, desde?: unknown): string {
  if (typeof desde === 'string' && desde.startsWith('/') && !desde.startsWith('//')) return desde;
  return usuario.rol === 'PUBLICO' ? RUTAS.inicio : RUTAS.panel;
}
