import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function solicitar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    setEnviando(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setEnviado(true);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setErro(status === 429 ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' : 'Não foi possível enviar a solicitação. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return <main className="min-h-dvh bg-[#f8faf6] px-5 py-12 text-[#102f21] sm:py-20">
    <div className="mx-auto max-w-[480px]">
      <Link to="/" className="mb-10 inline-flex items-center gap-3 font-bold text-[#102f21]"><img src="/logo.svg" alt="" className="h-10 w-10" />AgroGestor</Link>
      <section className="rounded-3xl border border-[#c6d5c9] bg-white p-6 shadow-lg sm:p-10" aria-labelledby="recuperar-titulo">
        <h1 id="recuperar-titulo" className="text-3xl font-bold tracking-tight">Recuperar senha</h1>
        {enviado ? <div role="status" className="mt-5 space-y-5 text-[#344d3e]">
          <p>Se houver uma conta com esse e-mail, enviaremos as instruções para redefinir sua senha.</p>
          <p>Confira também sua caixa de spam. O link recebido é válido por 30 minutos.</p>
          <Link to="/login" className="inline-block font-bold text-[#205b3c] underline">Voltar ao login</Link>
        </div> : <>
          <p className="mt-4 leading-relaxed text-[#344d3e]">Informe seu e-mail e enviaremos as instruções para acessar sua conta.</p>
          {erro && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-red-800">{erro}</p>}
          <form onSubmit={solicitar} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2"><label htmlFor="recuperar-email" className="font-semibold">E-mail</label>
              <input id="recuperar-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} disabled={enviando} className="min-h-12 rounded-xl border border-[#a7bcae] bg-white px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205b3c]" /></div>
            <button disabled={enviando} className="min-h-12 rounded-xl bg-[#205b3c] px-5 font-bold text-white hover:bg-[#102f21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205b3c] disabled:opacity-60">{enviando ? 'Enviando…' : 'Enviar instruções'}</button>
          </form>
          <Link to="/login" className="mt-6 inline-block font-semibold text-[#205b3c] underline">Voltar ao login</Link>
        </>}
      </section>
    </div>
  </main>;
}
