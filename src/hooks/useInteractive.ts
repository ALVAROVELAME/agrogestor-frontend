import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const podeAnimar = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTilt<T extends HTMLElement>(max = 8) {
  const frame = useRef(0);

  const onPointerMove = (e: ReactPointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || !podeAnimar()) return;
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-(y - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      el.dataset.tilting = 'true';
    });
  };

  const reset = (e: ReactPointerEvent<T>) => {
    cancelAnimationFrame(frame.current);
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    delete el.dataset.tilting;
  };

  return { onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}

export function useMagnet<T extends HTMLElement>(forca = 0.22) {
  const onPointerMove = (e: ReactPointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || !podeAnimar()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * forca;
    const dy = (e.clientY - (r.top + r.height / 2)) * forca;
    el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
    el.style.setProperty('--my', `${dy.toFixed(1)}px`);
  };

  const onPointerLeave = (e: ReactPointerEvent<T>) => {
    const el = e.currentTarget;
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
  };

  return { onPointerMove, onPointerLeave };
}

export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let activePointer: number | null = null;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));

    const onMove = (e: PointerEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (e.pointerType !== 'mouse' && e.pointerId !== activePointer) return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = clamp(((clientX - r.left) / r.width - 0.5) * 2);
        const py = clamp(((clientY - r.top) / r.height - 0.5) * 2);
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      activePointer = e.pointerId;
      el.setPointerCapture(e.pointerId);
      onMove(e);
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return;
      activePointer = null;
      onLeave();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onEnd);
    el.addEventListener('pointercancel', onEnd);
    el.addEventListener('lostpointercapture', onEnd);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onEnd);
      el.removeEventListener('pointercancel', onEnd);
      el.removeEventListener('lostpointercapture', onEnd);
    };
  }, []);

  return ref;
}

