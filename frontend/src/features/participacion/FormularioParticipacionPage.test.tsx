import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../api/apiClient';
import { FormularioParticipacionPage } from './FormularioParticipacionPage';

function montar(ruta = '/ayuda/formulario?motivo=libro') {
  render(<MemoryRouter initialEntries={[ruta]}><FormularioParticipacionPage /></MemoryRouter>);
}

describe('Formulario de participación', () => {
  it('conserva el correo al cambiar de motivo', () => {
    montar();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'lector@ejemplo.com' } });
    fireEvent.click(screen.getByLabelText('Buzón'));
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('lector@ejemplo.com');
    expect(screen.getByRole('textbox', { name: 'Mensaje' })).toBeRequired();
    expect(screen.getByLabelText('Sugerencia')).toBeChecked();
  });

  it('valida obligatorios y correo', () => {
    montar();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'incorrecto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugerencia' }));
    expect(screen.getByText('Escriba el título de la obra.')).toBeInTheDocument();
    expect(screen.getByText('Escriba el autor de la obra.')).toBeInTheDocument();
    expect(screen.getByText('Escriba un correo válido.')).toBeInTheDocument();
  });

  it('envía el buzón y cierra la confirmación con Escape', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { registrado: true } });
    montar('/ayuda/formulario?motivo=buzon');
    fireEvent.click(screen.getByLabelText('Queja'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Mensaje' }), { target: { value: 'Mensaje de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Regresar al inicio' })).toHaveFocus());
    expect(post).toHaveBeenCalledWith('/solicitudes-participacion', expect.objectContaining({ tipo: 'QUEJA', mensaje: 'Mensaje de prueba' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    post.mockRestore();
  });
});
