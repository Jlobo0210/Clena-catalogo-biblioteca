/** Roles del sistema (HU-13). Los mismos valores que el enum Rol de la base de datos. */
export const Rol = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  PERSONAL: 'PERSONAL',
  PUBLICO: 'PUBLICO',
} as const;

export type Rol = (typeof Rol)[keyof typeof Rol];

export const ROLES: readonly Rol[] = Object.values(Rol);

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as string[]).includes(valor);
}
