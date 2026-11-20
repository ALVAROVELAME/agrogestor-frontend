import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import RecuperarSenha from '../pages/auth/RecuperarSenha';
import RedefinirSenha from '../pages/auth/RedefinirSenha';

const logout = vi.hoisted(() => vi.fn());
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ logout }) }));

describe('recuperação de senha', () => {
  it('solicita recuperação e apresenta resposta genérica', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    render(<MemoryRouter><RecuperarSenha /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));
    expect(post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'ana@example.com' });
    expect(await screen.findByRole('status')).toHaveTextContent('Se houver uma conta');
  });
  it('informa link incompleto sem enviar solicitação', () => {
    render(<MemoryRouter><RedefinirSenha /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('incompleto');
  });
  it('rejeita confirmação diferente e envia senha válida', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    render(<MemoryRouter initialEntries={['/reset-password?token=teste']}><Routes><Route path="/reset-password" element={<RedefinirSenha />} /></Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nova senha'), 'segredo123');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outra123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('não coincidem');
    expect(post).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Confirmar nova senha'));
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(post).toHaveBeenCalledWith('/api/auth/reset-password', { token: 'teste', senha: 'segredo123' });
    expect(await screen.findByRole('status')).toHaveTextContent('senha foi redefinida');
    expect(logout).toHaveBeenCalled();
  });
  it('informa quando o link expirou', async () => {
    vi.spyOn(api, 'post').mockRejectedValue({ response: { status: 400 } });
    render(<MemoryRouter initialEntries={['/reset-password?token=expirado']}><RedefinirSenha /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nova senha'), 'segredo123');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('inválido ou expirado');
  });
});
