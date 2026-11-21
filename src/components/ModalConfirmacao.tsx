import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  titulo: string;
  mensagem: string;
  confirmar: string;
  perigoso?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

export default function ModalConfirmacao({ titulo, mensagem, confirmar, perigoso = false, aoConfirmar, aoCancelar }: Props) {
  const tituloId = useId();
  const mensagemId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelarAtual = useRef(aoCancelar);
  useEffect(() => { cancelarAtual.current = aoCancelar; }, [aoCancelar]);

  useEffect(() => {
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelarRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelarAtual.current();
      } else if (event.key === 'Tab') {
        const botoes = modalRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!botoes?.length) return;
        const primeiro = botoes[0];
        const ultimo = botoes[botoes.length - 1];
        if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo.focus(); }
        else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      if (anterior?.isConnected) anterior.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#060c09]/60 p-5 backdrop-blur-sm" onClick={aoCancelar}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={tituloId} aria-describedby={mensagemId} onClick={e => e.stopPropagation()} className="w-full max-w-[390px] rounded-[18px] border border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] p-6 text-[var(--ink,#0a1810)] shadow-[0_24px_70px_rgba(0,0,0,.25)]">
        <div aria-hidden="true" className={`mb-4 grid h-11 w-11 place-items-center rounded-full text-xl ${perigoso ? 'bg-[var(--danger-soft,#fdecec)] text-[var(--danger,#991b1b)]' : 'bg-[var(--brand-soft,#dcf5e3)] text-[var(--brand,#14532d)]'}`}>{perigoso ? '!' : '↗'}</div>
        <h2 id={tituloId} className="text-lg font-bold tracking-[-.02em]">{titulo}</h2>
        <p id={mensagemId} className="mt-2 text-sm leading-relaxed text-[var(--ink-soft,#2a4033)]">{mensagem}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelarRef} type="button" onClick={aoCancelar} className="min-h-11 rounded-[10px] border border-[var(--border,#d8e2dc)] bg-[var(--surface,#fff)] px-4 text-sm font-semibold text-[var(--ink,#0a1810)] hover:bg-[var(--surface-2,#f2f6f4)]">Cancelar</button>
          <button type="button" onClick={aoConfirmar} className={`min-h-11 rounded-[10px] px-4 text-sm font-semibold ${perigoso ? 'bg-[var(--danger,#991b1b)] text-white [[data-theme=escuro]_&]:text-[#2a1315]' : 'bg-[var(--brand,#14532d)] text-[var(--brand-ink,#fff)]'} hover:brightness-110`}>{confirmar}</button>
        </div>
      </div>
    </div>,
    document.querySelector('.dash') ?? document.body,
  );
}
