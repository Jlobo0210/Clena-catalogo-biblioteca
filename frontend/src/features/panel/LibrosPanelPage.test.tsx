import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LibroDto } from '../catalogo/types';
import { eliminarLibro, listarLibrosPanel } from './api/catalogo-admin.api';
import { LibrosPanelPage } from './LibrosPanelPage';

vi.mock('./api/catalogo-admin.api', () => ({ listarLibrosPanel: vi.fn(), eliminarLibro: vi.fn() }));
const listarMock = vi.mocked(listarLibrosPanel);
const eliminarMock = vi.mocked(eliminarLibro);

const libro = (n: number, cambios: Partial<LibroDto> = {}): LibroDto => ({
  id: `l-${n}`,
  titulo: `Libro ${n}`,
  anioPublicacion: 2001,
  idioma: 'es',
  isbn: null,
  tipoMaterial: 'LIBRO',
  formato: 'FISICO',
  enlaceDigital: null,
  autores: [{ id: 'a-1', nombre: 'Ana Pérez' }],
  temas: [],
  creadoEn: '2026-11-01T00:00:00Z',
  actualizadoEn: '2026-11-01T00:00:00Z',
  ...cambios,
});

const pagina = (items: LibroDto[], total = items.length) => ({ items, total, pagina: 1, tamano: 20 });

function montar(url = '/panel/libros', estado?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: url.split('?')[0], search: url.includes('?') ? `?${url.split('?')[1]}` : '', state: estado }]}>
      <Routes>
        <Route path="/panel/libros" element={<LibrosPanelPage />} />
        <Route path="/panel/libros/nuevo" element={<p>Formulario nuevo</p>} />
        <Route path="/panel/libros/:id" element={<p>Formulario de edición</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LibrosPanelPage (HU-25)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lista los libros con autores, año y formato', async () => {
    listarMock.mockResolvedValue(pagina([libro(1, { titulo: 'Cien años de soledad', formato: 'FISICO_Y_DIGITAL' })]));
    montar();

    const fila = (await screen.findByRole('rowheader', { name: 'Cien años de soledad' })).closest('tr')!;
    expect(fila).toHaveTextContent('Ana Pérez');
    expect(fila).toHaveTextContent('2001');
    expect(fila).toHaveTextContent('En sala y digital');
    expect(screen.getByText('1 libro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar Cien años de soledad' })).toHaveAttribute('href', '/panel/libros/l-1');
    expect(screen.getByRole('link', { name: /Nuevo libro/ })).toHaveAttribute('href', '/panel/libros/nuevo');
  });

  it('combina búsqueda, formato, tipo y orden', async () => {
    listarMock.mockResolvedValue(pagina([libro(1)]));
    montar();
    await screen.findByText('1 libro');

    await userEvent.type(screen.getByLabelText('Buscar por título'), 'soledad');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.selectOptions(screen.getByLabelText('Formato'), 'Digital');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de material'), 'Revista');
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'Año (más nuevos)');

    expect(listarMock).toHaveBeenLastCalledWith(
      {
        pagina: 1,
        tamano: 20,
        texto: 'soledad',
        formato: 'DIGITAL',
        tipoMaterial: 'REVISTA',
        ordenarPor: 'anio',
        direccion: 'desc',
      },
      expect.any(AbortSignal),
    );
    expect(await screen.findByText('1 libro con esos filtros')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(listarMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ texto: undefined, formato: undefined, tipoMaterial: undefined }),
      expect.any(AbortSignal),
    );
  });

  it('muestra el aviso que llega al volver del formulario', async () => {
    listarMock.mockResolvedValue(pagina([]));
    montar('/panel/libros', { aviso: 'Libro «X» registrado.' });
    expect(await screen.findByText('Libro «X» registrado.')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay libros.')).toBeInTheDocument();
  });

  it('no deja eliminar un libro con ejemplares y lo explica', async () => {
    listarMock.mockResolvedValue(pagina([libro(1)]));
    eliminarMock.mockRejectedValue(
      new AxiosError('409', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: '',
        data: { message: 'No se puede eliminar «Libro 1»: tiene 2 ejemplar(es). Dalos de baja primero.' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    );
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Libro 1' }));
    await userEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('tiene 2 ejemplar(es)');
  });

  it('elimina un libro sin ejemplares tras confirmar', async () => {
    listarMock.mockResolvedValueOnce(pagina([libro(1)]));
    listarMock.mockResolvedValueOnce(pagina([]));
    eliminarMock.mockResolvedValue();
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Libro 1' }));
    await userEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    expect(eliminarMock).toHaveBeenCalledWith('l-1');
    expect(await screen.findByText('Libro «Libro 1» eliminado.')).toBeInTheDocument();
  });
});
