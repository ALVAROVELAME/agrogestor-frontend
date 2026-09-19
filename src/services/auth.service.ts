import { api } from './api';
import type {
  LoginDTO,
  LoginRespostaDTO,
  Usuario,
  UsuarioCadastroDTO,
  ExcluirContaDTO,
  MensagemRespostaDTO,
} from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

export const authService = {
  async login(dados: LoginDTO): Promise<LoginRespostaDTO> {
    const { data } = await api.post<LoginRespostaDTO>('/api/auth/login', dados);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      }
    }
    return data;
  },

  async cadastrar(dados: UsuarioCadastroDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.post<MensagemRespostaDTO>('/api/usuarios', dados);
    return data;
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/api/auth/me');
    return data;
  },

  /**
   * Exclui a conta do usuário logado.
   * Requer a senha atual para confirmação.
   * Após sucesso, limpa o localStorage.
   */
  async excluirConta(dados: ExcluirContaDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.delete<MensagemRespostaDTO>('/api/usuarios/me', {
      data: dados,
    });
    // Limpa os dados locais após exclusão bem-sucedida
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  },
};