import { apiClient, HEALTH_URL } from '../../../api/apiClient';

export async function consultarSalud(signal: AbortSignal): Promise<void> {
  await apiClient.get(HEALTH_URL, { signal });
}
