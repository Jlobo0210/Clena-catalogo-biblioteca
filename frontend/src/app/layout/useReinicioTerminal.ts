import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useSesion } from '../../features/auth/sesion/contextoSesion';

export function useReinicioTerminal() {
  const navigate = useNavigate();
  const { salir, usuario } = useSesion();
  const [claveSesion, setClaveSesion] = useState(0);

  const reiniciar = () => {
    // En una terminal compartida, reiniciar también cierra la sesión de quien la usaba.
    if (usuario) void salir();
    setClaveSesion((clave) => clave + 1);
    navigate(RUTAS.inicio, { replace: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('contenido')?.focus();
  };

  return { claveSesion, reiniciar };
}
