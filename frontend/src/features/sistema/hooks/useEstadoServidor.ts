import { useEffect, useState } from 'react';
import { esCancelacion } from '../../../api/errores';
import { consultarSalud } from '../api/salud.api';

export type EstadoServidor = 'comprobando' | 'en-linea' | 'sin-conexion';

export function useEstadoServidor(intervaloMs = 60_000): EstadoServidor {
  const [estado, setEstado] = useState<EstadoServidor>('comprobando');

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    const comprobar = async () => {
      if (document.hidden) {
        return;
      }

      controller?.abort();
      controller = new AbortController();

      try {
        await consultarSalud(controller.signal);
        if (active) {
          setEstado('en-linea');
        }
      } catch (error: unknown) {
        if (active && !esCancelacion(error)) {
          setEstado('sin-conexion');
        }
      }
    };

    void comprobar();
    const intervaloId = window.setInterval(() => {
      void comprobar();
    }, intervaloMs);
    const manejarVisibilidad = () => {
      if (!document.hidden) {
        void comprobar();
      }
    };

    document.addEventListener('visibilitychange', manejarVisibilidad);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(intervaloId);
      document.removeEventListener('visibilitychange', manejarVisibilidad);
    };
  }, [intervaloMs]);

  return estado;
}
