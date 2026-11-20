import { CATEGORIAS, formatarLitros, type Estatisticas } from './metricas';
import ResumoFinanceiro from './ResumoFinanceiro';

const CORES = ['#3b82f6', '#d18a14', '#21a366', '#8b5cf6'];

export function VisaoGeral({ stats }: { stats: Estatisticas }) {
  const fatias = CATEGORIAS.map((categoria, i) => {
    const proporcao = stats.total ? stats.porCategoria[categoria] / stats.total * 100 : 0;
    const inicio = stats.total ? CATEGORIAS.slice(0, i).reduce((soma, c) => soma + stats.porCategoria[c], 0) / stats.total * 100 : 0;
    return { categoria, proporcao, inicio, cor: CORES[i] };
  });

  return <>
    <section className="dash-kpis" aria-label="Indicadores principais">
      <KpiCard icon="🐮" label="Animais cadastrados" value={stats.total} />
      <KpiCard icon="🥛" label="Produção cadastrada em lactação" value={formatarLitros(stats.producaoTotal)} />
      <KpiCard icon="📊" label="Média por vaca em lactação" value={stats.media === null ? '—' : formatarLitros(stats.media)} />
      <KpiCard icon="🌿" label="Vacas em lactação" value={stats.lactantes} />
    </section>
    <section className="dash-panel" aria-label="Sobre os indicadores">
      <p className="text-sm leading-relaxed text-[var(--muted)]">Retrato dos valores atuais cadastrados, não histórico de ordenhas. A média inclui todos os animais classificados em lactação, inclusive os com valor zero.</p>
      {stats.zeros > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.zeros} {stats.zeros === 1 ? 'vaca em lactação tem' : 'vacas em lactação têm'} valor zero: confira se ele foi informado. O sistema ainda não distingue zero de dado ausente.</p>}
      {stats.foraDeLactacaoComProducao > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.foraDeLactacaoComProducao} {stats.foraDeLactacaoComProducao === 1 ? 'animal fora de lactação tem produção cadastrada' : 'animais fora de lactação têm produção cadastrada'}; esses valores não entram nos indicadores acima.</p>}
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="dash-panel" aria-labelledby="top5-title">
        <div className="dash-panel-head"><h2 id="top5-title" className="dash-panel-title">Produção cadastrada por animal</h2><span className="dash-panel-meta">Até 5 vacas em lactação · L/dia</span></div>
        {stats.top5.length === 0 ? <p className="text-sm text-[var(--muted)]">Cadastre animais para ver o ranking ou informe produção para vacas em lactação.</p> :
          <div className="dash-chart-rows">{stats.top5.map(a => <div key={String(a.id)} className="dash-chart-row">
            <span className="dash-chart-label" title={`${a.nome} · ${a.brinco}`}>{a.nome}</span>
            <div className="dash-chart-track" aria-hidden="true"><div className="dash-chart-fill" style={{ width: `${stats.maxProd > 0 ? a.producaoDiaria / stats.maxProd * 100 : 0}%` }} /></div>
            <span className="dash-chart-value">{formatarLitros(a.producaoDiaria)}</span>
          </div>)}</div>}
      </section>
      <section className="dash-panel" aria-labelledby="cat-title">
        <div className="dash-panel-head"><h2 id="cat-title" className="dash-panel-title">Distribuição do rebanho</h2><span className="dash-panel-meta">Categorias atuais</span></div>
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
  return <div className="dash-kpi"><div className="dash-kpi-head"><span className="dash-kpi-icon" aria-hidden="true">{icon}</span></div><div className="dash-kpi-label">{label}</div><div className="dash-kpi-value" title={String(value)}>{value}</div></div>;
}
