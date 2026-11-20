import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnimalForm from '../components/AnimalForm';
import { useAnimais } from '../hooks/useAnimais';
import { animaisService } from '../services/animais.service';
import type { Animal } from '../types';

const animal: Animal = { id: 1, brinco: '0412', nome: 'Mimosa', categoria: 'Vaca em Lactação', producaoDiaria: 12 };

describe('rebanho', () => {
  it('valida campos obrigatórios e salva valores preenchidos', async () => {
    const salvar = vi.fn();
    const user = userEvent.setup();
    render(<AnimalForm animalEditando={null} onSalvar={salvar} onCancelar={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }));
    expect(screen.getByText('Brinco é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/brinco/i), ' 0412 ');
    await user.type(screen.getByLabelText(/^nome/i), ' Mimosa ');
    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }));
    expect(salvar).toHaveBeenCalledWith({ brinco: '0412', nome: 'Mimosa', categoria: 'Vaca em Lactação', producaoDiaria: 0 });
  });
  it('carrega dados do animal em edição e cancela com Escape', async () => {
    const cancelar = vi.fn();
    render(<AnimalForm animalEditando={animal} onSalvar={vi.fn()} onCancelar={cancelar} />);
    expect(screen.getByLabelText(/^nome/i)).toHaveValue('Mimosa');
    await userEvent.keyboard('{Escape}');
    expect(cancelar).toHaveBeenCalledOnce();
  });
  it('carrega, cria, atualiza e exclui animais', async () => {
    vi.spyOn(animaisService, 'listar').mockResolvedValue([animal]);
    const criado = { ...animal, id: 2, nome: 'Lua' };
    vi.spyOn(animaisService, 'criar').mockResolvedValue(criado);
    vi.spyOn(animaisService, 'atualizar').mockResolvedValue({ ...animal, nome: 'Estrela' });
    vi.spyOn(animaisService, 'excluir').mockResolvedValue();
    const { result } = renderHook(() => useAnimais());
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.animais).toEqual([animal]);
    await act(async () => { await result.current.salvar({ ...criado, id: undefined }); });
    await act(async () => { await result.current.salvar(animal); });
    expect(result.current.animais.map(a => a.nome)).toEqual(['Estrela', 'Lua']);
    await act(async () => { await result.current.excluir(1); });
    expect(result.current.animais).toEqual([criado]);
  });
  it('exibe erro de carregamento sem perder controle de estado', async () => {
    vi.spyOn(animaisService, 'listar').mockRejectedValue({ response: { data: { mensagem: 'Serviço indisponível' } } });
    const { result } = renderHook(() => useAnimais());
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.erro).toBe('Serviço indisponível');
    expect(result.current.animais).toEqual([]);
  });
});
