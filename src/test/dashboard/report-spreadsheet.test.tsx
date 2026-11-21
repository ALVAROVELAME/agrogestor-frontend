import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Relatorios from '../../components/dashboard/Relatorios';
import * as planilha from '../../components/dashboard/utils/planilhaRelatorio';
import { gestaoService } from '../../services/gestao.service';
import type { Animal } from '../../types';

const animais: Animal[] = [
  { id: 1, nome: 'Mimosa', brinco: '001', categoria: 'Vaca em Lactação', producaoDiaria: 20 },
  { id: 2, nome: '=1+1', brinco: '002', categoria: 'Bezerra', producaoDiaria: 0 },
];
const financeiro = { receitas: 500, despesas: 300, saldo: 200 };
afterEach(() => vi.restoreAllMocks());

it('gera planilha Excel com filtros, indicadores, financeiro e células seguras', async () => {
  const arquivo = await planilha.criarPlanilhaRelatorio({
    animais, totalAnimais: 3, busca: '01', categoria: 'Todas', ordem: 'nome',
    financeiro, producoes: [], tarefas: [], eventos: [], lancamentos: [], inicio: '2025-11-21', fim: '2026-11-20', geradoEm: new Date(2026, 10, 20, 12),
  });
  const resumo = arquivo.getWorksheet('Resumo')!;
  const tabela = arquivo.getWorksheet('Animais filtrados')!;
  expect(resumo.getCell('B3').value).toBe('01');
  expect(resumo.getCell('B6').value).toBe('2 / 3');
  expect(resumo.getCell('B11').value).toBe(20);
  expect(resumo.getCell('B25').value).toBe(500);
  expect(resumo.getCell('B27').value).toBe(200);
  expect(tabela.getCell('A2').value).toBe('001');
  expect(tabela.getCell('B3').value).toBe('=1+1');
  expect(tabela.getCell('B3').type).not.toBe(6);
  expect(tabela.autoFilter).toEqual({ from: 'A1', to: 'F3' });
  const bytes = await arquivo.xlsx.writeBuffer();
  expect(bytes.byteLength).toBeGreaterThan(1000);
  const ExcelJS = await import('exceljs');
  const aberto = new ExcelJS.Workbook();
  await aberto.xlsx.load(bytes);
  expect(aberto.getWorksheet('Animais filtrados')!.getCell('B3').value).toBe('=1+1');
  expect(aberto.getWorksheet('Resumo')!.getCell('B27').value).toBe(200);
}, 60000);

it('representa rebanho vazio sem criar média fictícia', async () => {
  const arquivo = await planilha.criarPlanilhaRelatorio({
    animais: [], totalAnimais: 0, busca: '', categoria: 'Todas', ordem: 'nome',
    financeiro: { receitas: 0, despesas: 0, saldo: 0 }, producoes: [], tarefas: [], eventos: [], lancamentos: [], inicio: '2025-11-21', fim: '2026-11-20', geradoEm: new Date(),
  });
  expect(arquivo.getWorksheet('Resumo')!.getCell('B12').value).toBe('Não disponível');
  expect(arquivo.getWorksheet('Animais filtrados')!.rowCount).toBe(1);
}, 60000);

it('envia à planilha somente os animais filtrados e os dados financeiros', async () => {
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue(financeiro);
  vi.spyOn(gestaoService, 'producoes').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'eventos').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'financeiro').mockResolvedValue([]);
  const baixar = vi.spyOn(planilha, 'baixarPlanilhaRelatorio').mockResolvedValue();
  render(<Relatorios animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Categoria'), 'Bezerra');
  await user.click(screen.getByRole('button', { name: /baixar planilha/i }));
  await waitFor(() => expect(baixar).toHaveBeenCalledWith(expect.objectContaining({
    animais: [animais[1]], totalAnimais: 2, categoria: 'Bezerra', financeiro,
  })));
});

it('não baixa planilha incompleta se a API do financeiro falhar', async () => {
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockRejectedValue(new Error('API indisponível'));
  vi.spyOn(gestaoService, 'producoes').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'eventos').mockResolvedValue([]);
  vi.spyOn(gestaoService, 'financeiro').mockResolvedValue([]);
  const baixar = vi.spyOn(planilha, 'baixarPlanilhaRelatorio').mockResolvedValue();
  render(<Relatorios animais={animais} />);
  await userEvent.click(screen.getByRole('button', { name: /baixar planilha/i }));
  expect(await screen.findByText(/não foi possível gerar a planilha/i)).toBeInTheDocument();
  expect(baixar).not.toHaveBeenCalled();
});

