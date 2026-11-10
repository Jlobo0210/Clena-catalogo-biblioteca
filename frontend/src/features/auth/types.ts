/** Roles del sistema (mismos valores que el backend, HU-13). */
export type Rol = 'ADMINISTRADOR' | 'PERSONAL' | 'PUBLICO';

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administración',
  PERSONAL: 'Personal del CLENA',
  PUBLICO: 'Usuario',
};

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  consentimientoPrivacidadEn: string;
  versionAvisoPrivacidad: string;
  creadoEn: string;
}

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: Usuario;
}

export interface AvisoPrivacidad {
  version: string;
  responsable: string;
  datosRecolectados: string[];
  finalidades: string[];
  derechos: string;
  texto: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  aceptaAvisoPrivacidad: boolean;
}

export interface Credenciales {
  email: string;
  password: string;
}

export interface PaginaUsuarios {
  items: Usuario[];
  total: number;
  pagina: number;
  tamano: number;
}
