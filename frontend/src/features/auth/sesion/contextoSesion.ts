import { createContext, useContext } from 'react';
import type { Credenciales, DatosRegistro, Rol, Usuario } from '../types';

export interface ValorSesion {
  usuario: Usuario | null;
  /** true mientras se recupera una sesión guardada al cargar la página. */
  cargando: boolean;
  ingresar: (credenciales: Credenciales) => Promise<Usuario>;
  registrarse: (datos: DatosRegistro) => Promise<Usuario>;
  salir: () => Promise<void>;
  tieneRol: (...roles: Rol[]) => boolean;
}

export const ContextoSesion = createContext<ValorSesion | null>(null);

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion);
  if (!valor) {
    throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  }
  return valor;
}
