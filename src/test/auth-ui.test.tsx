import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import Login from '../pages/auth/Login';
import RotaProtegida from '../components/auth/RotaProtegida';
import RotaPublica from '../components/auth/RotaPublica';

const auth = vi.hoisted(() => ({ login: vi.fn(), autenticado: false, carregando: false }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));

describe('login e rotas', () => {
  it('envia credenciais e encaminha ao painel', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'abc', usuario: { nome: 'Ana', email: 'ana@example.com' } } });
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<p>Painel aberto</p>} /></Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^e-mail$/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /^entrar/i }));
    expect(await screen.findByText('Painel aberto')).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Ana' }), 'abc');
  });
  it('direciona visitantes ao login quando tentam acessar o painel', () => {
    auth.autenticado = false;
    render(<MemoryRouter initialEntries={['/dashboard']}><Routes><Route path="/dashboard" element={<RotaProtegida><p>Privado</p></RotaProtegida>} /><Route path="/login" element={<p>Faça login</p>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Faça login')).toBeInTheDocument();
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });
  it('apresenta falha de login e limpa o erro ao editar', async () => {
    vi.spyOn(api, 'post').mockRejectedValue({ response: { data: { mensagem: 'Senha incorreta' } } });
    render(<MemoryRouter><Login /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^e-mail$/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'errada');
    await user.click(screen.getByRole('button', { name: /^entrar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Senha incorreta');
    await user.type(screen.getByLabelText(/^senha$/i), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('encaminha usuário autenticado da área pública ao painel', () => {
    auth.autenticado = true;
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<RotaPublica><p>Login</p></RotaPublica>} /><Route path="/dashboard" element={<p>Painel aberto</p>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Painel aberto')).toBeInTheDocument();
    auth.autenticado = false;
  });
});
