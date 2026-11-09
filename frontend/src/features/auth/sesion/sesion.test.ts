import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, conectarSesion } from '../../../api/apiClient';
import { usuarioDePrueba } from '../../../test/sesionFalsa';
import { almacenSesion } from './almacenSesion';
import * as sesion from './sesionServicio';

/** Servidor falso: responde según la ruta y guarda las peticiones recibidas. */
type Manejador = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown };
let peticiones: InternalAxiosRequestConfig[];
let manejador: Manejador;
const adaptadorOriginal = apiClient.defaults.adapter;

const adaptador: AxiosAdapter = async (config) => {
  peticiones.push(config);
  const { data, status } = manejador(config);
  const respuesta = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 400) {
    throw new AxiosError(String(status), 'ERR_BAD_REQUEST', config, undefined, respuesta);
  }
  return respuesta;
};

const sesionDelServidor = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  usuario: usuarioDePrueba('PERSONAL'),
});

let desconectar: () => void;

beforeEach(() => {
  peticiones = [];
  apiClient.defaults.adapter = adaptador;
  desconectar = conectarSesion({
    obtenerAccessToken: almacenSesion.obtenerAccessToken,
    renovarAccessToken: async () => (await sesion.renovarSesion())?.accessToken ?? null,
  });
});

afterEach(() => {
  desconectar();
  almacenSesion.limpiar();
  apiClient.defaults.adapter = adaptadorOriginal;
});

const autorizacion = (c: InternalAxiosRequestConfig) => AxiosHeaders.from(c.headers).get('Authorization');

describe('sesión en el navegador', () => {
  it('al iniciar sesión guarda el refresh token en sessionStorage y envía el access token', async () => {
    manejador = (c) =>
      c.url === '/auth/login' ? { status: 200, data: sesionDelServidor(1) } : { status: 200, data: usuarioDePrueba() };
    const oyente = vi.fn();
    const quitar = sesion.suscribirse(oyente);

    await sesion.iniciarSesion({ email: 'ana@example.com', password: 'clave-1234' });
    await apiClient.get('/auth/me');

    expect(sessionStorage.getItem('clena.refreshToken')).toBe('refresh-1');
    expect(autorizacion(peticiones[1])).toBe('Bearer access-1');
    expect(oyente).toHaveBeenCalledWith(expect.objectContaining({ rol: 'PERSONAL' }));
    quitar();
  });

  it('renueva el access token vencido una sola vez y repite la petición', async () => {
    almacenSesion.guardar('access-vencido', 'refresh-1');
    manejador = (c) => {
      if (c.url === '/auth/refresh') return { status: 200, data: sesionDelServidor(2) };
      return autorizacion(c) === 'Bearer access-2' ? { status: 200, data: ['ok'] } : { status: 401 };
    };

    // Dos peticiones vencen a la vez: deben compartir una sola renovación.
    const [a, b] = await Promise.all([apiClient.get('/usuarios'), apiClient.get('/usuarios')]);

    expect(a.data).toEqual(['ok']);
    expect(b.data).toEqual(['ok']);
    expect(peticiones.filter((p) => p.url === '/auth/refresh')).toHaveLength(1);
    expect(sessionStorage.getItem('clena.refreshToken')).toBe('refresh-2');
  });

  it('si el refresh token ya no sirve, cierra la sesión local', async () => {
    almacenSesion.guardar('access-vencido', 'refresh-revocado');
    manejador = () => ({ status: 401 });
    const oyente = vi.fn();
    const quitar = sesion.suscribirse(oyente);

    await expect(apiClient.get('/usuarios')).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem('clena.refreshToken')).toBeNull();
    expect(oyente).toHaveBeenLastCalledWith(null);
    quitar();
  });

  it('no intenta renovar cuando fallan las credenciales del login', async () => {
    manejador = () => ({ status: 401 });
    await expect(sesion.iniciarSesion({ email: 'a@b.co', password: 'x' })).rejects.toBeInstanceOf(AxiosError);
    expect(peticiones.map((p) => p.url)).toEqual(['/auth/login']);
  });

  it('cerrar sesión invalida el refresh token en el servidor y limpia el navegador', async () => {
    almacenSesion.guardar('access-1', 'refresh-1');
    manejador = () => ({ status: 204 });

    await sesion.cerrarSesion();

    expect(peticiones[0].url).toBe('/auth/logout');
    expect(JSON.parse(peticiones[0].data as string)).toEqual({ refreshToken: 'refresh-1' });
    expect(almacenSesion.obtenerAccessToken()).toBeNull();
    expect(sessionStorage.getItem('clena.refreshToken')).toBeNull();
  });
});
