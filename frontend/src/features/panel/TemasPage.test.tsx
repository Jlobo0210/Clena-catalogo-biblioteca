import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemaDto } from '../catalogo/types';
import { actualizarTema, crearTema, listarTemasPaginados } from './api/catalogo-admin.api';
import { TemasPage } from './TemasPage';

vi.mock('./api/catalogo-admin.api', () => ({
  listarTemasPaginados: vi.fn(),
  crearTema: vi.fn(),
  actualizarTema: vi.fn(),
  eliminarTema: vi.fn(),
}));
const listarMock = vi.mocked(listarTemasPaginados);
const crearMock = vi.mocked(crearTema);
const actualizarMock = vi.mocked(actualizarTema);

const tema = (cambios: Partial<TemaDto> = {}): TemaDto => ({
  id: 't-1',
  nombre: 'Historia',
  descripcion: 'Historia de la región Caribe',
  totalLibros: 7,
  creadoEn: '2026-11-01T00:00:00Z',
  actualizadoEn: '2026-11-01T00:00:00Z',
  ...cambios,
});

function montar() {
  render(
    <MemoryRouter initialEntries={['/panel/temas']}>
      <TemasPage />
    </MemoryRouter>,
  );
}

describe('TemasPage (HU-25)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('muestra la descripción y cuántos libros tiene cada tema', async () => {
    listarMock.mockResolvedValue({ items: [tema()], total: 1, pagina: 1, tamano: 20 });
    montar();

    expect(await screen.findByRole('rowheader', { name: 'Historia' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Libros' })).toBeInTheDocument();
    expect(screen.getByText('Historia de la región Caribe')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '7' })).toBeInTheDocument();
  });

  it('crea un tema con descripción opcional', async () => {
    listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, tamano: 20 });
    crearMock.mockResolvedValue(tema({ nombre: 'Redes', descripcion: null }));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo tema' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Redes');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(crearMock).toHaveBeenCalledWith({ nombre: 'Redes', descripcion: null });
    expect(await screen.findByText('Tema «Redes» creado.')).toBeInTheDocument();
  });

  it('valida el largo de la descripción', async () => {
    listarMock.mockResolvedValue({ items: [tema()], total: 1, pagina: 1, tamano: 20 });
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Historia' }));
    const descripcion = screen.getByLabelText('Descripción (opcional)');
    expect(descripcion).toHaveValue('Historia de la región Caribe');
    // maxLength impide escribir de más; se simula un valor pegado desde otro programa.
    descripcion.removeAttribute('maxLength');
    await userEvent.clear(descripcion);
    await userEvent.click(descripcion);
    await userEvent.paste('x'.repeat(501));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('La descripción no puede superar 500 caracteres.');
    expect(actualizarMock).not.toHaveBeenCalled();
  });

  it('al editar se puede borrar la descripción', async () => {
    listarMock.mockResolvedValue({ items: [tema()], total: 1, pagina: 1, tamano: 20 });
    actualizarMock.mockResolvedValue(tema({ descripcion: null }));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Historia' }));
    await userEvent.clear(screen.getByLabelText('Descripción (opcional)'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(actualizarMock).toHaveBeenCalledWith('t-1', { nombre: 'Historia', descripcion: null });
  });
});
