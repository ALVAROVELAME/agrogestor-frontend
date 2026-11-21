export default function CarregamentoPagina() {
  return (
    <div className="pagina-carregando" role="status" aria-live="polite">
      <div className="pagina-carregando__conteudo">
        <div className="pagina-carregando__marca" aria-hidden="true">
          <span className="pagina-carregando__anel" />
          <img src="/logo.svg" alt="" />
        </div>
        <span className="pagina-carregando__nome">AgroGestor</span>
        <span className="pagina-carregando__texto">Preparando tudo para você...</span>
      </div>
    </div>
  );
}
