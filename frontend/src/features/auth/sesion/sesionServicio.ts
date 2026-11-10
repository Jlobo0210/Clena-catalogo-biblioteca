import axios from 'axios';
import * as authApi from '../api/auth.api';
import type { Credenciales, DatosRegistro, Sesion, Usuario } from '../types';
import { almacenSesion } from './almacenSesion';

/**
 * Lógica de sesión sin React: iniciar, registrarse, renovar y cerrar.
 * El SesionProvider se suscribe para enterarse de los cambios (p. ej. cuando el
 * interceptor renueva el token o la sesión vence).
 */
type Oyente = (usuario: Usuario | null) => void;
const oyentes = new Set<Oyente>();

export function suscribirse(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function emitir(usuario: Usuario | null) {
  oyentes.forEach((oyente) => oyente(usuario));
}

function aplicar(sesion: Sesion): Usuario {
  almacenSesion.guardar(sesion.accessToken, sesion.refreshToken);
  emitir(sesion.usuario);
  return sesion.usuario;
}

function terminar() {
  almacenSesion.limpiar();
  emitir(null);
}

export async function iniciarSesion(credenciales: Credenciales): Promise<Usuario> {
  return aplicar(await authApi.iniciarSesion(credenciales));
}

export async function registrarse(datos: DatosRegistro): Promise<Usuario> {
  return aplicar(await authApi.registrarse(datos));
}

let renovacionEnCurso: Promise<Sesion | null> | null = null;

/**
 * Renueva la sesión con el refresh token. Si varias peticiones vencen a la vez, todas
 * esperan la misma renovación: el backend invalida cada refresh token al usarlo y, si
 * detecta que se reutiliza, cierra todas las sesiones del usuario.
 */
export function renovarSesion(): Promise<Sesion | null> {
  if (renovacionEnCurso) return renovacionEnCurso;

  const refreshToken = almacenSesion.obtenerRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  renovacionEnCurso = authApi
    .renovar(refreshToken)
    .then((sesion) => {
      aplicar(sesion);
      return sesion;
    })
    .catch((error: unknown) => {
      // Solo se descarta la sesión si el servidor la rechazó; sin conexión se conserva.
      if (axios.isAxiosError(error) && error.response) terminar();
      return null;
    })
    .finally(() => {
      renovacionEnCurso = null;
    });

  return renovacionEnCurso;
}

export async function cerrarSesion(): Promise<void> {
  const refreshToken = almacenSesion.obtenerRefreshToken();
  terminar();
  if (!refreshToken) return;
  try {
    await authApi.cerrarSesion(refreshToken);
  } catch {
    // La sesión local ya se cerró; si el servidor no responde, el token vence solo.
  }
}

export function haySesionGuardada(): boolean {
  return almacenSesion.obtenerRefreshToken() !== null;
}
