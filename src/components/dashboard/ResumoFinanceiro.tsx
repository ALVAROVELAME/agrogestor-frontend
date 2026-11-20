import { useCallback, useEffect, useState } from 'react';
import { formatarDinheiro } from './financeiroExemplo';
import { gestaoService, type FinanceiroResumo } from '../../services/gestao.service';

export default function ResumoFinanceiro({ emRelatorio = false }: { emRelatorio?: boolean }) {
  const [dados, setDados] = useState<FinanceiroResumo | null>(null);
  const [erro, setErro] = useState(false);
  const carregar = useCallback(async () => {
    const fim = new Date();
    const inicio = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - 364);
    const data = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    try { setDados(await gestaoService.resumoFinanceiro(data(inicio), data(fim))); setErro(false); }
    catch { setDados(null); setErro(true); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(carregar);
    window.addEventListener('agrogestor:financeiro-atualizado', carregar);
    return () => window.removeEventListener('agrogestor:financeiro-atualizado', carregar);
  }, [carregar]);
  if (erro) return <section className="dash-panel"><p role="alert">Não foi possível carregar o resumo financeiro da API.</p><button type="button" onClick={() => void carregar()}>Tentar novamente</button></section>;
  if (!dados) return <section className="dash-panel" role="status">Carregando resumo financeiro…</section>;
  const { receitas, despesas, saldo } = dados;
  const maior = Math.max(receitas, despesas, 1);
  return <section className="dash-panel" aria-label="Resumo financeiro">
    <div className="dash-panel-head"><h2 className="dash-panel-title">Financeiro</h2><span className="dash-panel-meta">Últimos 365 dias</span></div>
    {emRelatorio && <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Os filtros de animais não alteram este resumo financeiro.</p>}
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      <div><dt className="text-sm text-[var(--muted)]">Receitas</dt><dd className="text-lg font-bold">{formatarDinheiro(receitas)}</dd></div>
      <div><dt className="text-sm text-[var(--muted)]">Despesas</dt><dd className="text-lg font-bold">{formatarDinheiro(despesas)}</dd></div>
      <div><dt className="text-sm text-[var(--muted)]">Saldo</dt><dd className="text-lg font-bold">{formatarDinheiro(saldo)}</dd></div>
    </dl>
    <div className="mt-5 grid gap-3" aria-label="Comparação entre receitas e despesas">
      {([{ nome: 'Receitas', valor: receitas, cor: '#21a366' }, { nome: 'Despesas', valor: despesas, cor: '#d18a14' }]).map(item => <div key={item.nome}>
        <div className="mb-1 flex justify-between gap-2 text-sm"><span>{item.nome}</span><strong>{formatarDinheiro(item.valor)}</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${item.valor / maior * 100}%`, background: item.cor }} /></div>
      </div>)}
    </div>
  </section>;
}
