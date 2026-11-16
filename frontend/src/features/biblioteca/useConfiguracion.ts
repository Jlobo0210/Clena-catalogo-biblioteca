import { useEffect, useState } from 'react';
import { apiClient } from '../../api/apiClient';

export interface ConfiguracionBiblioteca {
  horarios: string;
  telefono: string;
  correo: string;
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'vacio' }
  | { tipo: 'listo'; datos: ConfiguracionBiblioteca };

export function useConfiguracion(): Estado {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  useEffect(() => {
    const controlador = new AbortController();
    apiClient.get<ConfiguracionBiblioteca | null>('/configuracion-biblioteca', { signal: controlador.signal })
      .then(({ data }) => setEstado(data ? { tipo: 'listo', datos: data } : { tipo: 'vacio' }))
      .catch(() => { if (!controlador.signal.aborted) setEstado({ tipo: 'error' }); });
    return () => controlador.abort();
  }, []);
  return estado;
}
