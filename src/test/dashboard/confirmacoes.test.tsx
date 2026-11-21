import { expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import PreviaGestao from '../../components/dashboard/PreviaGestao';
import { animaisService } from '../../services/animais.service';
import { gestaoService } from '../../services/gestao.service';

const logout = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ usuario: { nome: 'Ana', email: 'ana@example.com' }, logout }) }));

it('pede confirmação para sair e permite cancelar com Escape', async () => {
  vi.spyOn(animaisService, 'listar').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Menu do usuário' }));
  await user.click(screen.getByRole('button', { name: 'Sair' }));
  expect(screen.getByRole('dialog', { name: 'Sair da conta?' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(logout).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Sair' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }));
  expect(logout).toHaveBeenCalledOnce();
});

it('só exclui um registro após a confirmação', async () => {
  const registro = { id: 3, data: '2020-01-01', descricao: 'Vacinar', subtipo: null, valor: null, concluida: false, animalId: null, animalNome: null };
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([registro]);
  const excluir = vi.spyOn(gestaoService, 'excluir').mockResolvedValue();
  render(<PreviaGestao secao="agenda" animais={[]} />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Excluir' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
  expect(excluir).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Excluir' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(excluir).toHaveBeenCalledWith('tarefas', 3));
});

it('confirma a exclusão de um animal e apresenta o aviso de dados vinculados', async () => {
  vi.spyOn(animaisService, 'listar').mockResolvedValue([{ id: 1, brinco: '0412', nome: 'Mimosa', categoria: 'Vaca em Lactação', producaoDiaria: 12 }]);
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 });
  const excluir = vi.spyOn(animaisService, 'excluir').mockResolvedValue();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const user = userEvent.setup();
  await user.click(within(screen.getByRole('navigation', { name: 'Áreas do aplicativo' })).getByRole('button', { name: 'Rebanho' }));
  const botao = await screen.findByRole('button', { name: /excluir mimosa/i });
  await user.click(botao);
  const dialogo = screen.getByRole('dialog', { name: 'Excluir Mimosa?' });
  expect(dialogo).toHaveTextContent('ordenhas, tarefas e eventos');
  expect(excluir).not.toHaveBeenCalled();
  await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(excluir).toHaveBeenCalledWith(1));
});

it('protege a ação de zerar o rebanho com confirmação explícita', async () => {
  vi.spyOn(animaisService, 'listar').mockResolvedValue([{ id: 1, brinco: '0412', nome: 'Mimosa', categoria: 'Vaca em Lactação', producaoDiaria: 12 }]);
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 });
  const excluir = vi.spyOn(animaisService, 'excluir').mockResolvedValue();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const user = userEvent.setup();
  await user.click(within(screen.getByRole('navigation', { name: 'Áreas do aplicativo' })).getByRole('button', { name: 'Configurações' }));
  await user.click(screen.getByRole('button', { name: /zerar rebanho/i }));
  const dialogo = screen.getByRole('dialog', { name: 'Zerar rebanho?' });
  expect(dialogo).toHaveTextContent('não pode ser desfeita');
  expect(excluir).not.toHaveBeenCalled();
  await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(excluir).toHaveBeenCalledWith(1));
});
