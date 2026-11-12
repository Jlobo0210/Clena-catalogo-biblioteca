import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buscarLibros } from '../catalogo/api/libros.api';
import type { LibroDto, PaginaLibrosDto } from '../catalogo/types';
import { BusquedaPage } from './BusquedaPage';

vi.mock('../catalogo/api/libros.api', () => ({ buscarLibros: vi.fn() }));
const buscarMock = vi.mocked(buscarLibros);

function libro(n: number, cambios: Partial<LibroDto> = {}): LibroDto {
  return {
    id: `id-${n}`,
    titulo: `Libro ${n}`,
    anioPublicacion: 1967,
    idioma: 'es',
    isbn: null,
    tipoMaterial: 'LIBRO',
    formato: 'FISICO',
    enlaceDigital: null,
    autores: [{ id: 'a-1', nombre: 'Gabriel García Márquez' }],
    temas: [{ id: 't-1', nombre: 'Literatura' }],
    creadoEn: '2026-11-01T00:00:00Z',
    actualizadoEn: '2026-11-01T00:00:00Z',
    ...cambios,
  };
}

function pagina(items: LibroDto[], total = items.length, numero = 1): PaginaLibrosDto {
  return { items, total, pagina: numero, tamano: 10 };
}

function montar(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/buscar" element={<BusquedaPage />} />
        <Route path="/libros/:id" element={<p>Detalle del libro</p>} />
        <Route path="/temas" element={<p>Temas</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BusquedaPage (HU-24)', () => {
  beforeEach(() => {
    buscarMock.mockReset();
  });

  it('muestra los resultados con su cantidad, autores y datos', async () => {
    buscarMock.mockResolvedValue(
      pagina([libro(1, { titulo: 'Cien años de soledad' }), libro(2)], 2),
    );
    montar('/buscar?q=garcia%20marques');

    expect(
      await screen.findByRole('heading', { name: '2 resultados para «garcia marques»' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cien años de soledad' })).toHaveAttribute(
      'href',
      '/libros/id-1',
    );
    expect(screen.getAllByText('Gabriel García Márquez')).toHaveLength(2);
    expect(screen.getAllByText('En sala')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Español')[0]).toBeInTheDocument();
    expect(buscarMock).toHaveBeenCalledWith(
      { q: 'garcia marques', pagina: 1, tamano: 10 },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Se encontraron 2 libros');
  });

  it('anuncia en singular cuando hay un solo resultado', async () => {
    buscarMock.mockResolvedValue(pagina([libro(1)]));
    montar('/buscar?q=soledad');
    await screen.findByRole('heading', { name: '1 resultado para «soledad»' });
    expect(screen.getByRole('status')).toHaveTextContent('Se encontró 1 libro para soledad.');
  });

  it('el campo de búsqueda conserva el texto buscado', async () => {
    buscarMock.mockResolvedValue(pagina([libro(1)]));
    montar('/buscar?q=soledad');
    expect(await screen.findByRole('searchbox', { name: 'Buscar en el catálogo' })).toHaveValue('soledad');
    expect(screen.getByRole('heading', { level: 1, name: 'Buscar libros' })).toBeInTheDocument();
  });

  it('sin resultados explica qué hacer y ofrece explorar por tema', async () => {
    buscarMock.mockResolvedValue(pagina([], 0));
    montar('/buscar?q=astronomia');

    expect(
      await screen.findByRole('heading', { name: 'No encontramos libros para «astronomia»' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use menos palabras/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar el catálogo por tema' })).toBeInTheDocument();
  });

  it('pagina los resultados con enlaces Anterior y Siguiente', async () => {
    buscarMock.mockResolvedValue(pagina([libro(11)], 25, 2));
    montar('/buscar?q=libro&pagina=2');

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('href', '/buscar?q=libro');
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveAttribute(
      'href',
      '/buscar?q=libro&pagina=3',
    );
    expect(buscarMock).toHaveBeenCalledWith(
      { q: 'libro', pagina: 2, tamano: 10 },
      expect.any(AbortSignal),
    );
  });

  it('no muestra paginación si cabe en una página', async () => {
    buscarMock.mockResolvedValue(pagina([libro(1)]));
    montar('/buscar?q=libro');
    await screen.findByRole('heading', { name: '1 resultado para «libro»' });
    expect(screen.queryByRole('navigation', { name: 'Páginas de resultados' })).not.toBeInTheDocument();
  });

  it('si falla la conexión lo dice y permite reintentar', async () => {
    buscarMock.mockRejectedValueOnce(new AxiosError('Network Error'));
    buscarMock.mockResolvedValueOnce(pagina([libro(1)]));
    montar('/buscar?q=libro');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible conectar con el servidor.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('heading', { name: '1 resultado para «libro»' })).toBeInTheDocument();
  });

  it('sin texto invita a buscar y no llama a la API', () => {
    montar('/buscar');
    expect(screen.getByRole('heading', { name: '¿Qué libro busca?' })).toBeInTheDocument();
    expect(buscarMock).not.toHaveBeenCalled();
  });

  it('con una sola letra pide escribir más y no llama a la API', () => {
    montar('/buscar?q=a');
    expect(screen.getByRole('heading', { name: 'Escriba un poco más' })).toBeInTheDocument();
    expect(buscarMock).not.toHaveBeenCalled();
  });

  it('avisa que el filtro por colección aún no está disponible', async () => {
    buscarMock.mockResolvedValue(pagina([libro(1)]));
    montar('/buscar?q=libro&ambito=prensa');
    expect(await screen.findByText(/Pronto podrá buscar solo en «Hemeroteca y prensa»/)).toBeInTheDocument();
  });

  it('al abrir un resultado lleva al detalle', async () => {
    buscarMock.mockResolvedValue(pagina([libro(1)]));
    montar('/buscar?q=libro');
    await userEvent.click(await screen.findByRole('link', { name: 'Libro 1' }));
    expect(await screen.findByText('Detalle del libro')).toBeInTheDocument();
  });
});
