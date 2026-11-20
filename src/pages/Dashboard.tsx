import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
  useRef,
} from 'react';
import AnimalForm from '../components/AnimalForm';
import { KpiCard, VisaoGeral } from '../components/dashboard/VisaoGeral';
import PreviaGestao, { type SecaoGestao } from '../components/dashboard/PreviaGestao';
import Relatorios from '../components/dashboard/Relatorios';
import { calcularEstatisticas, formatarLitros } from '../components/dashboard/metricas';
import LogoutButton from '../components/auth/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { useAnimais } from '../hooks/useAnimais';
import type { Animal } from '../types';

const STORAGE_KEY = 'agrogestor:animais';
const THEME_KEY = 'agrogestor:tema';

type Aba = 'visao' | 'rebanho' | 'relatorios' | 'config' | SecaoGestao;
type Tema = 'claro' | 'escuro';
type Toast = { id: string; texto: string; tipo: 'sucesso' | 'erro' | 'info' };

type ErroApi = { response?: { data?: { mensagem?: string } } };

// ============================================================
// Utils
// ============================================================
const normalizar = (txt: string) =>
  txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatarData = () =>
  new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const iniciais = (nome?: string) => {
  if (!nome) return '?';
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
};

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ============================================================
// Hooks
// ============================================================
function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem(THEME_KEY) as Tema | null;
    if (salvo) return salvo;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'escuro';
    return 'claro';
  });
  useEffect(() => localStorage.setItem(THEME_KEY, tema), [tema]);
  const alternar = useCallback(
    () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')),
    []
  );
  return { tema, alternar };
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'info') => {
    const id = uid();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const remover = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  return { toasts, push, remover };
}

function useBodyLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [ativo]);
}

// ============================================================
// Ícones SVG inline
// ============================================================
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

