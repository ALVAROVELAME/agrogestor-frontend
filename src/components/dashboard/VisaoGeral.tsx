import type { Animal } from '../../types';

type Estatisticas = {
  total: number;
  producaoTotal: number;
  media: number;
  maior: Animal | null;
  porCategoria: Record<string, number>;
  top5: Animal[];
  maxProd: number;
};

export function VisaoGeral({ stats }: { stats: Estatisticas }) {
  return (
<>
                <section className="dash-kpis" aria-label="Indicadores principais">
                  <KpiCard icon="🐮" label="Total de animais" value={stats.total} />
                  <KpiCard icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                  <KpiCard icon="📊" label="Média por animal" value={`${stats.media.toFixed(2)} L`} />
                  <KpiCard
                    icon="🏆"
                    label="Maior produtor"
                    value={stats.maior ? `${stats.maior.nome} · ${stats.maior.producaoDiaria} L` : '—'}
                  />
                </section>

                <section className="dash-panel" aria-labelledby="top5-title">
                  <div className="dash-panel-head">
                    <h2 id="top5-title" className="dash-panel-title">Top 5 — Produção diária</h2>
                    <span className="dash-panel-meta">litros por dia</span>
                  </div>
                  {stats.top5.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Cadastre animais para ver o ranking.</p>
                  ) : (
                    <div className="dash-chart-rows">
                      {stats.top5.map((a, i) => (
                        <div key={String(a.id)} className="dash-chart-row">
                          <span className="dash-chart-label" title={a.nome}>{a.nome}</span>
                          <div className="dash-chart-track">
                            <div
                              className="dash-chart-fill"
                              style={{
                                width: `${(a.producaoDiaria / stats.maxProd) * 100}%`,
                                animationDelay: `${i * 0.06}s`,
                              }}
                            />
                          </div>
                          <span className="dash-chart-value">{a.producaoDiaria} L</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dash-panel" aria-labelledby="cat-title">
                  <div className="dash-panel-head">
                    <h2 id="cat-title" className="dash-panel-title">Distribuição por categoria</h2>
                  </div>
                  <div className="dash-chips">
                    {Object.entries(stats.porCategoria).map(([cat, qtd]) => (
                      <span key={cat} className="dash-chip">
                        {cat}
                        <span className="dash-chip-count">{qtd}</span>
                      </span>
                    ))}
                    {stats.total === 0 && (
                      <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>Nenhum animal cadastrado.</span>
                    )}
                  </div>
                </section>
              </>
  );
}

export function KpiCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi-head">
        <span className="dash-kpi-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="dash-kpi-label">{label}</div>
      <div className="dash-kpi-value" title={String(value)}>{value}</div>
    </div>
  );
}
