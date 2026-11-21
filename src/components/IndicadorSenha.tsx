export default function IndicadorSenha({ senha, id }: { senha: string; id: string }) {
  if (!senha) return null;

  const forca = Number(senha.length >= 8) + Number(/[A-Z]/.test(senha)) + Number(/[0-9]/.test(senha)) + Number(/[^A-Za-z0-9]/.test(senha));
  const info = [
    { label: 'Muito fraca', cor: '#b91c1c' },
    { label: 'Fraca', cor: '#c2410c' },
    { label: 'Média', cor: '#a16207' },
    { label: 'Boa', cor: '#15803d' },
    { label: 'Forte', cor: '#166534' },
  ][forca];
  const requisitos = [
    { ok: senha.length >= 6, texto: '6+ caracteres' },
    { ok: /[A-Z]/.test(senha), texto: '1 maiúscula' },
    { ok: /[0-9]/.test(senha), texto: '1 número' },
    { ok: /[^A-Za-z0-9]/.test(senha), texto: '1 símbolo' },
  ];

  return <div className="senha-indicador">
    <div className="sg-strength" id={id} role="progressbar" aria-valuenow={forca} aria-valuemin={0} aria-valuemax={4} aria-label={`Força da senha: ${info.label}`}>
      <div className="sg-strength-bar"><div className="sg-strength-fill" style={{ width: `${forca * 25}%`, background: info.cor }} /></div>
      <span className="sg-strength-label" style={{ color: info.cor }}>{info.label}</span>
    </div>
    <div className="sg-req-list">
      {requisitos.map(({ ok, texto }) => <span key={texto} className={`sg-req${ok ? ' is-ok' : ''}`} aria-label={`${texto}: ${ok ? 'atendido' : 'não atendido'}`}>
        <span className="sg-req-dot" aria-hidden="true">{ok ? '✓' : ''}</span>{texto}
      </span>)}
    </div>
  </div>;
}
