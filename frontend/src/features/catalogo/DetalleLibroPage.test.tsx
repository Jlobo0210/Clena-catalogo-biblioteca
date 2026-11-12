import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarEjemplares, obtenerLibro } from './api/libros.api';
import type { EjemplarDto, LibroDto, ListaEjemplaresDto } from './types';
import { DetalleLibroPage } from './DetalleLibroPage';

vi.mock('./api/libros.api', () => ({ obtenerLibro: vi.fn(), listarEjemplares: vi.fn() }));
const obtenerMock = vi.mocked(obtenerLibro);
const ejemplaresMock = vi.mocked(listarEjemplares);

const LIBRO: LibroDto = {
  id: 'l-1',
  titulo: 'Cien años de soledad',
  anioPublicacion: 1967,
  idioma: 'es',
  isbn: '9780306406157',
  tipoMaterial: 'LIBRO',
  formato: 'FISICO',
  enlaceDigital: null,
  autores: [{ id: 'a-1', nombre: 'Gabriel García Márquez' }],
  temas: [{ id: 't-1', nombre: 'Literatura' }],
  creadoEn: '2026-11-01T00:00:00Z',
  actualizadoEn: '2026-11-01T00:00:00Z',
};

function ejemplar(n: number, estado: EjemplarDto['estado']): EjemplarDto {
  return {
    id: `e-${n}`,
    libroId: 'l-1',
    codigoInventario: `INV-${n}`,
    estado,
    observaciones: null,
    ubicacion: { id: 'u-1', sala: 'Sala 1', seccion: 'Humanidades', estante: 'E-01', codigo: 'S1' },
  };
}

function lista(items: EjemplarDto[], proximaDevolucion: string | null = null): ListaEjemplaresDto {
  const disponibles = items.filter((e) => e.estado === 'DISPONIBLE').length;
  return {
    items,
    disponibilidad: {
      libroId: 'l-1',
      totalEjemplares: items.length,
      disponibles,
      disponible: disponibles > 0,
      proximaDevolucion,
    },
  };
}

