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
    if (!el || !podeAnimar()) return;
    let raf = 0;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = clamp(((e.clientX - r.left) / r.width - 0.5) * 2);
        const py = clamp(((e.clientY - r.top) / r.height - 0.5) * 2);
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}

