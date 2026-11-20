import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Animal } from '../../types';
import { gestaoService, type Ficha, type Producao, type Registro, type TipoEvento, type TipoFinanceiro, type Turno } from '../../services/gestao.service';
import { formatarDinheiro } from './financeiroExemplo';

export type SecaoGestao = 'producao' | 'ficha' | 'agenda' | 'eventos' | 'financeiro';
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const legivel = (data: string) => data.split('-').reverse().join('/');
const tiposEvento: Record<TipoEvento, string> = { CONSULTA: 'Consulta', VACINACAO: 'Vacinação', TRATAMENTO: 'Tratamento', INSEMINACAO: 'Inseminação', PARTO: 'Parto', OUTRO: 'Outro' };
const turnos: Record<Turno, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };
const erroApi = (e: unknown) => (e as { response?: { data?: { mensagem?: string }; status?: number } }).response?.data?.mensagem || 'Não foi possível acessar a API. Verifique a conexão e tente novamente.';

export default function PreviaGestao({ secao, animais }: { secao: SecaoGestao; animais: Animal[] }) {
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
  const selecionarAnimal = <label className={label}><span className="af-label">Animal</span><select className="af-select" value={animalId} onChange={e => { setFicha(null); setAnimalId(e.target.value); }} required><option value="">Selecione um animal</option>{animais.filter(a => a.id != null).map(a => <option key={a.id} value={a.id}>{a.nome} · {a.brinco}</option>)}</select></label>;
  return <div className="flex flex-col gap-5">
    <section className="dash-panel">
      <h2 className="text-base font-bold">{secao === 'ficha' ? 'Ficha do animal' : secao === 'producao' ? 'Registrar ordenha' : secao === 'agenda' ? 'Nova tarefa' : secao === 'eventos' ? 'Registrar evento' : 'Novo lançamento'}</h2>
      <form onSubmit={salvar} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-[14px]">
          {(secao === 'ficha' || secao === 'producao' || secao === 'eventos') && selecionarAnimal}
          {secao === 'ficha' && ficha && <>
            <label className={label}><span className="af-label">Nascimento</span><input className="af-input" type="date" max={hoje()} value={ficha.dataNascimento ?? ''} onChange={e => setFicha({ ...ficha, dataNascimento: e.target.value })} /></label>
            {(['raca', 'origem', 'observacoes'] as const).map(campo => <label className={label} key={campo}><span className="af-label">{campo === 'raca' ? 'Raça' : campo === 'origem' ? 'Origem' : 'Observações'}</span><input className="af-input" maxLength={campo === 'observacoes' ? 1000 : 100} value={ficha[campo] ?? ''} onChange={e => setFicha({ ...ficha, [campo]: e.target.value })} /></label>)}
          </>}
          {secao !== 'ficha' && <label className={label}><span className="af-label">Data</span><input className="af-input" type="date" required max={secao === 'producao' ? hoje() : undefined} value={data} onChange={e => setData(e.target.value)} /></label>}
          {secao === 'producao' && <><label className={label}><span className="af-label">Litros</span><input className="af-input" type="number" min="0.01" max="200" step="0.01" required value={litros} onChange={e => setLitros(e.target.value)} /></label><label className={label}><span className="af-label">Turno</span><select className="af-select" value={turno} onChange={e => setTurno(e.target.value as Turno)}>{Object.entries(turnos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></>}
          {secao === 'eventos' && <label className={label}><span className="af-label">Tipo de evento</span><select className="af-select" value={tipoEvento} onChange={e => setTipoEvento(e.target.value as TipoEvento)}>{Object.entries(tiposEvento).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
          {secao === 'financeiro' && <label className={label}><span className="af-label">Tipo</span><select className="af-select" value={tipoFinanceiro} onChange={e => setTipoFinanceiro(e.target.value as TipoFinanceiro)}><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option></select></label>}
          {(secao === 'agenda' || secao === 'eventos' || secao === 'financeiro') && <label className={label}><span className="af-label">{secao === 'agenda' ? 'Tarefa' : 'Descrição'}</span><input className="af-input" required maxLength={160} value={titulo} onChange={e => setTitulo(e.target.value)} /></label>}
          {secao === 'financeiro' && <label className={label}><span className="af-label">Valor em reais</span><input className="af-input" type="number" min="0.01" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} /></label>}
        </div>
        {secao === 'eventos' && <p className="af-hint">Registre informações orientadas pelo profissional responsável.</p>}
        {(!animais.length && (secao === 'ficha' || secao === 'producao' || secao === 'eventos')) && <p>Cadastre um animal no rebanho antes de continuar.</p>}
        {erro && <p role="alert" className="af-error">{erro} <button type="button" onClick={() => void carregar()}>Tentar novamente</button></p>}
        {mensagem && <p role="status">{mensagem}</p>}
        <div><button className="af-btn af-btn--primary" type="submit" disabled={salvando || (secao === 'ficha' && !ficha)}>{salvando ? 'Salvando…' : 'Salvar'}</button></div>
      </form>
    </section>
    {secao !== 'ficha' && <section className="dash-panel">
      <h2 className="text-base font-bold">{secao === 'producao' ? 'Histórico de produção' : secao === 'agenda' ? 'Tarefas' : secao === 'eventos' ? 'Histórico de eventos' : 'Receitas e despesas'}</h2>
      {carregando ? <p>Carregando…</p> : !erro && <ul className="mt-4 flex list-none flex-col divide-y divide-[var(--border)] p-0">
        {secao === 'producao' ? producoes.map(p => <li key={p.id} className="py-3"><strong>{p.animalNome} · {p.litros.toLocaleString('pt-BR')} L</strong><small className="block">{legivel(p.data)} · {turnos[p.turno]}</small><button type="button" className="dash-btn dash-btn-ghost" onClick={() => { if (window.confirm('Excluir este registro?')) void acao(() => gestaoService.excluir('producoes', p.id), 'Registro excluído.'); }}>Excluir</button></li>) :
          registros.map(r => <li key={r.id} className="py-3"><strong>{r.descricao}</strong><small className="block">{legivel(r.data)}{r.animalNome ? ` · ${r.animalNome}` : ''}{secao === 'eventos' && r.subtipo ? ` · ${tiposEvento[r.subtipo as TipoEvento] ?? r.subtipo}` : ''}{r.valor != null ? ` · ${r.subtipo === 'RECEITA' ? 'Receita' : 'Despesa'} · ${formatarDinheiro(r.valor)}` : ''}{secao === 'agenda' ? ` · ${r.concluida ? 'Concluída' : r.data < hoje() ? 'Em atraso' : 'Pendente'}` : ''}</small>
            {secao === 'agenda' && <button type="button" className="dash-btn dash-btn-ghost" onClick={() => void acao(() => gestaoService.atualizarTarefa(r.id, !r.concluida), 'Tarefa atualizada.')}>{r.concluida ? 'Reabrir' : 'Concluir'}</button>}
            <button type="button" className="dash-btn dash-btn-ghost" onClick={() => { if (window.confirm('Excluir este registro?')) void acao(() => gestaoService.excluir(recurso, r.id), 'Registro excluído.'); }}>Excluir</button>
          </li>)}
      </ul>}
      {!carregando && !erro && (secao === 'producao' ? producoes.length === 0 : registros.length === 0) && <p className="mt-3">Nenhum registro encontrado.</p>}
    </section>}
  </div>;
}