it('impede a exportação se o rebanho não carregou', () => {
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue(financeiro);
  render(<Relatorios animais={[]} erroAnimais="Falha" />);
  expect(screen.getByRole('button', { name: /baixar planilha/i })).toBeDisabled();
  expect(screen.getByText(/exportação está indisponível/i)).toBeInTheDocument();
});

it('exporta detalhes com datas, valores e textos seguros após reabrir o arquivo', async () => {
  const ordenha = { id: 10, animalId: 1, animalNome: 'Mimosa', data: '2026-11-19', turno: 'MANHA' as const, litros: 18.5 };
  const tarefa = { id: 20, data: '2026-11-01', descricao: 'Revisar ordenhadeira', subtipo: null, valor: null, concluida: false, animalId: null, animalNome: null };
  const evento = { id: 30, data: '2026-11-18', descricao: '=texto', subtipo: 'VACINACAO', valor: null, concluida: null, animalId: 1, animalNome: 'Mimosa' };
  const lancamento = { id: 40, data: '2026-11-19', descricao: 'Venda de leite', subtipo: 'RECEITA', valor: 500, concluida: null, animalId: null, animalNome: null };
  const arquivo = await planilha.criarPlanilhaRelatorio({ animais, totalAnimais: 2, busca: '', categoria: 'Todas', ordem: 'nome', financeiro, producoes: [ordenha], tarefas: [tarefa], eventos: [evento], lancamentos: [lancamento], inicio: '2025-11-21', fim: '2026-11-20', geradoEm: new Date(2026, 10, 20, 12) });
  const ExcelJS = await import('exceljs');
  const aberto = new ExcelJS.Workbook();
  await aberto.xlsx.load(await arquivo.xlsx.writeBuffer());
  expect(aberto.worksheets.map(a => a.name)).toEqual(['Resumo', 'Animais filtrados', 'Ordenhas', 'Eventos', 'Tarefas', 'Financeiro']);
  expect(aberto.getWorksheet('Ordenhas')!.getCell('C2').value).toBe('001');
  expect(aberto.getWorksheet('Ordenhas')!.getCell('E2').value).toBe(18.5);
  expect(aberto.getWorksheet('Ordenhas')!.getCell('A2').numFmt).toBe('dd/mm/yyyy');
  expect(aberto.getWorksheet('Tarefas')!.getCell('C2').value).toBe('Em atraso');
  expect(aberto.getWorksheet('Eventos')!.getCell('E2').value).toBe('=texto');
  expect(aberto.getWorksheet('Eventos')!.getCell('E2').type).not.toBe(6);
  expect(aberto.getWorksheet('Financeiro')!.getCell('D2').value).toBe(500);
  expect(aberto.getWorksheet('Resumo')!.getCell('B36').value).toBe(1);
}, 60000);

it('filtra registros vinculados e inclui tarefas gerais e financeiro do período', async () => {
  const data = new Date();
  const hoje = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const registro = { id: 1, data: hoje, descricao: 'Registro', subtipo: null, valor: null, concluida: false, animalId: null, animalNome: null };
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue(financeiro);
  vi.spyOn(gestaoService, 'producoes').mockResolvedValue([{ id: 1, animalId: 1, animalNome: 'Mimosa', data: hoje, turno: 'MANHA', litros: 10 }, { id: 2, animalId: 2, animalNome: 'Outra', data: hoje, turno: 'TARDE', litros: 3 }]);
  vi.spyOn(gestaoService, 'eventos').mockResolvedValue([{ ...registro, animalId: 1 }, { ...registro, id: 2, animalId: 2 }]);
  vi.spyOn(gestaoService, 'tarefas').mockResolvedValue([registro, { ...registro, id: 2, animalId: 1 }, { ...registro, id: 3, animalId: 2 }]);
  vi.spyOn(gestaoService, 'financeiro').mockResolvedValue([{ ...registro, valor: 20 }, { ...registro, id: 4, data: '2000-01-01', valor: 10 }]);
  const baixar = vi.spyOn(planilha, 'baixarPlanilhaRelatorio').mockResolvedValue();
  render(<Relatorios animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Categoria'), 'Vaca em Lactação');
  await user.click(screen.getByRole('button', { name: /baixar planilha/i }));
  await waitFor(() => expect(baixar).toHaveBeenCalledWith(expect.objectContaining({ producoes: [expect.objectContaining({ animalId: 1 })], eventos: [expect.objectContaining({ animalId: 1 })], tarefas: [expect.objectContaining({ animalId: null }), expect.objectContaining({ animalId: 1 })], lancamentos: [expect.objectContaining({ id: 1 })] })));
});
