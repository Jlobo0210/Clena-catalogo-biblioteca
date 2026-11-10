import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { conectarSesion } from '../../../api/apiClient';
import type { Rol, Usuario } from '../types';
import { almacenSesion } from './almacenSesion';
import { ContextoSesion, type ValorSesion } from './contextoSesion';
import * as sesion from './sesionServicio';

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(sesion.haySesionGuardada);

  useEffect(() => {
    const desconectar = conectarSesion({
      obtenerAccessToken: almacenSesion.obtenerAccessToken,
      renovarAccessToken: async () => (await sesion.renovarSesion())?.accessToken ?? null,
    });
    const desuscribir = sesion.suscribirse(setUsuario);

    // Al recargar la página el access token se pierde: se recupera con el refresh token.
    if (sesion.haySesionGuardada()) {
      void sesion.renovarSesion().finally(() => setCargando(false));
    }

    return () => {
      desconectar();
      desuscribir();
    };
  }, []);

  const tieneRol = useCallback(
    (...roles: Rol[]) => usuario !== null && roles.includes(usuario.rol),
    [usuario],
  );

  const valor = useMemo<ValorSesion>(
    () => ({
      usuario,
      cargando,
      ingresar: sesion.iniciarSesion,
      registrarse: sesion.registrarse,
      salir: sesion.cerrarSesion,
      tieneRol,
    }),
    [usuario, cargando, tieneRol],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}
