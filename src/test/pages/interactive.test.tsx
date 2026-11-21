import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useParallax } from '../../hooks/useInteractive';

function Cena() {
  const ref = useParallax<HTMLDivElement>();
  return <div ref={ref} data-testid="cena" />;
}

function ponteiro(alvo: EventTarget, tipo: string, pointerType: string, x: number, y: number) {
  const evento = new MouseEvent(tipo, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperties(evento, { pointerType: { value: pointerType }, pointerId: { value: 1 } });
  alvo.dispatchEvent(evento);
}

function prepararCena() {
  render(<Cena />);
  const cena = screen.getByTestId('cena');
  vi.spyOn(cena, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);
  cena.setPointerCapture = vi.fn();
  return cena;
}

it('acompanha o mouse e volta ao centro ao sair', async () => {
  const cena = prepararCena();
  ponteiro(window, 'pointermove', 'mouse', 200, 0);
  await waitFor(() => expect(cena.style.getPropertyValue('--px')).toBe('1.000'));
  expect(cena.style.getPropertyValue('--py')).toBe('-1.000');
  ponteiro(document.documentElement, 'pointerleave', 'mouse', 0, 0);
  expect(cena.style.getPropertyValue('--px')).toBe('0');
});

it('responde ao toque e retorna ao centro ao soltar', async () => {
  const cena = prepararCena();
  ponteiro(cena, 'pointerdown', 'touch', 200, 100);
  await waitFor(() => expect(cena.style.getPropertyValue('--px')).toBe('1.000'));
  expect(cena.setPointerCapture).toHaveBeenCalledWith(1);
  ponteiro(cena, 'pointerup', 'touch', 200, 100);
  expect(cena.style.getPropertyValue('--px')).toBe('0');
  expect(cena.style.getPropertyValue('--py')).toBe('0');
});

it('respeita a preferência por movimento reduzido', async () => {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
  const cena = prepararCena();
  ponteiro(window, 'pointermove', 'mouse', 200, 100);
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(cena.style.getPropertyValue('--px')).toBe('');
});
