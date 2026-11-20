import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisaoGeral } from '../components/dashboard/VisaoGeral';

it('mostra indicadores e estados vazios sem animais', () => {
  render(<VisaoGeral stats={{ total: 0, producaoTotal: 0, media: 0, maior: null, porCategoria: {}, top5: [], maxProd: 1 }} />);
  expect(screen.getByText('Cadastre animais para ver o ranking.')).toBeInTheDocument();
  expect(screen.getByText('Nenhum animal cadastrado.')).toBeInTheDocument();
});
