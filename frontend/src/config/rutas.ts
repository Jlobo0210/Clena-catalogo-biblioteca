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
  prestamosPersonal: '/panel/prestamos',
  prestamosSeguimiento: '/panel/prestamos/seguimiento',
  panelQr: '/panel/qr',
  panelAutores: '/panel/autores',
  panelTemas: '/panel/temas',
  panelImportar: '/panel/importar',
  panelLibros: '/panel/libros',
  panelLibroNuevo: '/panel/libros/nuevo',
  panelLibro: '/panel/libros/:id',
} as const;

/** Ruta del detalle de un libro (HU-24). */
export function rutaLibro(id: string): string {
  return RUTAS.libro.replace(':id', encodeURIComponent(id));
}

/** Edición de un libro en el panel (HU-25). */
export function rutaPanelLibro(id: string): string {
  return RUTAS.panelLibro.replace(':id', encodeURIComponent(id));
}
