import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { gestaoService } from '../services/gestao.service';

afterEach(() => vi.restoreAllMocks());

it('obtém todas as páginas da API para não omitir lançamentos', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { content: [{ id: 1 }], totalPages: 2 } })
    .mockResolvedValueOnce({ data: { content: [{ id: 2 }], totalPages: 2 } });
  expect(await gestaoService.financeiro()).toEqual([{ id: 1 }, { id: 2 }]);
  expect(get).toHaveBeenNthCalledWith(2, '/api/financeiro/lancamentos', { params: { pagina: 1, tamanho: 100 } });
});

it('envia o tipo e valor financeiro conforme o contrato', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 1 } });
  await gestaoService.criarFinanceiro({ data: '2020-01-01', tipo: 'DESPESA', descricao: 'Ração', valor: 30 });
  expect(post).toHaveBeenCalledWith('/api/financeiro/lancamentos', { data: '2020-01-01', tipo: 'DESPESA', descricao: 'Ração', valor: 30 });
});

it('propaga falha ao carregar uma página em vez de retornar dados incompletos', async () => {
  vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { content: [{ id: 1 }], totalPages: 2 } }).mockRejectedValueOnce(new Error('rede'));
  await expect(gestaoService.producoes()).rejects.toThrow('rede');
});
