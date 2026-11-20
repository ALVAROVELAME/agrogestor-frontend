import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    '[api] VITE_API_URL não definida. Crie um arquivo .env na raiz do projeto ' +
    'com a linha: VITE_API_URL=https://sua-url-da-api'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ============ REQUEST: adiciona Authorization ============
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ RESPONSE: trata 401 (token expirado/inválido) ============
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    // Somente uma requisição da sessão atual na área protegida deve expulsar o usuário.
    // Na página inicial, a validação de /me é tratada pelo AuthProvider.
    const token = localStorage.getItem('token');
    const authorization = error?.config?.headers?.Authorization;
    const isDashboard = window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/dashboard/');
    const isPublicAuth = url.includes('/api/auth/login') || url.includes('/api/auth/confirmar');

    if (status === 401 && isDashboard && !isPublicAuth && token && authorization === `Bearer ${token}`) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
