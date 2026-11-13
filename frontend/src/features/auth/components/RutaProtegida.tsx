import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RUTAS } from '../../../config/rutas';
import { useSesion } from '../sesion/contextoSesion';
import type { Rol } from '../types';
import { AccesoDenegado } from './AccesoDenegado';

interface RutaProtegidaProps {
  /** Roles que pueden entrar. Si se omite, basta con haber iniciado sesión. */
  roles?: Rol[];
}

export function RutaProtegida({ roles }: RutaProtegidaProps) {
  const { cargando, usuario } = useSesion();
  const location = useLocation();

  if (cargando) {
    return (
      <p role="status" style={{ padding: 'var(--espacio-12) 0' }}>
        Verificando tu sesión…
      </p>
    );
  }

  if (!usuario) {
    return (
      <Navigate
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
        to={RUTAS.ingresar}
      />
    );
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <AccesoDenegado />;
  }

  return <Outlet />;
}
