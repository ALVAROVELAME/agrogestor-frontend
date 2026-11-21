export function periodoFinanceiro(agora = new Date()) {
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 364);
  const data = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { inicio: data(inicio), fim: data(agora) };
}
