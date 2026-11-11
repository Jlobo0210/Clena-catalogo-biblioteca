import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarAutor,
  crearAutor,
  eliminarAutor,
  listarAutores,
  type AutorDto,
} from './api/catalogo-admin.api';
import { AutoresPage } from './AutoresPage';

vi.mock('./api/catalogo-admin.api', () => ({
  listarAutores: vi.fn(),
  crearAutor: vi.fn(),
  actualizarAutor: vi.fn(),
  eliminarAutor: vi.fn(),
}));
const listarMock = vi.mocked(listarAutores);
const crearMock = vi.mocked(crearAutor);
const actualizarMock = vi.mocked(actualizarAutor);
const eliminarMock = vi.mocked(eliminarAutor);

const autor = (n: number, nombre = `Autor ${n}`): AutorDto => ({
  id: `a-${n}`,
  nombre,
  creadoEn: '2026-11-01T00:00:00Z',
  actualizadoEn: '2026-11-01T00:00:00Z',
});

const pagina = (items: AutorDto[], total = items.length, numero = 1) => ({
  items,
  total,
  pagina: numero,
  tamano: 20,
});

function error(status: number, message: string) {
  return new AxiosError(String(status), 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

function UbicacionActual() {
  const { search } = useLocation();
  return <p data-testid="url">{search}</p>;
}

function montar(url = '/panel/autores') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/panel/autores"
          element={
            <>
              <AutoresPage />
              <UbicacionActual />
            </>
          }
        />
        <Route path="/panel" element={<p>Panel</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AutoresPage (HU-25)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lista los autores con su total y pide la primera página ordenada por nombre', async () => {
    listarMock.mockResolvedValue(pagina([autor(1, 'Gabriel García Márquez'), autor(2)], 2));
    montar();

    expect(await screen.findByRole('rowheader', { name: 'Gabriel García Márquez' })).toBeInTheDocument();
    expect(screen.getByText('2 autores')).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledWith(
      { pagina: 1, tamano: 20, nombre: undefined, ordenarPor: 'nombre', direccion: 'asc' },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('link', { name: 'Volver al panel' })).toHaveAttribute('href', '/panel');
  });

  it('filtra por nombre y ordena, guardando ambos en la URL', async () => {
    listarMock.mockResolvedValue(pagina([autor(1)]));
    montar();
    await screen.findByText('1 autores');

    await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'garcía');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByTestId('url')).toHaveTextContent('?q=garc%C3%ADa');
    expect(listarMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ nombre: 'garcía', pagina: 1 }),
      expect.any(AbortSignal),
    );

    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'Más recientes');
    expect(listarMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ ordenarPor: 'creadoEn', direccion: 'desc' }),
      expect.any(AbortSignal),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByTestId('url')).toHaveTextContent('?orden=creadoEn-desc');
  });

  it('pagina el listado', async () => {
    listarMock.mockResolvedValue(pagina([autor(21)], 45, 2));
    montar('/panel/autores?pagina=2');

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveAttribute('href', '/panel/autores?pagina=3');
    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('href', '/panel/autores');
  });

  it('valida el nombre antes de crear y no llama a la API', async () => {
    listarMock.mockResolvedValue(pagina([]));
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo autor' }));

    expect(screen.getByRole('heading', { name: 'Nuevo autor' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el nombre del autor.');
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('crea un autor, avisa y recarga el listado', async () => {
    listarMock.mockResolvedValueOnce(pagina([]));
    listarMock.mockResolvedValueOnce(pagina([autor(1, 'Ana Pérez')]));
    crearMock.mockResolvedValue(autor(1, 'Ana Pérez'));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo autor' }));
    await userEvent.type(screen.getByLabelText('Nombre'), '  Ana   Pérez ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(crearMock).toHaveBeenCalledWith({ nombre: 'Ana Pérez' });
    expect(await screen.findByText('Autor «Ana Pérez» creado.')).toBeInTheDocument();
    expect(await screen.findByRole('rowheader', { name: 'Ana Pérez' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nuevo autor' })).not.toBeInTheDocument();
  });

  it('muestra el error del servidor sin cerrar el formulario', async () => {
    listarMock.mockResolvedValue(pagina([]));
    crearMock.mockRejectedValue(error(409, 'Ya existe un autor llamado «Ana Pérez»'));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo autor' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un autor llamado «Ana Pérez»');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez');
  });

  it('edita un autor con el nombre actual ya escrito', async () => {
    listarMock.mockResolvedValue(pagina([autor(1, 'Ana Perez')]));
    actualizarMock.mockResolvedValue(autor(1, 'Ana Pérez'));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Ana Perez' }));
    const campo = screen.getByLabelText('Nombre');
    expect(campo).toHaveValue('Ana Perez');
    await userEvent.clear(campo);
    await userEvent.type(campo, 'Ana Pérez');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(actualizarMock).toHaveBeenCalledWith('a-1', { nombre: 'Ana Pérez' });
    expect(await screen.findByText('Autor «Ana Pérez» actualizado.')).toBeInTheDocument();
  });

  it('pide confirmación para eliminar y se puede cancelar', async () => {
    listarMock.mockResolvedValue(pagina([autor(1, 'Ana Pérez')]));
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Pérez' }));
    expect(screen.getByText(/¿Eliminar autor «Ana Pérez»\?/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(eliminarMock).not.toHaveBeenCalled();
    expect(screen.getByRole('rowheader', { name: 'Ana Pérez' })).toBeInTheDocument();
  });

  it('elimina tras confirmar', async () => {
    listarMock.mockResolvedValueOnce(pagina([autor(1, 'Ana Pérez')]));
    listarMock.mockResolvedValueOnce(pagina([]));
    eliminarMock.mockResolvedValue();
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Pérez' }));
    await userEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    expect(eliminarMock).toHaveBeenCalledWith('a-1');
    expect(await screen.findByText('Autor «Ana Pérez» eliminado.')).toBeInTheDocument();
    expect(await screen.findByText('Todavía no hay autores.')).toBeInTheDocument();
  });

  it('explica por qué no se puede eliminar un autor con libros', async () => {
    listarMock.mockResolvedValue(pagina([autor(1, 'Ana Pérez')]));
    eliminarMock.mockRejectedValue(
      error(409, 'No se puede eliminar «Ana Pérez»: tiene 3 libro(s) asociado(s). Desvincúlalos primero.'),
    );
    montar();

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Pérez' }));
    await userEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('tiene 3 libro(s) asociado(s)');
    expect(within(screen.getByRole('table')).getByRole('rowheader', { name: 'Ana Pérez' })).toBeInTheDocument();
  });

  it('si falla la carga permite reintentar', async () => {
    listarMock.mockRejectedValueOnce(new AxiosError('Network Error'));
    listarMock.mockResolvedValueOnce(pagina([autor(1)]));
    montar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible conectar con el servidor.');
    await userEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('rowheader', { name: 'Autor 1' })).toBeInTheDocument();
  });
});
