import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';

export function useReinicioTerminal() {
  const navigate = useNavigate();
  const [claveSesion, setClaveSesion] = useState(0);

  const reiniciar = () => {
    setClaveSesion((clave) => clave + 1);
    navigate(RUTAS.inicio, { replace: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('contenido')?.focus();
  };

  return { claveSesion, reiniciar };
}
