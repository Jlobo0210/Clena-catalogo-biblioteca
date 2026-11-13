import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarEjemplares, obtenerLibro } from '../catalogo/api/libros.api';
import type { EjemplarDto, LibroDto, UbicacionDto } from '../catalogo/types';
import {
  actualizarEjemplar,
  actualizarLibro,
  crearAutor,
  crearEjemplar,
  crearLibro,
  crearUbicacion,
  eliminarEjemplar,
  listarAutores,
  listarTemasPaginados,
  listarUbicaciones,
} from './api/catalogo-admin.api';
import { LibroPanelPage } from './LibroPanelPage';

vi.mock('../catalogo/api/libros.api', () => ({ obtenerLibro: vi.fn(), listarEjemplares: vi.fn() }));
vi.mock('./api/catalogo-admin.api', () => ({
  crearLibro: vi.fn(),
  actualizarLibro: vi.fn(),
  listarAutores: vi.fn(),
  crearAutor: vi.fn(),
  listarTemasPaginados: vi.fn(),
  listarUbicaciones: vi.fn(),
  crearUbicacion: vi.fn(),
  crearEjemplar: vi.fn(),
  actualizarEjemplar: vi.fn(),
  eliminarEjemplar: vi.fn(),
}));
const m = {
  obtenerLibro: vi.mocked(obtenerLibro),
  listarEjemplares: vi.mocked(listarEjemplares),
  crearLibro: vi.mocked(crearLibro),
  actualizarLibro: vi.mocked(actualizarLibro),
  listarAutores: vi.mocked(listarAutores),
  crearAutor: vi.mocked(crearAutor),
  listarTemas: vi.mocked(listarTemasPaginados),
  listarUbicaciones: vi.mocked(listarUbicaciones),
  crearUbicacion: vi.mocked(crearUbicacion),
  crearEjemplar: vi.mocked(crearEjemplar),
  actualizarEjemplar: vi.mocked(actualizarEjemplar),
  eliminarEjemplar: vi.mocked(eliminarEjemplar),
};

