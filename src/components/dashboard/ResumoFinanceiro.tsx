import { useCallback, useEffect, useState } from 'react';
import { formatarDinheiro } from './utils/financeiroExemplo';
import { gestaoService, type FinanceiroResumo } from '../../services/gestao.service';
import { periodoFinanceiro } from './utils/periodoFinanceiro';

export default function ResumoFinanceiro({ emRelatorio = false }: { emRelatorio?: boolean }) {
  const [dados, setDados] = useState<FinanceiroResumo | null>(null);
  const [erro, setErro] = useState(false);
  const carregar = useCallback(async () => {
    const { inicio, fim } = periodoFinanceiro();
    try { setDados(await gestaoService.resumoFinanceiro(inicio, fim)); setErro(false); }
    catch { setDados(null); setErro(true); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(carregar);
    window.addEventListener('agrogestor:financeiro-atualizado', carregar);
    return () => window.removeEventListener('agrogestor:financeiro-atualizado', carregar);
  }, [carregar]);
  if (erro) return <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4"><p role="alert">Não foi possível carregar o resumo financeiro da API.</p><button type="button" onClick={() => void carregar()}>Tentar novamente</button></section>;
  if (!dados) return <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" role="status">Carregando resumo financeiro…</section>;
  const { receitas, despesas, saldo } = dados;
  const maior = Math.max(receitas, despesas, 1);
  return <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-label="Resumo financeiro">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Financeiro</h2><span className="text-[12.5px] font-medium text-[var(--muted)]">Últimos 365 dias</span></div>
    {emRelatorio && <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Os filtros de animais não alteram este resumo financeiro.</p>}
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl p-3 [[data-theme=claro]_&]:bg-[#f1faf4]"><dt className="text-sm text-[var(--muted)]">Receitas</dt><dd className="text-lg font-bold [[data-theme=claro]_&]:text-[#14532d]">{formatarDinheiro(receitas)}</dd></div>
      <div className="rounded-xl p-3 [[data-theme=claro]_&]:bg-[#fff8f0]"><dt className="text-sm text-[var(--muted)]">Despesas</dt><dd className="text-lg font-bold [[data-theme=claro]_&]:text-[#853d0e]">{formatarDinheiro(despesas)}</dd></div>
      <div className="rounded-xl p-3 [[data-theme=claro]_&]:bg-[#f2f7fd]"><dt className="text-sm text-[var(--muted)]">Saldo</dt><dd className="text-lg font-bold [[data-theme=claro]_&]:text-[#1b4f88]">{formatarDinheiro(saldo)}</dd></div>
    </dl>
    <div className="mt-5 grid gap-3" aria-label="Comparação entre receitas e despesas">
      {([{ nome: 'Receitas', valor: receitas, cor: '#21a366' }, { nome: 'Despesas', valor: despesas, cor: '#d18a14' }]).map(item => <div key={item.nome}>
        <div className="mb-1 flex justify-between gap-2 text-sm"><span>{item.nome}</span><strong>{formatarDinheiro(item.valor)}</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${item.valor / maior * 100}%`, background: item.cor }} /></div>
      </div>)}
    </div>
  </section>;
}
