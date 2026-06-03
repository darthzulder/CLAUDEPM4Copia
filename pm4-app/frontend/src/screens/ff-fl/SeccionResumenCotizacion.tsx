import { CotizadorResult, CotizadorInputs } from '../../core/useCotizador';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cop(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return '—';
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(v))}`;
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="cot-res-header">
      <span className="cot-res-label">#</span>
      {cols.map((c) => <span key={c} className="cot-res-cell">{c}</span>)}
    </div>
  );
}

// ─── Spinner / error ─────────────────────────────────────────────────────────

function Estado({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return (
    <div className="cot-res-estado">
      <div className="cot-spinner" />
      <span>Calculando cotización…</span>
    </div>
  );
  if (error) return (
    <div className="cot-res-estado cot-res-estado--error">
      ⚠ Error al calcular: {error}
    </div>
  );
  return null;
}

// ─── Tablas por producto ─────────────────────────────────────────────────────

function TablaDyO({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.dyo;
  if (!d) return null;
  const { opt1, opt2, opt3 } = d;
  const lims = [inputs.dyo?.limite1, inputs.dyo?.limite2, inputs.dyo?.limite3];
  return (
    <div className="cot-res-product">
      <div className="cot-res-product-header">Seguro de Directores y Administradores (D&amp;O)</div>
      <div className="cot-res-table">
        <TableHeader cols={['Límite asegurado', 'Modalidad', 'Prima bruta anual']} />
        {[opt1, opt2, opt3].map((o, i) => (
          <div key={i} className="cot-res-row">
            <span className="cot-res-label">{i + 1}</span>
            <span className="cot-res-cell">{cop(Number(lims[i] ?? 0))}</span>
            <span className="cot-res-cell cot-res-cell--muted">Todo y cada reclamo en el agregado anual</span>
            <span className="cot-res-cell">{cop(o.prima_a)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaCC({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.cc;
  if (!d) return null;
  const evts = [inputs.cc?.limite1_evento, inputs.cc?.limite2_evento, inputs.cc?.limite3_evento];
  const agrs = [inputs.cc?.limite1_agregado, inputs.cc?.limite2_agregado, inputs.cc?.limite3_agregado];
  return (
    <div className="cot-res-product">
      <div className="cot-res-product-header">Seguro de Crimen Comercial</div>
      <div className="cot-res-table">
        <TableHeader cols={['Lím. por evento', 'Lím. por agregado', 'Deducible', 'Prima bruta anual']} />
        {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
          <div key={i} className="cot-res-row">
            <span className="cot-res-label">{i + 1}</span>
            <span className="cot-res-cell">{cop(Number(evts[i] ?? 0))}</span>
            <span className="cot-res-cell">{cop(Number(agrs[i] ?? 0))}</span>
            <span className="cot-res-cell">{cop(o.deducible)}</span>
            <span className="cot-res-cell">{cop(o.prima)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaPdysi({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.pdysi;
  if (!d) return null;
  const lims = [inputs.pdysi?.limite1, inputs.pdysi?.limite2, inputs.pdysi?.limite3];
  return (
    <div className="cot-res-product">
      <div className="cot-res-product-header">Seguro de Protección de Datos y Seguridad Informática</div>
      <div className="cot-res-table">
        <TableHeader cols={['Límite asegurado', 'Modalidad', 'Deducible', 'Prima bruta anual']} />
        {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
          <div key={i} className="cot-res-row">
            <span className="cot-res-label">{i + 1}</span>
            <span className="cot-res-cell">{cop(Number(lims[i] ?? 0))}</span>
            <span className="cot-res-cell cot-res-cell--muted">Por reclamación (claims made)</span>
            <span className="cot-res-cell">{cop(o.deducible)}</span>
            <span className="cot-res-cell">{cop(o.prima)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaPi({ result }: { result: CotizadorResult }) {
  const d = result.pi;
  if (!d) return null;
  return (
    <div className="cot-res-product">
      <div className="cot-res-product-header">Seguro de Responsabilidad Civil Profesional</div>
      <div className="cot-res-table">
        <TableHeader cols={['Límite asegurado', 'Modalidad', 'Deducible', 'Prima bruta anual']} />
        {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
          o.limite ? (
            <div key={i} className="cot-res-row">
              <span className="cot-res-label">{i + 1}</span>
              <span className="cot-res-cell">{cop(o.limite)}</span>
              <span className="cot-res-cell cot-res-cell--muted">Por reclamación (claims made)</span>
              <span className="cot-res-cell">{cop(o.deducible)}</span>
              <span className="cot-res-cell">{cop(o.prima)}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SeccionResumenCotizacion({
  result,
  loading,
  error,
  inputs,
  hasDyo,
  hasCc,
  hasPdysi,
  hasPi,
}: {
  result: CotizadorResult | null;
  loading: boolean;
  error: string | null;
  inputs: CotizadorInputs;
  hasDyo: boolean;
  hasCc: boolean;
  hasPdysi: boolean;
  hasPi: boolean;
}) {
  const hasAny = hasDyo || hasCc || hasPdysi || hasPi;
  if (!hasAny) return null;

  return (
    <div className="cot-res-wrapper">
      <div className="cot-res-section-title">Resumen de Cotizaciones</div>

      <Estado loading={loading} error={error} />

      {result && (
        <>
          {hasDyo   && <TablaDyO   result={result} inputs={inputs} />}
          {hasCc    && <TablaCC    result={result} inputs={inputs} />}
          {hasPdysi && <TablaPdysi result={result} inputs={inputs} />}
          {hasPi    && <TablaPi    result={result} />}
        </>
      )}

      {!result && !loading && !error && (
        <div className="cot-res-estado cot-res-estado--hint">
          Complete los datos de la cotización para ver el resumen.
        </div>
      )}
    </div>
  );
}
