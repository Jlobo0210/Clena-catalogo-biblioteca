import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import * as api from './api/prestamos.api';
import { PrestamosPersonalPage } from './PrestamosPersonalPage';
import type { Prestamo } from './types';

const prestamo = (cambios: Partial<Prestamo> = {}): Prestamo => ({
  id: 'p-1',
  estado: 'ACTIVO',
  fechaPrestamo: '2026-11-10T15:00:00.000Z',
  fechaLimite: '2026-11-25',
  fechaDevolucion: null,
  diasRestantes: 15,
  ejemplar: { id: 'e-1', codigoInventario: 'INV-0000-1' },
  libro: { id: 'l-1', titulo: 'Cien años de soledad' },
  usuario: { id: 'u-1', nombre: 'Visitante Demo', email: 'publico@clena.example' },
  registradoPor: { id: 's-1', nombre: 'Personal Demo' },
  ...cambios,
});

const pagina = (items: Prestamo[]) => ({ items, total: items.length, pagina: 1, tamano: 100 });

const error409 = (message: string) =>
  new AxiosError('409', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

function montar() {
  render(
    <MemoryRouter>
      <PrestamosPersonalPage />
    </MemoryRouter>,
  );
}

describe('PrestamosPersonalPage (HU-26)', () => {
  let listar: MockInstance<typeof api.listarPrestamos>;

  beforeEach(() => {
    listar = vi.spyOn(api, 'listarPrestamos').mockResolvedValue(pagina([]));
  });

  it('valida el formulario antes de enviar', async () => {
    const prestar = vi.spyOn(api, 'registrarPrestamo');
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Prestar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el código de inventario del ejemplar.');
    expect(screen.getByLabelText('Correo del usuario')).toHaveAttribute('aria-invalid', 'true');
    expect(prestar).not.toHaveBeenCalled();
  });

  it('presta un ejemplar, confirma con la fecha límite y recarga la lista', async () => {
    const prestar = vi.spyOn(api, 'registrarPrestamo').mockResolvedValue(prestamo());
    montar();
    await screen.findByText('No hay préstamos sin devolver.');
    listar.mockResolvedValue(pagina([prestamo()]));

    await userEvent.type(screen.getByLabelText('Código de inventario'), ' INV-0000-1 ');
    await userEvent.type(screen.getByLabelText('Correo del usuario'), 'publico@clena.example');
    await userEvent.click(screen.getByRole('button', { name: 'Prestar' }));

    expect(prestar).toHaveBeenCalledWith({ codigoInventario: 'INV-0000-1', usuarioEmail: 'publico@clena.example' });
    expect(await screen.findByText(/Préstamo registrado: «Cien años de soledad»/)).toHaveTextContent(
      '25 de noviembre de 2026',
    );
    expect(await screen.findByRole('rowheader', { name: /Cien años de soledad/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Código de inventario')).toHaveValue('');
  });

  it('muestra el motivo si el ejemplar no está disponible', async () => {
    vi.spyOn(api, 'registrarPrestamo').mockRejectedValue(
      error409('El ejemplar INV-0000-1 de «Cien años de soledad» no se puede prestar: ya está prestado.'),
    );
    montar();
    await userEvent.type(screen.getByLabelText('Código de inventario'), 'INV-0000-1');
    await userEvent.type(screen.getByLabelText('Correo del usuario'), 'publico@clena.example');
    await userEvent.click(screen.getByRole('button', { name: 'Prestar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ya está prestado');
  });

  it('registra la devolución desde la lista y la saca de pendientes', async () => {
    listar.mockResolvedValue(pagina([prestamo({ estado: 'VENCIDO', diasRestantes: -2 })]));
    const devolver = vi.spyOn(api, 'registrarDevolucion').mockResolvedValue(prestamo({ estado: 'DEVUELTO' }));
    montar();

    const fila = (await screen.findByRole('rowheader', { name: /Cien años de soledad/ })).closest('tr')!;
    expect(within(fila).getByText('Vencido hace 2 días')).toBeInTheDocument();
    listar.mockResolvedValue(pagina([]));
    await userEvent.click(
      within(fila).getByRole('button', { name: 'Registrar devolución de «Cien años de soledad», INV-0000-1' }),
    );

    expect(devolver).toHaveBeenCalledWith('p-1');
    expect(await screen.findByText(/Devolución registrada/)).toBeInTheDocument();
    expect(await screen.findByText('No hay préstamos sin devolver.')).toBeInTheDocument();
  });

  it('filtra solo los vencidos', async () => {
    montar();
    await screen.findByText('No hay préstamos sin devolver.');
    await userEvent.click(screen.getByLabelText('Solo vencidos'));
    expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'VENCIDO', ordenarPor: 'fechaLimite' }));
    expect(await screen.findByText('No hay préstamos vencidos.')).toBeInTheDocument();
  });
});
