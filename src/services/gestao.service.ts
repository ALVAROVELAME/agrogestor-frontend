import { api } from './api';

export type Turno = 'MANHA' | 'TARDE' | 'NOITE';
export type TipoEvento = 'CONSULTA' | 'VACINACAO' | 'TRATAMENTO' | 'INSEMINACAO' | 'PARTO' | 'OUTRO';
export type TipoFinanceiro = 'RECEITA' | 'DESPESA';
export interface Producao { id: number; animalId: number; animalNome: string; data: string; turno: Turno; litros: number }
export interface Registro { id: number; data: string; descricao: string; subtipo: string | null; valor: number | null; concluida: boolean | null; animalId: number | null; animalNome: string | null }
export interface Ficha { id: number; nome: string; brinco: string; dataNascimento: string | null; raca: string | null; origem: string | null; observacoes: string | null }
export interface FinanceiroResumo { receitas: number; despesas: number; saldo: number }
interface Pagina<T> { content: T[]; last: boolean; totalPages: number }

// Lê todas as páginas para que totais e históricos não parem nos primeiros 20 itens.
async function listarTodos<T>(url: string): Promise<T[]> {
  const itens: T[] = [];
  let pagina = 0;
  let totalPages = 1;
  while (pagina < totalPages) {
    const { data } = await api.get<Pagina<T>>(url, { params: { pagina, tamanho: 100 } });
    itens.push(...data.content);
    totalPages = data.totalPages;
    pagina++;
  }
  return itens;
}

export const gestaoService = {
  producoes: () => listarTodos<Producao>('/api/producoes'),
  tarefas: () => listarTodos<Registro>('/api/tarefas'),
  eventos: () => listarTodos<Registro>('/api/eventos'),
  financeiro: () => listarTodos<Registro>('/api/financeiro/lancamentos'),
  ficha: async (id: number | string) => (await api.get<Ficha>(`/api/animais/${id}`)).data,
  atualizarFicha: async (id: number | string, dados: Partial<Pick<Ficha, 'dataNascimento' | 'raca' | 'origem' | 'observacoes'>>) =>
    (await api.patch<Ficha>(`/api/animais/${id}/ficha`, dados)).data,
  criarProducao: async (dados: { animalId: number; data: string; turno: Turno; litros: number }) =>
    (await api.post<Producao>('/api/producoes', dados)).data,
  criarTarefa: async (dados: { titulo: string; data: string }) =>
    (await api.post<Registro>('/api/tarefas', dados)).data,
  atualizarTarefa: async (id: number, concluida: boolean) =>
    (await api.patch<Registro>(`/api/tarefas/${id}`, { concluida })).data,
  criarEvento: async (dados: { animalId: number; data: string; tipo: TipoEvento; descricao: string }) =>
    (await api.post<Registro>('/api/eventos', dados)).data,
  criarFinanceiro: async (dados: { data: string; tipo: TipoFinanceiro; descricao: string; valor: number }) =>
    (await api.post<Registro>('/api/financeiro/lancamentos', dados)).data,
  excluir: async (recurso: 'producoes' | 'tarefas' | 'eventos' | 'financeiro/lancamentos', id: number) => {
    await api.delete(`/api/${recurso}/${id}`);
  },
  resumoFinanceiro: async (inicio: string, fim: string) =>
    (await api.get<FinanceiroResumo>('/api/relatorios/financeiro', { params: { inicio, fim } })).data,
};
