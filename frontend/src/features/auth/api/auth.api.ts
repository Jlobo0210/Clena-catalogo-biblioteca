import { apiClient } from '../../../api/apiClient';
import type {
  AvisoPrivacidad,
  Credenciales,
  DatosRegistro,
  PaginaUsuarios,
  Rol,
  Sesion,
  Usuario,
} from '../types';

export async function iniciarSesion(credenciales: Credenciales): Promise<Sesion> {
  const { data } = await apiClient.post<Sesion>('/auth/login', credenciales);
  return data;
}

export async function registrarse(datos: DatosRegistro): Promise<Sesion> {
  const { data } = await apiClient.post<Sesion>('/auth/registro', datos);
  return data;
}

export async function renovar(refreshToken: string): Promise<Sesion> {
  const { data } = await apiClient.post<Sesion>('/auth/refresh', { refreshToken });
  return data;
}

export async function cerrarSesion(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function obtenerPerfil(): Promise<Usuario> {
  const { data } = await apiClient.get<Usuario>('/auth/me');
  return data;
}

export async function obtenerAvisoPrivacidad(): Promise<AvisoPrivacidad> {
  const { data } = await apiClient.get<AvisoPrivacidad>('/auth/aviso-privacidad');
  return data;
}

export async function listarUsuarios(pagina = 1, tamano = 20): Promise<PaginaUsuarios> {
  const { data } = await apiClient.get<PaginaUsuarios>('/usuarios', {
    params: { pagina, tamano },
  });
  return data;
}

export async function cambiarRol(id: string, rol: Rol): Promise<Usuario> {
  const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}/rol`, { rol });
  return data;
}
