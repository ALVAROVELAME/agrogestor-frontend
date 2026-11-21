import { CATEGORIAS, formatarLitros, type Estatisticas } from './utils/metricas';
import ResumoFinanceiro from './ResumoFinanceiro';

const CORES = ['#3b82f6', '#d18a14', '#21a366', '#8b5cf6'];

export function VisaoGeral({ stats }: { stats: Estatisticas }) {
  const fatias = CATEGORIAS.map((categoria, i) => {
    const proporcao = stats.total ? stats.porCategoria[categoria] / stats.total * 100 : 0;
    const inicio = stats.total ? CATEGORIAS.slice(0, i).reduce((soma, c) => soma + stats.porCategoria[c], 0) / stats.total * 100 : 0;
    return { categoria, proporcao, inicio, cor: CORES[i] };
  });

  return <>
    <section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px] max-[480px]:grid-cols-2 max-[480px]:gap-[10px]" aria-label="Indicadores principais">
      <KpiCard icon="🐮" label="Animais cadastrados" value={stats.total} />
      <KpiCard icon="🥛" label="Produção cadastrada em lactação" value={formatarLitros(stats.producaoTotal)} />
      <KpiCard icon="📊" label="Média por vaca em lactação" value={stats.media === null ? '—' : formatarLitros(stats.media)} />
      <KpiCard icon="🌿" label="Vacas em lactação" value={stats.lactantes} />
    </section>
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-label="Sobre os indicadores">
      <p className="text-sm leading-relaxed text-[var(--muted)]">Retrato dos valores atuais cadastrados, não histórico de ordenhas. A média inclui todos os animais classificados em lactação, inclusive os com valor zero.</p>
      {stats.zeros > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.zeros} {stats.zeros === 1 ? 'vaca em lactação tem' : 'vacas em lactação têm'} valor zero: confira se ele foi informado. O sistema ainda não distingue zero de dado ausente.</p>}
      {stats.foraDeLactacaoComProducao > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.foraDeLactacaoComProducao} {stats.foraDeLactacaoComProducao === 1 ? 'animal fora de lactação tem produção cadastrada' : 'animais fora de lactação têm produção cadastrada'}; esses valores não entram nos indicadores acima.</p>}
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-labelledby="top5-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 id="top5-title" className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Produção cadastrada por animal</h2><span className="text-[12.5px] font-medium text-[var(--muted)]">Até 5 vacas em lactação · L/dia</span></div>
        {stats.top5.length === 0 ? <p className="text-sm text-[var(--muted)]">Cadastre animais para ver o ranking ou informe produção para vacas em lactação.</p> :
          <div className="flex flex-col gap-3">{stats.top5.map(a => <div key={String(a.id)} className="grid grid-cols-[110px_1fr_72px] items-center gap-3 max-[720px]:grid-cols-[80px_1fr_60px] max-[720px]:gap-2">
            <span className="truncate text-[13px] font-semibold text-[var(--ink)] max-[720px]:text-xs" title={`${a.nome} · ${a.brinco}`}>{a.nome}</span>
            <div className="h-[10px] overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)]" aria-hidden="true"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-2),var(--brand))] motion-safe:animate-[dashGrow_.8s_cubic-bezier(.2,.7,.2,1)_both]" style={{ width: `${stats.maxProd > 0 ? a.producaoDiaria / stats.maxProd * 100 : 0}%` }} /></div>
            <span className="text-right text-[13px] font-bold tabular-nums text-[var(--ink-soft)] max-[720px]:text-xs">{formatarLitros(a.producaoDiaria)}</span>
          </div>)}</div>}
      </section>
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-labelledby="cat-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 id="cat-title" className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Distribuição do rebanho</h2><span className="text-[12.5px] font-medium text-[var(--muted)]">Categorias atuais</span></div>
        {stats.total === 0 ? <p className="text-sm text-[var(--muted)]">Nenhum animal cadastrado.</p> : <div className="flex flex-wrap items-center gap-6">
          <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0" aria-hidden="true">{fatias.filter(f => f.proporcao > 0).map(f => <circle key={f.categoria} cx="21" cy="21" r="15.9155" fill="none" stroke={f.cor} strokeWidth="6" strokeDasharray={`${f.proporcao} ${100 - f.proporcao}`} strokeDashoffset={-f.inicio} transform="rotate(-90 21 21)" />)}<text x="21" y="21" textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="8" fontWeight="700">{stats.total}</text></svg>
          <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">{fatias.map(f => <li key={f.categoria} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: f.cor }} aria-hidden="true" />{f.categoria}</span><strong>{stats.porCategoria[f.categoria]} · {f.proporcao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</strong></li>)}</ul>
        </div>}
      </section>
    </div>
    <ResumoFinanceiro />
  </>;
}

export function KpiCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] [[data-theme=claro]_&]:border-l-2! [[data-theme=claro]_&:nth-child(4n+1)]:border-l-[#08713e]! [[data-theme=claro]_&:nth-child(4n+1)]:bg-[#f2faf4]! [[data-theme=claro]_&:nth-child(4n+2)]:border-l-[#1768a6]! [[data-theme=claro]_&:nth-child(4n+2)]:bg-[#f1f8fd]! [[data-theme=claro]_&:nth-child(4n+3)]:border-l-[#985005]! [[data-theme=claro]_&:nth-child(4n+3)]:bg-[#fff9ec]! [[data-theme=claro]_&:nth-child(4n+4)]:border-l-[#7041a4]! [[data-theme=claro]_&:nth-child(4n+4)]:bg-[#f9f5fc]! p-[18px] transition-[transform,box-shadow,border-color] duration-[180ms] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] max-[480px]:p-[14px]"><div className="flex items-start justify-between gap-2"><span className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--brand-soft)] text-[17px] text-[var(--brand)] [[data-theme=escuro]_&]:text-[var(--brand-3)] max-[480px]:h-8 max-[480px]:w-8 max-[480px]:text-[15px]" aria-hidden="true">{icon}</span></div><div className="mt-[14px] text-[11.5px] font-bold uppercase tracking-[.08em] text-[var(--muted)] max-[480px]:text-[10.5px]">{label}</div><div className="mt-1 truncate text-[22px] font-extrabold tracking-[-.03em] tabular-nums text-[var(--ink)] max-[720px]:text-[20px] max-[480px]:text-[18px]" title={String(value)}>{value}</div></div>;
}
