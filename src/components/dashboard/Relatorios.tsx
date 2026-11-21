import { useMemo, useState } from 'react';
import type { Animal } from '../../types';
import { CATEGORIAS, calcularEstatisticas, formatarLitros } from './utils/metricas';
import { KpiCard } from './VisaoGeral';
import ResumoFinanceiro from './ResumoFinanceiro';
import { gestaoService } from '../../services/gestao.service';
import { periodoFinanceiro } from './utils/periodoFinanceiro';
import { baixarPlanilhaRelatorio } from './utils/planilhaRelatorio';

const normalizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Relatorios({ animais, carregandoAnimais = false, erroAnimais = null }: { animais: Animal[]; carregandoAnimais?: boolean; erroAnimais?: string | null }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [ordem, setOrdem] = useState('nome');
  const [exportando, setExportando] = useState(false);
  const [erroExportacao, setErroExportacao] = useState('');
  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const resultado = animais.filter(a => (categoria === 'Todas' || a.categoria === categoria) && (!termo || normalizar(`${a.nome} ${a.brinco}`).includes(termo)));
    return [...resultado].sort((a, b) => ordem === 'producao' ? b.producaoDiaria - a.producaoDiaria || a.nome.localeCompare(b.nome, 'pt-BR') : a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [animais, busca, categoria, ordem]);
  const stats = useMemo(() => calcularEstatisticas(filtrados), [filtrados]);
  const cores = ['#3b82f6', '#d18a14', '#21a366', '#8b5cf6'];
  async function exportar() {
    setExportando(true);
    setErroExportacao('');
    try {
      const geradoEm = new Date();
      const periodo = periodoFinanceiro(geradoEm);
      const [financeiro, producoes, tarefas, eventos, lancamentos] = await Promise.all([
        gestaoService.resumoFinanceiro(periodo.inicio, periodo.fim),
        gestaoService.producoes(), gestaoService.tarefas(), gestaoService.eventos(), gestaoService.financeiro(),
      ]);
      const ids = new Set(filtrados.filter(a => a.id != null).map(a => String(a.id)));
      const vinculado = (id: number | null) => id != null && ids.has(String(id));
      await baixarPlanilhaRelatorio({
        animais: filtrados, totalAnimais: animais.length, busca, categoria, ordem, financeiro, ...periodo, geradoEm,
        producoes: producoes.filter(p => vinculado(p.animalId)),
        eventos: eventos.filter(e => vinculado(e.animalId)),
        tarefas: tarefas.filter(t => t.animalId == null || vinculado(t.animalId)),
        lancamentos: lancamentos.filter(l => l.data >= periodo.inicio && l.data <= periodo.fim),
      });
    } catch {
      setErroExportacao('Não foi possível gerar a planilha. Confira a conexão com a API e tente novamente.');
    } finally {
      setExportando(false);
    }
  }

  return <>
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-labelledby="filtros-relatorio">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 id="filtros-relatorio" className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Filtros do relatório</h2><span className="text-[12.5px] font-medium text-[var(--muted)]">{filtrados.length} de {animais.length} animais</span></div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
        <label className="flex flex-col gap-1.5"><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Nome ou brinco</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar animal" /></label>
        <label className="flex flex-col gap-1.5"><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Categoria</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={categoria} onChange={e => setCategoria(e.target.value)}><option>Todas</option>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="flex flex-col gap-1.5"><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Ordenar por</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={ordem} onChange={e => setOrdem(e.target.value)}><option value="nome">Nome</option><option value="producao">Maior produção cadastrada</option></select></label>
      </div>
      {(busca || categoria !== 'Todas' || ordem !== 'nome') && <button className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-[10px] text-[13.5px] font-semibold text-[var(--ink)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:border-[var(--brand)] hover:enabled:bg-[var(--brand-soft)] hover:enabled:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:text-[var(--brand-3)] mt-4" type="button" onClick={() => { setBusca(''); setCategoria('Todas'); setOrdem('nome'); }}>Limpar filtros</button>}
    </section>

    <section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px] max-[480px]:grid-cols-2 max-[480px]:gap-[10px]" aria-label="Indicadores dos animais filtrados">
      <KpiCard icon="🐮" label="Animais filtrados" value={stats.total} />
      <KpiCard icon="🥛" label="Produção cadastrada em lactação" value={formatarLitros(stats.producaoTotal)} />
      <KpiCard icon="📊" label="Média por vaca em lactação" value={stats.media === null ? '—' : formatarLitros(stats.media)} />
      <KpiCard icon="🏆" label="Maior produção em lactação" value={stats.maior?.nome ?? '—'} />
    </section>
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-label="Leitura dos dados">
      <p className="text-sm leading-relaxed text-[var(--muted)]">Os filtros afetam os indicadores, o gráfico e a tabela. São valores atuais cadastrados, sem histórico por período. A média considera vacas em lactação, incluindo valores zero.</p>
      {stats.zeros > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">{stats.zeros} {stats.zeros === 1 ? 'vaca em lactação tem' : 'vacas em lactação têm'} valor zero, que pode representar produção não informada.</p>}
      {stats.foraDeLactacaoComProducao > 0 && <p className="mt-2 text-sm font-semibold text-[var(--warn)]">Há {stats.foraDeLactacaoComProducao} {stats.foraDeLactacaoComProducao === 1 ? 'animal fora de lactação com produção cadastrada' : 'animais fora de lactação com produção cadastrada'}; confira a categoria e o valor.</p>}
    </section>
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-labelledby="categorias-relatorio">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 id="categorias-relatorio" className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Animais por categoria</h2><span className="text-[12.5px] font-medium text-[var(--muted)]">Resultado filtrado</span></div>
      {stats.total === 0 ? <p className="text-sm text-[var(--muted)]">Nenhum animal corresponde aos filtros.</p> : <>
        <div className="flex h-5 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true">
          {CATEGORIAS.map((c, i) => <div key={c} style={{ width: `${stats.porCategoria[c] / stats.total * 100}%`, background: cores[i] }} />)}
        </div>
        <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">{CATEGORIAS.map((c, i) => <li key={c} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: cores[i] }} aria-hidden="true" />{c}</span><strong>{stats.porCategoria[c]} · {(stats.porCategoria[c] / stats.total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></li>)}</ul>
      </>}
    </section>
    <ResumoFinanceiro emRelatorio />
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4" aria-labelledby="rel-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[480px]:gap-2"><h2 id="rel-title" className="text-[14.5px] font-bold tracking-[-.01em] text-[var(--ink)]">Relatório detalhado</h2><button type="button" className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-[10px] text-[13.5px] font-semibold text-[var(--ink)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:border-[var(--brand)] hover:enabled:bg-[var(--brand-soft)] hover:enabled:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:text-[var(--brand-3)]" onClick={() => void exportar()} disabled={exportando || carregandoAnimais || !!erroAnimais}>{exportando ? 'Preparando planilha…' : '↓ Baixar planilha (.xlsx)'}</button></div>
      <p className="mb-3 text-sm text-[var(--muted)]">A planilha inclui animais filtrados, ordenhas e eventos vinculados, tarefas gerais ou vinculadas e o financeiro completo dos últimos 365 dias.</p>
      {carregandoAnimais && <p role="status">Carregando dados do rebanho para exportação…</p>}
      {erroAnimais && <p role="alert">Não foi possível carregar o rebanho. A exportação está indisponível.</p>}
      {erroExportacao && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--danger,#991b1b)] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']">{erroExportacao}</p>}
      <p className="mb-2 hidden items-center gap-1.5 text-xs font-medium text-[var(--muted)] max-[720px]:flex" aria-hidden="true"><span>↔</span> Arraste para o lado para ver todas as colunas</p>
      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] max-[720px]:overflow-x-auto max-[720px]:overscroll-x-contain max-[720px]:[scrollbar-width:thin]" role="region" aria-label="Tabela de animais" tabIndex={0}><table className="w-full border-collapse text-[13.5px] max-[720px]:min-w-[640px] max-[720px]:text-[13px] [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:bg-[var(--surface-2)] [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.08em] [&_th]:whitespace-nowrap [&_th]:text-[var(--muted)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-4 [&_td]:py-[14px] [&_td]:align-middle [&_td]:text-[var(--ink)] [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-[var(--surface-2)] max-[720px]:[&_th]:px-[14px] max-[720px]:[&_th]:py-[10px] max-[720px]:[&_td]:px-[14px] max-[720px]:[&_td]:py-3 max-[720px]:[&_tr>:first-child]:sticky max-[720px]:[&_tr>:first-child]:left-0 max-[720px]:[&_tr>:first-child]:z-10 max-[720px]:[&_td:first-child]:bg-[var(--surface)] max-[720px]:[&_th:first-child]:z-30">
        <caption className="sr-only">Relatório detalhado dos animais filtrados, com valores atuais cadastrados</caption>
        <thead><tr><th scope="col">Brinco</th><th scope="col">Nome</th><th scope="col">Categoria</th><th scope="col" className="text-right! font-bold tabular-nums whitespace-nowrap">Produção cadastrada</th></tr></thead>
        <tbody>{filtrados.map(a => <tr key={String(a.id)}><td className="font-bold tabular-nums text-[var(--brand)]! [[data-theme=escuro]_&]:text-[var(--brand-3)]!">{a.brinco}</td><td>{a.nome}</td><td><span className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-[10px] py-1 text-xs font-semibold text-[var(--brand)] [[data-theme=escuro]_&]:text-[var(--brand-3)]">{a.categoria}</span></td><td className="text-right! font-bold tabular-nums whitespace-nowrap">{formatarLitros(a.producaoDiaria)}</td></tr>)}
          {filtrados.length === 0 && <tr><td colSpan={4} className="text-center! text-[var(--muted)]!">Nenhum animal corresponde aos filtros.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </>;
}