// ============================================================
// Componente principal
// ============================================================
export default function Dashboard() {
  const { animais, salvar, excluir, importar, carregando, erro } = useAnimais();
  const { tema, alternar } = useTema();
  const { toasts, push, remover } = useToasts();
  const { usuario } = useAuth();

  const [aba, setAba] = useState<Aba>('visao');
  const [animalEditando, setAnimalEditando] = useState<Animal | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<'Todas' | Animal['categoria']>('Todas');
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState(false);
  const [paletaSelecionada, setPaletaSelecionada] = useState(0);

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const [buscaPaleta, setBuscaPaleta] = useState('');
  const buscaDeferred = useDeferredValue(busca);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const paletaRef = useRef<HTMLDivElement>(null);

  useBodyLock(paletaAberta || drawerMobileAberto || modalExcluirAberto);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletaAberta((v) => !v);
        setBuscaPaleta('');
        setPaletaSelecionada(0);
      }
      if (e.key === 'Escape') {
        if (paletaAberta) setPaletaAberta(false);
        else if (modalExcluirAberto && !excluindo) setModalExcluirAberto(false);
        else if (drawerMobileAberto) setDrawerMobileAberto(false);
        else setMenuUsuarioAberto(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletaAberta, modalExcluirAberto, drawerMobileAberto, excluindo]);

  useEffect(() => {
    if (!menuUsuarioAberto) return;
    const fechar = () => setMenuUsuarioAberto(false);
    window.addEventListener('click', fechar);
    return () => window.removeEventListener('click', fechar);
  }, [menuUsuarioAberto]);

  useEffect(() => {
    const ativo = paletaAberta || modalExcluirAberto || drawerMobileAberto;
    if (!ativo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root =
        modalExcluirAberto ? modalRef.current :
        paletaAberta ? paletaRef.current :
        null;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const atual = document.activeElement as HTMLElement;
      if (e.shiftKey && atual === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && atual === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletaAberta, modalExcluirAberto, drawerMobileAberto]);

  const handleSalvar = useCallback(
    async (animal: Animal) => {
      try {
        await salvar(animal);
        setAnimalEditando(null);
        push(animal.id ? 'Animal atualizado' : 'Animal cadastrado', 'sucesso');
      } catch (err) {
        const msg =
          (err as ErroApi)?.response?.data?.mensagem ||
          'Erro ao salvar animal. Tente novamente.';
        push(msg, 'erro');
      }
    },
    [salvar, push]
  );

  const handleExcluir = useCallback(
    async (animal: Animal) => {
      const ok = window.confirm(
        `Excluir "${animal.nome}" (brinco ${animal.brinco})? As ordenhas, tarefas e eventos vinculados também serão excluídos. Esta ação não pode ser desfeita.`
      );
      if (!ok) return;
      try {
        await excluir(animal.id);
        if (animalEditando?.id === animal.id) setAnimalEditando(null);
        push(`"${animal.nome}" foi excluído`, 'info');
      } catch (err) {
        const msg =
          (err as ErroApi)?.response?.data?.mensagem ||
          'Erro ao excluir animal. Tente novamente.';
        push(msg, 'erro');
      }
    },
    [excluir, push, animalEditando]
  );

  const exportarJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(animais, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrogestor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push('Backup exportado', 'sucesso');
  }, [animais, push]);

  const importarJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (!Array.isArray(data)) {
            push('Arquivo inválido', 'erro');
            return;
          }
          await importar(data);
          push(`${data.length} animais importados`, 'sucesso');
        } catch {
          push('Erro ao importar arquivo', 'erro');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importar, push]
  );

  const zerarRebanho = useCallback(async () => {
    if (!confirm('Apagar TODOS os animais? As ordenhas, tarefas e eventos vinculados também serão excluídos. Esta ação não pode ser desfeita.')) return;
    try {
      for (const a of animais) {
        if (a.id !== undefined && a.id !== null) {
          await excluir(a.id);
        }
      }
      push('Rebanho zerado', 'info');
    } catch (err) {
      const msg =
        (err as ErroApi)?.response?.data?.mensagem ||
        'Erro ao zerar rebanho. Tente novamente.';
      push(msg, 'erro');
    }
  }, [animais, excluir, push]);

  const abrirModalExcluir = () => {
    setSenhaExcluir('');
    setErroExcluir(null);
    setModalExcluirAberto(true);
  };

  const handleExcluirConta = async () => {
    if (!senhaExcluir.trim()) {
      setErroExcluir('Digite sua senha para continuar.');
      return;
    }
    setExcluindo(true);
    setErroExcluir(null);
    try {
      await authService.excluirConta({ senha: senhaExcluir });
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = '/';
    } catch (err: unknown) {
      const apiErr = err as ErroApi;
      setErroExcluir(
        apiErr?.response?.data?.mensagem ||
          'Não foi possível excluir a conta. Verifique sua senha.'
      );
      setExcluindo(false);
    }
  };

  const animaisFiltrados = useMemo(() => {
    const termo = normalizar(buscaDeferred.trim());
    return animais.filter((a) => {
      if (categoriaFiltro !== 'Todas' && a.categoria !== categoriaFiltro) return false;
      if (!termo) return true;
      return normalizar(a.nome).includes(termo) || normalizar(a.brinco).includes(termo);
    });
  }, [animais, buscaDeferred, categoriaFiltro]);

  const stats = useMemo(() => calcularEstatisticas(animais), [animais]);

  const paletaItens = useMemo(() => {
    const q = normalizar(buscaPaleta.trim());
    const comandos = [
      { id: 'go-visao', icon: '📊', titulo: 'Ir para Visão Geral', sub: 'Dashboard', run: () => setAba('visao') },
      { id: 'go-rebanho', icon: '🐮', titulo: 'Ir para Rebanho', sub: 'Lista de animais', run: () => setAba('rebanho') },
      { id: 'go-producao', icon: '🥛', titulo: 'Ir para Produção', sub: 'Registros de ordenha', run: () => setAba('producao') },
      { id: 'go-agenda', icon: '📅', titulo: 'Ir para Agenda', sub: 'Tarefas', run: () => setAba('agenda') },
      { id: 'go-eventos', icon: '🩺', titulo: 'Ir para Saúde e reprodução', sub: 'Eventos do rebanho', run: () => setAba('eventos') },
      { id: 'go-financeiro', icon: '💰', titulo: 'Ir para Financeiro', sub: 'Receitas e despesas', run: () => setAba('financeiro') },
      { id: 'go-relatorios', icon: '📈', titulo: 'Ir para Relatórios', sub: 'Tabela detalhada', run: () => setAba('relatorios') },
      { id: 'go-config', icon: '⚙️', titulo: 'Ir para Configurações', sub: 'Preferências', run: () => setAba('config') },
      { id: 'export', icon: '⬇️', titulo: 'Exportar backup', sub: 'Baixar JSON', run: exportarJSON },
      { id: 'theme', icon: tema === 'claro' ? '🌙' : '☀️', titulo: 'Alternar tema', sub: tema === 'claro' ? 'Ativar escuro' : 'Ativar claro', run: alternar },
    ];
    const listaComandos = comandos.filter(
      (c) => !q || normalizar(c.titulo).includes(q) || normalizar(c.sub).includes(q)
    );
    const listaAnimais = q
      ? animais
          .filter((a) => normalizar(a.nome).includes(q) || normalizar(a.brinco).includes(q))
          .slice(0, 8)
          .map((a) => ({
            id: `animal-${a.id}`,
            icon: '🐄',
            titulo: `${a.nome} · ${a.brinco}`,
            sub: `${a.categoria} · ${a.producaoDiaria} L/dia`,
            run: () => {
              setAba('rebanho');
              setBusca(a.nome);
            },
          }))
      : [];

    return { comandos: listaComandos, animais: listaAnimais, todos: [...listaComandos, ...listaAnimais] };
  }, [buscaPaleta, animais, tema, alternar, exportarJSON]);

  const onPaletaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = paletaItens.todos.length;
    if (total === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletaSelecionada((i) => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPaletaSelecionada((i) => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      paletaItens.todos[paletaSelecionada]?.run();
      setPaletaAberta(false);
    }
  };

  const navegarPara = (id: Aba) => {
    setAba(id);
    setDrawerMobileAberto(false);
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('Todas');
  };

  const filtrosAtivos = busca !== '' || categoriaFiltro !== 'Todas';
  const gruposNavegacao: { titulo: string; itens: { id: Aba; icone: string; texto: string; badge?: number | string }[] }[] = [
    { titulo: 'Principal', itens: [
      { id: 'visao', icone: '📊', texto: 'Visão Geral' },
      { id: 'rebanho', icone: '🐮', texto: 'Rebanho', badge: animais.length || undefined },
    ] },
    { titulo: 'Gestão', itens: [
      { id: 'producao', icone: '🥛', texto: 'Produção' },
      { id: 'agenda', icone: '📅', texto: 'Agenda' },
      { id: 'eventos', icone: '🩺', texto: 'Saúde e reprodução' },
      { id: 'financeiro', icone: '💰', texto: 'Financeiro' },
    ] },
    { titulo: 'Análise e conta', itens: [
      { id: 'relatorios', icone: '📈', texto: 'Relatórios' },
      { id: 'config', icone: '⚙️', texto: 'Configurações' },
    ] },
  ];
  const secaoGestao: SecaoGestao | null = aba === 'producao' || aba === 'agenda' || aba === 'eventos' || aba === 'financeiro' || aba === 'ficha' ? aba : null;
  const titulos: Record<Aba, string> = { visao: 'Visão Geral', rebanho: 'Rebanho', ficha: 'Ficha do animal', producao: 'Produção', agenda: 'Agenda', eventos: 'Saúde e reprodução', financeiro: 'Financeiro', relatorios: 'Relatórios', config: 'Configurações' };

  return (
    <>
      <div className="dash" data-theme={tema}>
        <aside className="dash-sidebar" aria-label="Navegação principal">
          <div className="dash-brand">
            <span className="dash-brand-mark" aria-hidden="true">🐄</span>
            <div className="dash-brand-text">
              <span className="dash-brand-name">AgroGestor</span>
              <span className="dash-brand-sub">Gestão de Rebanho</span>
            </div>
          </div>

          <nav className="dash-nav" aria-label="Áreas do aplicativo">
            {gruposNavegacao.map(grupo => <div key={grupo.titulo}>
              <div className="dash-nav-label">{grupo.titulo}</div>
              {grupo.itens.map(({ id, icone, texto, badge }) => <button key={id} type="button"
                className={`dash-nav-btn${aba === id || (aba === 'ficha' && id === 'rebanho') ? ' is-active' : ''}`}
                onClick={() => setAba(id)} aria-current={aba === id || (aba === 'ficha' && id === 'rebanho') ? 'page' : undefined}>
                <span className="dash-nav-icon" aria-hidden="true">{icone}</span><span>{texto}</span>
                {badge ? <span className="dash-nav-badge">{badge}</span> : null}
              </button>)}
            </div>)}
          </nav>

          <div className="dash-sidebar-footer">
            <button
              type="button"
              className="dash-nav-btn"
              onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}
            >
              <span className="dash-nav-icon" aria-hidden="true">🔍</span>
              <span>Buscar…</span>
              <kbd style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)' }}>Ctrl K</kbd>
            </button>
            <button type="button" className="dash-nav-btn" onClick={alternar}>
              <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              <button
                type="button"
                className="dash-burger"
                onClick={() => setDrawerMobileAberto(true)}
                aria-label="Abrir menu de navegação"
                aria-expanded={drawerMobileAberto}
              >
                <span aria-hidden="true">☰</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 className="dash-title">
                  {titulos[aba]}
                </h1>
                <p className="dash-subtitle">
                  {formatarData()} · {animais.length} {animais.length === 1 ? 'animal' : 'animais'}
                </p>
              </div>
            </div>

            <div className="dash-topbar-right">
              <button
                type="button"
                className="dash-search-trigger"
                onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}
                aria-label="Abrir busca de comandos"
              >
                <span className="dash-search-ico" aria-hidden="true">🔍</span>
                <span>Buscar…</span>
                <kbd>Ctrl K</kbd>
              </button>

              <button
                type="button"
                className="dash-icon-btn"
                onClick={alternar}
                aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              </button>

              <div className="dash-user" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="dash-user-btn"
                  onClick={() => setMenuUsuarioAberto((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuUsuarioAberto}
                  aria-label="Menu do usuário"
                >
                  <span className="dash-avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span>
                  <span className="dash-user-name">{usuario?.nome ?? 'Usuário'}</span>
                  <span className="chevron" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted)' }}>▾</span>
                </button>

                {menuUsuarioAberto && (
                  <div role="menu" className="dash-menu">
                    <div className="dash-menu-header">
                      <div className="dash-menu-name">{usuario?.nome ?? 'Usuário'}</div>
                      <div className="dash-menu-email">{usuario?.email ?? ''}</div>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="dash-menu-item"
                      onClick={() => { setMenuUsuarioAberto(false); setAba('config'); }}
                    >
                      <span aria-hidden="true">⚙️</span> Configurações
                    </button>
                    <div style={{ padding: 4 }}>
                      <LogoutButton
                        estilo={{
                          width: '100%',
                          padding: '9px 12px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="dash-content">
            {aba === 'visao' && <VisaoGeral stats={stats} />}

            {secaoGestao && <PreviaGestao key={secaoGestao} secao={secaoGestao} animais={animais} />}

            {aba === 'rebanho' && (
              <>
                <section className="dash-kpis" aria-label="Resumo do rebanho">
                  <KpiCard icon="🐮" label="Total de animais" value={stats.total} />
                  <KpiCard icon="🥛" label="Produção cadastrada em lactação" value={formatarLitros(stats.producaoTotal)} />
                  <KpiCard icon="📊" label="Média por vaca em lactação" value={stats.media === null ? '—' : formatarLitros(stats.media)} />
                  <KpiCard
                    icon="🏆"
                    label="Maior produtor"
                    value={stats.maior ? stats.maior.nome : '—'}
                  />
                </section>

                {/* ---------- ESTADO: CARREGANDO / ERRO ---------- */}
                {carregando && (
                  <div className="dash-status-panel" role="status" aria-live="polite">
                    <div className="dash-spinner" aria-hidden="true" />
                    <p className="dash-status-text">Carregando rebanho…</p>
                  </div>
                )}

                {!carregando && erro && (
                  <div className="dash-status-panel is-error" role="alert">
                    <p className="dash-status-text">
                      <span aria-hidden="true">⚠️</span> {erro}
                    </p>
                  </div>
                )}

                {/* ---------- FORMULÁRIO ---------- */}
                {!carregando && !erro && (
                  <section className="dash-panel" aria-labelledby="rebanho-form-title">
                    <div className="dash-panel-head">
                      <h2 id="rebanho-form-title" className="dash-panel-title">
                        {animalEditando ? 'Editar animal' : 'Novo animal'}
                      </h2>
                      <span className="dash-panel-meta">
                        {animalEditando
                          ? `Editando ${animalEditando.nome} · brinco ${animalEditando.brinco}`
                          : 'Preencha os dados abaixo para cadastrar'}
                      </span>
                    </div>
                    <div className="dash-form-wrap">
                      <AnimalForm
                        key={animalEditando ? `editar-${animalEditando.id}` : 'novo'}
                        animalEditando={animalEditando}
                        onSalvar={handleSalvar}
                        onCancelar={() => setAnimalEditando(null)}
                      />
                    </div>
                  </section>
                )}

                {/* ---------- LISTA ---------- */}
                {!carregando && !erro && (
                  <section className="dash-panel" aria-labelledby="rebanho-list-title">
                    <div className="dash-panel-head">
                      <h2 id="rebanho-list-title" className="dash-panel-title">
                        Lista de animais
                      </h2>
                      <span className="dash-panel-meta">
                        {animaisFiltrados.length} de {animais.length}
                        {animaisFiltrados.length === 1 ? ' animal' : ' animais'}
                      </span>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setAba('ficha')}>
                        Ver ficha do animal
                      </button>
                    </div>

                    <div className="dash-filters" role="search" aria-label="Filtros de animais" style={{ marginBottom: 16 }}>
                      <input
                        type="search"
                        className="dash-input"
                        placeholder="Buscar por nome ou brinco…"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        aria-label="Buscar animais"
                      />
                      <select
                        className="dash-select"
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value as typeof categoriaFiltro)}
                        aria-label="Filtrar por categoria"
                      >
                        {['Todas', 'Bezerra', 'Novilha', 'Vaca em Lactação', 'Vaca Seca'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {filtrosAtivos && (
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          onClick={limparFiltros}
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>

                    {animaisFiltrados.length === 0 ? (
                      <div className="dash-empty">
                        <span className="dash-empty-icon" aria-hidden="true">
                          {animais.length === 0 ? '🐄' : '🔎'}
                        </span>
                        <h3 className="dash-empty-title">
                          {animais.length === 0 ? 'Nenhum animal cadastrado' : 'Nenhum resultado'}
                        </h3>
                        <p className="dash-empty-desc">
                          {animais.length === 0
                            ? 'Cadastre seu primeiro animal usando o formulário acima para começar a acompanhar a produção.'
                            : 'Nenhum animal corresponde aos filtros aplicados. Tente ajustar a busca ou o filtro de categoria.'}
                        </p>
                        {animais.length > 0 && (
                          <button
                            type="button"
                            className="dash-btn dash-btn-primary"
                            onClick={limparFiltros}
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="dash-table-hint" aria-hidden="true">
                          <span>↔</span> Arraste para o lado para ver todas as colunas
                        </p>

                        <div
                          className="dash-table-wrap"
                          role="region"
                          aria-label="Tabela de animais"
                          tabIndex={0}
                        >
                          <table className="dash-table">
                            <caption className="sr-only">
                              Lista de animais do rebanho. Use os botões na coluna de ações para editar ou excluir.
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">Brinco</th>
                                <th scope="col">Nome</th>
                                <th scope="col">Categoria</th>
                                <th scope="col" className="num">Produção</th>
                                <th scope="col" className="actions-col">
                                  <span className="sr-only">Ações</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {animaisFiltrados.map((a) => (
                                <tr key={String(a.id)}>
                                  <td className="brinco-cell">{a.brinco}</td>
                                  <td>{a.nome}</td>
                                  <td>
                                    <span className="dash-cat-badge">{a.categoria}</span>
                                  </td>
                                  <td className="num">{a.producaoDiaria} L</td>
                                  <td className="actions-cell">
                                    <div className="dash-row-actions">
                                      <button
                                        type="button"
                                        className="dash-row-btn"
                                        onClick={() => {
                                          setAnimalEditando(a);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        aria-label={`Editar ${a.nome}`}
                                        title="Editar"
                                      >
                                        <IconEdit />
                                      </button>
                                      <button
                                        type="button"
                                        className="dash-row-btn is-danger"
                                        onClick={() => handleExcluir(a)}
                                        aria-label={`Excluir ${a.nome}`}
                                        title="Excluir"
                                      >
                                        <IconTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </section>
                )}
              </>
            )}

            {aba === 'relatorios' && <Relatorios animais={animais} />}

            {aba === 'config' && (
              <>
                <section className="dash-panel" aria-labelledby="pref-title">
                  <div className="dash-panel-head">
                    <h2 id="pref-title" className="dash-panel-title">Preferências</h2>
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Tema da interface</div>
                      <div className="dash-config-desc">Alterna entre claro e escuro</div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={alternar}
                    >
                      {tema === 'claro' ? '🌙 Ativar escuro' : '☀️ Ativar claro'}
                    </button>
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Backup dos dados</div>
                      <div className="dash-config-desc">Exporte ou importe em formato JSON</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={exportarJSON}>
                        ⬇️ Exportar
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn-ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        ⬆️ Importar
                      </button>
                    </div>
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Conta</div>
                      <div className="dash-config-desc">{usuario?.email ?? 'Sessão ativa'}</div>
                    </div>
                    <LogoutButton />
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Zerar rebanho</div>
                      <div className="dash-config-desc">Remove todos os animais cadastrados</div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-danger"
                      onClick={zerarRebanho}
                    >
                      Zerar rebanho
                    </button>
                  </div>
                </section>

                <section className="dash-danger-zone" aria-labelledby="danger-title">
                  <h2 id="danger-title" className="dash-danger-title">
                    <span aria-hidden="true">⚠️</span> Zona de Perigo
                  </h2>
                  <p className="dash-danger-desc">
                    Ações irreversíveis. Tenha certeza antes de continuar.
                  </p>

                  <div className="dash-danger-row">
                    <div>
                      <div className="dash-config-label">Excluir minha conta</div>
                      <div className="dash-config-desc">
                        Apaga permanentemente sua conta e todos os dados associados.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-danger"
                      onClick={abrirModalExcluir}
                    >
                      Excluir conta
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>

        {drawerMobileAberto && (
          <>
            <div
              className="dash-mobile-backdrop"
              onClick={() => setDrawerMobileAberto(false)}
              aria-hidden="true"
            />
            <aside
              className="dash-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navegação"
            >
              <div className="dash-brand">
                <span className="dash-brand-mark" aria-hidden="true">🐄</span>
                <div className="dash-brand-text">
                  <span className="dash-brand-name">AgroGestor</span>
                  <span className="dash-brand-sub">Gestão de Rebanho</span>
                </div>
              </div>

              <nav className="dash-nav" aria-label="Áreas do aplicativo">
                {gruposNavegacao.map(grupo => <div key={grupo.titulo}>
                  <div className="dash-nav-label">{grupo.titulo}</div>
                  {grupo.itens.map(({ id, icone, texto, badge }) => <button key={id} type="button"
                    className={`dash-nav-btn${aba === id || (aba === 'ficha' && id === 'rebanho') ? ' is-active' : ''}`}
                    onClick={() => navegarPara(id)} aria-current={aba === id || (aba === 'ficha' && id === 'rebanho') ? 'page' : undefined}>
                    <span className="dash-nav-icon" aria-hidden="true">{icone}</span><span>{texto}</span>
                    {badge ? <span className="dash-nav-badge">{badge}</span> : null}
                  </button>)}
                </div>)}
              </nav>

              <div className="dash-sidebar-footer">
                <button type="button" className="dash-nav-btn" onClick={() => { setDrawerMobileAberto(false); alternar(); }}>
                  <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
                  <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {modalExcluirAberto && (
          <div
            className="dash-overlay"
            onClick={() => !excluindo && setModalExcluirAberto(false)}
            role="presentation"
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-excluir-title"
              aria-describedby="modal-excluir-desc"
              className="dash-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dash-modal-icon" aria-hidden="true">⚠️</div>
              <h2 id="modal-excluir-title" className="dash-modal-title">
                Excluir conta permanentemente?
              </h2>
              <p id="modal-excluir-desc" className="dash-modal-desc">
                Esta ação é <strong>irreversível</strong>. Todos os seus animais, relatórios e
                dados serão apagados permanentemente. Digite sua senha para confirmar.
              </p>

              <label htmlFor="senha-excluir" className="dash-modal-label">
                Senha atual
              </label>
              <input
                id="senha-excluir"
                type="password"
                className="dash-input"
                placeholder="Digite sua senha"
                value={senhaExcluir}
                onChange={(e) => setSenhaExcluir(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !excluindo) handleExcluirConta();
                }}
                autoFocus
                disabled={excluindo}
                autoComplete="current-password"
                aria-describedby={erroExcluir ? 'erro-excluir' : undefined}
                aria-invalid={!!erroExcluir}
              />
              {erroExcluir && (
                <p id="erro-excluir" className="dash-error-inline" role="alert">
                  <span aria-hidden="true">●</span> {erroExcluir}
                </p>
              )}

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  onClick={() => setModalExcluirAberto(false)}
                  disabled={excluindo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-danger"
                  onClick={handleExcluirConta}
                  disabled={excluindo || !senhaExcluir.trim()}
                >
                  {excluindo ? 'Excluindo…' : 'Sim, excluir conta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {paletaAberta && (
          <div
            className="dash-overlay"
            onClick={() => setPaletaAberta(false)}
            role="presentation"
            style={{ alignItems: 'flex-start', paddingTop: '12vh' }}
          >
            <div
              ref={paletaRef}
              role="dialog"
              aria-modal="true"
              aria-label="Paleta de comandos"
              className="dash-palette"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                type="text"
                className="dash-palette-input"
                placeholder="Buscar comandos ou animais…"
                value={buscaPaleta}
                onChange={(e) => { setBuscaPaleta(e.target.value); setPaletaSelecionada(0); }}
                onKeyDown={onPaletaKeyDown}
                aria-label="Buscar"
              />

              <div className="dash-palette-list" role="listbox">
                {paletaItens.todos.length === 0 && (
                  <div className="dash-palette-empty">Nada encontrado.</div>
                )}

                {paletaItens.comandos.length > 0 && (
                  <>
                    <div className="dash-palette-group">Ações</div>
                    {paletaItens.comandos.map((item, i) => {
                      const sel = i === paletaSelecionada;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={`dash-palette-item${sel ? ' is-selected' : ''}`}
                          onMouseEnter={() => setPaletaSelecionada(i)}
                          onClick={() => { item.run(); setPaletaAberta(false); }}
                        >
                          <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                          <span className="dash-palette-item-text">
                            <span className="dash-palette-item-title">{item.titulo}</span>
                            <span className="dash-palette-item-sub">{item.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}

                {paletaItens.animais.length > 0 && (
                  <>
                    <div className="dash-palette-group">Animais</div>
                    {paletaItens.animais.map((item, i) => {
                      const idx = paletaItens.comandos.length + i;
                      const sel = idx === paletaSelecionada;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={`dash-palette-item${sel ? ' is-selected' : ''}`}
                          onMouseEnter={() => setPaletaSelecionada(idx)}
                          onClick={() => { item.run(); setPaletaAberta(false); }}
                        >
                          <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                          <span className="dash-palette-item-text">
                            <span className="dash-palette-item-title">{item.titulo}</span>
                            <span className="dash-palette-item-sub">{item.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="dash-toasts"
          role="region"
          aria-label="Notificações"
          aria-live="polite"
        >
          {toasts.map((tst) => (
            <div key={tst.id} className={`dash-toast dash-toast--${tst.tipo}`}>
              <span className="dash-toast-icon" aria-hidden="true">
                {tst.tipo === 'sucesso' ? '✓' : tst.tipo === 'erro' ? '!' : 'i'}
              </span>
              <span className="dash-toast-text">{tst.texto}</span>
              <button
                type="button"
                className="dash-toast-close"
                onClick={() => remover(tst.id)}
                aria-label="Fechar notificação"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={importarJSON}
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}
