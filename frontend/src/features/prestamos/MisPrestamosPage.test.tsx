import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from './api/prestamos.api';
import { MisPrestamosPage } from './MisPrestamosPage';
import type { Prestamo } from './types';

let n = 0;
function prestamo(titulo: string, cambios: Partial<Prestamo> = {}): Prestamo {
  n += 1;
  return {
    id: `p-${n}`,
    estado: 'ACTIVO',
    fechaPrestamo: '2026-11-01T15:00:00.000Z',
    fechaLimite: '2026-11-16',
    fechaDevolucion: null,
    diasRestantes: 6,
    ejemplar: { id: `e-${n}`, codigoInventario: `INV-000${n}-1` },
    libro: { id: `l-${n}`, titulo },
    usuario: { id: 'u-1', nombre: 'Ana', email: 'ana@example.com' },
    registradoPor: { id: 's-1', nombre: 'Personal' },
    ...cambios,
  };
}

const pagina = (items: Prestamo[]) => ({ items, total: items.length, pagina: 1, tamano: 100 });

function montar() {
  render(
    <MemoryRouter>
      <MisPrestamosPage />
    </MemoryRouter>,
  );
}

describe('MisPrestamosPage', () => {
  beforeEach(() => {
    n = 0;
  });

  it('pide solo los préstamos propios: pendientes por fecha límite e historial', async () => {
    const espia = vi.spyOn(api, 'obtenerMisPrestamos').mockResolvedValue(pagina([]));
    montar();
    await screen.findByText(/No tienes libros prestados/);
    expect(espia).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'SIN_DEVOLVER', ordenarPor: 'fechaLimite', direccion: 'asc' }),
    );
    expect(espia).toHaveBeenCalledWith(expect.objectContaining({ estado: 'DEVUELTO' }));
    expect(screen.getByText('Aún no has devuelto ningún préstamo.')).toBeInTheDocument();
  });

  it('resalta los vencidos y los próximos a vencer con texto, no solo con color', async () => {
    vi.spyOn(api, 'obtenerMisPrestamos').mockImplementation(async (f = {}) =>
      f.estado === 'SIN_DEVOLVER'
        ? pagina([
            prestamo('Cien años de soledad', { estado: 'VENCIDO', diasRestantes: -2, fechaLimite: '2026-11-08' }),
            prestamo('Historia del Caribe', { diasRestantes: 1, fechaLimite: '2026-11-11' }),
            prestamo('Redes, vol. 2', { diasRestantes: 12 }),
          ])
        : pagina([
            prestamo('Poesía reunida', {
              estado: 'DEVUELTO',
              diasRestantes: null,
              fechaDevolucion: '2026-11-05T15:00:00.000Z',
            }),
          ]),
    );
    montar();

    const aviso = (await screen.findByText(/Tienes 1 préstamo vencido/)).closest('[role="status"]');
    expect(aviso).toHaveTextContent('Tienes 1 préstamo vencido.');
    expect(aviso).toHaveTextContent('1 vence en 3 días o menos.');

    const vencido = screen.getByRole('article', { name: 'Cien años de soledad' });
    expect(within(vencido).getByText('Vencido hace 2 días')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Historia del Caribe' })).getByText('Vence mañana')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por devolver (3)' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Poesía reunida' })).toBeInTheDocument();
  });

  it('muestra un error si no se pueden cargar', async () => {
    vi.spyOn(api, 'obtenerMisPrestamos').mockRejectedValue(new Error('x'));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible completar la solicitud.');
  });
});
