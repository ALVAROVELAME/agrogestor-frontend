import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import { gestaoService } from '../../services/gestao.service';

afterEach(() => vi.restoreAllMocks());

it('mostra os valores retornados pela API para o período indicado', async () => {
  const buscar = vi.spyOn(gestaoService, 'resumoFinanceiro').mockResolvedValue({ receitas: 200, despesas: 30, saldo: 170 });
  render(<ResumoFinanceiro />);
  expect(await screen.findByRole('region', { name: 'Resumo financeiro' })).toHaveTextContent('170,00');
  expect(buscar).toHaveBeenCalledOnce();
  expect(screen.getByText('Últimos 365 dias')).toBeInTheDocument();
});

it('mostra falha da API no lugar de valores fictícios', async () => {
  vi.spyOn(gestaoService, 'resumoFinanceiro').mockRejectedValue(new Error('offline'));
  render(<ResumoFinanceiro />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
  expect(screen.queryByText('R$ 0,00')).not.toBeInTheDocument();
});
