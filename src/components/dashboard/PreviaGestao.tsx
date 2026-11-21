import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Animal } from '../../types';
import ModalConfirmacao from '../ModalConfirmacao';
import { gestaoService, type Ficha, type Producao, type Registro, type TipoEvento, type TipoFinanceiro, type Turno } from '../../services/gestao.service';
import { formatarDinheiro } from './utils/financeiroExemplo';

export type SecaoGestao = 'producao' | 'ficha' | 'agenda' | 'eventos' | 'financeiro';
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const legivel = (data: string) => data.split('-').reverse().join('/');
const tiposEvento: Record<TipoEvento, string> = { CONSULTA: 'Consulta', VACINACAO: 'Vacinação', TRATAMENTO: 'Tratamento', INSEMINACAO: 'Inseminação', PARTO: 'Parto', OUTRO: 'Outro' };
const turnos: Record<Turno, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };
const erroApi = (e: unknown) => (e as { response?: { data?: { mensagem?: string }; status?: number } }).response?.data?.mensagem || 'Não foi possível acessar a API. Verifique a conexão e tente novamente.';

export default function PreviaGestao({ secao, animais }: { secao: SecaoGestao; animais: Animal[] }) {
  const [exclusao, setExclusao] = useState<{ recurso: Parameters<typeof gestaoService.excluir>[0]; id: number } | null>(null);
  const [animalId, setAnimalId] = useState('');
  const [data, setData] = useState(hoje);
  const [litros, setLitros] = useState('');
  const [turno, setTurno] = useState<Turno>('MANHA');
  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>('CONSULTA');
  const [tipoFinanceiro, setTipoFinanceiro] = useState<TipoFinanceiro>('RECEITA');
  const [valor, setValor] = useState('');
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    const atual = ++requisicao.current;
    setCarregando(true); setErro('');
    try {
      if (secao === 'producao') { const dados = await gestaoService.producoes(); if (atual === requisicao.current) setProducoes(dados); }
      else if (secao === 'agenda') { const dados = await gestaoService.tarefas(); if (atual === requisicao.current) setRegistros(dados); }
      else if (secao === 'eventos') { const dados = await gestaoService.eventos(); if (atual === requisicao.current) setRegistros(dados); }
      else if (secao === 'financeiro') { const dados = await gestaoService.financeiro(); if (atual === requisicao.current) setRegistros(dados); }
      else if (animalId) { const dados = await gestaoService.ficha(animalId); if (atual === requisicao.current) setFicha(dados); }
      else setFicha(null);
    } catch (e) { if (atual === requisicao.current) setErro(erroApi(e)); }
    finally { if (atual === requisicao.current) setCarregando(false); }
  }, [secao, animalId]);
  useEffect(() => {
    const contador = requisicao;
    void Promise.resolve().then(carregar);
    return () => { contador.current++; };
  }, [carregar]);

  async function acao(fn: () => Promise<unknown>, texto: string) {
    setSalvando(true); setErro(''); setMensagem('');
    try {
      await fn();
      setMensagem(texto);
      await carregar();
      window.dispatchEvent(new Event('agrogestor:financeiro-atualizado'));
    } catch (e) { setErro(erroApi(e)); }
    finally { setSalvando(false); }
  }
  async function salvar(e: FormEvent) {
    e.preventDefault();
    if ((secao === 'producao' || secao === 'eventos') && !animalId) { setErro('Selecione um animal cadastrado.'); return; }
    if (secao === 'producao') {
      await acao(() => gestaoService.criarProducao({ animalId: Number(animalId), data, turno, litros: Number(litros) }), 'Ordenha registrada.');
    } else if (secao === 'agenda') {
      await acao(() => gestaoService.criarTarefa({ titulo: titulo.trim(), data }), 'Tarefa registrada.');
    } else if (secao === 'eventos') {
      await acao(() => gestaoService.criarEvento({ animalId: Number(animalId), data, tipo: tipoEvento, descricao: titulo.trim() }), 'Evento registrado.');
    } else if (secao === 'financeiro') {
      await acao(() => gestaoService.criarFinanceiro({ data, tipo: tipoFinanceiro, descricao: titulo.trim(), valor: Number(valor) }), 'Lançamento registrado.');
    } else if (ficha) {
      await acao(() => gestaoService.atualizarFicha(animalId, { dataNascimento: ficha.dataNascimento || undefined, raca: ficha.raca || '', origem: ficha.origem || '', observacoes: ficha.observacoes || '' }), 'Ficha atualizada.');
    }
  }
  const recurso = secao === 'agenda' ? 'tarefas' : secao === 'financeiro' ? 'financeiro/lancamentos' : secao === 'eventos' ? 'eventos' : 'producoes';
  const label = 'flex flex-col gap-1.5';
  const selecionarAnimal = <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Animal</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={animalId} onChange={e => { setFicha(null); setAnimalId(e.target.value); }} required><option value="">Selecione um animal</option>{animais.filter(a => a.id != null).map(a => <option key={a.id} value={a.id}>{a.nome} · {a.brinco}</option>)}</select></label>;
  return <div className="flex flex-col gap-5">
    {exclusao && <ModalConfirmacao titulo="Excluir registro?" mensagem="Deseja realmente excluir este registro? Esta ação não pode ser desfeita." confirmar="Excluir" perigoso aoCancelar={() => setExclusao(null)} aoConfirmar={() => { const alvo = exclusao; setExclusao(null); void acao(() => gestaoService.excluir(alvo.recurso, alvo.id), 'Registro excluído.'); }} />}
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4">
      <h2 className="text-base font-bold">{secao === 'ficha' ? 'Ficha do animal' : secao === 'producao' ? 'Registrar ordenha' : secao === 'agenda' ? 'Nova tarefa' : secao === 'eventos' ? 'Registrar evento' : 'Novo lançamento'}</h2>
      <form onSubmit={salvar} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-[14px]">
          {(secao === 'ficha' || secao === 'producao' || secao === 'eventos') && selecionarAnimal}
          {secao === 'ficha' && ficha && <>
            <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Nascimento</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" type="date" max={hoje()} value={ficha.dataNascimento ?? ''} onChange={e => setFicha({ ...ficha, dataNascimento: e.target.value })} /></label>
            {(['raca', 'origem', 'observacoes'] as const).map(campo => <label className={label} key={campo}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">{campo === 'raca' ? 'Raça' : campo === 'origem' ? 'Origem' : 'Observações'}</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" maxLength={campo === 'observacoes' ? 1000 : 100} value={ficha[campo] ?? ''} onChange={e => setFicha({ ...ficha, [campo]: e.target.value })} /></label>)}
          </>}
          {secao !== 'ficha' && <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Data</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" type="date" required max={secao === 'producao' ? hoje() : undefined} value={data} onChange={e => setData(e.target.value)} /></label>}
          {secao === 'producao' && <><label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Litros</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" type="number" min="0.01" max="200" step="0.01" required value={litros} onChange={e => setLitros(e.target.value)} /></label><label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Turno</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={turno} onChange={e => setTurno(e.target.value as Turno)}>{Object.entries(turnos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></>}
          {secao === 'eventos' && <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Tipo de evento</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={tipoEvento} onChange={e => setTipoEvento(e.target.value as TipoEvento)}>{Object.entries(tiposEvento).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
          {secao === 'financeiro' && <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Tipo</span><select className="w-full cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" value={tipoFinanceiro} onChange={e => setTipoFinanceiro(e.target.value as TipoFinanceiro)}><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option></select></label>}
          {(secao === 'agenda' || secao === 'eventos' || secao === 'financeiro') && <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">{secao === 'agenda' ? 'Tarefa' : 'Descrição'}</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" required maxLength={160} value={titulo} onChange={e => setTitulo(e.target.value)} /></label>}
          {secao === 'financeiro' && <label className={label}><span className="flex items-center justify-between text-[12.5px] font-bold tracking-[.02em] text-[var(--ink-soft,#2a4033)]">Valor em reais</span><input className="w-full rounded-[10px] border-[1.5px] border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-[14px] py-[10px] font-inherit text-sm text-[var(--ink,#0a1810)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted,#3f5a48)] hover:border-[var(--border-strong,#b0c3b8)] focus:border-[var(--brand,#14532d)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-2,#16a34a)_22%,transparent)]" type="number" min="0.01" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} /></label>}
        </div>
        {secao === 'eventos' && <p className="m-0 text-[12.5px] leading-normal text-[var(--muted,#3f5a48)]">Registre informações orientadas pelo profissional responsável.</p>}
        {(!animais.length && (secao === 'ficha' || secao === 'producao' || secao === 'eventos')) && <p>Cadastre um animal no rebanho antes de continuar.</p>}
        {erro && <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--danger,#991b1b)] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']">{erro} <button type="button" onClick={() => void carregar()}>Tentar novamente</button></p>}
        {mensagem && <p role="status">{mensagem}</p>}
        <div><button className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-[1.5px] border-transparent bg-[var(--brand,#14532d)] px-[18px] py-[10px] text-[13.5px] font-semibold text-[var(--brand-ink,#fff)] shadow-[0_6px_16px_-8px_rgba(20,83,45,.5)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:-translate-y-px hover:enabled:bg-[var(--brand-3,#052e16)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:bg-[#86efac] [[data-theme=escuro]_&]:hover:enabled:text-[#052e16]" type="submit" disabled={salvando || (secao === 'ficha' && !ficha)}>{salvando ? 'Salvando…' : 'Salvar'}</button></div>
      </form>
    </section>
    {secao !== 'ficha' && <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5 max-[720px]:p-4">
      <h2 className="text-base font-bold">{secao === 'producao' ? 'Histórico de produção' : secao === 'agenda' ? 'Tarefas' : secao === 'eventos' ? 'Histórico de eventos' : 'Receitas e despesas'}</h2>
      {carregando ? <p>Carregando…</p> : !erro && <ul className="mt-4 flex list-none flex-col divide-y divide-[var(--border)] p-0">
        {secao === 'producao' ? producoes.map(p => <li key={p.id} className="py-3"><strong>{p.animalNome} · {p.litros.toLocaleString('pt-BR')} L</strong><small className="block">{legivel(p.data)} · {turnos[p.turno]}</small><button type="button" className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-[10px] text-[13.5px] font-semibold text-[var(--ink)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:border-[var(--brand)] hover:enabled:bg-[var(--brand-soft)] hover:enabled:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:text-[var(--brand-3)]" onClick={() => setExclusao({ recurso: 'producoes', id: p.id })}>Excluir</button></li>) :
          registros.map(r => <li key={r.id} className="py-3"><strong>{r.descricao}</strong><small className="block">{legivel(r.data)}{r.animalNome ? ` · ${r.animalNome}` : ''}{secao === 'eventos' && r.subtipo ? ` · ${tiposEvento[r.subtipo as TipoEvento] ?? r.subtipo}` : ''}{r.valor != null ? ` · ${r.subtipo === 'RECEITA' ? 'Receita' : 'Despesa'} · ${formatarDinheiro(r.valor)}` : ''}{secao === 'agenda' ? ` · ${r.concluida ? 'Concluída' : r.data < hoje() ? 'Em atraso' : 'Pendente'}` : ''}</small>
            {secao === 'agenda' && <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-[10px] text-[13.5px] font-semibold text-[var(--ink)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:border-[var(--brand)] hover:enabled:bg-[var(--brand-soft)] hover:enabled:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:text-[var(--brand-3)]" onClick={() => void acao(() => gestaoService.atualizarTarefa(r.id, !r.concluida), 'Tarefa atualizada.')}>{r.concluida ? 'Reabrir' : 'Concluir'}</button>}
            <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-[10px] text-[13.5px] font-semibold text-[var(--ink)] transition-[transform,background,border-color,box-shadow,color] hover:enabled:border-[var(--brand)] hover:enabled:bg-[var(--brand-soft)] hover:enabled:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-55 [[data-theme=escuro]_&]:hover:enabled:text-[var(--brand-3)]" onClick={() => setExclusao({ recurso, id: r.id })}>Excluir</button>
          </li>)}
      </ul>}
      {!carregando && !erro && (secao === 'producao' ? producoes.length === 0 : registros.length === 0) && <p className="mt-3">Nenhum registro encontrado.</p>}
    </section>}
  </div>;
}
