import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuAberto(false);
  };

  return (
    <div style={s.page}>
      {/* ===================== NAVBAR ===================== */}
      <header
        style={{
          ...s.navbar,
          ...(scrolled ? s.navbarScrolled : null),
        }}
      >
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 26 }}>🐄</span>
            <span style={s.logoText}>AgroGestor</span>
          </Link>

          <nav style={s.navLinks}>
            <button onClick={() => scrollPara('features')} style={s.navLink}>Recursos</button>
            <button onClick={() => scrollPara('como-funciona')} style={s.navLink}>Como funciona</button>
            <button onClick={() => scrollPara('precos')} style={s.navLink}>Preços</button>
            <button onClick={() => scrollPara('faq')} style={s.navLink}>FAQ</button>
          </nav>

          <div style={s.navActions}>
            <Link to="/login" style={s.btnNavGhost}>Entrar</Link>
            <Link to="/signup" style={s.btnNavPrimary}>Criar conta</Link>
          </div>

          {/* Hambúrguer mobile */}
          <button
            onClick={() => setMenuAberto((v) => !v)}
            style={s.hamburger}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {/* Menu mobile */}
        {menuAberto && (
          <div style={s.mobileMenu}>
            <button onClick={() => scrollPara('features')} style={s.mobileLink}>Recursos</button>
            <button onClick={() => scrollPara('como-funciona')} style={s.mobileLink}>Como funciona</button>
            <button onClick={() => scrollPara('precos')} style={s.mobileLink}>Preços</button>
            <button onClick={() => scrollPara('faq')} style={s.mobileLink}>FAQ</button>
            <div style={{ display: 'flex', gap: 8, padding: '12px 24px' }}>
              <Link to="/login" style={{ ...s.btnNavGhost, flex: 1, textAlign: 'center' }}>Entrar</Link>
              <Link to="/signup" style={{ ...s.btnNavPrimary, flex: 1, textAlign: 'center' }}>Criar conta</Link>
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO ===================== */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroText}>
            <span style={s.badge}>🌱 Novo — versão 2.0 disponível</span>
            <h1 style={s.heroTitle}>
              Gestão do seu rebanho,<br />
              <span style={s.heroHighlight}>simples como deve ser.</span>
            </h1>
            <p style={s.heroSubtitle}>
              Controle produção, categorias e relatórios do seu rebanho em uma
              plataforma moderna. Sem planilhas, sem complicação — feito para o
              produtor rural.
            </p>

            <div style={s.heroActions}>
              <Link to="/signup" style={s.btnPrimaryLg}>
                Começar grátis →
              </Link>
              <button
                onClick={() => scrollPara('como-funciona')}
                style={s.btnGhostLg}
              >
                ▶ Ver como funciona
              </button>
            </div>

            <div style={s.heroTrust}>
              <span style={s.trustItem}>✓ Sem cartão de crédito</span>
              <span style={s.trustItem}>✓ Configuração em 1 minuto</span>
              <span style={s.trustItem}>✓ Dados salvos na nuvem</span>
            </div>
          </div>

          {/* Mockup visual */}
          <div style={s.heroVisual}>
            <div style={s.mockupCard}>
              <div style={s.mockupHeader}>
                <div style={{ ...s.dot, background: '#ff5f56' }} />
                <div style={{ ...s.dot, background: '#ffbd2e' }} />
                <div style={{ ...s.dot, background: '#27c93f' }} />
                <span style={s.mockupTitle}>agrogestor.app/dashboard</span>
              </div>

              <div style={s.mockupBody}>
                <div style={s.mockupStats}>
                  <MiniStat icon="🐮" label="Animais" value="128" />
                  <MiniStat icon="🥛" label="Produção" value="2.4k L" />
                  <MiniStat icon="📊" label="Média" value="18.7 L" />
                </div>

                {[
                  { nome: 'Mimosa', valor: 24, pct: 100 },
                  { nome: 'Estrela', valor: 20, pct: 83 },
                  { nome: 'Lua', valor: 16, pct: 66 },
                  { nome: 'Princesa', valor: 12, pct: 50 },
                ].map((a) => (
                  <div key={a.nome} style={s.mockupRow}>
                    <span style={s.mockupRowLabel}>{a.nome}</span>
                    <div style={s.mockupBar}>
                      <div style={{ ...s.mockupBarFill, width: `${a.pct}%` }} />
                    </div>
                    <span style={s.mockupRowValue}>{a.valor} L</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Elementos decorativos */}
            <div style={{ ...s.blob, top: -40, right: -40, background: '#4caf50' }} />
            <div style={{ ...s.blob, bottom: -30, left: -30, background: '#1f5f2b' }} />
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section style={s.stats}>
        <div style={s.statsInner}>
          <StatItem numero="12k+" label="Animais gerenciados" />
          <StatItem numero="850+" label="Produtores ativos" />
          <StatItem numero="3.2M" label="Litros registrados" />
          <StatItem numero="99.9%" label="Uptime garantido" />
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" style={s.section}>
        <header style={s.sectionHeader}>
          <span style={s.eyebrow}>RECURSOS</span>
          <h2 style={s.sectionTitle}>Tudo que você precisa, em um só lugar</h2>
          <p style={s.sectionSubtitle}>
            Ferramentas pensadas para simplificar a rotina do produtor e
            aumentar a produtividade do rebanho.
          </p>
        </header>

        <div style={s.featuresGrid}>
          {[
            { icon: '🐄', titulo: 'Cadastro inteligente', desc: 'Registre animais com brinco, nome, categoria e produção em segundos.' },
            { icon: '📊', titulo: 'Dashboards em tempo real', desc: 'Visualize KPIs, médias e rankings de produção instantaneamente.' },
            { icon: '🔍', titulo: 'Busca avançada', desc: 'Encontre qualquer animal por nome, brinco ou categoria com um clique.' },
            { icon: '📈', titulo: 'Relatórios completos', desc: 'Gere relatórios detalhados e exporte em JSON para backup.' },
            { icon: '🌙', titulo: 'Tema claro e escuro', desc: 'Trabalhe confortavelmente de dia ou de madrugada, você escolhe.' },
            { icon: '⚡', titulo: 'Atalhos de teclado', desc: 'Command palette (Ctrl+K) para navegar e executar ações em milissegundos.' },
          ].map((f) => (
            <div key={f.titulo} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitle}>{f.titulo}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section id="como-funciona" style={{ ...s.section, background: '#f9fbf9' }}>
        <header style={s.sectionHeader}>
          <span style={s.eyebrow}>COMO FUNCIONA</span>
          <h2 style={s.sectionTitle}>Comece em 3 passos simples</h2>
          <p style={s.sectionSubtitle}>
            Do cadastro ao primeiro relatório em menos de 5 minutos.
          </p>
        </header>

        <div style={s.stepsGrid}>
          {[
            { num: '01', icon: '📝', titulo: 'Crie sua conta', desc: 'Cadastro gratuito, sem cartão de crédito. Confirme o e-mail e pronto.' },
            { num: '02', icon: '🐮', titulo: 'Cadastre seus animais', desc: 'Adicione brinco, nome, categoria e produção diária de cada animal.' },
            { num: '03', icon: '📈', titulo: 'Acompanhe os resultados', desc: 'Veja dashboards, gráficos e relatórios atualizados em tempo real.' },
          ].map((p, i) => (
            <div key={p.num} style={s.stepCard}>
              <div style={s.stepNum}>{p.num}</div>
              <div style={s.stepIcon}>{p.icon}</div>
              <h3 style={s.stepTitle}>{p.titulo}</h3>
              <p style={s.stepDesc}>{p.desc}</p>
              {i < 2 && <div style={s.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ===================== DEPOIMENTOS ===================== */}
      <section style={s.section}>
        <header style={s.sectionHeader}>
          <span style={s.eyebrow}>DEPOIMENTOS</span>
          <h2 style={s.sectionTitle}>Quem usa, recomenda</h2>
          <p style={s.sectionSubtitle}>
            Produtores de todo o Brasil já transformaram sua gestão com o AgroGestor.
          </p>
        </header>

        <div style={s.testimonialsGrid}>
          {[
            { nome: 'João Pereira', cargo: 'Fazenda Santa Rita · MG', texto: 'Reduzi o tempo gasto com anotações em 80%. Agora tudo está no celular.', iniciais: 'JP' },
            { nome: 'Maria Oliveira', cargo: 'Sítio Boa Vista · PR', texto: 'A busca é fantástica. Acho qualquer vaca pelo brinco em segundos.', iniciais: 'MO' },
            { nome: 'Carlos Souza', cargo: 'Fazenda Lagoa Azul · GO', texto: 'Os relatórios me ajudaram a aumentar a produção em 15% em 6 meses.', iniciais: 'CS' },
          ].map((t) => (
            <div key={t.nome} style={s.testimonialCard}>
              <div style={s.stars}>★★★★★</div>
              <p style={s.testimonialText}>"{t.texto}"</p>
              <div style={s.testimonialAuthor}>
                <div style={s.avatar}>{t.iniciais}</div>
                <div>
                  <div style={s.authorName}>{t.nome}</div>
                  <div style={s.authorRole}>{t.cargo}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== PREÇOS ===================== */}
      <section id="precos" style={{ ...s.section, background: '#f9fbf9' }}>
        <header style={s.sectionHeader}>
          <span style={s.eyebrow}>PREÇOS</span>
          <h2 style={s.sectionTitle}>Planos para todos os tamanhos</h2>
          <p style={s.sectionSubtitle}>
            Comece grátis e evolua conforme seu rebanho cresce. Sem surpresas.
          </p>
        </header>

        <div style={s.pricingGrid}>
          {[
            {
              nome: 'Grátis',
              preco: 'R$ 0',
              periodo: '/ sempre',
              desc: 'Ideal para pequenos produtores',
              features: ['Até 30 animais', 'Dashboard básico', 'Relatórios essenciais', 'Suporte por e-mail'],
              cta: 'Começar grátis',
              destaque: false,
            },
            {
              nome: 'Pro',
              preco: 'R$ 29',
              periodo: '/ mês',
              desc: 'Para quem quer produtividade máxima',
              features: ['Animais ilimitados', 'Gráficos avançados', 'Backup automático', 'Tema escuro', 'Suporte prioritário'],
              cta: 'Assinar Pro',
              destaque: true,
            },
            {
              nome: 'Empresa',
              preco: 'R$ 99',
              periodo: '/ mês',
              desc: 'Multi-fazendas e equipes',
              features: ['Tudo do Pro', 'Multi-usuários', 'API de integração', 'Relatórios personalizados', 'Gerente de conta'],
              cta: 'Falar com vendas',
              destaque: false,
            },
          ].map((p) => (
            <div
              key={p.nome}
              style={{
                ...s.pricingCard,
                ...(p.destaque ? s.pricingCardFeatured : null),
              }}
            >
              {p.destaque && <span style={s.pricingBadge}>MAIS POPULAR</span>}
              <h3 style={s.pricingName}>{p.nome}</h3>
              <div style={s.pricingPrice}>
                <span style={s.pricingValue}>{p.preco}</span>
                <span style={s.pricingPeriod}>{p.periodo}</span>
              </div>
              <p style={s.pricingDesc}>{p.desc}</p>
              <ul style={s.pricingFeatures}>
                {p.features.map((f) => (
                  <li key={f} style={s.pricingFeature}>
                    <span style={s.checkSmall}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                style={{
                  ...s.pricingCta,
                  ...(p.destaque ? s.pricingCtaFeatured : null),
                }}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" style={s.section}>
        <header style={s.sectionHeader}>
          <span style={s.eyebrow}>PERGUNTAS FREQUENTES</span>
          <h2 style={s.sectionTitle}>Dúvidas? A gente responde</h2>
        </header>

        <div style={s.faqWrap}>
          {[
            { q: 'Preciso instalar algo?', a: 'Não! O AgroGestor é 100% web. Basta acessar pelo navegador do computador, tablet ou celular.' },
            { q: 'Meus dados ficam seguros?', a: 'Sim. Todos os dados são salvos automaticamente e você pode exportar um backup em JSON quando quiser.' },
            { q: 'Posso usar de graça para sempre?', a: 'Sim! O plano Grátis permite até 30 animais sem custo e sem prazo de expiração.' },
            { q: 'Funciona offline?', a: 'A plataforma precisa de internet para sincronizar. Mas os dados ficam em cache local para consulta rápida.' },
            { q: 'Como cancelo minha assinatura?', a: 'A qualquer momento, direto no painel, sem burocracia e sem multa. Você continua com o plano Grátis.' },
          ].map((item, i) => (
            <FaqItem key={i} pergunta={item.q} resposta={item.a} />
          ))}
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section style={s.ctaFinal}>
        <div style={s.ctaFinalInner}>
          <h2 style={s.ctaFinalTitle}>Pronto para transformar sua gestão?</h2>
          <p style={s.ctaFinalSubtitle}>
            Junte-se a centenas de produtores que já modernizaram sua fazenda.
            Comece grátis hoje.
          </p>
          <Link to="/signup" style={s.ctaFinalBtn}>
            Criar conta gratuita →
          </Link>
          <p style={s.ctaFinalNote}>Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerCol}>
            <div style={s.logo}>
              <span style={{ fontSize: 24 }}>🐄</span>
              <span style={s.logoText}>AgroGestor</span>
            </div>
            <p style={s.footerDesc}>
              Gestão inteligente do rebanho para o produtor rural moderno.
            </p>
          </div>

          <div style={s.footerCol}>
            <h4 style={s.footerTitle}>Produto</h4>
            <button onClick={() => scrollPara('features')} style={s.footerLink}>Recursos</button>
            <button onClick={() => scrollPara('precos')} style={s.footerLink}>Preços</button>
            <button onClick={() => scrollPara('faq')} style={s.footerLink}>FAQ</button>
          </div>

          <div style={s.footerCol}>
            <h4 style={s.footerTitle}>Conta</h4>
            <Link to="/login" style={s.footerLink}>Entrar</Link>
            <Link to="/signup" style={s.footerLink}>Criar conta</Link>
          </div>

          <div style={s.footerCol}>
            <h4 style={s.footerTitle}>Contato</h4>
            <span style={s.footerLink}>contato@agrogestor.app</span>
            <span style={s.footerLink}>+55 (11) 99999-0000</span>
          </div>
        </div>

        <div style={s.footerBottom}>
          <span>© {new Date().getFullYear()} AgroGestor. Todos os direitos reservados.</span>
          <span>Feito com 💚 no Brasil</span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={s.miniStat}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{ fontSize: 10, color: '#7a8a7a', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1f5f2b' }}>{value}</div>
    </div>
  );
}

function StatItem({ numero, label }: { numero: string; label: string }) {
  return (
    <div style={s.statItem}>
      <div style={s.statNumero}>{numero}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={s.faqItem}>
      <button onClick={() => setAberto((v) => !v)} style={s.faqBtn}>
        <span style={s.faqQuestion}>{pergunta}</span>
        <span style={{ ...s.faqIcon, transform: aberto ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {aberto && <p style={s.faqAnswer}>{resposta}</p>}
    </div>
  );
}

// ============================================================
// Estilos
// ============================================================
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#1a2b1a',
    background: '#fff',
    overflowX: 'hidden',
  },

  // NAVBAR
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid transparent',
    transition: 'all 0.25s',
  },
  navbarScrolled: {
    background: 'rgba(255,255,255,0.98)',
    borderBottom: '1px solid #e3ece3',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: '#1f5f2b',
  },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3 },
  navLinks: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: {
    background: 'transparent',
    border: 'none',
    fontSize: 14,
    color: '#3b5a3b',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    fontWeight: 500,
  },
  navActions: { display: 'flex', gap: 10, alignItems: 'center' },
  btnNavGhost: {
    padding: '8px 16px',
    fontSize: 13,
    color: '#1f5f2b',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: 8,
  },
  btnNavPrimary: {
    padding: '8px 18px',
    fontSize: 13,
    background: '#1f5f2b',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: 8,
  },
  hamburger: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    color: '#1f5f2b',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    borderTop: '1px solid #e3ece3',
    padding: '8px 0 16px',
  },
  mobileLink: {
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    padding: '12px 24px',
    fontSize: 15,
    color: '#3b5a3b',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // HERO
  hero: {
    paddingTop: 120,
    paddingBottom: 80,
    background: 'linear-gradient(180deg, #f9fbf9 0%, #ffffff 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 60,
    alignItems: 'center',
  },
  heroText: { maxWidth: 560 },
  badge: {
    display: 'inline-block',
    background: '#e6f4e6',
    color: '#1f5f2b',
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 52,
    lineHeight: 1.1,
    margin: '0 0 20px',
    fontWeight: 800,
    letterSpacing: -1.5,
    color: '#0f1f10',
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #1f5f2b, #4caf50)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 1.6,
    color: '#4a5a4a',
    margin: '0 0 32px',
  },
  heroActions: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 },
  btnPrimaryLg: {
    padding: '14px 28px',
    background: '#1f5f2b',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(31,95,43,0.25)',
    transition: 'transform 0.15s',
    display: 'inline-block',
  },
  btnGhostLg: {
    padding: '14px 24px',
    background: '#fff',
    color: '#1f5f2b',
    border: '1.5px solid #cddccd',
    fontWeight: 600,
    fontSize: 15,
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  heroTrust: { display: 'flex', flexWrap: 'wrap', gap: 18 },
  trustItem: { fontSize: 13, color: '#6b806b', fontWeight: 500 },

  heroVisual: { position: 'relative', minHeight: 420 },
  mockupCard: {
    position: 'relative',
    zIndex: 2,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 24px 60px rgba(31,95,43,0.15)',
    overflow: 'hidden',
    border: '1px solid #e3ece3',
  },
  mockupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    background: '#f4f6f8',
    borderBottom: '1px solid #e3ece3',
  },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  mockupTitle: { marginLeft: 10, fontSize: 11, color: '#8a9a8a' },
  mockupBody: { padding: 18 },
  mockupStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16,
  },
  miniStat: {
    background: '#f4f8f4',
    padding: '10px 12px',
    borderRadius: 8,
    textAlign: 'center',
  },
  mockupRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 50px',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  mockupRowLabel: { fontSize: 12, fontWeight: 500, color: '#3b5a3b' },
  mockupBar: {
    height: 8,
    background: '#eef4ee',
    borderRadius: 999,
    overflow: 'hidden',
  },
  mockupBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1f5f2b, #4caf50)',
    borderRadius: 999,
  },
  mockupRowValue: { fontSize: 12, color: '#6b806b', textAlign: 'right' },
  blob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: '50%',
    opacity: 0.08,
    filter: 'blur(20px)',
  },

  // STATS
  stats: { background: '#1f5f2b', padding: '48px 24px' },
  statsInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 24,
    textAlign: 'center',
  },
  statItem: {},
  statNumero: {
    fontSize: 36,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 1,
  },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8 },

  // SECTIONS
  section: { padding: '96px 24px' },
  sectionHeader: { textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1f5f2b',
    letterSpacing: 1.5,
    display: 'block',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 38,
    lineHeight: 1.15,
    margin: '0 0 16px',
    fontWeight: 800,
    letterSpacing: -1,
    color: '#0f1f10',
  },
  sectionSubtitle: { fontSize: 16, color: '#6b806b', margin: 0, lineHeight: 1.6 },

  // FEATURES
  featuresGrid: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: '28px 24px',
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 14,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  featureIcon: {
    width: 52,
    height: 52,
    display: 'grid',
    placeItems: 'center',
    background: '#e6f4e6',
    borderRadius: 12,
    fontSize: 24,
    marginBottom: 16,
  },
  featureTitle: { fontSize: 17, margin: '0 0 8px', fontWeight: 700, color: '#0f1f10' },
  featureDesc: { fontSize: 14, lineHeight: 1.6, color: '#6b806b', margin: 0 },

  // STEPS
  stepsGrid: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 32,
    position: 'relative',
  },
  stepCard: { textAlign: 'center', position: 'relative' },
  stepNum: {
    fontSize: 12,
    fontWeight: 800,
    color: '#1f5f2b',
    letterSpacing: 2,
    marginBottom: 16,
  },
  stepIcon: {
    width: 72,
    height: 72,
    display: 'grid',
    placeItems: 'center',
    background: '#fff',
    border: '2px solid #e6f4e6',
    borderRadius: '50%',
    fontSize: 32,
    margin: '0 auto 20px',
    boxShadow: '0 6px 20px rgba(31,95,43,0.08)',
  },
  stepTitle: { fontSize: 18, margin: '0 0 10px', fontWeight: 700, color: '#0f1f10' },
  stepDesc: { fontSize: 14, lineHeight: 1.6, color: '#6b806b', margin: 0, maxWidth: 280, marginInline: 'auto' },
  stepArrow: {
    position: 'absolute',
    right: -16,
    top: 90,
    fontSize: 24,
    color: '#cddccd',
  },

  // TESTIMONIALS
  testimonialsGrid: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  testimonialCard: {
    padding: '28px 24px',
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 14,
  },
  stars: { fontSize: 16, color: '#f5b642', marginBottom: 12, letterSpacing: 2 },
  testimonialText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#3b5a3b',
    fontStyle: 'italic',
    margin: '0 0 20px',
  },
  testimonialAuthor: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1f5f2b, #4caf50)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 14,
  },
  authorName: { fontSize: 14, fontWeight: 700, color: '#0f1f10' },
  authorRole: { fontSize: 12, color: '#8a9a8a' },

  // PRICING
  pricingGrid: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
    alignItems: 'stretch',
  },
  pricingCard: {
    padding: '32px 28px',
    background: '#fff',
    border: '1px solid #e3ece3',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  pricingCardFeatured: {
    border: '2px solid #1f5f2b',
    boxShadow: '0 20px 50px rgba(31,95,43,0.15)',
    transform: 'scale(1.03)',
  },
  pricingBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1f5f2b',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 999,
    letterSpacing: 1,
  },
  pricingName: { fontSize: 18, margin: '0 0 12px', fontWeight: 700, color: '#0f1f10' },
  pricingPrice: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  pricingValue: { fontSize: 36, fontWeight: 800, color: '#0f1f10', letterSpacing: -1 },
  pricingPeriod: { fontSize: 14, color: '#8a9a8a' },
  pricingDesc: { fontSize: 13, color: '#6b806b', margin: '0 0 24px' },
  pricingFeatures: { listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 },
  pricingFeature: {
    fontSize: 14,
    color: '#3b5a3b',
    padding: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  checkSmall: {
    color: '#1f5f2b',
    fontWeight: 700,
    fontSize: 14,
  },
  pricingCta: {
    display: 'block',
    textAlign: 'center',
    padding: '12px 20px',
    border: '1.5px solid #1f5f2b',
    color: '#1f5f2b',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 10,
  },
  pricingCtaFeatured: {
    background: '#1f5f2b',
    color: '#fff',
    border: '1.5px solid #1f5f2b',
  },

  // FAQ
  faqWrap: { maxWidth: 760, margin: '0 auto' },
  faqItem: {
    borderBottom: '1px solid #e3ece3',
    padding: '8px 0',
  },
  faqBtn: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    padding: '16px 0',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    gap: 16,
  },
  faqQuestion: { fontSize: 16, fontWeight: 600, color: '#0f1f10' },
  faqIcon: {
    fontSize: 22,
    color: '#1f5f2b',
    transition: 'transform 0.2s',
    flexShrink: 0,
    lineHeight: 1,
  },
  faqAnswer: {
    margin: '0 0 16px',
    fontSize: 14,
    lineHeight: 1.7,
    color: '#6b806b',
  },

  // CTA FINAL
  ctaFinal: {
    background: 'linear-gradient(135deg, #1f5f2b 0%, #2d7a3a 60%, #4caf50 100%)',
    padding: '80px 24px',
    color: '#fff',
  },
  ctaFinalInner: { maxWidth: 720, margin: '0 auto', textAlign: 'center' },
  ctaFinalTitle: {
    fontSize: 40,
    lineHeight: 1.15,
    margin: '0 0 16px',
    fontWeight: 800,
    letterSpacing: -1,
  },
  ctaFinalSubtitle: {
    fontSize: 17,
    lineHeight: 1.6,
    opacity: 0.92,
    margin: '0 0 32px',
  },
  ctaFinalBtn: {
    display: 'inline-block',
    padding: '16px 32px',
    background: '#fff',
    color: '#1f5f2b',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 16,
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  ctaFinalNote: { fontSize: 13, opacity: 0.8, marginTop: 16 },

  // FOOTER
  footer: { background: '#0f1f10', color: '#cddccd', padding: '56px 24px 24px' },
  footerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: 40,
    paddingBottom: 40,
  },
  footerCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  footerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 8px',
  },
  footerDesc: { fontSize: 13, lineHeight: 1.6, opacity: 0.7, margin: '8px 0 0', maxWidth: 300 },
  footerLink: {
    fontSize: 13,
    color: '#cddccd',
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    opacity: 0.85,
  },
  footerBottom: {
    maxWidth: 1200,
    margin: '0 auto',
    paddingTop: 24,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 12,
    opacity: 0.7,
  },
};