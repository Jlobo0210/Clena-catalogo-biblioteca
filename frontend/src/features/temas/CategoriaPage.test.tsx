import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LibroDto, PaginaLibrosDto, TemaDto } from '../catalogo/types';
import { listarLibrosDeTema, obtenerTema } from './api/categorias.api';
import { CategoriaPage } from './CategoriaPage';

vi.mock('./api/categorias.api', () => ({
  obtenerTema: vi.fn(),
  listarLibrosDeTema: vi.fn(),
}));
const temaMock = vi.mocked(obtenerTema);
const librosMock = vi.mocked(listarLibrosDeTema);

const POESIA: TemaDto = {
  id: 't-poesia',
  nombre: 'Poesía',
  descripcion: 'Poesía colombiana y del Caribe.',
  totalLibros: 12,
  creadoEn: '2026-11-01T00:00:00Z',
  actualizadoEn: '2026-11-01T00:00:00Z',
};

function libro(n: number, cambios: Partial<LibroDto> = {}): LibroDto {
  return {
    id: `l-${n}`,
    titulo: `Libro ${n}`,
    anioPublicacion: 1990 + n,
    idioma: 'es',
    isbn: null,
    tipoMaterial: 'LIBRO',
    formato: 'FISICO',
    enlaceDigital: null,
    autores: [{ id: 'a-1', nombre: 'Meira Delmar' }],
    temas: [{ id: 't-poesia', nombre: 'Poesía' }],
    creadoEn: '2026-11-01T00:00:00Z',
    actualizadoEn: '2026-11-01T00:00:00Z',
    ...cambios,
  };
}

function pagina(items: LibroDto[], total = items.length, numero = 1): PaginaLibrosDto {
  return { items, total, pagina: numero, tamano: 10 };
}

function error(status: number) {
  return new AxiosError('error', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });
}

/** Muestra la URL actual para comprobar que los filtros quedan en ella. */
function UrlActual() {
  const { pathname, search } = useLocation();
  return <p data-testid="url">{`${pathname}${search}`}</p>;
}

