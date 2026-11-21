import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

vi.mock('../../pages/Landing', () => ({ default: () => <h1>Início</h1> }));
vi.mock('../../pages/auth/Login', () => ({ default: () => <h1>Entrar</h1> }));
vi.mock('../../pages/Status', () => ({ default: () => <h1>Status público</h1> }));

afterEach(() => window.history.replaceState({}, '', '/'));

it('direciona visitantes para login ao acessar o dashboard', async () => {
  window.history.replaceState({}, '', '/dashboard');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
});

it('mantém páginas de status acessíveis sem sessão', async () => {
  window.history.replaceState({}, '', '/status');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Status público' })).toBeInTheDocument();
});

it('redireciona endereços desconhecidos para o início', async () => {
  window.history.replaceState({}, '', '/pagina-inexistente');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
});
