import { useAuth } from '../../contexts/AuthContext';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  estilo?: CSSProperties;
  confirmar?: boolean;
  /** Para onde redirecionar após logout. */
  redirecionarPara?: string;
}

export default function LogoutButton({
  estilo,
  confirmar = true,
  redirecionarPara = '/login',
}: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirmar && !window.confirm('Deseja realmente sair?')) return;

    // 1. Limpa o token/usuário do localStorage + state
    logout();

    navigate(redirecionarPara, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        background: 'transparent',
        color: '#a03030',
        border: '1px solid #f5c6c6',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
        ...estilo,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#fdecec')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Sair
    </button>
  );
}
