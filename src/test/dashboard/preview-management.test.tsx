import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreviaGestao from '../../components/dashboard/PreviaGestao';
import { gestaoService } from '../../services/gestao.service';
import type { Animal } from '../../types';

const animais: Animal[] = [{ id: 9, nome: 'Mimosa', brinco: '0412', categoria: 'Vaca em Lactação', producaoDiaria: 20 }];
beforeEach(() => { vi.restoreAllMocks(); });

it('carrega animais reais e envia a ordenha à API', async () => {
  vi.spyOn(gestaoService, 'producoes').mockResolvedValue([]);
  const criar = vi.spyOn(gestaoService, 'criarProducao').mockResolvedValue({ id: 1, animalId: 9, animalNome: 'Mimosa', data: '2020-01-01', turno: 'TARDE', litros: 5 });
  render(<PreviaGestao secao="producao" animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Animal'), '9');
  await user.type(screen.getByLabelText('Litros'), '5');
  await user.selectOptions(screen.getByLabelText('Turno'), 'TARDE');
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(criar).toHaveBeenCalledWith(expect.objectContaining({ animalId: 9, litros: 5, turno: 'TARDE' })));
  expect(await screen.findByRole('status')).toHaveTextContent('Ordenha registrada');
});

it('mostra erro da API e não informa sucesso quando o cadastro falha', async () => {
  vi.spyOn(gestaoService, 'financeiro').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'criarFinanceiro').mockRejectedValue({ response: { data: { mensagem: 'Falha no lançamento' } } });
  render(<PreviaGestao secao="financeiro" animais={animais} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Descrição'), 'Ração');
  await user.type(screen.getByLabelText('Valor em reais'), '20');
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha no lançamento');
  expect(screen.queryByText('Lançamento registrado.')).not.toBeInTheDocument();
});

it('conclui uma tarefa na API e recarrega os registros', async () => {
  const registro = { id: 3, data: '2020-01-01', descricao: 'Vacinar', subtipo: null, valor: null, concluida: false, animalId: null, animalNome: null };
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([registro]);
  const atualizar = vi.spyOn(gestaoService, 'atualizarTarefa').mockResolvedValue({ ...registro, concluida: true });
  render(<PreviaGestao secao="agenda" animais={animais} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Concluir' }));
  await waitFor(() => expect(atualizar).toHaveBeenCalledWith(3, true));
});

it('carrega e salva os dados complementares da ficha', async () => {
  const ficha = { id: 9, nome: 'Mimosa', brinco: '0412', dataNascimento: null, raca: '', origem: '', observacoes: '' };
  vi.spyOn(gestaoService, 'ficha').mockResolvedValue(ficha);
  const atualizar = vi.spyOn(gestaoService, 'atualizarFicha').mockResolvedValue(ficha);
  render(<PreviaGestao secao="ficha" animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Animal'), '9');
  await user.type(await screen.findByLabelText('Raça'), 'Holandesa');
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(atualizar).toHaveBeenCalledWith('9', expect.objectContaining({ raca: 'Holandesa' })));
});

it('envia evento com o id do animal e o tipo esperado pela API', async () => {
  vi.spyOn(gestaoService, 'eventos').mockResolvedValue([]);
  const registro = { id: 1, data: '2020-01-01', descricao: 'Dose anual', subtipo: 'VACINACAO', valor: null, concluida: null, animalId: 9, animalNome: 'Mimosa' };
  const criar = vi.spyOn(gestaoService, 'criarEvento').mockResolvedValue(registro);
  render(<PreviaGestao secao="eventos" animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Animal'), '9');
  await user.selectOptions(screen.getByLabelText('Tipo de evento'), 'VACINACAO');
  await user.type(screen.getByLabelText('Descrição'), 'Dose anual');
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(criar).toHaveBeenCalledWith(expect.objectContaining({ animalId: 9, tipo: 'VACINACAO', descricao: 'Dose anual' })));
});

it('informa falha ao buscar registros sem apresentar dados de exemplo', async () => {
  vi.spyOn(gestaoService, 'eventos').mockRejectedValue(new Error('offline'));
  render(<PreviaGestao secao="eventos" animais={animais} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível acessar a API');
  expect(screen.queryByText('Acompanhamento de rotina')).not.toBeInTheDocument();
});
