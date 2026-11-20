/** Indica uma funcionalidade ainda não implementada na API, sem testar o estado da rede. */
export default function AvisoIntegracao({ resumo = false }: { resumo?: boolean }) {
  return <div role="note" aria-label="Status de integração" className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
    <strong className="text-sm text-[var(--warn)]">Não conectado à API</strong>
    {resumo
      ? <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">O financeiro usa dados de demonstração, que não são salvos.</p>
      : <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Esta funcionalidade ainda não foi integrada. Estes registros são exemplos e não são salvos. Ao recarregar a página ou sair do aplicativo, as alterações serão perdidas.</p>}
  </div>;
}
