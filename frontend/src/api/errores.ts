import axios from 'axios';

export type TipoErrorApi =
  | 'sin-conexion'
  | 'no-encontrado'
  | 'validacion'
  | 'no-autenticado'
  | 'sin-permiso'
  | 'conflicto'
  | 'servidor'
  | 'desconocido';

export interface ErrorApi {
  tipo: TipoErrorApi;
  mensaje: string;
  /** Detalle de validación que envía el backend (uno por campo con problema). */
  detalles?: string[];
}

/** Forma del ErrorResponse uniforme del backend (HU-09). */
interface RespuestaError {
  error?: unknown;
  message?: unknown;
  details?: unknown;
}

export function esCancelacion(error: unknown): boolean {
  return axios.isCancel(error);
}

function mensajeDelServidor(data: RespuestaError | undefined): string | undefined {
  return typeof data?.message === 'string' && data.message.trim() ? data.message : undefined;
}

export function normalizarError(error: unknown): ErrorApi {
  if (!axios.isAxiosError<RespuestaError>(error)) {
    return {
      tipo: 'desconocido',
      mensaje: 'No fue posible completar la solicitud.',
    };
  }

  if (!error.response) {
    return {
      tipo: 'sin-conexion',
      mensaje: 'No fue posible conectar con el servidor.',
    };
  }

  const data = error.response.data;
  const delServidor = mensajeDelServidor(data);

  switch (error.response.status) {
    case 404:
      return {
        tipo: 'no-encontrado',
        mensaje: 'El recurso solicitado no está disponible.',
      };
    case 400:
      return {
        tipo: 'validacion',
        mensaje: delServidor ?? 'Los datos enviados no son válidos.',
        detalles: Array.isArray(data?.details)
          ? data.details.filter((d): d is string => typeof d === 'string')
          : undefined,
      };
    case 401:
      return {
        tipo: 'no-autenticado',
        mensaje: delServidor ?? 'Tu sesión no es válida. Inicia sesión de nuevo.',
      };
    case 403:
      return {
        tipo: 'sin-permiso',
        mensaje: delServidor ?? 'No tienes permiso para realizar esta acción.',
      };
    case 409:
      return {
        tipo: 'conflicto',
        mensaje: delServidor ?? 'La información entra en conflicto con datos existentes.',
      };
    default:
      return {
        tipo: 'servidor',
        mensaje: 'El servidor no pudo completar la solicitud.',
      };
  }
}
