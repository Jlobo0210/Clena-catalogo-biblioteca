import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusquedaPage } from '../busqueda/BusquedaPage';
import { CLAVE_TUTORIAL } from './tutorialVisto';

vi.mock('../busqueda/api/busqueda.api', () => ({ buscarLibros: vi.fn() }));

function montar() {
  render(
    <MemoryRouter initialEntries={['/buscar?desde=qr']}>
      <Routes>
        <Route path="/buscar" element={<BusquedaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Tutorial de la primera búsqueda (HU-32)', () => {
  beforeEach(() => {
    localStorage.removeItem(CLAVE_TUTORIAL);
  });

  it('aparece la primera vez, enfoca el paso y explica los tres pasos', async () => {
    const usuario = userEvent.setup();
    montar();

    const dialogo = screen.getByRole('dialog', { name: 'Escriba lo que busca' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Escriba lo que busca' })).toHaveFocus();

    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { name: 'Afine con los filtros' })).toHaveFocus();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { name: 'Lea dónde está el libro' })).toBeInTheDocument();
    expect(screen.getByText(/sala, la sección y el estante/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await usuario.click(screen.getByRole('button', { name: 'Empezar a buscar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(CLAVE_TUTORIAL)).toBe('si');
    await waitFor(() => expect(screen.getByLabelText(/buscar/i, { selector: 'input' })).toHaveFocus());
  });

  it('se puede saltar con Escape y repetir desde el botón visible', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(CLAVE_TUTORIAL)).toBe('si');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver tutorial' })).toHaveFocus());

    await usuario.click(screen.getByRole('button', { name: 'Ver tutorial' }));
    expect(screen.getByRole('dialog', { name: 'Escriba lo que busca' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Saltar tutorial' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no vuelve a aparecer solo si ya se vio', () => {
    localStorage.setItem(CLAVE_TUTORIAL, 'si');
    montar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver tutorial' })).toBeInTheDocument();
  });

  it('mantiene el foco dentro del diálogo con Tab', async () => {
    const usuario = userEvent.setup();
    montar();
    // El foco empieza en el título del paso
    await usuario.tab(); // Saltar tutorial
    await usuario.tab(); // Siguiente
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Cerrar tutorial' })).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
  });
});
