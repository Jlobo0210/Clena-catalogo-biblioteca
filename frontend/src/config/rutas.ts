export const RUTAS = {
  inicio: '/',
  buscar: '/buscar',
  busquedaAvanzada: '/busqueda-avanzada',
  temas: '/temas',
  libro: '/libros/:id',
  ingresar: '/ingresar',
  registro: '/registro',
  miCuenta: '/mi-cuenta',
  panel: '/panel',
  usuarios: '/panel/usuarios',
  panelAutores: '/panel/autores',
  panelTemas: '/panel/temas',
  panelImportar: '/panel/importar',
} as const;

/** Ruta del detalle de un libro (HU-24). */
export function rutaLibro(id: string): string {
  return RUTAS.libro.replace(':id', encodeURIComponent(id));
}
