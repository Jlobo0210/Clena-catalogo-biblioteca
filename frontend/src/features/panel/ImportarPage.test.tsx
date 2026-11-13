import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { descargarPlantilla, importarCatalogo, type ReporteImportacion } from './api/catalogo-admin.api';
import { ImportarPage } from './ImportarPage';

vi.mock('./api/catalogo-admin.api', () => ({
  importarCatalogo: vi.fn(),
  descargarPlantilla: vi.fn(),
}));
const importarMock = vi.mocked(importarCatalogo);
const plantillaMock = vi.mocked(descargarPlantilla);

const REPORTE: ReporteImportacion = {
  totalFilas: 3,
  columnasIgnoradas: [],
  filasImportadas: 3,
  filasConError: 0,
  librosCreados: 2,
  librosExistentes: 1,
  ejemplaresCreados: 2,
  ejemplaresExistentes: 0,
  autoresCreados: 1,
  temasCreados: 1,
  ubicacionesCreadas: 1,
  errores: [],
};

const csv = (nombre = 'catalogo.csv', contenido = 'titulo,autores,idioma\nA,B,es\n') =>
  new File([contenido], nombre, { type: 'text/csv' });

function montar() {
  render(
    <MemoryRouter>
      <ImportarPage />
    </MemoryRouter>,
  );
}

describe('ImportarPage (HU-25)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('explica cómo preparar el archivo', () => {
    montar();
    expect(screen.getByRole('heading', { level: 1, name: 'Importar catálogo desde CSV' })).toBeInTheDocument();
    expect(screen.getByText(/Máximo 1000 filas y 2 MB/)).toBeInTheDocument();
  });

  it('pide elegir un archivo antes de importar', async () => {
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Elige el archivo CSV que quieres importar.');
    expect(screen.getByLabelText('Archivo CSV')).toHaveAttribute('aria-invalid', 'true');
    expect(importarMock).not.toHaveBeenCalled();
  });

  it('rechaza archivos que no son CSV', async () => {
    montar();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), csv('catalogo.xlsx'), { applyAccept: false });
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El archivo debe tener extensión .csv');
    expect(importarMock).not.toHaveBeenCalled();
  });

  it('rechaza archivos de más de 2 MB', async () => {
    montar();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), csv('grande.csv', 'a'.repeat(2 * 1024 * 1024 + 1)));
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El archivo supera 2 MB');
  });

  it('importa y muestra el reporte con las cifras', async () => {
    importarMock.mockResolvedValue(REPORTE);
    montar();
    const archivo = csv();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), archivo);
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(importarMock).toHaveBeenCalledWith(archivo);
    const titulo = await screen.findByRole('heading', { name: 'Resultado de la importación' });
    expect(titulo).toHaveFocus();
    expect(screen.getByText('Se importaron las 3 filas sin errores.')).toBeInTheDocument();
    expect(screen.getByText('Libros nuevos').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('Libros que ya existían').nextSibling).toHaveTextContent('1');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lista las filas con error y las columnas ignoradas', async () => {
    importarMock.mockResolvedValue({
      ...REPORTE,
      filasImportadas: 1,
      filasConError: 2,
      columnasIgnoradas: ['observaciones'],
      errores: [
        { fila: 3, errores: ['El ISBN no es válido'] },
        { fila: 5, errores: ['El título es obligatorio', 'Un libro debe tener al menos un autor'] },
      ],
    });
    montar();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), csv());
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(await screen.findByText(/Se importaron 1 de 3 filas/)).toBeInTheDocument();
    expect(screen.getByText(/no son de la plantilla/)).toHaveTextContent('observaciones');
    expect(screen.getByRole('rowheader', { name: '3' }).nextSibling).toHaveTextContent('El ISBN no es válido');
    expect(screen.getByText('Un libro debe tener al menos un autor')).toBeInTheDocument();
  });

  it('muestra el error del servidor si el archivo no sirve', async () => {
    importarMock.mockRejectedValue(
      new AxiosError('400', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: '',
        data: { message: 'Faltan columnas obligatorias: autores, idioma.' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    );
    montar();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), csv());
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Faltan columnas obligatorias: autores, idioma.');
  });

  it('descarga la plantilla con la sesión', async () => {
    plantillaMock.mockResolvedValue(new Blob(['titulo,autores,idioma\n'], { type: 'text/csv' }));
    const crearUrl = vi.fn(() => 'blob:plantilla');
    const liberarUrl = vi.fn();
    Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: liberarUrl });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    montar();

    await userEvent.click(screen.getByRole('button', { name: 'Descargar plantilla' }));
    expect(plantillaMock).toHaveBeenCalled();
    expect(clic).toHaveBeenCalled();
    expect(liberarUrl).toHaveBeenCalledWith('blob:plantilla');
  });
});
