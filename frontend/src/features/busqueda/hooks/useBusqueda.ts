import { useEffect, useState } from 'react';
import { buscarLibros, type FiltrosBusqueda } from '../api/busqueda.api';
import type { PaginaLibrosDto } from '../../catalogo/types';

interface EstadoBusqueda {
  datos: PaginaLibrosDto | null;
  cargando: boolean;
  error: string | null;
}

/**
 * Hook que ejecuta la búsqueda cada vez que cambian los filtros.
 * Cancela la petición anterior si llegan nuevos filtros antes de que termine.
 */
export function useBusqueda(
  filtros: FiltrosBusqueda,
  pagina: number,
): EstadoBusqueda {
  const [estado, setEstado] = useState<EstadoBusqueda>({
    datos: null,
    cargando: false,
    error: null,
  });

  // Serializar filtros para comparación estable como dependencia del efecto
  const filtrosKey = JSON.stringify({ ...filtros, pagina });

  useEffect(() => {
    if (!filtros.q || filtros.q.trim().length < 2) {
      setEstado({ datos: null, cargando: false, error: null });
      return;
    }

    const controller = new AbortController();
    setEstado((prev) => ({ ...prev, cargando: true, error: null }));

    buscarLibros({ ...filtros, pagina }, controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) {
          setEstado({ datos, cargando: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al buscar';
          setEstado({ datos: null, cargando: false, error: mensaje });
        }
      });

    return () => {
      controller.abort();
    };
    // filtrosKey es la forma serializada estable de filtros+pagina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey]);

  return estado;
}
