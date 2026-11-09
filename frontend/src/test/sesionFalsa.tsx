import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { ContextoSesion, type ValorSesion } from '../features/auth/sesion/contextoSesion';
import type { Rol, Usuario } from '../features/auth/types';

export function usuarioDePrueba(rol: Rol = 'PUBLICO', cambios: Partial<Usuario> = {}): Usuario {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Ana Pérez',
    email: 'ana@example.com',
    rol,
    consentimientoPrivacidadEn: '2026-11-07T15:00:00.000Z',
    versionAvisoPrivacidad: '1.0',
    creadoEn: '2026-11-07T15:00:00.000Z',
    ...cambios,
  };
}

export function sesionFalsa(cambios: Partial<ValorSesion> = {}): ValorSesion {
  const usuario = cambios.usuario ?? null;
  return {
    usuario,
    cargando: false,
    ingresar: vi.fn(),
    registrarse: vi.fn(),
    salir: vi.fn().mockResolvedValue(undefined),
    tieneRol: (...roles: Rol[]) => usuario !== null && roles.includes(usuario.rol),
    ...cambios,
  };
}

export function ConSesion({ children, valor }: { children: ReactNode; valor: ValorSesion }) {
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}
