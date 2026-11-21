import type { Animal } from '../../../types';

export const CATEGORIAS: Animal['categoria'][] = ['Bezerra', 'Novilha', 'Vaca em Lactação', 'Vaca Seca'];

/** Dados atuais do cadastro, não um histórico de ordenhas. */
export function calcularEstatisticas(animais: Animal[]) {
  const lactantes = animais.filter(a => a.categoria === 'Vaca em Lactação');
  const producaoTotal = lactantes.reduce((soma, a) => soma + a.producaoDiaria, 0);
  const comProducao = lactantes.filter(a => a.producaoDiaria > 0);
  const ordenados = [...comProducao].sort((a, b) => b.producaoDiaria - a.producaoDiaria);
  const porCategoria = Object.fromEntries(CATEGORIAS.map(categoria => [categoria, animais.filter(a => a.categoria === categoria).length]));
  return {
    total: animais.length,
    lactantes: lactantes.length,
    producaoTotal,
    media: lactantes.length ? producaoTotal / lactantes.length : null,
    maior: ordenados[0] ?? null,
    menor: ordenados.at(-1) ?? null,
    porCategoria,
    top5: ordenados.slice(0, 5),
    maxProd: ordenados[0]?.producaoDiaria ?? 0,
    zeros: lactantes.filter(a => a.producaoDiaria === 0).length,
    foraDeLactacaoComProducao: animais.filter(a => a.categoria !== 'Vaca em Lactação' && a.producaoDiaria > 0).length,
  };
}

export type Estatisticas = ReturnType<typeof calcularEstatisticas>;
export const formatarLitros = (valor: number) => `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`;
