import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ConSesion, sesionFalsa, usuarioDePrueba } from '../../../test/sesionFalsa';
import type { ValorSesion } from '../sesion/contextoSesion';
import { RutaProtegida } from './RutaProtegida';

function PaginaIngreso() {
  const { state } = useLocation();
  return <p>Pantalla de ingreso desde {(state as { desde: string }).desde}</p>;
}

function montar(valor: ValorSesion, ruta = '/panel') {
  render(
    <ConSesion valor={valor}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/ingresar" element={<PaginaIngreso />} />
          <Route element={<RutaProtegida roles={['PERSONAL', 'ADMINISTRADOR']} />}>
            <Route path="/panel" element={<p>Contenido del panel</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ConSesion>,
  );
}

describe('RutaProtegida', () => {
  it('manda a iniciar sesión y recuerda la página pedida', () => {
    montar(sesionFalsa(), '/panel?pestana=libros');
    expect(screen.getByText('Pantalla de ingreso desde /panel?pestana=libros')).toBeInTheDocument();
  });

  it('espera mientras se recupera la sesión guardada', () => {
    montar(sesionFalsa({ cargando: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión');
  });

  it('niega el acceso al público', () => {
    montar(sesionFalsa({ usuario: usuarioDePrueba('PUBLICO') }));
    expect(screen.getByRole('heading', { name: 'No tienes acceso a esta sección' })).toBeInTheDocument();
    expect(screen.queryByText('Contenido del panel')).not.toBeInTheDocument();
  });

  it.each(['PERSONAL', 'ADMINISTRADOR'] as const)('deja entrar al rol %s', (rol) => {
    montar(sesionFalsa({ usuario: usuarioDePrueba(rol) }));
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument();
  });
});
