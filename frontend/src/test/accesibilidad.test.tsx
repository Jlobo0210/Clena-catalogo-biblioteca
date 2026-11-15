import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { buscarLibros } from '../features/busqueda/api/busqueda.api';
import { BusquedaPage } from '../features/busqueda/BusquedaPage';
import { listarEjemplares, obtenerLibro } from '../features/catalogo/api/libros.api';
import { DetalleLibroPage } from '../features/catalogo/DetalleLibroPage';
import type { LibroDto } from '../features/catalogo/types';
import { IngresarPage } from '../features/auth/pages/IngresarPage';
import { MiCuentaPage } from '../features/cuenta/MiCuentaPage';
import { PanelPage } from '../features/panel/PanelPage';
import { TutorialBusqueda } from '../features/tutorial/TutorialBusqueda';
import { TablaDesplazable } from '../shared/ui/TablaDesplazable';
import { violacionesAxe } from './axe';
import { ConSesion, sesionFalsa, usuarioDePrueba } from './sesionFalsa';

vi.mock('../features/busqueda/api/busqueda.api', () => ({ buscarLibros: vi.fn() }));
vi.mock('../features/catalogo/api/libros.api', () => ({
  obtenerLibro: vi.fn(),
  listarEjemplares: vi.fn(),
}));

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

function enRuta(ruta: string, patron: string, pagina: React.ReactNode, rol?: 'PUBLICO' | 'PERSONAL') {
  const usuario = rol ? usuarioDePrueba(rol) : null;
  return render(
    <ConSesion valor={sesionFalsa({ usuario })}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path={patron} element={<main>{pagina}</main>} />
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
}

/** HU-33: las pantallas principales no tienen violaciones de WCAG 2.2 AA según axe. */
describe('Accesibilidad con axe (HU-33)', () => {
  it('el control funciona: detecta una imagen sin texto alternativo y un campo sin etiqueta', async () => {
    const { container } = render(
      <div>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- error a propósito para probar el control */}
        <img src="x.png" />
        <input type="text" />
      </div>,
    );
    const violaciones = await violacionesAxe(container);
    expect(violaciones.join('\n')).toMatch(/image-alt/);
    expect(violaciones.join('\n')).toMatch(/label/);
  });

  it('resultados de búsqueda', async () => {
    vi.mocked(buscarLibros).mockResolvedValue({ items: [LIBRO], total: 1, pagina: 1, tamano: 10 });
    const { container } = enRuta('/buscar?q=garcia', '/buscar', <BusquedaPage />);
    await screen.findByRole('heading', { name: /1 resultado para/ });
    expect(await violacionesAxe(container)).toEqual([]);
  });

  it('detalle del libro con ubicación y disponibilidad', async () => {
    vi.mocked(obtenerLibro).mockResolvedValue(LIBRO);
    vi.mocked(listarEjemplares).mockResolvedValue({
      items: [
        {
          id: 'e-1',
          libroId: 'l-1',
          codigoInventario: 'INV-1',
          estado: 'DISPONIBLE',
          observaciones: null,
          ubicacion: { id: 'u-1', sala: 'Sala 1', seccion: 'Humanidades', estante: 'E-01', codigo: 'S1' },
        },
      ],
      disponibilidad: { libroId: 'l-1', totalEjemplares: 1, disponibles: 1, disponible: true, proximaDevolucion: null },
    });
    const { container } = enRuta('/libros/l-1', '/libros/:id', <DetalleLibroPage />);
    await screen.findByRole('heading', { level: 1, name: 'Cien años de soledad' });
    expect(await violacionesAxe(container)).toEqual([]);
  });

  it('tutorial de la primera búsqueda (diálogo)', async () => {
    const { container } = render(<TutorialBusqueda onCerrar={() => undefined} />);
    expect(await violacionesAxe(container)).toEqual([]);
  });

  it('inicio de sesión', async () => {
    const { container } = enRuta('/ingresar', '/ingresar', <IngresarPage />);
    expect(await violacionesAxe(container)).toEqual([]);
  });

  it('mi cuenta con el formulario de eliminar cuenta abierto', async () => {
    const usuario = userEvent.setup();
    const { container } = enRuta('/mi-cuenta', '/mi-cuenta', <MiCuentaPage />, 'PUBLICO');
    await usuario.click(screen.getByRole('button', { name: 'Quiero eliminar mi cuenta' }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' }));
    expect(await violacionesAxe(container)).toEqual([]);
  });

  it('panel del personal', async () => {
    const { container } = enRuta('/panel', '/panel', <PanelPage />, 'PERSONAL');
    expect(await violacionesAxe(container)).toEqual([]);
  });
});

describe('TablaDesplazable (HU-33)', () => {
  it('solo es región enfocable cuando la tabla no cabe', () => {
    const anchos = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(800);
    const visibles = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
    render(
      <TablaDesplazable etiqueta="Préstamos">
        <table>
          <caption>Préstamos</caption>
          <tbody>
            <tr>
              <td>1</td>
            </tr>
          </tbody>
        </table>
      </TablaDesplazable>,
    );
    const region = screen.getByRole('region', { name: /Préstamos \(desplácese/ });
    expect(region).toHaveAttribute('tabindex', '0');
    anchos.mockRestore();
    visibles.mockRestore();
  });

  it('si la tabla cabe, no agrega una parada de tabulación', () => {
    render(
      <TablaDesplazable etiqueta="Préstamos">
        <table>
          <tbody>
            <tr>
              <td>1</td>
            </tr>
          </tbody>
        </table>
      </TablaDesplazable>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
