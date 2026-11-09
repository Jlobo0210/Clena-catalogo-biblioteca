import axios from 'axios';

export type TipoErrorApi =
  | 'sin-conexion'
  | 'no-encontrado'
  | 'validacion'
  | 'servidor'
  | 'desconocido';

export interface ErrorApi {
  tipo: TipoErrorApi;
  mensaje: string;
}

interface RespuestaError {
  error?: unknown;
}

export function esCancelacion(error: unknown): boolean {
  return axios.isCancel(error);
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

  switch (error.response.status) {
    case 404:
      return {
        tipo: 'no-encontrado',
        mensaje: 'El recurso solicitado no está disponible.',
      };
    case 400:
      return {
        tipo: 'validacion',
        mensaje: 'Los datos enviados no son válidos.',
      };
    default:
      return {
        tipo: 'servidor',
        mensaje: 'El servidor no pudo completar la solicitud.',
      };
  }
}
