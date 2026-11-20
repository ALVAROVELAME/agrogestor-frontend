import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisaoGeral } from '../components/dashboard/VisaoGeral';
import { calcularEstatisticas } from '../components/dashboard/metricas';

it('mostra indicadores e estados vazios sem animais', () => {
  render(<VisaoGeral stats={calcularEstatisticas([])} />);
  expect(screen.getByText(/Cadastre animais para ver o ranking/)).toBeInTheDocument();
  expect(screen.getByText('Nenhum animal cadastrado.')).toBeInTheDocument();
});
