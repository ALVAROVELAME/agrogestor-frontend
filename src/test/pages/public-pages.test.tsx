import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../../services/api';
import Signup from '../../pages/auth/Signup';
import ConfirmarEmail from '../../pages/auth/ConfirmarEmail';
import Termos from '../../pages/legal/Termos';
import Privacidade from '../../pages/legal/Privacidade';
import { StatusView } from '../../pages/Status';
import Landing from '../../pages/Landing';

const page = (component: React.ReactNode, path = '/') => render(<MemoryRouter initialEntries={[path]}>{component}</MemoryRouter>);
describe('telas e interações', () => {
  it('apresenta a landing e permite mudar o animal da demonstração', async () => {
    page(<Landing />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Estrela/i }));
    expect(screen.getByRole('heading', { name: /Estrela, últimos 7 dias/i })).toBeInTheDocument();
  });
  it('exibe termos e privacidade', () => {
    const { unmount } = page(<Termos />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/termos/i);
    unmount();
    page(<Privacidade />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/privacidade/i);
  });
  it('impede cadastro inválido e envia dados válidos', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    page(<Signup />);
    const submit = screen.getByRole('button', { name: /criar conta grátis/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/nome completo/i), 'Ana Silva');
    await user.type(screen.getByLabelText(/^e-mail$/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'senha123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'senha123');
    await user.click(screen.getByText(/concordo com os/i));
    await user.click(submit);
    expect(post).toHaveBeenCalledWith('/api/usuarios', { nome: 'Ana Silva', email: 'ana@example.com', senha: 'senha123' });
    expect(await screen.findByText(/cadastro realizado/i)).toBeInTheDocument();
  });
  it('informa quando o link de confirmação não tem token', async () => {
    page(<ConfirmarEmail />, '/confirmar');
    expect(await screen.findByRole('heading', { name: /link incompleto/i })).toBeInTheDocument();
  });
  it('confirma e-mail com token', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    page(<ConfirmarEmail />, '/confirmar?token=abc');
    expect(await screen.findByRole('heading', { name: /e-mail confirmado/i })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/api/auth/confirmar', expect.objectContaining({ params: { token: 'abc' } }));
  });
  it('mostra erro de confirmação e permite tentar de novo', async () => {
    const get = vi.spyOn(api, 'get').mockRejectedValueOnce({ response: { status: 410 } }).mockResolvedValueOnce({ data: {} });
    page(<ConfirmarEmail />, '/confirmar?token=abc');
    expect(await screen.findByText(/este link expirou/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('heading', { name: /e-mail confirmado/i })).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(2);
  });
  it('mostra status e permite tentar novamente', async () => {
    const retry = vi.fn();
    page(<StatusView tipo="erro" titulo="Falhou" mensagem="Tente mais tarde" onRetry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
