import { afterEach, describe, expect, it, vi } from 'vitest';

async function timeoutConfigurado(valor: string | undefined) {
  vi.resetModules();
  vi.stubEnv('VITE_API_TIMEOUT_MS', valor);
  const { apiClient } = await import('./apiClient');
  return apiClient.defaults.timeout;
}

describe('VITE_API_TIMEOUT_MS', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa 5000 cuando la variable está ausente', async () => {
    await expect(timeoutConfigurado(undefined)).resolves.toBe(5000);
  });

  it('usa 5000 cuando el valor no es válido', async () => {
    await expect(timeoutConfigurado('no-es-numero')).resolves.toBe(5000);
    await expect(timeoutConfigurado('0')).resolves.toBe(5000);
    await expect(timeoutConfigurado('-1')).resolves.toBe(5000);
  });

  it('usa el valor configurado cuando es un número positivo', async () => {
    await expect(timeoutConfigurado('20000')).resolves.toBe(20000);
  });
});
