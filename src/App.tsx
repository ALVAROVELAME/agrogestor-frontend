import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import RotaProtegida from './components/auth/RotaProtegida';
import RotaPublica from './components/auth/RotaPublica';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Status = lazy(() => import('./pages/Status'));
const ConfirmarEmail = lazy(() => import('./pages/auth/ConfirmarEmail'));
const Termos = lazy(() => import('./pages/legal/Termos'));
const Privacidade = lazy(() => import('./pages/legal/Privacidade'));
const RecuperarSenha = lazy(() => import('./pages/auth/RecuperarSenha'));
const RedefinirSenha = lazy(() => import('./pages/auth/RedefinirSenha'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div role="status">Carregando...</div>}>
        <Routes>
          {/* ============ ROTAS PÚBLICAS ============ */}
          <Route
            path="/"
            element={
              <RotaPublica>
                <Landing />
              </RotaPublica>
            }
          />
          <Route
            path="/login"
            element={
              <RotaPublica>
                <Login />
              </RotaPublica>
            }
          />
          <Route
            path="/signup"
            element={
              <RotaPublica>
                <Signup />
              </RotaPublica>
            }
          />

          {/* ============ PÁGINAS DE STATUS (sempre acessíveis) ============ */}
          <Route path="/status" element={<Status />} />
          <Route path="/confirmar" element={<ConfirmarEmail />} />
          <Route path="/forgot-password" element={<RecuperarSenha />} />
          <Route path="/reset-password" element={<RedefinirSenha />} />

          {/* ============ PÁGINAS LEGAIS (sempre acessíveis) ============ */}
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />

          {/* ============ ROTAS PROTEGIDAS ============ */}
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />

          {/* ============ FALLBACK ============ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
