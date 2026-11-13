import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConSesion, sesionFalsa, usuarioDePrueba } from '../../../test/sesionFalsa';
import * as authApi from '../api/auth.api';
import type { ValorSesion } from '../sesion/contextoSesion';
import { RegistroPage } from './RegistroPage';

const aviso = {
  version: '1.0',
  responsable: 'Biblioteca del CLENA, Barranquilla',
  datosRecolectados: ['Nombre', 'Correo electrónico'],
  finalidades: ['Crear y administrar tu cuenta.'],
  derechos: 'Puedes pedir la eliminación de tu cuenta.',
  texto: 'Al crear tu cuenta autorizas el tratamiento de tus datos.',
};

beforeEach(() => {
  vi.spyOn(authApi, 'obtenerAvisoPrivacidad').mockResolvedValue(aviso);
});

function montar(valor: ValorSesion) {
  render(
    <ConSesion valor={valor}>
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/" element={<p>Inicio</p>} />
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
}

async function llenar() {
  await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez');
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-1');
  await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'clave-segura-1');
}

describe('RegistroPage', () => {
  it('muestra el aviso de privacidad del servidor', async () => {
    montar(sesionFalsa());
    expect(await screen.findByRole('heading', { name: 'Aviso de privacidad (versión 1.0)' })).toBeInTheDocument();
    expect(screen.getByText(aviso.texto)).toBeInTheDocument();
  });

  it('no envía si no se acepta el aviso', async () => {
    const valor = sesionFalsa();
    montar(valor);
    await screen.findByText(aviso.texto);
    await llenar();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Debes aceptar el aviso de privacidad');
    expect(valor.registrarse).not.toHaveBeenCalled();
  });

  it('crea la cuenta con la aceptación explícita del aviso', async () => {
    const valor = sesionFalsa({ registrarse: vi.fn().mockResolvedValue(usuarioDePrueba()) });
    montar(valor);
    await screen.findByText(aviso.texto);
    await llenar();
    await userEvent.click(screen.getByLabelText(/autorizo el tratamiento de mis datos/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
    expect(valor.registrarse).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'clave-segura-1',
      aceptaAvisoPrivacidad: true,
    });
  });

  it('avisa si el correo ya tiene cuenta', async () => {
    const conflicto = new AxiosError('409', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      data: { message: 'El correo ya está registrado' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    montar(sesionFalsa({ registrarse: vi.fn().mockRejectedValue(conflicto) }));
    await screen.findByText(aviso.texto);
    await llenar();
    await userEvent.click(screen.getByLabelText(/autorizo el tratamiento de mis datos/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con este correo');
  });
});
