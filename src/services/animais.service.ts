import { api } from './api';
import type { Animal } from '../types';

// Mapeia a categoria da API (enum) <-> UI (string amigável)
const mapCategoriaParaApi = (c: string) =>
  c.toUpperCase().replace(' ', '_');

const mapCategoriaDaApi = (c: string) => {
  const map: Record<string, Animal['categoria']> = {
    BEZERRA: 'Bezerra',
    NOVILHA: 'Novilha',
    VACA_EM_LACTACAO: 'Vaca em Lactação',
    VACA_SECA: 'Vaca Seca',
  };
  return map[c] ?? 'Vaca em Lactação';
};

export const animaisService = {
  async listar(): Promise<Animal[]> {
    const { data } = await api.get<any[]>('/api/animais');
    return data.map((a) => ({
      id: a.id,
      brinco: a.brinco,
      nome: a.nome,
      categoria: mapCategoriaDaApi(a.categoria),
      producaoDiaria: a.producaoDiaria,
    }));
  },

  async criar(animal: Omit<Animal, 'id'>): Promise<Animal> {
    const { data } = await api.post<any>('/api/animais', {
      brinco: animal.brinco,
      nome: animal.nome,
      categoria: mapCategoriaParaApi(animal.categoria),
      producaoDiaria: animal.producaoDiaria,
    });
    return {
      id: data.id,
      brinco: data.brinco,
      nome: data.nome,
      categoria: mapCategoriaDaApi(data.categoria),
      producaoDiaria: data.producaoDiaria,
    };
  },

  async atualizar(animal: Animal): Promise<Animal> {
    const { data } = await api.put<any>(`/api/animais/${animal.id}`, {
      brinco: animal.brinco,
      nome: animal.nome,
      categoria: mapCategoriaParaApi(animal.categoria),
      producaoDiaria: animal.producaoDiaria,
    });
    return {
      id: data.id,
      brinco: data.brinco,
      nome: data.nome,
      categoria: mapCategoriaDaApi(data.categoria),
      producaoDiaria: data.producaoDiaria,
    };
  },

  async excluir(id: string | number): Promise<void> {
    await api.delete(`/api/animais/${id}`);
  },
};