function montar(estado?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/libros/l-1', state: estado }]}>
      <Routes>
        <Route path="/libros/:id" element={<DetalleLibroPage />} />
        <Route path="/buscar" element={<p>Búsqueda</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const cargado = () =>
  screen.findByRole('heading', { level: 1, name: 'Cien años de soledad' });

const error404 = () =>
  new AxiosError('404', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: { message: 'Libro no encontrado' },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('DetalleLibroPage (HU-24)', () => {
  beforeEach(() => {
    obtenerMock.mockReset();
    ejemplaresMock.mockReset();
  });

  it('muestra la ficha técnica y los temas', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([ejemplar(1, 'DISPONIBLE')]));
    montar();

    await cargado();
    expect(screen.getByText('Año de publicación').nextSibling).toHaveTextContent('1967');
    expect(screen.getByText('Idioma').nextSibling).toHaveTextContent('Español');
    expect(screen.getByText('ISBN').nextSibling).toHaveTextContent('9780306406157');
    expect(screen.getByText('Formato').nextSibling).toHaveTextContent('En sala');
    expect(screen.getByRole('heading', { name: /Materias y descriptores/ }).nextSibling).toHaveTextContent(
      'Literatura',
    );
    expect(obtenerMock).toHaveBeenCalledWith('l-1', expect.any(AbortSignal));
    expect(ejemplaresMock).toHaveBeenCalledWith('l-1', expect.any(AbortSignal));
  });

  it('dice dónde está cada ejemplar y cuántos hay disponibles', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(
      lista([ejemplar(1, 'DISPONIBLE'), ejemplar(2, 'PRESTADO'), ejemplar(3, 'EN_REPARACION')]),
    );
    montar();

    expect(await screen.findByText('1 de 3 ejemplares disponibles')).toBeInTheDocument();
    expect(screen.getAllByText('Sala 1 · Sección Humanidades · Estante E-01')).toHaveLength(3);
    expect(screen.getByText('Prestado')).toBeInTheDocument();
    expect(screen.getByText('En reparación')).toBeInTheDocument();
    expect(screen.getByText('Código INV-2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver ubicación en estantería/ })).toHaveAttribute(
      'href',
      '#ubicacion-titulo',
    );
  });

  it('avisa cuando ningún ejemplar está disponible sin fecha estimada', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([ejemplar(1, 'PRESTADO')], null));
    montar();

    expect(await screen.findByText('Sin ejemplares disponibles ahora')).toBeInTheDocument();
    expect(screen.getByText(/Ningún ejemplar está disponible en este momento/)).toBeInTheDocument();
    expect(screen.getByText(/Pregunte al personal/)).toBeInTheDocument();
    expect(screen.queryByText(/Fecha estimada de devolución/)).not.toBeInTheDocument();
  });

  it('muestra la fecha estimada de devolución más próxima cuando no hay ejemplares disponibles', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([ejemplar(1, 'PRESTADO')], '2026-11-20T00:00:00.000Z'));
    montar();

    expect(await screen.findByText('Sin ejemplares disponibles ahora')).toBeInTheDocument();
    expect(screen.getByText(/Ningún ejemplar está disponible en este momento/)).toBeInTheDocument();
    expect(screen.getByText(/Fecha estimada de devolución más próxima/)).toBeInTheDocument();
    // Fecha formateada en español: 20 de noviembre de 2026
    expect(screen.getByText(/20 de noviembre de 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Pregunte al personal/)).not.toBeInTheDocument();
  });

  it('copia la ubicación de los ejemplares disponibles', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([ejemplar(1, 'DISPONIBLE'), ejemplar(2, 'DISPONIBLE')]));
    const user = userEvent.setup();
    const escribir = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    montar();

    await cargado();
    await user.click(screen.getByRole('button', { name: 'Copiar ubicación' }));
    expect(escribir).toHaveBeenCalledWith(
      'Cien años de soledad: Sala 1 · Sección Humanidades · Estante E-01',
    );
    expect(await screen.findByText('Ubicación copiada.')).toBeInTheDocument();
  });

  it('permite imprimir la ficha', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([]));
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    montar();

    await cargado();
    await userEvent.click(screen.getByRole('button', { name: 'Imprimir ficha' }));
    expect(imprimir).toHaveBeenCalled();
  });

  it('ofrece la versión digital en otra pestaña y no muestra ejemplares', async () => {
    obtenerMock.mockResolvedValue({
      ...LIBRO,
      formato: 'DIGITAL',
      enlaceDigital: 'https://biblioteca.example/cien',
    });
    ejemplaresMock.mockResolvedValue(lista([]));
    montar();

    const enlace = await screen.findByRole('link', { name: /Leer la versión digital/ });
    expect(enlace).toHaveAttribute('href', 'https://biblioteca.example/cien');
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAccessibleName(/se abre en otra pestaña/);
    expect(screen.getByText('Esta obra solo está disponible en versión digital.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver ubicación/ })).not.toBeInTheDocument();
  });

  it('vuelve a los resultados de los que vino', async () => {
    obtenerMock.mockResolvedValue(LIBRO);
    ejemplaresMock.mockResolvedValue(lista([]));
    montar({ desde: '/buscar?q=soledad' });

    await cargado();
    const volver = screen.getByRole('link', { name: /Volver a los resultados/ });
    expect(volver).toHaveAttribute('href', '/buscar?q=soledad');
    await userEvent.click(volver);
    expect(await screen.findByText('Búsqueda')).toBeInTheDocument();
  });

  it('si la obra no existe lo dice con claridad', async () => {
    obtenerMock.mockRejectedValue(error404());
    ejemplaresMock.mockRejectedValue(error404());
    montar();

    expect(await screen.findByRole('heading', { name: 'No encontramos esta obra' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a la búsqueda' })).toHaveAttribute('href', '/buscar');
  });

  it('si falla la conexión permite reintentar', async () => {
    obtenerMock.mockRejectedValueOnce(new AxiosError('Network Error'));
    ejemplaresMock.mockResolvedValue(lista([]));
    obtenerMock.mockResolvedValueOnce(LIBRO);
    montar();

    expect(await screen.findByRole('heading', { name: 'No pudimos cargar esta obra' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await cargado()).toBeInTheDocument();
  });
});
