import { useCallback, useEffect, useState } from 'react';
import { animaisService } from '../services/animais.service';
import type { Animal } from '../types';

type ErroApi = { response?: { data?: { mensagem?: string } } };

export function useAnimais() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega do backend ao montar
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await animaisService.listar();
        if (ativo) setAnimais(dados);
      } catch (err) {
        if (ativo) {
          const msg =
            (err as ErroApi)?.response?.data?.mensagem ||
            'Não foi possível carregar o rebanho. Verifique sua conexão.';
          setErro(msg);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Cria ou atualiza via API
  const salvar = useCallback(async (animal: Animal) => {
    if (animal.id) {
      const atualizado = await animaisService.atualizar(animal);
      setAnimais((prev) =>
        prev.map((a) => (a.id === atualizado.id ? atualizado : a))
      );
      return atualizado;
    }
    const criado = await animaisService.criar(animal);
    setAnimais((prev) => [...prev, criado]);
    return criado;
  }, []);

  // Exclui via API
  const excluir = useCallback(
    async (id: string | number | undefined | null) => {
      if (id === undefined || id === null) return;
      await animaisService.excluir(id);
      setAnimais((prev) => prev.filter((a) => a.id !== id));
    },
    []
  );

  // Importação em massa (cria um por um via API)
  const importar = useCallback(async (novos: Animal[]) => {
    const criados: Animal[] = [];
    for (const a of novos) {
      const c = await animaisService.criar({
        brinco: a.brinco,
        nome: a.nome,
        categoria: a.categoria,
        producaoDiaria: a.producaoDiaria,
      });
      criados.push(c);
    }
    setAnimais((prev) => [...prev, ...criados]);
  }, []);

  return { animais, salvar, excluir, importar, carregando, erro };
}

