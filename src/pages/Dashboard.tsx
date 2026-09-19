import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
  useRef,
} from 'react';
import AnimalForm from '../components/AnimalForm';
import AnimalList from '../components/AnimalList';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import type { Animal } from '../types';

const STORAGE_KEY = 'agrogestor:animais';
const THEME_KEY = 'agrogestor:tema';

type Aba = 'visao' | 'rebanho' | 'relatorios' | 'config';
type Tema = 'claro' | 'escuro';
type Toast = { id: string; texto: string; tipo: 'sucesso' | 'erro' | 'info' };

// ============================================================
// Hook: animais + persistência
// ============================================================
function useAnimais() {
  const [animais, setAnimais] = useState<Animal[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Animal[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animais));
  }, [animais]);

  const salvar = useCallback((animal: Animal) => {
    setAnimais((prev) => {
      if (animal.id) return prev.map((a) => (a.id === animal.id ? animal : a));
      return [...prev, { ...animal, id: crypto.randomUUID() }];
    });
  }, []);

  const excluir = useCallback((id: string | number) => {
    setAnimais((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const importar = useCallback((novos: Animal[]) => setAnimais(novos), []);

  return { animais, salvar, excluir, importar };
}

// ============================================================
// Hook: tema
// ============================================================
function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem(THEME_KEY) as Tema | null;
    return salvo ?? 'claro';
  });
  useEffect(() => localStorage.setItem(THEME_KEY, tema), [tema]);
  const alternar = () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro'));
  return { tema, alternar };
}

// ============================================================
// Hook: toasts empilhados
// ============================================================
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

// ============================================================
// Utilitário
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
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
};

