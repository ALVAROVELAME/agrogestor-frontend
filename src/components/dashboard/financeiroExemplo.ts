export type LancamentoExemplo = { id: number; descricao: string; tipo: 'Receita' | 'Despesa'; valor: number; data: string };

export function criarLancamentosExemplo(): LancamentoExemplo[] {
  const hoje = new Date();
  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return [
    { id: 1, descricao: 'Venda de leite', tipo: 'Receita', valor: 250, data },
    { id: 2, descricao: 'Alimentação', tipo: 'Despesa', valor: 80, data },
  ];
}

export const formatarDinheiro = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function calcularFinanceiro(lancamentos: LancamentoExemplo[]) {
  const somarCentavos = (tipo: LancamentoExemplo['tipo']) => lancamentos
    .filter(item => item.tipo === tipo)
    .reduce((total, item) => total + Math.round(item.valor * 100), 0);
  const receitas = somarCentavos('Receita');
  const despesas = somarCentavos('Despesa');
  return { receitas: receitas / 100, despesas: despesas / 100, saldo: (receitas - despesas) / 100 };
}