function montar(url = '/temas/t-poesia') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/temas/:id"
          element={
            <>
              <CategoriaPage />
              <UrlActual />
            </>
          }
        />
        <Route path="/libros/:id" element={<p>Detalle del libro</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const ultimaLlamada = () => librosMock.mock.calls.at(-1)!;

describe('CategoriaPage (HU-35)', () => {
  beforeEach(() => {
    temaMock.mockReset().mockResolvedValue(POESIA);
    librosMock.mockReset();
  });

  it('muestra la categoría y sus libros, ordenados por título', async () => {
    librosMock.mockResolvedValue(pagina([libro(1), libro(2)], 2));
    montar();

    expect(await screen.findByRole('heading', { level: 1, name: 'Poesía' })).toBeInTheDocument();
    expect(screen.getByText('Poesía colombiana y del Caribe.')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: '2 libros en «Poesía»' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ordenados por título, de la A a la Z.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Libro 1' })).toHaveAttribute('href', '/libros/l-1');
    expect(screen.getByRole('link', { name: 'Todas las categorías' })).toHaveAttribute('href', '/temas');
    expect(screen.getByText('2 libros en Poesía. Página 1.')).toBeInTheDocument();

    expect(temaMock).toHaveBeenCalledWith('t-poesia', expect.any(AbortSignal));
    expect(ultimaLlamada()).toEqual([
      't-poesia',
      { soloDisponibles: false, ordenarPor: 'titulo' },
      { pagina: 1, tamano: 10 },
      expect.any(AbortSignal),
    ]);
  });

  it('ofrece los mismos filtros de la búsqueda, sin el orden por relevancia', async () => {
    librosMock.mockResolvedValue(pagina([libro(1)]));
    montar();
    await screen.findByRole('heading', { name: '1 libro en «Poesía»' });

    expect(screen.getByLabelText('Tipo de material')).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
    expect(screen.getByLabelText('Desde el año')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta el año')).toBeInTheDocument();
    expect(screen.getByLabelText('Solo con ejemplares disponibles')).toBeInTheDocument();
    const orden = screen.getByLabelText('Ordenar por');
    expect([...orden.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'Título (A–Z)',
      'Año (más reciente)',
    ]);
  });

  it('al filtrar, consulta con los filtros, vuelve a la página 1 y los guarda en la URL', async () => {
    librosMock.mockResolvedValue(pagina([libro(1)], 25));
    montar('/temas/t-poesia?pagina=2');
    await screen.findByRole('heading', { name: '25 libros en «Poesía»' });
    expect(ultimaLlamada()[2]).toEqual({ pagina: 2, tamano: 10 });

    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en');
    await userEvent.click(screen.getByLabelText('Solo con ejemplares disponibles'));
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'anio');

    await screen.findByText('Ordenados del más reciente al más antiguo.');
    expect(ultimaLlamada()).toEqual([
      't-poesia',
      { idioma: 'en', soloDisponibles: true, ordenarPor: 'anio' },
      { pagina: 1, tamano: 10 },
      expect.any(AbortSignal),
    ]);
    expect(screen.getByTestId('url')).toHaveTextContent(
      '/temas/t-poesia?idioma=en&soloDisponibles=true&ordenarPor=anio',
    );
    expect(
      screen.getByRole('heading', { name: '25 libros en «Poesía» con los filtros activos' }),
    ).toBeInTheDocument();
  });

  it('lee los filtros de la URL y la paginación los conserva', async () => {
    librosMock.mockResolvedValue(pagina([libro(1)], 25, 2));
    montar('/temas/t-poesia?tipoMaterial=TESIS&anioDesde=1990&anioHasta=2000&pagina=2');
    await screen.findByRole('heading', { name: '25 libros en «Poesía» con los filtros activos' });

    expect(ultimaLlamada()[1]).toEqual({
      tipoMaterial: 'TESIS',
      anioDesde: 1990,
      anioHasta: 2000,
      soloDisponibles: false,
      ordenarPor: 'titulo',
    });
    expect(screen.getByLabelText('Tipo de material')).toHaveValue('TESIS');
    expect(screen.getByLabelText('Desde el año')).toHaveValue(1990);
    expect(screen.getByRole('link', { name: /Siguiente/ })).toHaveAttribute(
      'href',
      '/temas/t-poesia?tipoMaterial=TESIS&anioDesde=1990&anioHasta=2000&pagina=3',
    );
    expect(screen.getByRole('link', { name: /Anterior/ })).toHaveAttribute(
      'href',
      '/temas/t-poesia?tipoMaterial=TESIS&anioDesde=1990&anioHasta=2000',
    );
  });

  it('sin resultados con filtros, permite quitarlos', async () => {
    librosMock.mockResolvedValue(pagina([], 0));
    montar('/temas/t-poesia?soloDisponibles=true&ordenarPor=anio');

    expect(
      await screen.findByRole('heading', {
        name: 'Ningún libro de esta categoría coincide con los filtros',
      }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    // Conserva el orden elegido, que no es un filtro.
    expect(screen.getByTestId('url')).toHaveTextContent('/temas/t-poesia?ordenarPor=anio');
    expect(screen.queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument();
  });

  it('una categoría sin libros lo dice y ofrece otras', async () => {
    librosMock.mockResolvedValue(pagina([], 0));
    montar();

    expect(
      await screen.findByRole('heading', { name: 'Esta categoría todavía no tiene libros' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'otras categorías' })).toHaveAttribute('href', '/temas');
  });

  it('si la categoría no existe, lo dice y lleva a todas las categorías', async () => {
    temaMock.mockRejectedValue(error(404));
    librosMock.mockResolvedValue(pagina([], 0));
    montar('/temas/no-existe');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos esta categoría' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todas las categorías' })).toHaveAttribute(
      'href',
      '/temas',
    );
  });

  it('si fallan los libros, lo dice y permite reintentar', async () => {
    librosMock
      .mockRejectedValueOnce(new AxiosError('Network Error'))
      .mockResolvedValueOnce(pagina([libro(1)]));
    montar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los libros de esta categoría',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('link', { name: 'Libro 1' })).toBeInTheDocument();
  });

  it('cada libro abre su detalle', async () => {
    librosMock.mockResolvedValue(pagina([libro(1)]));
    montar('/temas/t-poesia?soloDisponibles=true');
    await userEvent.click(await screen.findByRole('link', { name: 'Libro 1' }));
    expect(screen.getByText('Detalle del libro')).toBeInTheDocument();
  });
});
