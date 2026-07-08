import FormSection from '../../../components/FormSection';
import { ZrTable, ZrAlert, ZrLoader } from '../../../components/fields/ZdsFields';
import { QuoterResult, QuoterInputs } from '../../../core/useCotizador';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Formateamos un valor numérico como moneda colombiana
function cop(in_dblValue: number | null | undefined): string {
  if (in_dblValue === null || in_dblValue === undefined || in_dblValue === 0) return '—';
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(in_dblValue))}`;
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

function TablaDyO({ result, inputs }: { result: QuoterResult; inputs: QuoterInputs }) {
  const objDyo = result.dyo;
  if (!objDyo) return null;
  // Reunimos los límites elegidos para las tres opciones
  const arrLims = [inputs.dyo?.limite1, inputs.dyo?.limite2, inputs.dyo?.limite3];
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
            {/* Pintamos una fila por cada opción calculada */}
            {([objDyo.opt1, objDyo.opt2, objDyo.opt3] as typeof objDyo.opt1[]).map((objOpt, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(arrLims[i] ?? 0))}</td>
                <td className="quote-summary-cell quote-summary-cell--muted">Todo y cada reclamo en el agregado anual</td>
                <td className="quote-summary-cell">{cop(objOpt.prima_a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaCC({ result, inputs }: { result: QuoterResult; inputs: QuoterInputs }) {
  const objCc = result.cc;
  if (!objCc) return null;
  // Reunimos los límites por evento y por agregado de las tres opciones
  const arrEvts = [inputs.cc?.limite1_evento, inputs.cc?.limite2_evento, inputs.cc?.limite3_evento];
  const arrAgrs = [inputs.cc?.limite1_agregado, inputs.cc?.limite2_agregado, inputs.cc?.limite3_agregado];
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
            {/* Pintamos una fila por cada opción calculada */}
            {([objCc.opt1, objCc.opt2, objCc.opt3] as typeof objCc.opt1[]).map((objOpt, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(arrEvts[i] ?? 0))}</td>
                <td className="quote-summary-cell">{cop(Number(arrAgrs[i] ?? 0))}</td>
                <td className="quote-summary-cell">{cop(objOpt.deducible)}</td>
                <td className="quote-summary-cell">{cop(objOpt.prima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaPdysi({ result, inputs }: { result: QuoterResult; inputs: QuoterInputs }) {
  const objPdysi = result.pdysi;
  if (!objPdysi) return null;
  // Reunimos los límites elegidos para las tres opciones
  const arrLims = [inputs.pdysi?.limite1, inputs.pdysi?.limite2, inputs.pdysi?.limite3];
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
            {/* Pintamos una fila por cada opción calculada */}
            {([objPdysi.opt1, objPdysi.opt2, objPdysi.opt3] as typeof objPdysi.opt1[]).map((objOpt, i) => (
              <tr key={i}>
                <td className="quote-summary-label">{i + 1}</td>
                <td className="quote-summary-cell">{cop(Number(arrLims[i] ?? 0))}</td>
                <td className="quote-summary-cell quote-summary-cell--muted">Por reclamación (claims made)</td>
                <td className="quote-summary-cell">{cop(objOpt.prima)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
    </div>
  );
}

function TablaPi({ result }: { result: QuoterResult }) {
  const objPi = result.pi;
  if (!objPi) return null;
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
            {/* Pintamos solo las opciones que tienen un límite definido */}
            {([objPi.opt1, objPi.opt2, objPi.opt3] as typeof objPi.opt1[]).map((objOpt, i) => (
              objOpt.limite ? (
                <tr key={i}>
                  <td className="quote-summary-label">{i + 1}</td>
                  <td className="quote-summary-cell">{cop(objOpt.limite)}</td>
                  <td className="quote-summary-cell quote-summary-cell--muted">Por reclamación (claims made)</td>
                  <td className="quote-summary-cell">{cop(objOpt.prima)}</td>
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
  result: QuoterResult | null;
  loading: boolean;
  warmingUp: boolean;
  error: string | null;
  inputs: QuoterInputs;
  hasDyo: boolean;
  hasCc: boolean;
  hasPdysi: boolean;
  hasPi: boolean;
}) {
  // No mostramos el resumen si no hay ningún producto seleccionado
  const blnHasAny = hasDyo || hasCc || hasPdysi || hasPi;
  if (!blnHasAny) return null;

  return (
    <FormSection title="Resumen de Cotizaciones">
      <div className="form-section-body quote-summary-body">

        <Estado loading={loading} warmingUp={warmingUp} error={error} />

        {/* Mostramos la tabla de cada producto cuando ya hay resultado */}
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
