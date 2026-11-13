import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarPrestamos, obtenerResumenPrestamos } from './api/prestamos.api';
import { SeguimientoPrestamosPage } from './SeguimientoPrestamosPage';
import type { Prestamo } from './types';

vi.mock('./api/prestamos.api', () => ({ listarPrestamos: vi.fn(), obtenerResumenPrestamos: vi.fn() }));
const listarMock = vi.mocked(listarPrestamos);
const resumenMock = vi.mocked(obtenerResumenPrestamos);

const prestamo = (cambios: Partial<Prestamo> = {}): Prestamo => ({
  id: 'p-1',
  estado: 'VENCIDO',
  fechaPrestamo: '2026-11-01T15:00:00.000Z',
  fechaLimite: '2026-11-16',
  fechaDevolucion: null,
  diasRestantes: -10,
  diasRetraso: 10,
  ejemplar: { id: 'e-1', codigoInventario: 'INV-0000-1' },
  libro: { id: 'l-1', titulo: 'Cien años de soledad' },
  usuario: { id: 'u-1', nombre: 'Visitante Demo', email: 'publico@clena.example' },
  registradoPor: { id: 's-1', nombre: 'Personal Demo' },
  ...cambios,
});

const pagina = (items: Prestamo[], total = items.length) => ({ items, total, pagina: 1, tamano: 20 });

function montar(url = '/panel/prestamos/seguimiento') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/panel/prestamos/seguimiento" element={<SeguimientoPrestamosPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SeguimientoPrestamosPage (HU-36)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resumenMock.mockResolvedValue({ hoy: '2026-11-26', diasAviso: 3, sinDevolver: 5, vencidos: 2, porVencer: 1 });
  });

  it('muestra el resumen y, por defecto, los vencidos con usuario, libro, ejemplar y días de retraso', async () => {
    listarMock.mockResolvedValue(pagina([prestamo()]));
    montar();

    const fila = (await screen.findByRole('rowheader', { name: /Visitante Demo/ })).closest('tr')!;
    expect(fila).toHaveTextContent('publico@clena.example');
    expect(fila).toHaveTextContent('Cien años de soledad');
    expect(fila).toHaveTextContent('INV-0000-1');
    expect(fila).toHaveTextContent('Vencido hace 10 días');
    expect(within(fila).getByRole('cell', { name: '10 días' })).toBeInTheDocument();

    const correo = within(fila).getByRole('link', { name: 'Escribir a Visitante Demo sobre «Cien años de soledad»' });
    expect(correo.getAttribute('href')).toMatch(/^mailto:publico@clena\.example\?subject=/);

    expect(screen.getByText('Préstamos vencidos: 1.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /2\s*vencidos/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: /1\s*vencen en 3 días o menos/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /5\s*sin devolver en total/ })).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'VENCIDO', ordenarPor: 'fechaLimite', direccion: 'asc', pagina: 1 }),
      expect.any(AbortSignal),
    );
  });

  it('cambia a los próximos a vencer desde el resumen', async () => {
    listarMock.mockResolvedValue(pagina([]));
    montar();
    await screen.findByText('No hay préstamos vencidos.');

    listarMock.mockResolvedValue(
      pagina([prestamo({ id: 'p-2', estado: 'ACTIVO', fechaLimite: '2026-11-28', diasRestantes: 2, diasRetraso: 0 })]),
    );
    await userEvent.click(await screen.findByRole('link', { name: /vencen en 3 días o menos/ }));

    expect(listarMock).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'POR_VENCER' }), expect.any(AbortSignal));
    const fila = (await screen.findByRole('rowheader', { name: /Visitante Demo/ })).closest('tr')!;
    expect(fila).toHaveTextContent('Vence en 2 días');
    expect(within(fila).getByRole('cell', { name: 'Sin retraso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar')).toHaveValue('POR_VENCER');
  });

  it('filtra por rango de fecha límite y valida que «desde» no sea posterior a «hasta»', async () => {
    listarMock.mockResolvedValue(pagina([prestamo()]));
    montar();
    await screen.findByText('Préstamos vencidos: 1.');

    await userEvent.type(screen.getByLabelText('Desde'), '2026-11-30');
    await userEvent.type(screen.getByLabelText('Hasta'), '2026-11-01');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar fechas' }));
    expect(screen.getByRole('alert')).toHaveTextContent('no puede ser posterior');
    expect(screen.getByLabelText('Desde')).toHaveAttribute('aria-invalid', 'true');

    await userEvent.clear(screen.getByLabelText('Desde'));
    await userEvent.type(screen.getByLabelText('Desde'), '2026-10-01');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar fechas' }));
    expect(listarMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ limiteDesde: '2026-10-01', limiteHasta: '2026-11-01' }),
      expect.any(AbortSignal),
    );
    expect(await screen.findByText('Préstamos vencidos: 1 con esas fechas.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Quitar fechas' }));
    expect(listarMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ limiteDesde: undefined, limiteHasta: undefined }),
      expect.any(AbortSignal),
    );
  });

  it('lee los filtros y la página desde la URL y pagina de 20 en 20', async () => {
    listarMock.mockResolvedValue(pagina([prestamo()], 45));
    montar('/panel/prestamos/seguimiento?estado=SIN_DEVOLVER&orden=prestamo-desc&desde=2026-11-01&pagina=2');

    await screen.findByText('Préstamos sin devolver: 45 con esas fechas.');
    expect(listarMock).toHaveBeenCalledWith(
      {
        estado: 'SIN_DEVOLVER',
        limiteDesde: '2026-11-01',
        limiteHasta: undefined,
        ordenarPor: 'fechaPrestamo',
        direccion: 'desc',
        pagina: 2,
        tamano: 20,
      },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('navigation', { name: 'Páginas de resultados' })).toBeInTheDocument();
  });

  it('en los devueltos muestra la fecha de devolución y no ofrece escribir', async () => {
    listarMock.mockResolvedValue(
      pagina([
        prestamo({
          estado: 'DEVUELTO',
          fechaDevolucion: '2026-11-20T15:00:00.000Z',
          diasRestantes: null,
          diasRetraso: null,
        }),
      ]),
    );
    montar('/panel/prestamos/seguimiento?estado=DEVUELTO');

    const fila = (await screen.findByRole('rowheader', { name: /Visitante Demo/ })).closest('tr')!;
    expect(screen.getByRole('columnheader', { name: 'Devuelto el' })).toBeInTheDocument();
    expect(fila).toHaveTextContent('20 de noviembre de 2026');
    expect(within(fila).queryByRole('link', { name: /Escribir/ })).not.toBeInTheDocument();
  });

  it('si falla el listado permite reintentar', async () => {
    listarMock.mockRejectedValueOnce(new Error('caída'));
    listarMock.mockResolvedValueOnce(pagina([prestamo()]));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('Préstamos vencidos: 1.')).toBeInTheDocument();
  });
});
