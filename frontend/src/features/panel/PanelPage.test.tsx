import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ConSesion, sesionFalsa, usuarioDePrueba } from '../../test/sesionFalsa';
import { PanelPage } from './PanelPage';

function montar(rol: 'PERSONAL' | 'ADMINISTRADOR') {
  const usuario = usuarioDePrueba(rol);
  render(
    <ConSesion valor={sesionFalsa({ usuario, tieneRol: (...roles) => roles.includes(usuario.rol) })}>
      <MemoryRouter>
        <PanelPage />
      </MemoryRouter>
    </ConSesion>,
  );
}

describe('PanelPage (HU-25)', () => {
  it('lleva al personal a autores, temas e importación', () => {
    montar('PERSONAL');
    expect(screen.getByRole('link', { name: 'Autores' })).toHaveAttribute('href', '/panel/autores');
    expect(screen.getByRole('link', { name: 'Temas' })).toHaveAttribute('href', '/panel/temas');
    expect(screen.getByRole('link', { name: 'Importar desde CSV' })).toHaveAttribute('href', '/panel/importar');
    expect(screen.getByRole('link', { name: 'Código QR de acceso' })).toHaveAttribute('href', '/panel/qr');
    expect(screen.queryByRole('link', { name: 'Usuarios y roles' })).not.toBeInTheDocument();
  });

  it('a la administración también le muestra usuarios y roles', () => {
    montar('ADMINISTRADOR');
    expect(screen.getByRole('link', { name: 'Usuarios y roles' })).toHaveAttribute('href', '/panel/usuarios');
  });
});
