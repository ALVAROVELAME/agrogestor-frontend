import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

interface LoginResposta {
  sucesso: boolean;
  mensagem: string;
  token: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    ativo: boolean;
  };
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  // Limpa erro quando o usuário digita
  useEffect(() => {
    if (erro) setErro(null);
  }, [email, senha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const { data } = await api.post<LoginResposta>('/api/auth/login', {
        email,
        senha,
      });

      // Guarda o token JWT
      localStorage.setItem('token', data.token);

      // Guarda o usuário para exibir no dashboard
      if (data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { mensagem?: string } } };
      setErro(
        apiErr?.response?.data?.mensagem ||
          'Credenciais inválidas ou e-mail não confirmado.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
      <aside style={s.brand}>
        <div>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 40 }}>🐄</span>
            <span style={s.logoText}>AgroGestor</span>
          </Link>
          <h2 style={s.brandTitle}>Gestão inteligente do seu rebanho</h2>
          <p style={s.brandSubtitle}>
            Controle produção, categorias e relatórios em um só lugar.
          </p>
        </div>
        <div style={s.brandFooter}>© {new Date().getFullYear()} AgroGestor</div>
      </aside>

      {/* ============ PAINEL DIREITO — FORMULÁRIO ============ */}
      <main style={s.formSide}>
        <div style={s.formWrap}>
          <h1 style={s.title}>Bem-vindo de volta 👋</h1>
          <p style={s.subtitle}>Entre com suas credenciais</p>

          {erro && (
            <div role="alert" style={s.alert}>
              ⚠️ {erro}
            </div>
          )}

          <form onSubmit={handleLogin} style={s.form} noValidate>
            <div style={s.field}>
              <label htmlFor="email" style={s.label}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={s.input}
              />
            </div>

            <div style={s.field}>
              <label htmlFor="senha" style={s.label}>
                Senha
              </label>
              <div style={s.passwordWrap}>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...s.input, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  style={s.eyeBtn}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{ ...s.btnPrimary, ...(carregando ? s.btnDisabled : null) }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={s.footerText}>
            Não tem conta?{' '}
            <Link to="/signup" style={s.link}>
              Criar conta grátis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
    width: '100%',
    background: '#f4f6f8',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  brand: {
    background: 'linear-gradient(135deg, #1f5f2b 0%, #2d7a3a 60%, #4caf50 100%)',
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
  formSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    background: '#f4f6f8',
  },
  formWrap: { width: '100%', maxWidth: 400 },
  title: { fontSize: 26, margin: '0 0 6px', color: '#1a2b1a', fontWeight: 700 },
  subtitle: { fontSize: 14, color: '#6b806b', margin: '0 0 28px' },
  alert: {
    background: '#fdecec',
    color: '#a03030',
    border: '1px solid #f5c6c6',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 20,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3b5a3b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #cddccd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    color: '#1a2b1a',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  passwordWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 6,
  },
  btnPrimary: {
    marginTop: 8,
    padding: '12px 18px',
    background: '#1f5f2b',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: '#6b806b',
  },
  link: { color: '#1f5f2b', fontWeight: 600, textDecoration: 'none' },
};