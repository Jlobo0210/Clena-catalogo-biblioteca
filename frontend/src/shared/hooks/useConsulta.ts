import { useCallback, useEffect, useState } from 'react';
import { esCancelacion, normalizarError, type ErrorApi } from '../../api/errores';

export type EstadoConsulta<T> =
  | { estado: 'cargando' }
  | { estado: 'listo'; datos: T }
  | { estado: 'error'; error: ErrorApi };

/**
 * Ejecuta una consulta a la API cada vez que cambia `clave` y cancela la anterior.
 * Devuelve el estado y una función para reintentar. Con `consultar = null` no hace nada.
 */
export function useConsulta<T>(
  clave: string,
  consultar: ((signal: AbortSignal) => Promise<T>) | null,
): EstadoConsulta<T> & { reintentar: () => void } {
  const [estado, setEstado] = useState<EstadoConsulta<T>>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!consultar) return;
    const controller = new AbortController();
    let activo = true;
    setEstado({ estado: 'cargando' });

    consultar(controller.signal)
      .then((datos) => {
        if (activo) setEstado({ estado: 'listo', datos });
      })
      .catch((error: unknown) => {
        if (activo && !esCancelacion(error)) {
          setEstado({ estado: 'error', error: normalizarError(error) });
        }
      });

    return () => {
      activo = false;
      controller.abort();
    };
    // La consulta se repite solo cuando cambian la clave o el intento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { ...estado, reintentar };
}
