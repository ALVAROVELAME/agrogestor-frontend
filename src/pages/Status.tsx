import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export interface StatusOpcoes {
  tipo: 'carregando' | 'sucesso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  ctaTexto?: string;
  ctaLink?: string;
  autoRedirect?: number; // segundos
  detalhes?: string;
  onRetry?: () => void;
  retryTexto?: string;
}

/* ============================================================
   CSS
   ============================================================ */

/* ============================================================
   Componente principal (named export)
   — Reutilizável por qualquer página
   ============================================================ */
export function StatusView({
  tipo,
  titulo,
  mensagem,
  ctaTexto,
  ctaLink,
  autoRedirect,
  detalhes,
  onRetry,
  retryTexto = 'Tentar novamente',
}: StatusOpcoes) {
  const navigate = useNavigate();
  const [segundos, setSegundos] = useState(autoRedirect ?? 0);

  useEffect(() => {
    if (!autoRedirect || !ctaLink) return;
    const id = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(id);
          navigate(ctaLink, { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [autoRedirect, ctaLink, navigate]);

  const icone =
    tipo === 'sucesso' ? '✓' :
    tipo === 'erro' ? '✕' :
    tipo === 'info' ? 'i' :
    null;

  const liveProps =
    tipo === 'erro'
      ? { role: 'alert' as const, 'aria-live': 'assertive' as const }
      : { role: 'status' as const, 'aria-live': 'polite' as const };

  return (
    <>
      <div className="st">
        <a href="#st-main" className="st-skip">Ir para o conteúdo</a>

        <div className="st-page">
          <Link to="/" className="st-brand" aria-label="AgroGestor — início">
            <img className="st-brand-mark" src="/logo.svg" alt="" />
            <span>AgroGestor</span>
          </Link>

          <main className="st-card" id="st-main" {...liveProps}>
            <div className={`st-icon st-icon--${tipo}`} aria-hidden="true">
              {tipo === 'carregando' ? <span className="st-spinner" /> : icone}
            </div>

            <h1 className="st-title">{titulo}</h1>
            <p className="st-msg">{mensagem}</p>

            {detalhes && <p className="st-detalhes">{detalhes}</p>}

            {tipo !== 'carregando' && (ctaTexto || onRetry) && (
              <div className="mt-8 flex flex-col items-center gap-3">
                {ctaTexto && ctaLink && (
                  <Link to={ctaLink} className="st-btn-primary">
                    {ctaTexto}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}

                {onRetry && (
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={onRetry}
                  >
                    <span aria-hidden="true">↻</span> {retryTexto}
                  </button>
                )}
              </div>
            )}

            {autoRedirect && ctaLink && segundos > 0 && (
              <>
                <p className="st-countdown">
                  Redirecionando em <b>{segundos}</b>s…
                </p>
                <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
                  <div
                    className="st-countdown-fill"
                    style={{ width: `${(segundos / autoRedirect) * 100}%` }}
                  />
                </div>
              </>
            )}

            <p className="st-footer">
              <span>© {new Date().getFullYear()} AgroGestor</span>
              <span className="st-footer-dot" aria-hidden="true" />
              <span>Feito no Brasil 🇧🇷</span>
            </p>
          </main>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Página padrão (default export)
   — Usada pela rota /status no App.tsx
   ============================================================ */
export default function StatusPage() {
  return (
    <StatusView
      tipo="info"
      titulo="Central de status"
      mensagem="Esta é a página genérica de status do AgroGestor. Se você chegou aqui por engano, volte para o início."
      ctaTexto="Voltar ao início"
      ctaLink="/"
    />
  );
}
