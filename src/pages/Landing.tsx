import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LINKS, DIAS, DIAS_LONGOS, REBANHO, MAX_LITROS, MEDIA_REBANHO_DIA, HERO_LINHAS, fmt } from '../data/landing';
import { useTilt, useMagnet, useParallax } from '../hooks/useInteractive';

/* ============================================================
   Subcomponentes
   ============================================================ */
function ExtLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

function Tilt({
  className = '',
  wrapClass = '',
  max = 8,
  children,
}: {
  className?: string;
  wrapClass?: string;
  max?: number;
  children: ReactNode;
}) {
  const t = useTilt<HTMLDivElement>(max);
  return (
    <div
      className={`ag-tilt ${wrapClass} ${className}`}
      onPointerMove={t.onPointerMove}
      onPointerLeave={t.onPointerLeave}
      onPointerCancel={t.onPointerCancel}
    >
      {children}
    </div>
  );
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="ag-logo" onClick={onClick} aria-label="AgroGestor, página inicial">
      <img src="/logo.svg" alt="" width={36} height={36} />
      <span>AgroGestor</span>
    </Link>
  );
}

function FaqItem({ pergunta, children }: { pergunta: string; children: ReactNode }) {
  return (
    <details className="ag-faq-item">
      <summary className="ag-faq-q">
        <span>{pergunta}</span>
        <span className="ag-faq-ic" aria-hidden="true">+</span>
      </summary>
      <div className="ag-faq-a">{children}</div>
    </details>
  );
}

const layer = (z: number, k: number): CSSProperties =>
  ({ '--z': `${z}px`, '--k': k } as CSSProperties);

