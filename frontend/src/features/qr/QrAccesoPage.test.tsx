import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QrAccesoPage } from './QrAccesoPage';
import { urlAccesoQr } from './urlAccesoQr';

vi.mock('qrcode', () => ({
  default: { toDataURL: () => Promise.resolve('data:image/png;base64,QR') },
}));

describe('QrAccesoPage (HU-31)', () => {
  it('el QR abre la búsqueda pública', () => {
    expect(urlAccesoQr('https://catalogo.clena.org')).toBe(
      'https://catalogo.clena.org/buscar?desde=qr',
    );
  });

  it('muestra el QR con texto alternativo y permite descargarlo e imprimirlo', async () => {
    render(<QrAccesoPage />);

    expect(screen.getByRole('heading', { name: 'Código QR de acceso' })).toBeInTheDocument();
    const imagen = await screen.findByRole('img', { name: /Código QR que abre la búsqueda/ });
    expect(imagen).toHaveAttribute('src', 'data:image/png;base64,QR');

    const descarga = screen.getByRole('link', { name: 'Descargar imagen (PNG)' });
    expect(descarga).toHaveAttribute('download', 'qr-consulta-facil.png');
    expect(screen.getByRole('button', { name: 'Imprimir cartel' })).toBeInTheDocument();
  });
});