// ============================================================
// Componente principal
// ============================================================
export default function Dashboard() {
  const { animais, salvar, excluir, importar } = useAnimais();
  const { tema, alternar } = useTema();
  const { toasts, push } = useToasts();
  const { usuario } = useAuth();

  const [aba, setAba] = useState<Aba>('visao');
  const [animalEditando, setAnimalEditando] = useState<Animal | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<'Todas' | Animal['categoria']>('Todas');
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);

  // Exclusão de conta
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const buscaDeferred = useDeferredValue(busca);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atalhos globais
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletaAberta((v) => !v);
      }
      if (e.key === 'Escape') {
        setPaletaAberta(false);
        setMenuUsuarioAberto(false);
        if (!excluindo) setModalExcluirAberto(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [excluindo]);

  // Fecha menu do usuário ao clicar fora
  useEffect(() => {
    if (!menuUsuarioAberto) return;
    const fechar = () => setMenuUsuarioAberto(false);
    window.addEventListener('click', fechar);
    return () => window.removeEventListener('click', fechar);
  }, [menuUsuarioAberto]);

  // Ações
  const handleSalvar = useCallback(
    (animal: Animal) => {
      salvar(animal);
      setAnimalEditando(null);
      push(animal.id ? 'Animal atualizado!' : 'Animal cadastrado!', 'sucesso');
    },
    [salvar, push]
  );

  const handleExcluir = useCallback(
    (id: string | number) => {
      const animal = animais.find((a) => a.id === id);
      if (!animal) return;
      if (confirm(`Excluir "${animal.nome}" (brinco ${animal.brinco})?`)) {
        excluir(id);
        push('Animal excluído.', 'info');
      }
    },
    [animais, excluir, push]
  );

  const exportarJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(animais, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrogestor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push('Backup exportado!', 'sucesso');
  }, [animais, push]);

  const importarJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (Array.isArray(data)) {
            importar(data);
            push(`${data.length} animais importados.`, 'sucesso');
          } else push('Arquivo inválido.', 'erro');
        } catch {
          push('Erro ao ler arquivo.', 'erro');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importar, push]
  );

  // Exclusão de conta
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
      // Limpa cache local de animais também
      localStorage.removeItem(STORAGE_KEY);
      // Recarrega pra landing (sem token)
      window.location.href = '/';
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { mensagem?: string } } };
      setErroExcluir(
        apiErr?.response?.data?.mensagem ||
          'Não foi possível excluir a conta. Verifique sua senha.'
      );
      setExcluindo(false);
    }
  };

  // Filtro
  const animaisFiltrados = useMemo(() => {
    const termo = normalizar(buscaDeferred.trim());
    return animais.filter((a) => {
      if (categoriaFiltro !== 'Todas' && a.categoria !== categoriaFiltro) return false;
      if (!termo) return true;
      return normalizar(a.nome).includes(termo) || normalizar(a.brinco).includes(termo);
    });
  }, [animais, buscaDeferred, categoriaFiltro]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = animais.length;
    const producaoTotal = animais.reduce((acc, a) => acc + (a.producaoDiaria || 0), 0);
    const media = total > 0 ? producaoTotal / total : 0;
    const maior = animais.reduce<Animal | null>(
      (m, a) => (!m || a.producaoDiaria > m.producaoDiaria ? a : m), null);
    const menor = animais.reduce<Animal | null>(
      (m, a) => (!m || a.producaoDiaria < m.producaoDiaria ? a : m), null);

    const porCategoria = animais.reduce<Record<string, number>>((acc, a) => {
      acc[a.categoria] = (acc[a.categoria] || 0) + 1;
      return acc;
    }, {});

    const top5 = [...animais].sort((a, b) => b.producaoDiaria - a.producaoDiaria).slice(0, 5);
    const maxProd = top5[0]?.producaoDiaria ?? 1;

    return { total, producaoTotal, media, maior, menor, porCategoria, top5, maxProd };
  }, [animais]);

  const t = tema === 'escuro' ? dark : light;

  return (
    <div style={{ ...base.app, background: t.bg, color: t.text }}>
      {/* ============ SIDEBAR ============ */}
      <aside style={{ ...base.sidebar, background: t.sidebar, borderColor: t.border }}>
        <div style={base.brand}>
          <span style={{ fontSize: 24 }}>🐄</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AgroGestor</div>
            <div style={{ fontSize: 11, color: t.muted }}>Gestão de Rebanho</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 20 }}>
          {(
            [
              ['visao', '📊', 'Visão Geral'],
              ['rebanho', '🐮', 'Rebanho'],
              ['relatorios', '📈', 'Relatórios'],
              ['config', '⚙️', 'Configurações'],
            ] as const
          ).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              style={{
                ...base.navBtn,
                background: aba === id ? t.accentSoft : 'transparent',
                color: aba === id ? t.accent : t.text,
                fontWeight: aba === id ? 600 : 500,
              }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
          <button onClick={alternar} style={{ ...base.navBtn, color: t.muted }}>
            <span>{tema === 'claro' ? '🌙' : '☀️'}</span>
            Tema {tema === 'claro' ? 'escuro' : 'claro'}
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main style={base.main}>
        {/* Topbar */}
        <header
          style={{
            ...base.topbar,
            background: t.surface,
            borderColor: t.border,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: t.text }}>
              {aba === 'visao' && 'Visão Geral'}
              {aba === 'rebanho' && 'Rebanho'}
              {aba === 'relatorios' && 'Relatórios'}
              {aba === 'config' && 'Configurações'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>
              {formatarData()} · {animais.length} animais cadastrados
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setPaletaAberta(true)}
              style={{ ...base.btnGhost, borderColor: t.border, color: t.muted }}
              title="Ctrl+K"
            >
              🔍 Buscar <kbd style={base.kbd}>Ctrl K</kbd>
            </button>
            <button
              onClick={exportarJSON}
              style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}
            >
              ⬇️ Exportar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}
            >
              ⬆️ Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={importarJSON}
              style={{ display: 'none' }}
            />

            {/* ============ MENU DO USUÁRIO ============ */}
            <div
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMenuUsuarioAberto((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'transparent',
                  border: `1px solid ${t.border}`,
                  borderRadius: 999,
                  padding: '4px 12px 4px 4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: t.text,
                }}
                aria-haspopup="menu"
                aria-expanded={menuUsuarioAberto}
              >
                <div
                  style={{
                    ...base.avatar,
                    background: t.accent,
                    width: 30,
                    height: 30,
                    fontSize: 12,
                  }}
                >
                  {iniciais(usuario?.nome)}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {usuario?.nome ?? 'Usuário'}
                </span>
                <span style={{ fontSize: 10, color: t.muted }}>▾</span>
              </button>

              {menuUsuarioAberto && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 240,
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 10,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    padding: 8,
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${t.border}`,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>
                      {usuario?.nome ?? 'Usuário'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: t.muted,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {usuario?.email ?? ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuUsuarioAberto(false);
                      setAba('config');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                      color: t.text,
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = t.accentSoft)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    ⚙️ Configurações
                  </button>

                  <div style={{ padding: '6px 4px 2px' }}>
                    <LogoutButton
                      estilo={{
                        width: '100%',
                        padding: '9px 12px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div style={base.content}>
          {/* ============ ABA: VISÃO GERAL ============ */}
          {aba === 'visao' && (
            <>
              <section style={base.statsGrid}>
                <KpiCard t={t} icon="🐮" label="Total de animais" value={stats.total} />
                <KpiCard t={t} icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                <KpiCard t={t} icon="📊" label="Média por animal" value={`${stats.media.toFixed(2)} L`} />
                <KpiCard
                  t={t}
                  icon="🏆"
                  label="Maior produtor"
                  value={stats.maior ? `${stats.maior.nome} · ${stats.maior.producaoDiaria} L` : '—'}
                />
              </section>

              <section style={{ ...base.panel, background: t.surface, borderColor: t.border }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: t.text }}>
                  Top 5 — Produção diária (L)
                </h3>
                {stats.top5.length === 0 ? (
                  <p style={{ color: t.muted, fontSize: 13 }}>Sem dados para exibir.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.top5.map((a) => (
                      <div key={String(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 120, fontSize: 13, color: t.text, fontWeight: 500 }}>
                          {a.nome}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 22,
                            background: t.accentSoft,
                            borderRadius: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${(a.producaoDiaria / stats.maxProd) * 100}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
                              borderRadius: 6,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <div style={{ width: 60, textAlign: 'right', fontSize: 13, color: t.muted }}>
                          {a.producaoDiaria} L
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ ...base.panel, background: t.surface, borderColor: t.border }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: t.text }}>
                  Distribuição por categoria
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(stats.porCategoria).map(([cat, qtd]) => (
                    <span
                      key={cat}
                      style={{
                        background: t.accentSoft,
                        color: t.accent,
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {cat}: <strong>{qtd}</strong>
                    </span>
                  ))}
                  {stats.total === 0 && (
                    <span style={{ color: t.muted, fontSize: 13 }}>Nenhum animal cadastrado.</span>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ============ ABA: REBANHO ============ */}
          {aba === 'rebanho' && (
            <>
              <section style={base.filtros}>
                <input
                  placeholder="🔍 Buscar por nome ou brinco..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    ...base.input,
                    background: t.surface,
                    borderColor: t.border,
                    color: t.text,
                  }}
                />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value as typeof categoriaFiltro)}
                  style={{
                    ...base.input,
                    flex: '0 0 200px',
                    background: t.surface,
                    borderColor: t.border,
                    color: t.text,
                  }}
                >
                  {['Todas', 'Bezerra', 'Novilha', 'Vaca em Lactação', 'Vaca Seca'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {(busca || categoriaFiltro !== 'Todas') && (
                  <button
                    onClick={() => {
                      setBusca('');
                      setCategoriaFiltro('Todas');
                    }}
                    style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}
                  >
                    Limpar
                  </button>
                )}
              </section>

              <AnimalForm
                animalEditando={animalEditando}
                onSalvar={handleSalvar}
                onCancelar={() => setAnimalEditando(null)}
              />

              {animaisFiltrados.length === 0 ? (
                <div
                  style={{
                    ...base.empty,
                    background: t.surface,
                    borderColor: t.border,
                    color: t.muted,
                  }}
                >
                  <p style={{ fontSize: 32, margin: 0 }}>
                    {animais.length === 0 ? '🐄' : '🔎'}
                  </p>
                  <p>
                    {animais.length === 0
                      ? 'Nenhum animal cadastrado. Use o formulário acima.'
                      : 'Nenhum resultado para os filtros aplicados.'}
                  </p>
                </div>
              ) : (
                <AnimalList
                  animais={animaisFiltrados}
                  onEditar={setAnimalEditando}
                  onExcluir={handleExcluir}
                />
              )}
            </>
          )}

          {/* ============ ABA: RELATÓRIOS ============ */}
          {aba === 'relatorios' && (
            <>
              <section style={base.statsGrid}>
                <KpiCard t={t} icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                <KpiCard t={t} icon="📊" label="Média geral" value={`${stats.media.toFixed(2)} L`} />
                <KpiCard
                  t={t}
                  icon="🏆"
                  label="Maior produtor"
                  value={stats.maior ? stats.maior.nome : '—'}
                />
                <KpiCard
                  t={t}
                  icon="📉"
                  label="Menor produtor"
                  value={stats.menor ? stats.menor.nome : '—'}
                />
              </section>

              <section style={{ ...base.panel, background: t.surface, borderColor: t.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: t.text }}>Relatório detalhado</h3>
                  <button
                    onClick={() => window.print()}
                    style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}
                  >
                    🖨️ Imprimir
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, color: t.muted }}>
                      <th style={base.th}>Brinco</th>
                      <th style={base.th}>Nome</th>
                      <th style={base.th}>Categoria</th>
                      <th style={{ ...base.th, textAlign: 'right' }}>Produção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animais.map((a) => (
                      <tr key={String(a.id)} style={{ borderBottom: `1px solid ${t.border}` }}>
                        <td style={base.td}>{a.brinco}</td>
                        <td style={base.td}>{a.nome}</td>
                        <td style={base.td}>{a.categoria}</td>
                        <td style={{ ...base.td, textAlign: 'right', fontWeight: 600 }}>
                          {a.producaoDiaria} L
                        </td>
                      </tr>
                    ))}
                    {animais.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...base.td, textAlign: 'center', color: t.muted }}>
                          Sem dados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ============ ABA: CONFIGURAÇÕES ============ */}
          {aba === 'config' && (
            <>
              <section style={{ ...base.panel, background: t.surface, borderColor: t.border }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: t.text }}>Preferências</h3>

                <div style={base.configRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: t.text }}>Tema da interface</div>
                    <div style={{ fontSize: 12, color: t.muted }}>Alterna entre claro e escuro</div>
                  </div>
                  <button onClick={alternar} style={{ ...base.btnPrimary, background: t.accent }}>
                    {tema === 'claro' ? '🌙 Escuro' : '☀️ Claro'}
                  </button>
                </div>

                <div style={base.configRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: t.text }}>Backup dos dados</div>
                    <div style={{ fontSize: 12, color: t.muted }}>
                      Exporte ou importe em formato JSON
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={exportarJSON} style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}>
                      Exportar
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ ...base.btnGhost, borderColor: t.border, color: t.text }}
                    >
                      Importar
                    </button>
                  </div>
                </div>

                <div style={base.configRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: t.text }}>Conta</div>
                    <div style={{ fontSize: 12, color: t.muted }}>
                      {usuario?.email ?? 'Sessão ativa'}
                    </div>
                  </div>
                  <LogoutButton />
                </div>

                <div style={base.configRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: t.text }}>Zerar rebanho</div>
                    <div style={{ fontSize: 12, color: t.muted }}>
                      Remove todos os animais (irreversível)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Apagar TODOS os animais? Esta ação não pode ser desfeita.')) {
                        importar([]);
                        push('Rebanho zerado.', 'info');
                      }
                    }}
                    style={{ ...base.btnPrimary, background: '#d94c4c' }}
                  >
                    Zerar
                  </button>
                </div>
              </section>

              {/* ============ ZONA DE PERIGO ============ */}
              <section
                style={{
                  border: '1px solid #f5c6c6',
                  borderRadius: 12,
                  padding: '20px 22px',
                  background: tema === 'escuro' ? 'rgba(217,76,76,0.08)' : '#fff8f8',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 6px',
                    fontSize: 14,
                    color: '#a03030',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  ⚠️ Zona de Perigo
                </h3>
                <p style={{ fontSize: 12, color: t.muted, margin: '0 0 16px' }}>
                  Ações irreversíveis. Tenha certeza antes de continuar.
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(217,76,76,0.2)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: t.text }}>Excluir minha conta</div>
                    <div style={{ fontSize: 12, color: t.muted }}>
                      Apaga permanentemente sua conta e todos os seus dados (animais, registros).
                    </div>
                  </div>
                  <button
                    onClick={abrirModalExcluir}
                    style={{
                      padding: '10px 18px',
                      background: '#d94c4c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Excluir conta
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ============ MODAL: EXCLUIR CONTA ============ */}
      {modalExcluirAberto && (
        <div
          onClick={() => !excluindo && setModalExcluirAberto(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 460,
              background: t.surface,
              border: '1px solid #f5c6c6',
              borderRadius: 14,
              padding: '24px 24px 20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              color: t.text,
            }}
          >
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>⚠️</div>
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 20,
                color: '#a03030',
                textAlign: 'center',
              }}
            >
              Excluir conta permanentemente?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: t.muted,
                textAlign: 'center',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              Esta ação é <strong style={{ color: '#a03030' }}>irreversível</strong>. Todos os
              seus animais, relatórios e dados serão apagados permanentemente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <label htmlFor="senha-excluir" style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                Digite sua senha para confirmar
              </label>
              <input
                id="senha-excluir"
                type="password"
                placeholder="Sua senha atual"
                value={senhaExcluir}
                onChange={(e) => setSenhaExcluir(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !excluindo) handleExcluirConta();
                }}
                autoFocus
                disabled={excluindo}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: erroExcluir ? '1px solid #d94c4c' : `1px solid ${t.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  background: t.surface,
                  color: t.text,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              {erroExcluir && (
                <span style={{ fontSize: 12, color: '#a03030', fontWeight: 500 }}>
                  {erroExcluir}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                disabled={excluindo}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: excluindo ? 'not-allowed' : 'pointer',
                  color: t.text,
                  fontFamily: 'inherit',
                  opacity: excluindo ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirConta}
                disabled={excluindo || !senhaExcluir.trim()}
                style={{
                  padding: '10px 18px',
                  background: '#d94c4c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    excluindo || !senhaExcluir.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: excluindo || !senhaExcluir.trim() ? 0.5 : 1,
                }}
              >
                {excluindo ? 'Excluindo...' : 'Sim, excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ COMMAND PALETTE ============ */}
      {paletaAberta && (
        <div
          onClick={() => setPaletaAberta(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 520,
              background: t.surface,
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <input
              autoFocus
              placeholder="Digite um comando ou busque por animal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                borderBottom: `1px solid ${t.border}`,
                fontSize: 14,
                outline: 'none',
                background: 'transparent',
                color: t.text,
              }}
            />
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {[
                { icon: '🐮', label: 'Ir para Rebanho', run: () => setAba('rebanho') },
                { icon: '📊', label: 'Ir para Visão Geral', run: () => setAba('visao') },
                { icon: '📈', label: 'Ir para Relatórios', run: () => setAba('relatorios') },
                { icon: '⚙️', label: 'Ir para Configurações', run: () => setAba('config') },
                { icon: '⬇️', label: 'Exportar backup', run: exportarJSON },
                { icon: tema === 'claro' ? '🌙' : '☀️', label: 'Alternar tema', run: alternar },
              ]
                .filter((a) => normalizar(a.label).includes(normalizar(busca)))
                .map((a, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      a.run();
                      setPaletaAberta(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: t.text,
                      fontSize: 13,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = t.accentSoft)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TOASTS ============ */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1100,
        }}
      >
        {toasts.map((tst) => (
          <div
            key={tst.id}
            style={{
              background:
                tst.tipo === 'sucesso' ? '#1f5f2b' : tst.tipo === 'erro' ? '#d94c4c' : '#3b5a8a',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              animation: 'slideIn 0.25s ease',
            }}
          >
            {tst.texto}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

// ============================================================
// Subcomponente: KPI Card
// ============================================================
function KpiCard({
  icon,
  label,
  value,
  t,
}: {
  icon: string;
  label: string;
  value: string | number;
  t: typeof light;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: t.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginTop: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: t.text }}>{value}</div>
    </div>
  );
}

// ============================================================
// Tema
// ============================================================
const light = {
  bg: '#f4f6f8',
  surface: '#ffffff',
  sidebar: '#ffffff',
  border: '#e5e9ec',
  text: '#1a2b1a',
  muted: '#7a8a7a',
  accent: '#1f5f2b',
  accent2: '#4caf50',
  accentSoft: '#e6f4e6',
};

const dark = {
  bg: '#0f1512',
  surface: '#1a211d',
  sidebar: '#141a16',
  border: '#262e29',
  text: '#e6ece8',
  muted: '#8a9a8f',
  accent: '#4caf50',
  accent2: '#81c784',
  accentSoft: '#1f3a24',
};

// ============================================================
// Estilos base
// ============================================================
const base: Record<string, React.CSSProperties> = {
  app: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    minHeight: '100vh',
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    transition: 'background 0.25s, color 0.25s',
  },
  sidebar: {
    borderRight: '1px solid',
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    background: 'transparent',
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  main: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 28px',
    borderBottom: '1px solid',
    gap: 12,
    flexWrap: 'wrap',
  },
  content: { padding: '24px 28px 60px', display: 'flex', flexDirection: 'column', gap: 20 },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 14,
  },

  panel: {
    border: '1px solid',
    borderRadius: 12,
    padding: '18px 20px',
  },

  filtros: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: {
    flex: '1 1 260px',
    padding: '10px 14px',
    border: '1px solid',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  },

  btnPrimary: {
    padding: '9px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'inherit',
  },
  btnGhost: {
    padding: '9px 14px',
    background: 'transparent',
    border: '1px solid',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
  },
  kbd: {
    background: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 10,
    marginLeft: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
  },

  empty: {
    textAlign: 'center',
    padding: '40px 16px',
    border: '1px dashed',
    borderRadius: 12,
    fontSize: 13,
  },

  configRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '16px 0',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  th: { textAlign: 'left', padding: '8px 6px', fontWeight: 600, fontSize: 12 },
  td: { padding: '10px 6px', fontSize: 13 },
};