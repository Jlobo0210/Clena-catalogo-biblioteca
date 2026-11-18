/** HU-29: RECORDATORIO antes de la fecha límite; VENCIMIENTO cuando ya pasó. */
export type TipoAlerta = 'RECORDATORIO' | 'VENCIMIENTO';

/** Lo que hace falta para escribir el correo de una alerta. */
export interface PrestamoParaAlerta {
  prestamoId: string;
  /** «YYYY-MM-DD» */
  fechaLimite: string;
  usuario: { nombre: string; email: string };
  libroTitulo: string;
  codigoInventario: string;
}

/** Rango de la fecha límite («YYYY-MM-DD»), ambos extremos incluidos. */
export interface RangoFechaLimite {
  desde?: string;
  hasta?: string;
}

export interface AlertaPrestamoRepository {
  /**
   * Préstamos sin devolver con la fecha límite en el rango, que todavía no recibieron una
   * alerta de ese tipo. Excluye a los usuarios anonimizados (HU-34): ya no tienen correo.
   */
  pendientes(
    tipo: TipoAlerta,
    rango: RangoFechaLimite,
  ): Promise<PrestamoParaAlerta[]>;
  /**
   * Anota la alerta como enviada antes de enviarla (R14: una sola vez por préstamo y tipo).
   * Devuelve false si ya estaba anotada, p. ej. porque otra ejecución la tomó primero.
   */
  reservar(
    prestamoId: string,
    tipo: TipoAlerta,
    enviadaEn: Date,
  ): Promise<boolean>;
  /** Quita la anotación si el envío falló, para que la próxima ejecución lo intente de nuevo. */
  liberar(prestamoId: string, tipo: TipoAlerta): Promise<void>;
}

export const ALERTA_PRESTAMO_REPOSITORY = Symbol('ALERTA_PRESTAMO_REPOSITORY');
