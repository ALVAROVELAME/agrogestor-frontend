import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { StatusView, type StatusOpcoes } from './Status';

export default function ConfirmarEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [estado, setEstado] = useState<StatusOpcoes>({
    tipo: 'carregando',
    titulo: 'Confirmando seu e-mail...',
    mensagem: 'Aguarde um instante enquanto ativamos sua conta.',
    ctaTexto: 'Aguarde...',
    ctaLink: '/',
  });

  useEffect(() => {
    if (!token) {
      setEstado({
        tipo: 'erro',
        titulo: 'Token ausente',
        mensagem:
          'O link de confirmação está incompleto. Verifique o e-mail enviado e tente novamente.',
        ctaTexto: 'Voltar ao início',
        ctaLink: '/',
      });
      return;
    }

    api
      .get(`/api/auth/confirmar`, { params: { token } })
      .then(() => {
        setEstado({
          tipo: 'sucesso',
          titulo: 'E-mail confirmado! 🎉',
          mensagem:
            'Sua conta está ativa. Agora você já pode fazer login e começar a usar o AgroGestor.',
          ctaTexto: 'Ir para o login',
          ctaLink: '/login',
          autoRedirect: 6,
        });
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.mensagem ||
          'O token pode ter expirado ou já foi usado.';

        setEstado({
          tipo: 'erro',
          titulo: 'Não foi possível confirmar',
          mensagem: msg,
          ctaTexto: 'Voltar ao início',
          ctaLink: '/',
        });
      });
  }, [token]);

  return <StatusView {...estado} />;
}