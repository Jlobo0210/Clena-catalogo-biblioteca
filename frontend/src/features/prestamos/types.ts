export type EstadoPrestamo = 'ACTIVO' | 'VENCIDO' | 'DEVUELTO';

export interface Prestamo {
  id: string;
  estado: EstadoPrestamo;
  fechaPrestamo: string;
  /** «YYYY-MM-DD», día límite en hora de Colombia. */
  fechaLimite: string;
  fechaDevolucion: string | null;
  /** Días para el límite; negativo = días de atraso; null si ya se devolvió. */
  diasRestantes: number | null;
  /** Días de retraso (0 si está al día); null si ya se devolvió (HU-36). */
  diasRetraso?: number | null;
  ejemplar: { id: string; codigoInventario: string };
  libro: { id: string; titulo: string };
  usuario: { id: string; nombre: string; email: string };
  registradoPor: { id: string; nombre: string };
}

export interface PaginaPrestamos {
  items: Prestamo[];
  total: number;
  pagina: number;
  tamano: number;
}
