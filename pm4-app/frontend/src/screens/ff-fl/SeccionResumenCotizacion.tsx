import FormSection from '../../components/FormSection';
import { ZrTable, ZrAlert, ZrLoader } from '../../components/fields/ZdsFields';
import { CotizadorResult, CotizadorInputs } from '../../core/useCotizador';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cop(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return '—';
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(v))}`;
}

// ─── Spinner / error ─────────────────────────────────────────────────────────

function Estado({ loading, warmingUp, error }: { loading: boolean; warmingUp: boolean; error: string | null }) {
  if (warmingUp) return (
    <div className="quote-summary-status">
      <ZrLoader style={{ ['--z-loader--size' as never]: '18px' }} />
      <span>Inicializando servicio de cotización… (puede tardar ~30 segundos)</span>
    </div>
  );
  if (loading) return (
    <div className="quote-summary-status">
      <ZrLoader style={{ ['--z-loader--size' as never]: '18px' }} />
      <span>Calculando cotización…</span>
    </div>
  );
  if (error) return (
    <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al calcular: {error}</ZrAlert>
  );
  return null;
}

// ─── Tablas por producto ─────────────────────────────────────────────────────

function TablaDyO({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.dyo;
  if (!d) return null;
  const lims = [inputs.dyo?.limite1, inputs.dyo?.limite2, inputs.dyo?.limite3];
  return (
    <div className="quote-summary-product">
      <div className="quote-summary-product-header">Seguro de Directores y Administradores (D&amp;O)</div>
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Límite asegurado</th>
              <th>Modalidad</th>
              <th>Prima bruta anual</th>
            </tr>
          </thead>
          <tbody>
            {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(lims[i] ?? 0))}</td>
                <td className="quote-summary-cell quote-summary-cell--muted">Todo y cada reclamo en el agregado anual</td>
                <td className="quote-summary-cell">{cop(o.prima_a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaCC({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.cc;
  if (!d) return null;
  const evts = [inputs.cc?.limite1_evento, inputs.cc?.limite2_evento, inputs.cc?.limite3_evento];
  const agrs = [inputs.cc?.limite1_agregado, inputs.cc?.limite2_agregado, inputs.cc?.limite3_agregado];
  return (
    <div className="quote-summary-product">
      <div className="quote-summary-product-header">Seguro de Crimen Comercial</div>
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Lím. por evento</th>
              <th>Lím. por agregado</th>
              <th>Deducible</th>
              <th>Prima bruta anual</th>
            </tr>
          </thead>
          <tbody>
            {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(evts[i] ?? 0))}</td>
                <td className="quote-summary-cell">{cop(Number(agrs[i] ?? 0))}</td>
                <td className="quote-summary-cell">{cop(o.deducible)}</td>
                <td className="quote-summary-cell">{cop(o.prima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaPdysi({ result, inputs }: { result: CotizadorResult; inputs: CotizadorInputs }) {
  const d = result.pdysi;
  if (!d) return null;
  const lims = [inputs.pdysi?.limite1, inputs.pdysi?.limite2, inputs.pdysi?.limite3];
  return (
    <div className="quote-summary-product">
      <div className="quote-summary-product-header">Seguro de Protección de Datos y Seguridad Informática</div>
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Límite asegurado</th>
              <th>Modalidad</th>
              <th>Prima bruta anual</th>
            </tr>
          </thead>
          <tbody>
            {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(lims[i] ?? 0))}</td>
                <td className="quote-summary-cell quote-summary-cell--muted">Por reclamación (claims made)</td>
                <td className="quote-summary-cell">{cop(o.prima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaPi({ result }: { result: CotizadorResult }) {
  const d = result.pi;
  if (!d) return null;
  return (
    <div className="quote-summary-product">
      <div className="quote-summary-product-header">Seguro de Responsabilidad Civil Profesional</div>
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Límite asegurado</th>
              <th>Modalidad</th>
              <th>Prima bruta anual</th>
            </tr>
          </thead>
          <tbody>
            {([d.opt1, d.opt2, d.opt3] as typeof d.opt1[]).map((o, i) => (
              o.limite ? (
                <tr key={i}>
                  <td className="quote-summary-label">{i + 1}</td>
                  <td className="quote-summary-cell">{cop(o.limite)}</td>
                  <td className="quote-summary-cell quote-summary-cell--muted">Por reclamación (claims made)</td>
                  <td className="quote-summary-cell">{cop(o.prima)}</td>
                </tr>
              ) : null
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SeccionResumenCotizacion({
  result,
  loading,
  warmingUp,
  error,
  inputs,
  hasDyo,
  hasCc,
  hasPdysi,
  hasPi,
}: {
  result: CotizadorResult | null;
  loading: boolean;
  warmingUp: boolean;
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
    <FormSection title="Resumen de Cotizaciones">
      <div className="form-section-body quote-summary-body">

        <Estado loading={loading} warmingUp={warmingUp} error={error} />

        {result && (
          <>
            {hasDyo   && <TablaDyO   result={result} inputs={inputs} />}
            {hasCc    && <TablaCC    result={result} inputs={inputs} />}
            {hasPdysi && <TablaPdysi result={result} inputs={inputs} />}
            {hasPi    && <TablaPi    result={result} />}
          </>
        )}

        {!result && !loading && !error && (
          <div className="quote-summary-status quote-summary-status--hint">
            Complete los datos de la cotización para ver el resumen.
          </div>
        )}

      </div>
    </FormSection>
  );
}
