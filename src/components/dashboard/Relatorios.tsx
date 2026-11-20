import { useMemo, useState } from 'react';
import type { Animal } from '../../types';
import { CATEGORIAS, calcularEstatisticas, formatarLitros } from './metricas';
import { KpiCard } from './VisaoGeral';
import ResumoFinanceiro from './ResumoFinanceiro';

const normalizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Relatorios({ animais }: { animais: Animal[] }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [ordem, setOrdem] = useState('nome');
  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const resultado = animais.filter(a => (categoria === 'Todas' || a.categoria === categoria) && (!termo || normalizar(`${a.nome} ${a.brinco}`).includes(termo)));
    return [...resultado].sort((a, b) => ordem === 'producao' ? b.producaoDiaria - a.producaoDiaria || a.nome.localeCompare(b.nome, 'pt-BR') : a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [animais, busca, categoria, ordem]);
  const stats = useMemo(() => calcularEstatisticas(filtrados), [filtrados]);
  const cores = ['#3b82f6', '#d18a14', '#21a366', '#8b5cf6'];

  return <>
    <section className="dash-panel" aria-labelledby="filtros-relatorio">
      <div className="dash-panel-head"><h2 id="filtros-relatorio" className="dash-panel-title">Filtros do relatório</h2><span className="dash-panel-meta">{filtrados.length} de {animais.length} animais</span></div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
        <label className="flex flex-col gap-1.5"><span className="af-label">Nome ou brinco</span><input className="af-input" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar animal" /></label>
        <label className="flex flex-col gap-1.5"><span className="af-label">Categoria</span><select className="af-select" value={categoria} onChange={e => setCategoria(e.target.value)}><option>Todas</option>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="flex flex-col gap-1.5"><span className="af-label">Ordenar por</span><select className="af-select" value={ordem} onChange={e => setOrdem(e.target.value)}><option value="nome">Nome</option><option value="producao">Maior produção cadastrada</option></select></label>
      </div>
      {(busca || categoria !== 'Todas' || ordem !== 'nome') && <button className="dash-btn dash-btn-ghost mt-4" type="button" onClick={() => { setBusca(''); setCategoria('Todas'); setOrdem('nome'); }}>Limpar filtros</button>}
    </section>

    <section className="dash-kpis" aria-label="Indicadores dos animais filtrados">
      <KpiCard icon="🐮" label="Animais filtrados" value={stats.total} />
      <KpiCard icon="🥛" label="Produção cadastrada em lactação" value={formatarLitros(stats.producaoTotal)} />
      <KpiCard icon="📊" label="Média por vaca em lactação" value={stats.media === null ? '—' : formatarLitros(stats.media)} />
      <KpiCard icon="🏆" label="Maior produção em lactação" value={stats.maior?.nome ?? '—'} />
    </section>
    <section className="dash-panel" aria-label="Leitura dos dados">
      <p className="text-sm leading-relaxed text-[var(--muted)]">Os filtros afetam os indicadores, o gráfico e a tabela. São valores atuais cadastrados, sem histórico por período. A média considera vacas em lactação, incluindo valores zero.</p>
      {stats.zeros > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.zeros} {stats.zeros === 1 ? 'vaca em lactação tem' : 'vacas em lactação têm'} valor zero, que pode representar produção não informada.</p>}
      {stats.foraDeLactacaoComProducao > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">Há {stats.foraDeLactacaoComProducao} {stats.foraDeLactacaoComProducao === 1 ? 'animal fora de lactação com produção cadastrada' : 'animais fora de lactação com produção cadastrada'}; confira a categoria e o valor.</p>}
    </section>
    <section className="dash-panel" aria-labelledby="categorias-relatorio">
      <div className="dash-panel-head"><h2 id="categorias-relatorio" className="dash-panel-title">Animais por categoria</h2><span className="dash-panel-meta">Resultado filtrado</span></div>
      {stats.total === 0 ? <p className="text-sm text-[var(--muted)]">Nenhum animal corresponde aos filtros.</p> : <>
        <div className="flex h-5 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true">
          {CATEGORIAS.map((c, i) => <div key={c} style={{ width: `${stats.porCategoria[c] / stats.total * 100}%`, background: cores[i] }} />)}
        </div>
        <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">{CATEGORIAS.map((c, i) => <li key={c} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: cores[i] }} aria-hidden="true" />{c}</span><strong>{stats.porCategoria[c]} · {(stats.porCategoria[c] / stats.total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></li>)}</ul>
      </>}
    </section>
    <ResumoFinanceiro emRelatorio />
    <section className="dash-panel" aria-labelledby="rel-title">
      <div className="dash-panel-head"><h2 id="rel-title" className="dash-panel-title">Relatório detalhado</h2><button type="button" className="dash-btn dash-btn-ghost" onClick={() => window.print()}>🖨️ Imprimir</button></div>
      <p className="dash-table-hint" aria-hidden="true"><span>↔</span> Arraste para o lado para ver todas as colunas</p>
      <div className="dash-table-wrap" role="region" aria-label="Tabela de animais" tabIndex={0}><table className="dash-table">
        <caption className="sr-only">Relatório detalhado dos animais filtrados, com valores atuais cadastrados</caption>
        <thead><tr><th scope="col">Brinco</th><th scope="col">Nome</th><th scope="col">Categoria</th><th scope="col" className="num">Produção cadastrada</th></tr></thead>
        <tbody>{filtrados.map(a => <tr key={String(a.id)}><td className="brinco-cell">{a.brinco}</td><td>{a.nome}</td><td><span className="dash-cat-badge">{a.categoria}</span></td><td className="num">{formatarLitros(a.producaoDiaria)}</td></tr>)}
          {filtrados.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>Nenhum animal corresponde aos filtros.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </>;
}
