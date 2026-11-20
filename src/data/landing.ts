export const LINKS = {
  swagger: 'https://agrogestor-api.duckdns.org/swagger-ui/index.html',
  portfolio: 'https://alvarovelame.vercel.app',
  github: 'https://github.com/ALVAROVELAME',
  linkedin: 'https://www.linkedin.com/in/alvaro-velame/',
  email: 'mailto:alvarovelameprofissional@gmail.com',
  emailEnterprise:
    'mailto:alvarovelameprofissional@gmail.com?subject=AgroGestor%20-%20Plano%20Empresa',
  emailText: 'alvarovelameprofissional@gmail.com',
};

/* ============================================================
   Dados de exemplo
   ============================================================ */
export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DIAS_LONGOS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

export const REBANHO = [
  { nome: 'Mimosa', brinco: '0412', raca: 'Holandesa', litros: [22, 23, 24, 23, 25, 24, 24] },
  { nome: 'Estrela', brinco: '0377', raca: 'Girolando', litros: [19, 20, 18, 21, 20, 20, 21] },
  { nome: 'Lua', brinco: '0291', raca: 'Jersey', litros: [15, 16, 17, 15, 16, 16, 17] },
  { nome: 'Princesa', brinco: '0518', raca: 'Girolando', litros: [11, 12, 12, 13, 12, 13, 12] },
];

export const MAX_LITROS = 30;
export const MEDIA_REBANHO_DIA = DIAS.map(
  (_, d) => REBANHO.reduce((soma, a) => soma + a.litros[d], 0) / REBANHO.length
);

export const HERO_LINHAS = [
  { nome: 'Mimosa', v: 24 },
  { nome: 'Estrela', v: 20 },
  { nome: 'Lua', v: 16 },
  { nome: 'Princesa', v: 12 },
];

export const fmt = (n: number, d = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

