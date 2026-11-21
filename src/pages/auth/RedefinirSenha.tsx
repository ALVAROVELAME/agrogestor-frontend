import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import IndicadorSenha from '../../components/IndicadorSenha';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const token = params.get('token');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState('');

  async function redefinir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || enviando) return;
    if (senha.length < 6 || new TextEncoder().encode(senha).length > 72) { setErro('Use pelo menos 6 caracteres e no máximo 72 bytes.'); return; }
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return; }
    setErro(''); setEnviando(true);
    try {
      await api.post('/api/auth/reset-password', { token, senha });
      logout();
      setSenha(''); setConfirmacao(''); setConcluido(true);
      navigate('/reset-password', { replace: true });
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setErro(status === 400 ? 'Link inválido ou expirado. Solicite outro link.' : status === 429 ? 'Muitas tentativas. Aguarde e tente novamente.' : 'Não foi possível redefinir a senha. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return <main className="min-h-dvh bg-[#f8faf6] px-5 py-12 text-[#102f21] sm:py-20">
    <div className="mx-auto max-w-[480px]">
      <Link to="/" className="mb-10 inline-flex items-center gap-3 font-bold text-[#102f21]"><img src="/logo.svg" alt="" className="h-10 w-10" />AgroGestor</Link>
      <section className="rounded-3xl border border-[#c6d5c9] bg-white p-6 shadow-lg sm:p-10" aria-labelledby="redefinir-titulo">
        <h1 id="redefinir-titulo" className="text-3xl font-bold tracking-tight">Criar nova senha</h1>
        {concluido ? <div role="status" className="mt-5 space-y-5"><p>Sua senha foi redefinida. Entre novamente com a nova senha.</p><Link to="/login" className="inline-block font-bold text-[#205b3c] underline">Ir para o login</Link></div> : !token ? <div role="alert" className="mt-5"><p>O link de recuperação está incompleto.</p><Link to="/forgot-password" className="mt-4 inline-block font-bold text-[#205b3c] underline">Solicitar novo link</Link></div> : <>
          <p className="mt-4 text-[#344d3e]">Escolha uma senha com pelo menos 6 caracteres.</p>
          {erro && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-red-800">{erro}</p>}
          <form onSubmit={redefinir} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="nova-senha" className="font-semibold">Nova senha</label>
              <input id="nova-senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={100} value={senha} onChange={e => setSenha(e.target.value)} disabled={enviando} aria-describedby={senha ? 'reset-strength' : undefined} className="min-h-12 rounded-xl border border-[#a7bcae] px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205b3c]" />
              <IndicadorSenha senha={senha} id="reset-strength" />
            </div>
            <div className="flex flex-col gap-2"><label htmlFor="confirmar-nova-senha" className="font-semibold">Confirmar nova senha</label><input id="confirmar-nova-senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={100} value={confirmacao} onChange={e => setConfirmacao(e.target.value)} disabled={enviando} className="min-h-12 rounded-xl border border-[#a7bcae] px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205b3c]" /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)} /> Mostrar senhas</label>
            <button disabled={enviando} className="min-h-12 rounded-xl bg-[#205b3c] px-5 font-bold text-white hover:bg-[#102f21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205b3c] disabled:opacity-60">{enviando ? 'Salvando…' : 'Redefinir senha'}</button>
          </form>
          <Link to="/forgot-password" className="mt-6 inline-block font-semibold text-[#205b3c] underline">Solicitar novo link</Link>
        </>}
      </section>
    </div>
  </main>;
}
