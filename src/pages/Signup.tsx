import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

// ============================================================
// Regras de validação
// ============================================================
const VALIDACOES = {
  nome: {
    valido: (v: string) => v.trim().length >= 3,
    msg: 'Nome deve ter pelo menos 3 caracteres',
  },
  email: {
    valido: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    msg: 'E-mail inválido',
  },
  senha: {
    valido: (v: string) => v.length >= 6,
    msg: 'Senha deve ter pelo menos 6 caracteres',
  },
};

export default function Signup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});

  // Limpa erro quando o usuário digita
  useEffect(() => {
    if (erro) setErro(null);
  }, [nome, email, senha, confirmar]);

  // ---------- Força da senha ----------
  const forca = useMemo(() => {
    let score = 0;
    if (senha.length >= 8) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;
    return score;
  }, [senha]);

  const forcaInfo = useMemo(() => {
    const map = [
      { label: 'Muito fraca', cor: '#d94c4c' },
      { label: 'Fraca', cor: '#e88b3a' },
      { label: 'Média', cor: '#e8c33a' },
      { label: 'Boa', cor: '#6fbf4c' },
      { label: 'Forte', cor: '#1f5f2b' },
    ];
    return map[forca];
  }, [forca]);

  // ---------- Validação geral do form ----------
  const erros = useMemo(() => {
    const e: Record<string, string> = {};
    if (nome && !VALIDACOES.nome.valido(nome)) e.nome = VALIDACOES.nome.msg;
    if (email && !VALIDACOES.email.valido(email)) e.email = VALIDACOES.email.msg;
    if (senha && !VALIDACOES.senha.valido(senha)) e.senha = VALIDACOES.senha.msg;
    if (confirmar && confirmar !== senha) e.confirmar = 'As senhas não coincidem';
    return e;
  }, [nome, email, senha, confirmar]);

  const formValido = useMemo(
    () =>
      VALIDACOES.nome.valido(nome) &&
      VALIDACOES.email.valido(email) &&
      VALIDACOES.senha.valido(senha) &&
      senha === confirmar &&
      aceitouTermos,
    [nome, email, senha, confirmar, aceitouTermos]
  );

  const mostrarErro = (campo: string) =>
    tocados[campo] && erros[campo] ? erros[campo] : null;

  const marcarTocado = (campo: string) =>
    setTocados((t) => ({ ...t, [campo]: true }));

  // ---------- Submit ----------
  const handleCadastro = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErro(null);

      // Força mostrar todos os erros
      setTocados({ nome: true, email: true, senha: true, confirmar: true });

      if (!formValido) return;

      setCarregando(true);
      try {
        await api.post('/api/usuarios', { nome, email, senha });
        setSucesso(true);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { mensagem?: string } } })?.response?.data
            ?.mensagem || 'Erro ao cadastrar. Verifique os dados e tente novamente.';
        setErro(msg);
      } finally {
        setCarregando(false);
      }
    },
    [nome, email, senha, formValido]
  );

  return (
    <div style={s.page}>
      {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
      <aside style={s.brand}>
        <div style={s.brandContent}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 36 }}>🐄</span>
            <span style={s.logoText}>AgroGestor</span>
          </Link>

          <h2 style={s.brandTitle}>Comece a gerenciar seu rebanho hoje</h2>
          <p style={s.brandSubtitle}>
            Crie sua conta gratuitamente e tenha controle total sobre produção,
            categorias e relatórios do seu rebanho.
          </p>

          <ul style={s.brandList}>
            {[
              '100% grátis, sem cartão de crédito',
              'Dados salvos automaticamente',
              'Acesso de qualquer dispositivo',
              'Cancelamento a qualquer momento',
            ].map((item) => (
              <li key={item} style={s.brandItem}>
                <span style={s.check}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div style={s.brandFooter}>
          © {new Date().getFullYear()} AgroGestor · Todos os direitos reservados
        </div>
      </aside>

      {/* ============ PAINEL DIREITO — FORMULÁRIO ============ */}
      <main style={s.formSide}>
        <div style={s.formWrap}>
          {sucesso ? (
            <div style={s.successBox}>
              <div style={s.successIcon}>✅</div>
              <h2 style={s.successTitle}>Cadastro realizado!</h2>
              <p style={s.successText}>
                Enviamos um e-mail de confirmação para <strong>{email}</strong>.
                <br />
                Verifique sua caixa de entrada para ativar a conta.
              </p>
              <Link to="/login" style={s.btnPrimary}>
                Ir para o login →
              </Link>
              <p style={{ fontSize: 12, color: '#8a9a8a', marginTop: 16 }}>
                Não recebeu? Verifique a caixa de spam.
              </p>
            </div>
          ) : (
            <>
              <header style={s.formHeader}>
                <Link to="/" style={s.backLink}>
                  ← Voltar
                </Link>
                <h1 style={s.title}>Criar conta 🌱</h1>
                <p style={s.subtitle}>Preencha os dados para começar</p>
              </header>

              {erro && (
                <div role="alert" style={s.alert}>
                  <span style={{ fontSize: 16 }}>⚠️</span> {erro}
                </div>
              )}

              <form onSubmit={handleCadastro} style={s.form} noValidate>
                {/* Nome */}
                <div style={s.field}>
                  <label htmlFor="nome" style={s.label}>
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => marcarTocado('nome')}
                    required
                    autoComplete="name"
                    aria-invalid={!!mostrarErro('nome')}
                    style={{
                      ...s.input,
                      ...(mostrarErro('nome') ? s.inputError : null),
                    }}
                  />
                  {mostrarErro('nome') && (
                    <span style={s.errorMsg}>{erros.nome}</span>
                  )}
                </div>

                {/* Email */}
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
                    onBlur={() => marcarTocado('email')}
                    required
                    autoComplete="email"
                    aria-invalid={!!mostrarErro('email')}
                    style={{
                      ...s.input,
                      ...(mostrarErro('email') ? s.inputError : null),
                    }}
                  />
                  {mostrarErro('email') && (
                    <span style={s.errorMsg}>{erros.email}</span>
                  )}
                </div>

                {/* Senha */}
                <div style={s.field}>
                  <label htmlFor="senha" style={s.label}>
                    Senha
                  </label>
                  <div style={s.passwordWrap}>
                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      onBlur={() => marcarTocado('senha')}
                      required
                      autoComplete="new-password"
                      aria-invalid={!!mostrarErro('senha')}
                      style={{
                        ...s.input,
                        paddingRight: 44,
                        ...(mostrarErro('senha') ? s.inputError : null),
                      }}
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

                  {senha && (
                    <>
                      <div style={s.strengthWrap}>
                        <div style={s.strengthBar}>
                          <div
                            style={{
                              ...s.strengthFill,
                              width: `${(forca / 4) * 100}%`,
                              background: forcaInfo.cor,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color: forcaInfo.cor,
                            fontWeight: 600,
                            minWidth: 80,
                            textAlign: 'right',
                          }}
                        >
                          {forcaInfo.label}
                        </span>
                      </div>

                      {/* Checklist de requisitos */}
                      <div style={s.requisitos}>
                        <Requisito ok={senha.length >= 6} texto="6+ caracteres" />
                        <Requisito ok={/[A-Z]/.test(senha)} texto="1 maiúscula" />
                        <Requisito ok={/[0-9]/.test(senha)} texto="1 número" />
                        <Requisito
                          ok={/[^A-Za-z0-9]/.test(senha)}
                          texto="1 símbolo"
                        />
                      </div>
                    </>
                  )}

                  {mostrarErro('senha') && (
                    <span style={s.errorMsg}>{erros.senha}</span>
                  )}
                </div>

                {/* Confirmar senha */}
                <div style={s.field}>
                  <label htmlFor="confirmar" style={s.label}>
                    Confirmar senha
                  </label>
                  <input
                    id="confirmar"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    onBlur={() => marcarTocado('confirmar')}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!mostrarErro('confirmar')}
                    style={{
                      ...s.input,
                      ...(mostrarErro('confirmar') ? s.inputError : null),
                    }}
                  />
                  {mostrarErro('confirmar') && (
                    <span style={s.errorMsg}>{erros.confirmar}</span>
                  )}
                  {confirmar && confirmar === senha && senha.length >= 6 && (
                    <span style={{ fontSize: 11, color: '#1f5f2b', fontWeight: 500 }}>
                      ✓ Senhas conferem
                    </span>
                  )}
                </div>

                {/* Termos */}
                <label style={s.termos}>
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(e) => setAceitouTermos(e.target.checked)}
                    style={s.checkbox}
                  />
                  <span style={{ fontSize: 13, color: '#3b5a3b' }}>
                    Concordo com os{' '}
                    <a href="#" style={s.link}>Termos de Uso</a> e a{' '}
                    <a href="#" style={s.link}>Política de Privacidade</a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={carregando || !formValido}
                  style={{
                    ...s.btnPrimary,
                    ...(carregando || !formValido ? s.btnDisabled : null),
                  }}
                >
                  {carregando ? 'Criando conta...' : 'Criar conta grátis'}
                </button>
              </form>

              <p style={s.footerText}>
                Já tem conta?{' '}
                <Link to="/login" style={s.link}>
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Subcomponente: Requisito da senha
// ============================================================
function Requisito({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: ok ? '#1f5f2b' : '#8a9a8a',
        fontWeight: ok ? 600 : 400,
      }}
    >
      <span style={{ fontSize: 10 }}>{ok ? '✓' : '○'}</span>
      {texto}
    </span>
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

  // ---------- Painel esquerdo ----------
  brand: {
    background: 'linear-gradient(135deg, #1f5f2b 0%, #2d7a3a 60%, #4caf50 100%)',
    color: '#fff',
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  brandContent: { position: 'relative', zIndex: 1 },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 56,
    textDecoration: 'none',
    color: '#fff',
  },
  logoText: { fontSize: 22, fontWeight: 700, letterSpacing: 0.5 },
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
    margin: '0 0 40px',
    maxWidth: 420,
  },
  brandList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  brandItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    opacity: 0.95,
  },
  check: {
    display: 'inline-grid',
    placeItems: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  brandFooter: { fontSize: 12, opacity: 0.7, position: 'relative', zIndex: 1 },

  // ---------- Painel direito ----------
  formSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    background: '#f4f6f8',
    overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 420 },
  formHeader: { marginBottom: 24, position: 'relative' },
  backLink: {
    display: 'inline-block',
    fontSize: 13,
    color: '#6b806b',
    textDecoration: 'none',
    marginBottom: 12,
    fontWeight: 500,
  },
  title: {
    fontSize: 26,
    margin: '0 0 6px',
    color: '#1a2b1a',
    fontWeight: 700,
  },
  subtitle: { fontSize: 14, color: '#6b806b', margin: 0 },

  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fdecec',
    color: '#a03030',
    border: '1px solid #f5c6c6',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 18,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 14 },
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
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#d94c4c',
    boxShadow: '0 0 0 3px rgba(217,76,76,0.12)',
  },
  errorMsg: { fontSize: 11, color: '#d94c4c', fontWeight: 500 },

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
    borderRadius: 6,
  },

  strengthWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    background: '#e3ece3',
    borderRadius: 999,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 999,
    transition: 'width 0.25s, background 0.25s',
  },
  requisitos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px 12px',
    marginTop: 2,
  },

  termos: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 3,
    cursor: 'pointer',
    accentColor: '#1f5f2b',
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
    transition: 'background 0.15s, opacity 0.15s',
    fontFamily: 'inherit',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },

  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 13,
    color: '#6b806b',
  },
  link: {
    color: '#1f5f2b',
    fontWeight: 600,
    textDecoration: 'none',
  },

  successBox: {
    textAlign: 'center',
    padding: '40px 28px',
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 14,
    boxShadow: '0 4px 20px rgba(31,95,43,0.06)',
  },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { margin: '0 0 12px', color: '#1f5f2b', fontSize: 22 },
  successText: {
    color: '#6b806b',
    fontSize: 14,
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
};