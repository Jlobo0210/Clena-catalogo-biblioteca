export const RUTAS = {
  inicio: '/',
  buscar: '/buscar',
  busquedaAvanzada: '/busqueda-avanzada',
  temas: '/temas',
  libro: '/libros/:id',
  ingresar: '/ingresar',
  registro: '/registro',
  miCuenta: '/mi-cuenta',
  misPrestamos: '/mis-prestamos',
  panel: '/panel',
  usuarios: '/panel/usuarios',
} as const;

/** Ruta del detalle de un libro (HU-24). */
export function rutaLibro(id: string): string {
  return RUTAS.libro.replace(':id', encodeURIComponent(id));
}
