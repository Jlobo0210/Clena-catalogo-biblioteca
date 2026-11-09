import { useEffect, useState } from 'react';
import { esCancelacion } from '../../../api/errores';
import { contarLibros } from '../api/libros.api';

type EstadoTotalLibros = 'cargando' | 'listo' | 'error';

interface TotalLibrosState {
  estado: EstadoTotalLibros;
  total: number | null;
}

export function useTotalLibros(): TotalLibrosState {
  const [state, setState] = useState<TotalLibrosState>({
    estado: 'cargando',
    total: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    contarLibros(controller.signal)
      .then((total) => {
        if (active) {
          setState({ estado: 'listo', total });
        }
      })
      .catch((error: unknown) => {
        if (active && !esCancelacion(error)) {
          setState({ estado: 'error', total: null });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return state;
}
