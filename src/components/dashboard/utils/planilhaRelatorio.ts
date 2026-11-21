import type { Animal } from '../../../types';
import type { FinanceiroResumo, Producao, Registro } from '../../../services/gestao.service';
import type { Worksheet, CellValue } from 'exceljs';
import { calcularEstatisticas, CATEGORIAS } from './metricas';

export interface DadosPlanilha {
  animais: Animal[];
  totalAnimais: number;
  busca: string;
  categoria: string;
  ordem: string;
  financeiro: FinanceiroResumo;
  inicio: string;
  fim: string;
  geradoEm: Date;
  producoes: Producao[];
  tarefas: Registro[];
  eventos: Registro[];
  lancamentos: Registro[];
}

/** Cria uma planilha com os dados exibidos no relatório e sem executar textos como fórmulas. */
export async function criarPlanilhaRelatorio(dados: DadosPlanilha) {
  const ExcelJS = await import('exceljs');
  const arquivo = new ExcelJS.Workbook();
  arquivo.creator = 'AgroGestor';
  arquivo.created = dados.geradoEm;
  const resumo = arquivo.addWorksheet('Resumo');
  const rebanho = arquivo.addWorksheet('Animais filtrados', { views: [{ state: 'frozen', ySplit: 1 }] });
  resumo.columns = [{ width: 38 }, { width: 26 }, { width: 28 }, { width: 24 }];
  rebanho.columns = [{ width: 20 }, { width: 28 }, { width: 25 }, { width: 26 }];
  const stats = calcularEstatisticas(dados.animais);
  const cabecalho = (linha: number, titulo: string) => {
    resumo.mergeCells(linha, 1, linha, 4);
    const celula = resumo.getCell(linha, 1);
    celula.value = titulo;
    celula.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF184D3C' } };
    celula.alignment = { vertical: 'middle' };
    resumo.getRow(linha).height = 24;
  };
  cabecalho(1, 'AGROGESTOR · RELATÓRIO DO REBANHO');
  resumo.getCell('A2').value = 'Gerado em';
  resumo.getCell('B2').value = dados.geradoEm.toLocaleString('pt-BR');
  resumo.getCell('A3').value = 'Busca por nome ou brinco';
  resumo.getCell('B3').value = dados.busca || 'Sem filtro';
  resumo.getCell('A4').value = 'Categoria';
  resumo.getCell('B4').value = dados.categoria;
  resumo.getCell('A5').value = 'Ordenação';
  resumo.getCell('B5').value = dados.ordem === 'producao' ? 'Maior produção cadastrada' : 'Nome';
  resumo.getCell('A6').value = 'Animais filtrados / total';
  resumo.getCell('B6').value = `${stats.total} / ${dados.totalAnimais}`;
  cabecalho(8, 'INDICADORES DOS ANIMAIS FILTRADOS');
  const indicadores: [string, string | number][] = [
    ['Animais filtrados', stats.total],
    ['Vacas em lactação', stats.lactantes],
    ['Produção cadastrada em lactação (L/dia)', stats.producaoTotal],
    ['Média por vaca em lactação (L/dia)', stats.media ?? 'Não disponível'],
    ['Maior produção em lactação', stats.maior?.nome ?? 'Não disponível'],
    ['Vacas em lactação com valor zero', stats.zeros],
    ['Fora de lactação com produção cadastrada', stats.foraDeLactacaoComProducao],
  ];
  indicadores.forEach(([nome, valor], i) => { resumo.getCell(9 + i, 1).value = nome; resumo.getCell(9 + i, 2).value = valor; });
  resumo.getCell('B11').numFmt = '0.00';
  resumo.getCell('B12').numFmt = '0.00';
  cabecalho(17, 'ANIMAIS POR CATEGORIA');
  CATEGORIAS.forEach((categoria, i) => {
    resumo.getCell(18 + i, 1).value = categoria;
    resumo.getCell(18 + i, 2).value = stats.porCategoria[categoria];
    resumo.getCell(18 + i, 3).value = stats.total ? stats.porCategoria[categoria] / stats.total : 0;
    resumo.getCell(18 + i, 3).numFmt = '0.0%';
  });
  cabecalho(23, 'FINANCEIRO · TODOS OS LANÇAMENTOS NO PERÍODO');
  resumo.getCell('A24').value = 'Período';
  resumo.getCell('B24').value = `${dados.inicio} a ${dados.fim}`;
  (['Receitas', 'Despesas', 'Saldo'] as const).forEach((nome, i) => {
    resumo.getCell(25 + i, 1).value = nome;
    resumo.getCell(25 + i, 2).value = [dados.financeiro.receitas, dados.financeiro.despesas, dados.financeiro.saldo][i];
    resumo.getCell(25 + i, 2).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
  });
  cabecalho(29, 'COMO INTERPRETAR');
  [
    'Os indicadores e a lista respeitam os filtros de animais selecionados.',
    'O financeiro inclui todos os lançamentos do período; os filtros de animais não se aplicam.',
    'Produção cadastrada é o valor atual informado no cadastro, não o histórico de ordenhas.',
    'A média inclui valores zero, que podem representar produção não informada.',
  ].forEach((nota, i) => {
    resumo.mergeCells(30 + i, 1, 30 + i, 4);
    const cell = resumo.getCell(30 + i, 1); cell.value = nota;
    cell.alignment = { wrapText: true, vertical: 'middle' };
    resumo.getRow(30 + i).height = 30;
  });
  resumo.eachRow(row => { row.getCell(1).font = { ...row.getCell(1).font, bold: true }; });
  cabecalho(35, 'DETALHES INCLUÍDOS NO ARQUIVO');
  [
    ['Ordenhas dos animais filtrados', dados.producoes.length],
    ['Eventos dos animais filtrados', dados.eventos.length],
    ['Tarefas gerais ou dos animais filtrados', dados.tarefas.length],
    ['Lançamentos financeiros no período', dados.lancamentos.length],
  ].forEach(([nome, total], i) => { resumo.getCell(36 + i, 1).value = nome; resumo.getCell(36 + i, 2).value = total; });
  resumo.mergeCells('A41:D41');
  resumo.getCell('A41').value = 'Ordenhas, eventos e tarefas incluem todo o histórico disponível. Tarefas sem animal vinculado também são incluídas.';
  resumo.getCell('A41').alignment = { wrapText: true, vertical: 'middle' };
  resumo.getRow(41).height = 32;
  resumo.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];
  resumo.properties.defaultRowHeight = 20;
  resumo.getColumn(1).width = 46;
  resumo.getColumn(2).width = 32;
  rebanho.addRow(['Brinco', 'Nome', 'Categoria', 'Produção cadastrada (L/dia)', 'ID do animal', 'Observação']);
  rebanho.getColumn(5).width = 18;
  rebanho.getColumn(6).width = 38;
  const linhaTitulo = rebanho.getRow(1);
  linhaTitulo.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  linhaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF184D3C' } };
  linhaTitulo.height = 24;
  dados.animais.forEach((animal, i) => {
    const observacao = animal.categoria === 'Vaca em Lactação' && animal.producaoDiaria === 0 ? 'Valor zero: conferir cadastro' : animal.categoria !== 'Vaca em Lactação' && animal.producaoDiaria > 0 ? 'Produção fora de lactação' : '';
    const linha = rebanho.addRow([animal.brinco, animal.nome, animal.categoria, animal.producaoDiaria, animal.id != null ? String(animal.id) : '', observacao]);
    linha.getCell(4).numFmt = '0.00';
    if (i % 2 === 0) linha.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7F3' } };
  });
  rebanho.autoFilter = { from: 'A1', to: `F${Math.max(1, dados.animais.length + 1)}` };
  rebanho.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];

  const animaisPorId = new Map(dados.animais.filter(a => a.id != null).map(a => [String(a.id), a]));
  const dataExcel = (data: string): Date | string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : data;
  };
  const nomeAnimal = (r: Registro) => r.animalNome || (r.animalId == null ? 'Sem vínculo' : animaisPorId.get(String(r.animalId))?.nome || 'Não informado');
  const brinco = (id: number | null) => id == null ? '' : animaisPorId.get(String(id))?.brinco ?? '';
  const prepararTabela = (nome: string, colunas: { titulo: string; largura: number }[], linhas: CellValue[][], datas: number[] = [], moedas: number[] = [], numeros: number[] = []): Worksheet => {
    const aba = arquivo.addWorksheet(nome, { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
    aba.columns = colunas.map(c => ({ width: c.largura }));
    aba.addRow(colunas.map(c => c.titulo));
    aba.getRow(1).height = 28;
    aba.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    aba.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF184D3C' } };
    aba.getRow(1).alignment = { vertical: 'middle', wrapText: true };
    linhas.forEach((valores, i) => {
      const row = aba.addRow(valores);
      row.height = 21;
      row.alignment = { vertical: 'middle' };
      if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7F3' } };
      datas.forEach(n => { row.getCell(n).numFmt = 'dd/mm/yyyy'; });
      moedas.forEach(n => { row.getCell(n).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00'; });
      numeros.forEach(n => { row.getCell(n).numFmt = '0.00'; });
    });
    aba.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, linhas.length + 1), column: colunas.length } };
    return aba;
  };
  const porData = <T extends { data: string }>(itens: T[]) => [...itens].sort((a, b) => b.data.localeCompare(a.data));
  const turnos: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };
  const tipos: Record<string, string> = { CONSULTA: 'Consulta', VACINACAO: 'Vacinação', TRATAMENTO: 'Tratamento', INSEMINACAO: 'Inseminação', PARTO: 'Parto', OUTRO: 'Outro', RECEITA: 'Receita', DESPESA: 'Despesa' };
  prepararTabela('Ordenhas', [{ titulo: 'Data', largura: 15 }, { titulo: 'Animal', largura: 26 }, { titulo: 'Brinco', largura: 18 }, { titulo: 'Turno', largura: 16 }, { titulo: 'Litros', largura: 16 }, { titulo: 'ID registro', largura: 16 }], porData(dados.producoes).map(p => [dataExcel(p.data), p.animalNome, brinco(p.animalId), turnos[p.turno] ?? p.turno, p.litros, p.id]), [1], [], [5]);
  prepararTabela('Eventos', [{ titulo: 'Data', largura: 15 }, { titulo: 'Animal', largura: 26 }, { titulo: 'Brinco', largura: 18 }, { titulo: 'Tipo', largura: 20 }, { titulo: 'Descrição', largura: 55 }, { titulo: 'ID registro', largura: 16 }], porData(dados.eventos).map(e => [dataExcel(e.data), nomeAnimal(e), brinco(e.animalId), tipos[e.subtipo ?? ''] ?? e.subtipo ?? 'Não informado', e.descricao, e.id]), [1]);
  const hoje = `${dados.geradoEm.getFullYear()}-${String(dados.geradoEm.getMonth() + 1).padStart(2, '0')}-${String(dados.geradoEm.getDate()).padStart(2, '0')}`;
  prepararTabela('Tarefas', [{ titulo: 'Data', largura: 15 }, { titulo: 'Descrição', largura: 55 }, { titulo: 'Situação', largura: 18 }, { titulo: 'Animal', largura: 26 }, { titulo: 'Brinco', largura: 18 }, { titulo: 'ID registro', largura: 16 }], porData(dados.tarefas).map(t => [dataExcel(t.data), t.descricao, t.concluida === true ? 'Concluída' : t.concluida === false ? (t.data < hoje ? 'Em atraso' : 'Pendente') : 'Não informada', nomeAnimal(t), brinco(t.animalId), t.id]), [1]);
  prepararTabela('Financeiro', [{ titulo: 'Data', largura: 15 }, { titulo: 'Tipo', largura: 18 }, { titulo: 'Descrição', largura: 55 }, { titulo: 'Valor (R$)', largura: 20 }, { titulo: 'Animal', largura: 26 }, { titulo: 'ID registro', largura: 16 }], porData(dados.lancamentos).map(l => [dataExcel(l.data), tipos[l.subtipo ?? ''] ?? l.subtipo ?? 'Não informado', l.descricao, l.valor, l.animalNome ?? (l.animalId == null ? 'Sem vínculo' : 'Não informado'), l.id]), [1], [4]);
  return arquivo;
}

export async function baixarPlanilhaRelatorio(dados: DadosPlanilha) {
  const arquivo = await criarPlanilhaRelatorio(dados);
  const conteudo = await arquivo.xlsx.writeBuffer();
  const blob = new Blob([conteudo], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agrogestor-relatorio-${dados.fim}.xlsx`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
