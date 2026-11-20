import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, type AxiosAdapter } from 'axios';
import { AuthProvider } from '../contexts/AuthContext';
import RotaPublica from '../components/auth/RotaPublica';
import RotaProtegida from '../components/auth/RotaProtegida';
import LogoutButton from '../components/auth/LogoutButton';
import { api } from '../services/api';
import { authService } from '../services/auth.service';

const adapterOriginal = api.defaults.adapter;
afterEach(() => { api.defaults.adapter = adapterOriginal; window.history.replaceState({}, '', '/'); });

function renderApp() {
  return render(<MemoryRouter initialEntries={['/']}><AuthProvider><Routes>
    <Route path="/" element={<RotaPublica><p>Página institucional</p></RotaPublica>} />
    <Route path="/login" element={<p>Tela de login</p>} />
    <Route path="/dashboard" element={<RotaProtegida><p>Aplicativo</p><LogoutButton confirmar={false} /></RotaProtegida>} />
  </Routes></AuthProvider></MemoryRouter>);
}

describe('entrada e saída da sessão', () => {
  it('abre a página institucional sem sessão', async () => {
    renderApp();
    expect(await screen.findByText('Página institucional')).toBeInTheDocument();
  });
  it('mantém a página institucional quando o token expirou', async () => {
    window.history.replaceState({}, '', '/');
    localStorage.setItem('token', 'expirado');
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('Sessão expirada', 'ERR_BAD_REQUEST', config, undefined, { config, status: 401, statusText: 'Unauthorized', headers: {}, data: {} });
    };
    api.defaults.adapter = adapter;
    renderApp();
    expect(await screen.findByText('Página institucional')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.pathname).toBe('/');
  });
  it('abre o aplicativo com sessão válida e vai ao login ao sair', async () => {
    localStorage.setItem('token', 'valido');
    localStorage.setItem('usuario', JSON.stringify({ nome: 'Ana', email: 'ana@example.com' }));
    vi.spyOn(authService, 'me').mockResolvedValue({ nome: 'Ana', email: 'ana@example.com' });
    renderApp();
    expect(await screen.findByText('Aplicativo')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
