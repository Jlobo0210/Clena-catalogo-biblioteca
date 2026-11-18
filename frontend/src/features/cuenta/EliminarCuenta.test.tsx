import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConSesion, sesionFalsa, usuarioDePrueba } from '../../test/sesionFalsa';
import { eliminarCuenta } from '../auth/api/auth.api';
import type { Rol } from '../auth/types';
import { MiCuentaPage } from './MiCuentaPage';

vi.mock('../auth/api/auth.api', () => ({ eliminarCuenta: vi.fn() }));
const eliminarMock = vi.mocked(eliminarCuenta);

function Inicio() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  return <p>Inicio: {aviso}</p>;
}

function montar(rol: Rol = 'PUBLICO') {
  const valor = sesionFalsa({ usuario: usuarioDePrueba(rol) });
  render(
    <ConSesion valor={valor}>
      <MemoryRouter initialEntries={['/mi-cuenta']}>
        <Routes>
          <Route path="/mi-cuenta" element={<MiCuentaPage />} />
          <Route path="/" element={<Inicio />} />
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
  return valor;
}

function error409(mensaje: string) {
  return new AxiosError('Conflict', '409', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    data: { statusCode: 409, error: 'CONFLICT', message: mensaje },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('Eliminar mi cuenta (HU-34)', () => {
  beforeEach(() => {
    eliminarMock.mockReset();
  });

  it('explica qué pasa y pide contraseña y confirmación antes de enviar', async () => {
    const usuario = userEvent.setup();
    montar();

    expect(screen.getByRole('heading', { name: 'Eliminar mi cuenta' })).toBeInTheDocument();
    expect(screen.getByText(/sin datos que te\s+identifiquen/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Quiero eliminar mi cuenta' }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' }));

    const resumen = screen.getByRole('alert');
    expect(resumen).toHaveTextContent('Escribe tu contraseña para confirmar.');
    expect(resumen).toHaveTextContent('Marca la casilla');
    expect(eliminarMock).not.toHaveBeenCalled();
  });

  it('elimina, cierra la sesión y lleva al inicio con el aviso', async () => {
    const usuario = userEvent.setup();
    eliminarMock.mockResolvedValue(undefined);
    const sesion = montar();

    await usuario.click(screen.getByRole('button', { name: 'Quiero eliminar mi cuenta' }));
    await usuario.type(screen.getByLabelText('Tu contraseña'), 'clave-segura-1');
    await usuario.click(screen.getByRole('checkbox', { name: /se elimina para siempre/ }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' }));

    expect(await screen.findByText(/Inicio: Tu cuenta fue eliminada/)).toBeInTheDocument();
    expect(eliminarMock).toHaveBeenCalledWith('clave-segura-1');
    expect(sesion.salir).toHaveBeenCalled();
  });

  it('muestra el motivo del servidor si tiene préstamos sin devolver', async () => {
    const usuario = userEvent.setup();
    eliminarMock.mockRejectedValue(
      error409('Tienes 1 préstamo(s) sin devolver. Devuélvelos en el mostrador.'),
    );
    const sesion = montar();

    await usuario.click(screen.getByRole('button', { name: 'Quiero eliminar mi cuenta' }));
    await usuario.type(screen.getByLabelText('Tu contraseña'), 'clave-segura-1');
    await usuario.click(screen.getByRole('checkbox', { name: /se elimina para siempre/ }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tienes 1 préstamo(s) sin devolver');
    expect(sesion.salir).not.toHaveBeenCalled();
  });

  it('a la administración no le ofrece eliminar la cuenta', () => {
    montar('ADMINISTRADOR');
    expect(screen.getByText(/no se puede eliminar desde aquí/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quiero eliminar mi cuenta' })).not.toBeInTheDocument();
  });
});
