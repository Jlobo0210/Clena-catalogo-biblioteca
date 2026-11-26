import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarTemas } from '../catalogo/api/temas.api';
import type { TemaDto } from '../catalogo/types';
import { ExplorarPage } from './ExplorarPage';

vi.mock('../catalogo/api/temas.api', () => ({ listarTemas: vi.fn() }));
const listarMock = vi.mocked(listarTemas);

function tema(id: string, nombre: string, totalLibros: number, descripcion: string | null = null): TemaDto {
  return {
    id,
    nombre,
    descripcion,
    totalLibros,
    creadoEn: '2026-11-01T00:00:00Z',
    actualizadoEn: '2026-11-01T00:00:00Z',
  };
}

const TEMAS = [
  tema('t-poesia', 'Poesía', 3),
  tema('t-historia', 'Historia de Barranquilla', 12, 'Crónicas y desarrollo portuario.'),
  tema('t-arte', 'Arte', 1),
];

function montar() {
  render(
    <MemoryRouter initialEntries={['/temas']}>
      <Routes>
        <Route path="/temas" element={<ExplorarPage />} />
        <Route path="/temas/:id" element={<p>Página de la categoría</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const nombresDeTarjetas = () =>
  screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('ExplorarPage (HU-35)', () => {
  beforeEach(() => {
    listarMock.mockReset();
  });

  it('lista las categorías reales en orden alfabético, con su cantidad de libros', async () => {
    listarMock.mockResolvedValue({ items: TEMAS, total: 3, pagina: 1, tamano: 100 });
    montar();

    expect(await screen.findByRole('heading', { name: 'Arte' })).toBeInTheDocument();
    expect(nombresDeTarjetas()).toEqual(['Arte', 'Historia de Barranquilla', 'Poesía']);
    expect(screen.getByText('3 categorías')).toBeInTheDocument();
    const historia = screen.getByRole('article', { name: 'Historia de Barranquilla' });
    expect(within(historia).getByText('12 títulos')).toBeInTheDocument();
    expect(within(historia).getByText('Crónicas y desarrollo portuario.')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Arte' })).getByText('1 título')).toBeInTheDocument();
  });

  it('cada categoría lleva a su página de libros', async () => {
    listarMock.mockResolvedValue({ items: TEMAS, total: 3, pagina: 1, tamano: 100 });
    montar();

    const enlace = await screen.findByRole('link', { name: 'Ver libros de Poesía' });
    expect(enlace).toHaveAttribute('href', '/temas/t-poesia');
    await userEvent.click(enlace);
    expect(screen.getByText('Página de la categoría')).toBeInTheDocument();
  });

  it('filtra las categorías sin importar tildes ni mayúsculas, y lo anuncia', async () => {
    listarMock.mockResolvedValue({ items: TEMAS, total: 3, pagina: 1, tamano: 100 });
    montar();

    const campo = await screen.findByRole('searchbox', { name: 'Buscar una categoría por su nombre' });
    await userEvent.type(campo, 'POESIA');
    expect(nombresDeTarjetas()).toEqual(['Poesía']);
    expect(screen.getByText('1 de 3 categorías')).toBeInTheDocument();
    expect(screen.getByText('1 categoría encontrada')).toBeInTheDocument();

    // También busca en la descripción.
    await userEvent.clear(campo);
    await userEvent.type(campo, 'portuario');
    expect(nombresDeTarjetas()).toEqual(['Historia de Barranquilla']);

    await userEvent.clear(campo);
    await userEvent.type(campo, 'astronomía');
    expect(
      screen.getByRole('heading', { name: 'Ninguna categoría coincide con «astronomía»' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'búsqueda general' })).toHaveAttribute('href', '/buscar');

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(nombresDeTarjetas()).toHaveLength(3);
    expect(campo).toHaveFocus();
  });

  it('ordena por cantidad de títulos', async () => {
    listarMock.mockResolvedValue({ items: TEMAS, total: 3, pagina: 1, tamano: 100 });
    montar();

    const masTitulos = await screen.findByRole('button', { name: 'Más títulos' });
    await userEvent.click(masTitulos);
    expect(masTitulos).toHaveAttribute('aria-pressed', 'true');
    expect(nombresDeTarjetas()).toEqual(['Historia de Barranquilla', 'Poesía', 'Arte']);
  });

  it('si falla la conexión lo dice (sin datos de ejemplo) y permite reintentar', async () => {
    listarMock
      .mockRejectedValueOnce(new AxiosError('Network Error'))
      .mockResolvedValueOnce({ items: TEMAS, total: 3, pagina: 1, tamano: 100 });
    montar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las categorías');
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('heading', { name: 'Arte' })).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledTimes(2);
  });

  it('sin categorías lo dice y ofrece la búsqueda general', async () => {
    listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, tamano: 100 });
    montar();

    expect(
      await screen.findByRole('heading', { name: 'Todavía no hay categorías en el catálogo' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