/* ============================================================
   Página
   ============================================================ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [selecionado, setSelecionado] = useState(0);

  const sceneRef = useParallax<HTMLDivElement>();
  const magHero = useMagnet<HTMLAnchorElement>();
  const magFinal = useMagnet<HTMLAnchorElement>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuAberto]);

  const fechar = () => setMenuAberto(false);

  /* Demo interativa */
  const animal = REBANHO[selecionado];
  const total = animal.litros.reduce((s, v) => s + v, 0);
  const media = total / animal.litros.length;
  const melhor = Math.max(...animal.litros);
  const melhorDia = DIAS_LONGOS[animal.litros.indexOf(melhor)];
  const variacao = ((animal.litros[6] - animal.litros[0]) / animal.litros[0]) * 100;
  const resumoGrafico = animal.litros.map((v, i) => `${DIAS_LONGOS[i]} ${v} litros`).join(', ');

  const PLANOS = [
    {
      nome: 'Grátis', preco: 'R$ 0', periodo: 'para sempre',
      desc: 'Para quem está começando a organizar o rebanho.',
      features: ['Até 30 animais', 'Painel do dia', 'Relatórios essenciais', 'Suporte por e-mail'],
      cta: 'Criar conta grátis', to: '/signup', destaque: false,
    },
    {
      nome: 'Pro', preco: 'R$ 29', periodo: 'por mês',
      desc: 'Para quem quer acompanhar tudo sem limite.',
      features: ['Animais ilimitados', 'Gráficos avançados', 'Backup automático', 'Tema escuro', 'Suporte prioritário'],
      cta: 'Assinar o Pro', to: '/signup', destaque: true,
    },
    {
      nome: 'Empresa', preco: 'R$ 99', periodo: 'por mês',
      desc: 'Para várias fazendas e equipes.',
      features: ['Tudo do Pro', 'Vários usuários', 'API de integração', 'Relatórios personalizados', 'Gerente de conta'],
      cta: 'Falar por e-mail', to: LINKS.emailEnterprise, destaque: false,
    },
  ];

  return (
    <>
      <div className="ag">
        <a href="#ag-main" className="ag-skip">Ir para o conteúdo principal</a>

        {/* ===================== NAVBAR ===================== */}
        <header className={`ag-nav${scrolled ? ' is-scrolled' : ''}`}>
          <div className="ag-nav-inner">
            <Logo onClick={fechar} />

            <nav className="ag-nav-links" aria-label="Principal">
              <a href="#recursos" className="ag-nav-link">Recursos</a>
              <a href="#demonstracao" className="ag-nav-link">Demonstração</a>
              <a href="#como-funciona" className="ag-nav-link">Como funciona</a>
              <a href="#planos" className="ag-nav-link">Planos</a>
              <a href="#faq" className="ag-nav-link">Dúvidas</a>
              <ExtLink href={LINKS.swagger} className="ag-nav-link">API</ExtLink>
            </nav>

            <div className="ag-nav-actions">
              <Link to="/login" className="ag-btn ag-btn-ghost">Entrar</Link>
              <Link to="/signup" className="ag-btn ag-btn-solid">Criar conta</Link>
            </div>

            <button
              type="button"
              className="ag-burger"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              aria-controls="ag-menu-mobile"
            >
              <span aria-hidden="true">{menuAberto ? '✕' : '☰'}</span>
            </button>
          </div>

          {menuAberto && (
            <nav className="ag-drawer" id="ag-menu-mobile" aria-label="Menu mobile">
              <a href="#recursos" className="ag-drawer-link" onClick={fechar}>Recursos</a>
              <a href="#demonstracao" className="ag-drawer-link" onClick={fechar}>Demonstração</a>
              <a href="#como-funciona" className="ag-drawer-link" onClick={fechar}>Como funciona</a>
              <a href="#planos" className="ag-drawer-link" onClick={fechar}>Planos</a>
              <a href="#faq" className="ag-drawer-link" onClick={fechar}>Dúvidas</a>
              <ExtLink href={LINKS.swagger} className="ag-drawer-link">Documentação da API</ExtLink>
              <div className="ag-drawer-actions">
                <Link to="/login" className="ag-btn ag-btn-ghost" onClick={fechar}>Entrar</Link>
                <Link to="/signup" className="ag-btn ag-btn-solid" onClick={fechar}>Criar conta</Link>
              </div>
            </nav>
          )}
        </header>

        <main id="ag-main">
          {/* ===================== HERO ===================== */}
          <section className="ag-hero" aria-labelledby="hero-title">
            <div className="ag-hero-inner relative isolate">
              <div className="ag-hero-text">
                <h1 id="hero-title" className="ag-hero-title">
                  Saiba quanto cada vaca produz, sem caderno nem planilha.
                </h1>
                <p className="ag-hero-sub">
                  O AgroGestor reúne cadastro por brinco, produção de leite e relatórios do
                  rebanho em um painel que abre no celular, no tablet e no computador.
                </p>
                <div className="ag-hero-actions">
                  <Link
                    to="/signup"
                    className="ag-cta ag-cta-primary"
                    onPointerMove={magHero.onPointerMove}
                    onPointerLeave={magHero.onPointerLeave}
                  >
                    Criar conta grátis
                  </Link>
                  <ExtLink href={LINKS.swagger} className="ag-cta ag-cta-ghost">
                    Ver a API no Swagger
                  </ExtLink>
                </div>
                <ul className="ag-facts" aria-label="Vantagens">
                  <li>Sem cartão de crédito</li>
                  <li>Pronto em 1 minuto</li>
                  <li>Dados na nuvem</li>
                </ul>
              </div>

              <div
                className="ag-scene"
                ref={sceneRef}
                role="img"
                aria-label="Ilustração do painel do AgroGestor: produção do dia, ranking das vacas e cartão de brinco flutuando sobre um campo."
              >
                <div className="ag-stage" aria-hidden="true">
                  <div className="ag-floor" />

                  <div className="ag-panel">
                    <div className="ag-panel-top">
                      <span className="ag-panel-title">Produção de hoje</span>
                      <span className="ag-panel-when">Ordenha da manhã</span>
                    </div>
                    <div className="ag-panel-total">
                      <strong>2.394</strong>
                      <span>litros</span>
                    </div>
                    <p className="ag-panel-meta">128 animais, média de 18,7 L por vaca</p>
                    {HERO_LINHAS.map((a, i) => (
                      <div key={a.nome} className="ag-prow">
                        <span className="ag-prow-name">{a.nome}</span>
                        <div className="ag-prow-track">
                          <div
                            className="ag-prow-fill"
                            style={{ width: `${(a.v / 24) * 100}%`, animationDelay: `${0.4 + i * 0.12}s` }}
                          />
                        </div>
                        <span className="ag-prow-val">{a.v} L</span>
                      </div>
                    ))}
                  </div>

                  <div className="ag-layer" style={{ ...layer(90, 16), top: -34, right: -22 }}>
                    <div className="ag-float">
                      <span className="ag-tagcard">
                        <small>Brinco 0412</small>
                        <strong>Mimosa</strong>
                        <span>24 L hoje</span>
                      </span>
                    </div>
                  </div>

                  <div className="ag-layer" style={{ ...layer(130, 26), bottom: 24, left: -26 }}>
                    <div className="ag-float slow">
                      <span className="ag-chip">Média: 18,7 L por vaca</span>
                    </div>
                  </div>

                  <div className="ag-layer" style={{ ...layer(170, 38), top: 74, left: -18 }}>
                    <div className="ag-float">
                      <span className="ag-disc" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================== RECURSOS ===================== */}
          <section id="recursos" className="ag-section" aria-labelledby="recursos-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head">
                <h2 id="recursos-title" className="ag-title">O que você faz no AgroGestor</h2>
                <p className="ag-subtitle">
                  Cada recurso resolve uma tarefa do dia a dia no curral e no escritório da fazenda.
                </p>
              </header>

              <div className="grid grid-cols-6 gap-[18px]">
                <div className="ag-feat wide col-span-4 max-[960px]:col-span-6">
                  <div className="ag-card ag-record-card">
                    <div className="ag-record-copy">
                      <h3 className="ag-card-title">Um registro por animal, identificado pelo brinco</h3>
                      <p className="ag-card-desc">
                        Nome, brinco, categoria e produção ficam no mesmo cadastro. Achou a vaca,
                        achou o histórico dela.
                      </p>
                    </div>
                    <dl className="ag-record">
                      <div><dt>Nome</dt><dd>Mimosa</dd></div>
                      <div><dt>Brinco</dt><dd>0412</dd></div>
                      <div><dt>Categoria</dt><dd>Holandesa</dd></div>
                      <div><dt>Produção hoje</dt><dd>24 L</dd></div>
                    </dl>
                  </div>
                </div>

                <div className="ag-feat col-span-2 max-[960px]:col-span-3 max-[680px]:col-span-6">
                  <Tilt className="ag-card">
                    <h3 className="ag-card-title ag-pop">Painel do dia</h3>
                    <p className="ag-card-desc ag-pop">
                      Total de litros, média por vaca e ranking de produção, sem montar fórmula.
                    </p>
                  </Tilt>
                </div>

                <div className="ag-feat col-span-2 max-[960px]:col-span-3 max-[680px]:col-span-6">
                  <Tilt className="ag-card">
                    <h3 className="ag-card-title ag-pop">Busca que filtra enquanto você digita</h3>
                    <p className="ag-card-desc ag-pop">Procure por nome, brinco ou categoria e a lista responde na hora.</p>
                  </Tilt>
                </div>

                <div className="ag-feat col-span-2 max-[960px]:col-span-3 max-[680px]:col-span-6">
                  <Tilt className="ag-card">
                    <h3 className="ag-card-title ag-pop">Relatórios e backup</h3>
                    <p className="ag-card-desc ag-pop">Exporte os dados do rebanho em JSON sempre que quiser guardar uma cópia.</p>
                  </Tilt>
                </div>

                <div className="ag-feat col-span-2 max-[960px]:col-span-3 max-[680px]:col-span-6">
                  <Tilt className="ag-card">
                    <h3 className="ag-card-title ag-pop">Tema claro e escuro</h3>
                    <p className="ag-card-desc ag-pop">Leitura confortável no sol do curral e também à noite.</p>
                  </Tilt>
                </div>

                <div className="ag-feat col-span-2 max-[960px]:col-span-3 max-[680px]:col-span-6">
                  <Tilt className="ag-card">
                    <h3 className="ag-card-title ag-pop">Atalhos de teclado</h3>
                    <p className="ag-card-desc ag-pop">Abra a paleta de comandos para navegar e agir sem tirar a mão do teclado.</p>
                    <span className="ag-kbd ag-pop" aria-label="Atalho: Control mais K">
                      <kbd>Ctrl</kbd><kbd>K</kbd>
                    </span>
                  </Tilt>
                </div>
              </div>
            </div>
          </section>

          {/* ===================== DEMONSTRAÇÃO ===================== */}
          <section id="demonstracao" className="ag-section soft" aria-labelledby="demo-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head">
                <h2 id="demo-title" className="ag-title">Escolha uma vaca e veja a semana dela</h2>
                <p className="ag-subtitle">
                  Teste o painel aqui mesmo. A barra amarela em cada dia marca a média do rebanho.
                </p>
              </header>

              <div className="ag-demo">
                <div>
                  <ul className="ag-picks" aria-label="Animais de exemplo">
                    {REBANHO.map((a, i) => (
                      <li key={a.brinco}>
                        <button
                          type="button"
                          className="ag-pick"
                          aria-pressed={selecionado === i}
                          onClick={() => setSelecionado(i)}
                        >
                          <span>
                            <b>{a.nome}</b>
                            <small>Brinco {a.brinco}, {a.raca}</small>
                          </span>
                          <span className="ag-pick-avg">
                            {fmt(a.litros.reduce((s, v) => s + v, 0) / 7)} L
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="ag-demo-note">Dados de exemplo. No app, tudo vem do que você cadastrou.</p>
                </div>

                <Tilt className="ag-demo-panel" max={3}>
                  <div className="ag-demo-head">
                    <h3>{animal.nome}, últimos 7 dias</h3>
                    <span className="ag-legend">Média do rebanho</span>
                  </div>

                  <ol className="ag-chart" role="img" aria-label={`Produção diária de ${animal.nome}: ${resumoGrafico}.`}>
                    {animal.litros.map((v, d) => (
                      <li key={DIAS[d]} className="ag-col" aria-hidden="true">
                        <span className="ag-col-val">{v}</span>
                        <div className="ag-col-wrap">
                          <div className="ag-col-bar" style={{ height: `${(v / MAX_LITROS) * 100}%` }} />
                          <div className="ag-col-tick" style={{ bottom: `${(MEDIA_REBANHO_DIA[d] / MAX_LITROS) * 100}%` }} />
                        </div>
                        <span className="ag-col-day">{DIAS[d]}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="ag-kpis" aria-live="polite">
                    <div className="ag-kpi">
                      <span>Média por dia</span>
                      <strong>{fmt(media)} L</strong>
                    </div>
                    <div className="ag-kpi">
                      <span>Melhor dia</span>
                      <strong>{melhorDia}, {melhor} L</strong>
                    </div>
                    <div className="ag-kpi">
                      <span>Total da semana</span>
                      <strong>{total} L</strong>
                    </div>
                  </div>
                  <p className="sr-only">
                    Variação entre segunda e domingo: {variacao >= 0 ? '+' : ''}{fmt(variacao, 0)} por cento.
                  </p>
                </Tilt>
              </div>
            </div>
          </section>

          {/* ===================== COMO FUNCIONA ===================== */}
          <section id="como-funciona" className="ag-section soft" style={{ paddingTop: 0 }} aria-labelledby="como-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head center">
                <h2 id="como-title" className="ag-title">Do cadastro ao primeiro relatório em 3 passos</h2>
                <p className="ag-subtitle">Sem instalar nada. Você só precisa de um navegador.</p>
              </header>

              <ol className="ag-steps">
                <li className="ag-step">
                  <div className="ag-step-n" aria-hidden="true">1</div>
                  <h3>Crie sua conta</h3>
                  <p>Cadastro gratuito e sem cartão. Confirme o e-mail e entre.</p>
                </li>
                <li className="ag-step">
                  <div className="ag-step-n" aria-hidden="true">2</div>
                  <h3>Cadastre seus animais</h3>
                  <p>Informe brinco, nome, categoria e a produção diária de cada um.</p>
                </li>
                <li className="ag-step">
                  <div className="ag-step-n" aria-hidden="true">3</div>
                  <h3>Acompanhe os números</h3>
                  <p>Veja o painel, os gráficos e os relatórios atualizados a cada registro.</p>
                </li>
              </ol>
            </div>
          </section>

          {/* ===================== TRANSPARÊNCIA / DEV ===================== */}
          <section id="desenvolvedor" className="ag-dev ag-dark" aria-labelledby="dev-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head">
                <h2 id="dev-title" className="ag-title" style={{ color: '#fff' }}>
                  Veja por dentro como o AgroGestor foi feito
                </h2>
                <p className="ag-subtitle">
                  O AgroGestor foi criado por Álvaro Velame. A API é documentada e o código está
                  aberto para você conferir.
                </p>
              </header>

              <div className="ag-devgrid">
                <Tilt wrapClass="ag-devcard-wrap">
                  <ExtLink href={LINKS.swagger} className="ag-devcard">
                    <h3>Documentação da API</h3>
                    <p>Todos os endpoints da API REST no Swagger, prontos para testar.</p>
                    <span className="ag-devcard-go" aria-hidden="true">Abrir Swagger</span>
                  </ExtLink>
                </Tilt>
                <Tilt wrapClass="ag-devcard-wrap">
                  <ExtLink href={LINKS.github} className="ag-devcard">
                    <h3>Código no GitHub</h3>
                    <p>Repositórios, commits e a evolução do projeto em um só perfil.</p>
                    <span className="ag-devcard-go" aria-hidden="true">Abrir GitHub</span>
                  </ExtLink>
                </Tilt>
                <Tilt wrapClass="ag-devcard-wrap">
                  <ExtLink href={LINKS.portfolio} className="ag-devcard">
                    <h3>Portfólio do autor</h3>
                    <p>Outros projetos e a história de quem desenvolveu o AgroGestor.</p>
                    <span className="ag-devcard-go" aria-hidden="true">Abrir portfólio</span>
                  </ExtLink>
                </Tilt>
              </div>

              <div className="ag-contact">
                <ExtLink href={LINKS.linkedin} className="ag-pill">LinkedIn</ExtLink>
                <a href={LINKS.email} className="ag-pill">{LINKS.emailText}</a>
              </div>
            </div>
          </section>

          {/* ===================== PLANOS ===================== */}
          <section id="planos" className="ag-section" aria-labelledby="planos-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head center">
                <h2 id="planos-title" className="ag-title">Comece grátis e cresça no seu ritmo</h2>
                <p className="ag-subtitle">
                  Troque de plano quando o rebanho crescer. Cancele quando quiser, direto no painel.
                </p>
              </header>

              <div className="ag-pricing">
                {PLANOS.map((p) => (
                  <Tilt key={p.nome} wrapClass={`ag-plan-wrap${p.destaque ? ' featured' : ''}`} max={6}>
                    {p.destaque && <span className="ag-plan-badge">Mais escolhido</span>}
                    <div className={`ag-plan${p.destaque ? ' featured' : ''}`}>
                      <h3 className="ag-plan-name">{p.nome}</h3>
                      <div className="ag-plan-price">
                        <span className="ag-plan-value">{p.preco}</span>
                        <span className="ag-plan-period">{p.periodo}</span>
                      </div>
                      <p className="ag-plan-desc">{p.desc}</p>
                      <ul className="ag-plan-feats">
                        {p.features.map((f) => (
                          <li key={f} className="ag-plan-feat">
                            <span className="ag-check" aria-hidden="true">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      {p.to.startsWith('mailto:') ? (
                        <a href={p.to} className="ag-plan-cta">{p.cta}</a>
                      ) : (
                        <Link to={p.to} className="ag-plan-cta">{p.cta}</Link>
                      )}
                    </div>
                  </Tilt>
                ))}
              </div>

              <p className="ag-pricing-note">
                O AgroGestor é um projeto de portfólio e os planos são demonstrativos.{' '}
                <ExtLink href={LINKS.portfolio}>Conheça o autor</ExtLink>.
              </p>
            </div>
          </section>

          {/* ===================== FAQ ===================== */}
          <section id="faq" className="ag-section soft" aria-labelledby="faq-title">
            <div className="mx-auto max-w-[1200px] px-6">
              <header className="ag-head center">
                <h2 id="faq-title" className="ag-title">Dúvidas frequentes</h2>
              </header>

              <div className="ag-faq">
                <FaqItem pergunta="Preciso instalar alguma coisa?">
                  Não. O AgroGestor funciona no navegador do computador, do tablet e do celular.
                </FaqItem>
                <FaqItem pergunta="Meus dados ficam seguros?">
                  Os dados são salvos automaticamente e você pode exportar um backup em JSON quando quiser.
                </FaqItem>
                <FaqItem pergunta="Posso usar de graça para sempre?">
                  Pode. O plano Grátis permite até 30 animais, sem custo e sem prazo de validade.
                </FaqItem>
                <FaqItem pergunta="Funciona sem internet?">
                  A sincronização precisa de internet, mas os dados ficam em cache no aparelho para consulta rápida.
                </FaqItem>
                <FaqItem pergunta="Existe uma API para integrar?">
                  Existe. A API REST está documentada no{' '}
                  <ExtLink href={LINKS.swagger}>Swagger</ExtLink>.
                </FaqItem>
                <FaqItem pergunta="Como cancelo minha assinatura?">
                  A qualquer momento, pelo painel, sem multa. Você volta para o plano Grátis.
                </FaqItem>
              </div>
            </div>
          </section>

          {/* ===================== CTA FINAL ===================== */}
          <section className="ag-final ag-dark" aria-labelledby="cta-final-title">
            <div className="ag-final-inner">
              <h2 id="cta-final-title" className="ag-final-title">
                Comece a registrar o seu rebanho hoje
              </h2>
              <p className="ag-final-sub">
                Crie a conta em um minuto e cadastre o primeiro animal ainda hoje.
              </p>
              <Link
                to="/signup"
                className="ag-cta ag-cta-corn"
                onPointerMove={magFinal.onPointerMove}
                onPointerLeave={magFinal.onPointerLeave}
              >
                Criar conta gratuita
              </Link>
              <p className="ag-final-note">
                Sem cartão de crédito. Prefere conversar? Escreva para{' '}
                <a href={LINKS.email}>{LINKS.emailText}</a>.
              </p>
            </div>
          </section>
        </main>

        {/* ===================== FOOTER ===================== */}
        <footer className="ag-footer ag-dark">
          <div className="ag-footer-inner">
            <div className="ag-footer-col">
              <Logo />
              <p className="ag-footer-desc">
                Gestão do rebanho leiteiro para o produtor rural, sem planilhas e sem complicação.
              </p>
            </div>

            <nav className="ag-footer-col" aria-label="Produto">
              <h2 className="ag-footer-title">Produto</h2>
              <a href="#recursos" className="ag-footer-link">Recursos</a>
              <a href="#demonstracao" className="ag-footer-link">Demonstração</a>
              <a href="#planos" className="ag-footer-link">Planos</a>
              <a href="#faq" className="ag-footer-link">Dúvidas</a>
            </nav>

            <nav className="ag-footer-col" aria-label="Conta">
              <h2 className="ag-footer-title">Conta</h2>
              <Link to="/login" className="ag-footer-link">Entrar</Link>
              <Link to="/signup" className="ag-footer-link">Criar conta</Link>
              <ExtLink href={LINKS.swagger} className="ag-footer-link">Documentação da API</ExtLink>
            </nav>

            <nav className="ag-footer-col" aria-label="Contato e links do autor">
              <h2 className="ag-footer-title">Fale com o autor</h2>
              <a href={LINKS.email} className="ag-footer-link">{LINKS.emailText}</a>
              <ExtLink href={LINKS.linkedin} className="ag-footer-link">LinkedIn</ExtLink>
              <ExtLink href={LINKS.github} className="ag-footer-link">GitHub</ExtLink>
              <ExtLink href={LINKS.portfolio} className="ag-footer-link">Portfólio</ExtLink>
            </nav>
          </div>

          <div className="ag-footer-bottom">
            <span>© {new Date().getFullYear()} AgroGestor. Todos os direitos reservados.</span>
            <span>
              Desenvolvido por <ExtLink href={LINKS.portfolio}>Álvaro Velame</ExtLink>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
