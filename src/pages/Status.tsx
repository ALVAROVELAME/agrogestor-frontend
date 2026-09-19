import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export type TipoStatus = 'sucesso' | 'erro' | 'aviso' | 'info' | 'carregando';

export interface StatusOpcoes {
  tipo?: TipoStatus;
  titulo?: string;
  mensagem?: string;
  ctaTexto?: string;
  ctaLink?: string;
  /** Segundos para redirecionar automaticamente. 0 = desativado */
  autoRedirect?: number;
}

// ============================================================
// Configuração visual por tipo
// ============================================================
const CONFIG: Record<
  TipoStatus,
  { icon: string; cor: string; fundo: string; texto: string; label: string }
> = {
  sucesso: {
    icon: '✓',
    cor: '#1f5f2b',
    fundo: '#e6f4e6',
    texto: '#1f5f2b',
    label: 'Sucesso',
  },
  erro: {
    icon: '✕',
    cor: '#d94c4c',
    fundo: '#fdecec',
    texto: '#a03030',
    label: 'Erro',
  },
  aviso: {
    icon: '!',
    cor: '#e8a20c',
    fundo: '#fef5e0',
    texto: '#8a5b00',
    label: 'Aviso',
  },
  info: {
    icon: 'i',
    cor: '#2c6fbb',
    fundo: '#e6f0fb',
    texto: '#1a4a80',
    label: 'Informação',
  },
  carregando: {
    icon: '◌',
    cor: '#6b806b',
    fundo: '#f0f4f0',
    texto: '#3b5a3b',
    label: 'Aguarde',
  },
};

// ============================================================
// Componente visual puro (recebe props)
// ============================================================
export function StatusView({
  tipo = 'info',
  titulo = 'Tudo certo por aqui',
  mensagem = '',
  ctaTexto = 'Voltar ao início',
  ctaLink = '/',
  autoRedirect = 0,
}: StatusOpcoes) {
  const navigate = useNavigate();
  const cfg = CONFIG[tipo] ?? CONFIG.info;

  // Auto-redirect opcional
  useEffect(() => {
    if (!autoRedirect || autoRedirect <= 0) return;
    const timer = setTimeout(
      () => navigate(ctaLink, { replace: true }),
      autoRedirect * 1000
    );
    return () => clearTimeout(timer);
  }, [autoRedirect, ctaLink, navigate]);

  const corBotao = tipo === 'carregando' ? '#1f5f2b' : cfg.cor;

  return (
    <div style={s.page}>
      <style>{`
        @media (max-width: 980px) {
          .status-page { grid-template-columns: 1fr !important; }
          .status-brand {
            padding: 40px 32px !important;
            min-height: 200px !important;
            text-align: center;
            align-items: center !important;
          }
          .status-brand-title { font-size: 24px !important; max-width: 100% !important; }
          .status-brand-subtitle { display: none; }
        }
        @keyframes statusSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes statusFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
      <aside style={s.brand} className="status-brand">
        <div>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 40 }}>🐄</span>
            <span style={s.logoText}>AgroGestor</span>
          </Link>
          <h2 style={s.brandTitle} className="status-brand-title">
            Gestão inteligente do seu rebanho
          </h2>
          <p style={s.brandSubtitle} className="status-brand-subtitle">
            Controle produção, categorias e relatórios em um só lugar.
          </p>
        </div>
        <div style={s.brandFooter}>
          © {new Date().getFullYear()} AgroGestor
        </div>
      </aside>

      {/* ============ PAINEL DIREITO — STATUS ============ */}
      <main style={s.main}>
        <div style={s.card}>
          {/* Ícone animado */}
          <div
            style={{
              ...s.iconWrap,
              background: cfg.fundo,
              border: `2px solid ${cfg.cor}`,
            }}
          >
            <span
              style={{
                ...s.icon,
                color: cfg.texto,
                animation:
                  tipo === 'carregando'
                    ? 'statusSpin 1.4s linear infinite'
                    : 'statusPop 0.45s ease-out',
              }}
            >
              {cfg.icon}
            </span>
          </div>

          {/* Badge do tipo */}
          <span
            style={{
              ...s.badge,
              background: cfg.fundo,
              color: cfg.texto,
            }}
          >
            {cfg.label}
          </span>

          {/* Título */}
          <h1 style={s.title}>{titulo}</h1>

          {/* Mensagem */}
          {mensagem && <p style={s.mensagem}>{mensagem}</p>}

          {/* Botão CTA */}
          <Link
            to={ctaLink}
            style={{ ...s.btnPrimary, background: corBotao }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {ctaTexto} →
          </Link>

          {/* Auto-redirect */}
          {autoRedirect > 0 && (
            <p style={s.autoText}>
              Redirecionando em {autoRedirect} segundos...
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Componente padrão (lê de location.state OU query string)
// ============================================================
export default function Status() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const state = (location.state as StatusOpcoes | null) ?? {};

  const tipo = (params.get('tipo') ?? state.tipo ?? 'info') as TipoStatus;
  const titulo = params.get('titulo') ?? state.titulo;
  const mensagem = params.get('mensagem') ?? state.mensagem;
  const ctaTexto = params.get('ctaTexto') ?? state.ctaTexto;
  const ctaLink = params.get('ctaLink') ?? state.ctaLink;
  const autoRedirect = Number(
    params.get('autoRedirect') ?? state.autoRedirect ?? 0
  );

  return (
    <StatusView
      tipo={tipo}
      titulo={titulo}
      mensagem={mensagem}
      ctaTexto={ctaTexto}
      ctaLink={ctaLink}
      autoRedirect={autoRedirect}
    />
  );
}

// ============================================================
// Estilos
// ============================================================
const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
    width: '100%',
    background: '#f4f6f8',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  brand: {
    background:
      'linear-gradient(135deg, #1f5f2b 0%, #2d7a3a 60%, #4caf50 100%)',
    color: '#fff',
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 56,
    textDecoration: 'none',
    color: '#fff',
  },
  logoText: { fontSize: 22, fontWeight: 700 },
  brandTitle: {
    fontSize: 32,
    lineHeight: 1.2,
    margin: '0 0 16px',
    fontWeight: 700,
    maxWidth: 420,
  },
  brandSubtitle: {
    fontSize: 15,
    lineHeight: 1.6,
    opacity: 0.9,
    margin: 0,
    maxWidth: 420,
  },
  brandFooter: { fontSize: 12, opacity: 0.7 },
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 18,
    padding: '40px 32px 32px',
    boxShadow: '0 12px 40px rgba(31,95,43,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    animation: 'statusFadeIn 0.35s ease-out',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    marginBottom: 18,
  },
  icon: {
    fontSize: 44,
    fontWeight: 700,
    lineHeight: 1,
    display: 'inline-block',
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    padding: '5px 12px',
    borderRadius: 999,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 10px',
    color: '#1a2b1a',
    lineHeight: 1.25,
  },
  mensagem: {
    fontSize: 14,
    color: '#6b806b',
    lineHeight: 1.6,
    margin: '0 0 26px',
    maxWidth: 360,
  },
  btnPrimary: {
    marginTop: 4,
    padding: '12px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'opacity 0.15s, transform 0.15s',
    fontFamily: 'inherit',
  },
  autoText: {
    marginTop: 16,
    fontSize: 12,
    color: '#8a9a8a',
    fontStyle: 'italic',
  },
};