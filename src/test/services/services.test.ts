import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../services/api';
import { authService } from '../../services/auth.service';
import { animaisService } from '../../services/animais.service';

describe('autenticação e rebanho', () => {
  beforeEach(() => localStorage.clear());
  it('salva e remove a sessão após login e logout', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'abc', usuario: { nome: 'Ana', email: 'ana@example.com' } } });
    await authService.login({ email: 'ana@example.com', senha: 'senha' });
    expect(authService.getToken()).toBe('abc');
    expect(authService.getUsuario()?.nome).toBe('Ana');
    authService.logout();
    expect(authService.getToken()).toBeNull();
    expect(authService.getUsuario()).toBeNull();
  });
  it('não falha ao encontrar dados de usuário inválidos', () => {
    localStorage.setItem('usuario', '{');
    expect(authService.getUsuario()).toBeNull();
  });
  it('converte as categorias recebidas e enviadas para a API', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [{ id: 1, brinco: '1', nome: 'Mimosa', categoria: 'VACA_EM_LACTACAO', producaoDiaria: 12 }] });
    expect((await animaisService.listar())[0].categoria).toBe('Vaca em Lactação');
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 2, brinco: '2', nome: 'Lua', categoria: 'VACA_SECA', producaoDiaria: 0 } });
    const animal = await animaisService.criar({ brinco: '2', nome: 'Lua', categoria: 'Vaca Seca', producaoDiaria: 0 });
    expect(post).toHaveBeenCalledWith('/api/animais', expect.objectContaining({ categoria: 'VACA_SECA' }));
    expect(animal.categoria).toBe('Vaca Seca');
  });
  it('apaga dados locais apenas após exclusão de conta bem-sucedida', async () => {
    localStorage.setItem('token', 'abc');
    vi.spyOn(api, 'delete').mockRejectedValueOnce(new Error('erro')).mockResolvedValueOnce({ data: { mensagem: 'ok' } });
    await expect(authService.excluirConta({ senha: 'x' })).rejects.toThrow();
    expect(authService.getToken()).toBe('abc');
    await authService.excluirConta({ senha: 'x' });
    expect(authService.getToken()).toBeNull();
  });
});
