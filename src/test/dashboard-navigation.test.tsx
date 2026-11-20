import { expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { animaisService } from '../services/animais.service';
import { gestaoService } from '../services/gestao.service';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ usuario: { nome: 'Ana', email: 'ana@example.com' }, logout: vi.fn() }) }));

it('navega entre áreas e solicita dados de cada recurso', async () => {
  vi.spyOn(animaisService, 'listar').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue({ receitas: 100, despesas: 20, saldo: 80 });
  vi.spyOn(gestaoService, 'producoes').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'eventos').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'financeiro').mockResolvedValue([]);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const user = userEvent.setup();
  const menu = screen.getByRole('navigation', { name: 'Áreas do aplicativo' });
  for (const nome of ['Produção', 'Agenda', 'Saúde e reprodução', 'Financeiro', 'Relatórios']) {
    await user.click(within(menu).getByRole('button', { name: nome }));
    expect(screen.getByRole('heading', { name: nome, level: 1 })).toBeInTheDocument();
  }
  expect(gestaoService.producoes).toHaveBeenCalled();
  expect(gestaoService.tarefas).toHaveBeenCalled();
  expect(gestaoService.eventos).toHaveBeenCalled();
  expect(gestaoService.financeiro).toHaveBeenCalled();
  expect(await screen.findByRole('region', { name: 'Resumo financeiro' })).toHaveTextContent('80,00');
});