const LIBRO: LibroDto = {
  id: 'l-1',
  titulo: 'Cien años de soledad',
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
};
const UBICACION: UbicacionDto = { id: 'u-1', sala: 'Sala 1', seccion: 'Humanidades', estante: 'E-01', codigo: 'S1' };
const ejemplar = (cambios: Partial<EjemplarDto> = {}): EjemplarDto => ({
  id: 'e-1',
  libroId: 'l-1',
  codigoInventario: 'INV-1',
  estado: 'DISPONIBLE',
  observaciones: null,
  ubicacion: UBICACION,
  ...cambios,
});
const lista = (items: EjemplarDto[]) => ({
  items,
  disponibilidad: {
    libroId: 'l-1',
    totalEjemplares: items.length,
    disponibles: items.filter((e) => e.estado === 'DISPONIBLE').length,
    disponible: true,
    proximaDevolucion: null,
  },
});
const error = (status: number, message: string) =>
  new AxiosError(String(status), 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

function montar(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/panel/libros/nuevo" element={<LibroPanelPage />} />
        <Route path="/panel/libros/:id" element={<LibroPanelPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  m.listarTemas.mockResolvedValue({
    items: [
      { id: 't-1', nombre: 'Literatura', descripcion: null, totalLibros: 3, creadoEn: '', actualizadoEn: '' },
      { id: 't-2', nombre: 'Historia', descripcion: null, totalLibros: 1, creadoEn: '', actualizadoEn: '' },
    ],
    total: 2,
    pagina: 1,
    tamano: 100,
  });
  m.listarUbicaciones.mockResolvedValue([UBICACION]);
});

describe('LibroPanelPage: nuevo libro (HU-25)', () => {
  it('valida antes de enviar', async () => {
    montar('/panel/libros/nuevo');
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar libro' }));

    const resumen = screen.getByRole('alert');
    expect(resumen).toHaveTextContent('Escribe el título.');
    expect(resumen).toHaveTextContent('Agrega al menos un autor.');
    expect(m.crearLibro).not.toHaveBeenCalled();
  });

  it('pide el enlace si el libro es digital y valida año e ISBN', async () => {
    montar('/panel/libros/nuevo');
    await userEvent.type(await screen.findByLabelText('Título'), 'Revista de redes');
    await userEvent.click(screen.getByRole('radio', { name: 'Digital' }));
    await userEvent.type(screen.getByLabelText('Año de publicación (opcional)'), '99');
    await userEvent.type(screen.getByLabelText('ISBN'), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar libro' }));

    const resumen = screen.getByRole('alert');
    expect(resumen).toHaveTextContent('Un libro digital necesita su enlace');
    expect(resumen).toHaveTextContent('Escribe un año entre 1000');
    expect(resumen).toHaveTextContent('El ISBN debe tener 10 o 13 dígitos');
  });

  it('busca autores en el servidor, los ordena y registra el libro', async () => {
    m.listarAutores.mockImplementation(async (filtro) => ({
      items:
        filtro.nombre === 'garc'
          ? [{ id: 'a-1', nombre: 'Gabriel García Márquez', creadoEn: '', actualizadoEn: '' }]
          : [{ id: 'a-2', nombre: 'Lucía Ramírez', creadoEn: '', actualizadoEn: '' }],
      total: 1,
      pagina: 1,
      tamano: 8,
    }));
    m.crearLibro.mockResolvedValue({ ...LIBRO, id: 'l-9' });
    m.obtenerLibro.mockResolvedValue({ ...LIBRO, id: 'l-9' });
    m.listarEjemplares.mockResolvedValue(lista([]));
    montar('/panel/libros/nuevo');

    await userEvent.type(await screen.findByLabelText('Título'), ' Cien años de soledad ');
    const buscar = screen.getByLabelText('Buscar un autor para agregarlo');
    await userEvent.type(buscar, 'garc');
    await userEvent.click(await screen.findByRole('button', { name: /Gabriel García Márquez/ }));
    await userEvent.type(buscar, 'luci');
    await userEvent.click(await screen.findByRole('button', { name: /Lucía Ramírez/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Subir a Lucía Ramírez' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Literatura' }));
    await userEvent.type(screen.getByLabelText('Año de publicación (opcional)'), '1967');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar libro' }));

    expect(m.crearLibro).toHaveBeenCalledWith({
      titulo: 'Cien años de soledad',
      anioPublicacion: 1967,
      idioma: 'es',
      isbn: null,
      tipoMaterial: 'LIBRO',
      formato: 'FISICO',
      enlaceDigital: null,
      autorIds: ['a-2', 'a-1'],
      temaIds: ['t-1'],
    });
    // Pasa a la edición del libro nuevo, con su aviso, para agregar ejemplares.
    expect(await screen.findByText(/registrado. Ahora puedes agregar sus ejemplares/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Ejemplares' })).toBeInTheDocument();
  });

  it('crea el autor si no existe', async () => {
    m.listarAutores.mockResolvedValue({ items: [], total: 0, pagina: 1, tamano: 8 });
    m.crearAutor.mockResolvedValue({ id: 'a-7', nombre: 'Autora Nueva', creadoEn: '', actualizadoEn: '' });
    montar('/panel/libros/nuevo');

    await userEvent.type(await screen.findByLabelText('Buscar un autor para agregarlo'), 'Autora Nueva');
    expect(await screen.findByText('No hay autores con ese nombre.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Crear el autor «Autora Nueva» y agregarlo' }));
    expect(m.crearAutor).toHaveBeenCalledWith({ nombre: 'Autora Nueva' });
    expect(await screen.findByRole('button', { name: 'Quitar a Autora Nueva' })).toBeInTheDocument();
  });

  it('muestra el error del servidor (p. ej. ISBN repetido)', async () => {
    m.listarAutores.mockResolvedValue({
      items: [{ id: 'a-1', nombre: 'Ana', creadoEn: '', actualizadoEn: '' }],
      total: 1,
      pagina: 1,
      tamano: 8,
    });
    m.crearLibro.mockRejectedValue(error(409, 'Ya existe un libro con el ISBN 9780306406157: «Otro»'));
    montar('/panel/libros/nuevo');

    await userEvent.type(await screen.findByLabelText('Título'), 'X');
    await userEvent.type(screen.getByLabelText('Buscar un autor para agregarlo'), 'an');
    await userEvent.click(await screen.findByRole('button', { name: /Ana/ }));
    await userEvent.type(screen.getByLabelText('ISBN'), '978-0-306-40615-7');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar libro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un libro con el ISBN');
  });
});

describe('LibroPanelPage: editar libro y ejemplares (HU-25)', () => {
  it('carga los datos y guarda los cambios', async () => {
    m.obtenerLibro.mockResolvedValue(LIBRO);
    m.listarEjemplares.mockResolvedValue(lista([]));
    m.actualizarLibro.mockResolvedValue({ ...LIBRO, titulo: 'Cien años de soledad (2.ª ed.)' });
    montar('/panel/libros/l-1');

    const titulo = await screen.findByLabelText('Título');
    expect(titulo).toHaveValue('Cien años de soledad');
    expect(await screen.findByRole('checkbox', { name: 'Literatura' })).toBeChecked();
    expect(screen.getByText('Gabriel García Márquez')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver como visitante/ })).toHaveAttribute('href', '/libros/l-1');

    await userEvent.clear(titulo);
    await userEvent.type(titulo, 'Cien años de soledad (2.ª ed.)');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(m.actualizarLibro).toHaveBeenCalledWith(
      'l-1',
      expect.objectContaining({ titulo: 'Cien años de soledad (2.ª ed.)', autorIds: ['a-1'], temaIds: ['t-1'] }),
    );
    expect(await screen.findByText('Cambios de «Cien años de soledad (2.ª ed.)» guardados.')).toBeInTheDocument();
  });

  it('un libro solo digital no muestra ejemplares', async () => {
    m.obtenerLibro.mockResolvedValue({ ...LIBRO, formato: 'DIGITAL', enlaceDigital: 'https://x.example' });
    montar('/panel/libros/l-1');
    expect(await screen.findByText('Este libro es solo digital: no tiene ejemplares físicos.')).toBeInTheDocument();
    expect(m.listarEjemplares).not.toHaveBeenCalled();
  });

  it('agrega un ejemplar en una ubicación nueva', async () => {
    m.obtenerLibro.mockResolvedValue(LIBRO);
    m.listarEjemplares.mockResolvedValueOnce(lista([]));
    m.listarEjemplares.mockResolvedValueOnce(lista([ejemplar({ codigoInventario: 'INV-9' })]));
    const nueva = { id: 'u-2', sala: 'Sala 3', seccion: 'Referencia', estante: 'R-01', codigo: 'S3' };
    m.crearUbicacion.mockResolvedValue(nueva);
    m.crearEjemplar.mockResolvedValue(ejemplar({ codigoInventario: 'INV-9', ubicacion: nueva }));
    montar('/panel/libros/l-1');

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar ejemplar' }));
    const form = screen.getByRole('form', { name: 'Nuevo ejemplar' });
    await userEvent.type(within(form).getByLabelText('Código de inventario'), 'INV-9');
    await userEvent.click(within(form).getByRole('button', { name: /Registrar una ubicación nueva/ }));
    await userEvent.type(within(form).getByLabelText('Sala'), 'Sala 3');
    await userEvent.type(within(form).getByLabelText('Sección'), 'Referencia');
    await userEvent.type(within(form).getByLabelText('Estante'), 'R-01{Enter}');

    expect(m.crearUbicacion).toHaveBeenCalledWith({ sala: 'Sala 3', seccion: 'Referencia', estante: 'R-01' });
    expect(m.crearEjemplar).not.toHaveBeenCalled();
    expect(await within(form).findByLabelText('Ubicación')).toHaveValue('u-2');

    await userEvent.selectOptions(within(form).getByLabelText('Estado'), 'En reparación');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar ejemplar' }));
    expect(m.crearEjemplar).toHaveBeenCalledWith('l-1', {
      codigoInventario: 'INV-9',
      ubicacionId: 'u-2',
      estado: 'EN_REPARACION',
      observaciones: null,
    });
    expect(await screen.findByText('Ejemplar INV-9 registrado.')).toBeInTheDocument();
  });

  it('valida el ejemplar antes de enviar', async () => {
    m.obtenerLibro.mockResolvedValue(LIBRO);
    m.listarEjemplares.mockResolvedValue(lista([]));
    montar('/panel/libros/l-1');

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar ejemplar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar ejemplar' }));
    const resumen = within(screen.getByRole('form', { name: 'Nuevo ejemplar' })).getByRole('alert');
    expect(resumen).toHaveTextContent('Escribe el código de inventario.');
    expect(resumen).toHaveTextContent('Elige dónde está el ejemplar.');
  });

  it('un ejemplar prestado conserva su estado al editarlo', async () => {
    m.obtenerLibro.mockResolvedValue(LIBRO);
    m.listarEjemplares.mockResolvedValue(lista([ejemplar({ estado: 'PRESTADO' })]));
    m.actualizarEjemplar.mockResolvedValue(ejemplar({ estado: 'PRESTADO', observaciones: 'Lomo roto' }));
    montar('/panel/libros/l-1');

    await userEvent.click(await screen.findByRole('button', { name: 'Editar ejemplar INV-1' }));
    expect(screen.getByText(/Vuelve a estar disponible cuando se registra la devolución/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Observaciones (opcional)'), 'Lomo roto');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar ejemplar' }));
    expect(m.actualizarEjemplar).toHaveBeenCalledWith('l-1', 'e-1', {
      codigoInventario: 'INV-1',
      ubicacionId: 'u-1',
      observaciones: 'Lomo roto',
    });
  });

  it('explica por qué no se puede eliminar un ejemplar prestado', async () => {
    m.obtenerLibro.mockResolvedValue(LIBRO);
    m.listarEjemplares.mockResolvedValue(lista([ejemplar({ estado: 'PRESTADO' })]));
    m.eliminarEjemplar.mockRejectedValue(error(409, 'No se puede eliminar un ejemplar con préstamos activos'));
    montar('/panel/libros/l-1');

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar ejemplar INV-1' }));
    await userEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('préstamos activos');
  });

  it('si el libro no existe lo dice', async () => {
    m.obtenerLibro.mockRejectedValue(error(404, 'Libro no encontrado'));
    montar('/panel/libros/l-404');
    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos este libro');
  });
});
