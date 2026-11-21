import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Relatorios from '../../components/dashboard/Relatorios';
import { VisaoGeral } from '../../components/dashboard/VisaoGeral';
import { calcularEstatisticas } from '../../components/dashboard/utils/metricas';
import type { Animal } from '../../types';

const animais: Animal[] = [
  { id: 1, brinco: '01', nome: 'Mimosa', categoria: 'Vaca em Lactação', producaoDiaria: 20 },
  { id: 2, brinco: '02', nome: 'Lua', categoria: 'Vaca em Lactação', producaoDiaria: 0 },
  { id: 3, brinco: '03', nome: 'Estrela', categoria: 'Bezerra', producaoDiaria: 5 },
];

it('calcula indicadores usando apenas animais em lactação e alerta valores ambíguos', () => {
  const stats = calcularEstatisticas(animais);
  expect(stats.producaoTotal).toBe(20);
  expect(stats.media).toBe(10);
  expect(stats.zeros).toBe(1);
  expect(stats.foraDeLactacaoComProducao).toBe(1);
  render(<VisaoGeral stats={stats} />);
  expect(screen.getByText(/não distingue zero de dado ausente/i)).toBeInTheDocument();
  expect(screen.getByText(/fora de lactação tem produção cadastrada/i)).toBeInTheDocument();
});

it('não cria média nem divisão por zero para rebanho vazio ou valores zerados', () => {
  expect(calcularEstatisticas([]).media).toBeNull();
  const stats = calcularEstatisticas([{ ...animais[1] }]);
  expect(stats.media).toBe(0);
  expect(stats.maxProd).toBe(0);
  expect(stats.top5).toEqual([]);
  const { container } = render(<VisaoGeral stats={stats} />);
  expect(container.innerHTML).not.toContain('NaN');
});

it('aplica filtros aos indicadores e à tabela e permite limpá-los', async () => {
  render(<Relatorios animais={animais} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Categoria'), 'Bezerra');
  expect(screen.getByText('1 de 3 animais')).toBeInTheDocument();
  const tabela = screen.getByRole('region', { name: 'Tabela de animais' });
  expect(within(tabela).getByText('Estrela')).toBeInTheDocument();
  expect(within(tabela).queryByText('Mimosa')).not.toBeInTheDocument();
  expect(screen.getByText(/fora de lactação com produção cadastrada/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(screen.getByText('3 de 3 animais')).toBeInTheDocument();
  expect(within(tabela).getByText('Mimosa')).toBeInTheDocument();
});

it('busca por brinco e mostra estado vazio quando não há correspondência', async () => {
  render(<Relatorios animais={animais} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Nome ou brinco'), '02');
  expect(screen.getByText('1 de 3 animais')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Tabela de animais' })).getByText('Lua')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Nome ou brinco'));
  await user.type(screen.getByLabelText('Nome ou brinco'), 'não existe');
  expect(screen.getByText('0 de 3 animais')).toBeInTheDocument();
  expect(screen.getAllByText('Nenhum animal corresponde aos filtros.')).toHaveLength(2);
});
