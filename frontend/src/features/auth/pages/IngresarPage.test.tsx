import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ConSesion, sesionFalsa, usuarioDePrueba } from '../../../test/sesionFalsa';
import type { ValorSesion } from '../sesion/contextoSesion';
import { IngresarPage } from './IngresarPage';

function montar(valor: ValorSesion, estado?: unknown) {
  render(
    <ConSesion valor={valor}>
      <MemoryRouter initialEntries={[{ pathname: '/ingresar', state: estado }]}>
        <Routes>
          <Route path="/ingresar" element={<IngresarPage />} />
          <Route path="/" element={<p>Inicio</p>} />
          <Route path="/panel" element={<p>Panel</p>} />
          <Route path="/mi-cuenta" element={<p>Mi cuenta</p>} />
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
}

const error401 = () =>
  new AxiosError('401', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    data: { message: 'Credenciales inválidas' },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('IngresarPage', () => {
  it('tiene etiquetas en todos los campos', () => {
    montar(sesionFalsa());
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('valida antes de enviar y anuncia los errores', async () => {
    const valor = sesionFalsa();
    montar(valor);
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe tu correo electrónico.');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(valor.ingresar).not.toHaveBeenCalled();
  });

  it('muestra un mensaje claro si las credenciales no son correctas', async () => {
    const valor = sesionFalsa({ ingresar: vi.fn().mockRejectedValue(error401()) });
    montar(valor);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala-clave-1');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo o la contraseña no son correctos');
  });

  it('lleva al personal a su panel al ingresar', async () => {
    const valor = sesionFalsa({ ingresar: vi.fn().mockResolvedValue(usuarioDePrueba('PERSONAL')) });
    montar(valor);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), ' personal@clena.example ');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-1234');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Panel')).toBeInTheDocument();
    expect(valor.ingresar).toHaveBeenCalledWith({ email: 'personal@clena.example', password: 'clave-1234' });
  });

  it('vuelve a la página que se pidió antes de ingresar', async () => {
    const valor = sesionFalsa({ ingresar: vi.fn().mockResolvedValue(usuarioDePrueba('PUBLICO')) });
    montar(valor, { desde: '/mi-cuenta' });
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-1234');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument();
  });

  it('permite mostrar la contraseña', async () => {
    montar(sesionFalsa());
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
  });
});
