import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea,
  ZrButton, ZrAlert, ZrModal, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  DEFAULTS, SLA_UMBRAL_CRITICO,
  type RevisionRespuestaSacFormData, type AccionRevisionSAC, type SoporteAdjunto,
} from './variables';

export default function RevisionRespuestaSac() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [showVistaPrevia, setShowVistaPrevia] = useState(false);

  const form = useForm<RevisionRespuestaSacFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, setError,
    formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RevisionRespuestaSacFormData>) });
  }, [task, reset]);

  const err = (name: keyof RevisionRespuestaSacFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-008-02 — SLA crítico: banner rojo si slaRestante <= 3.
  const sla = Number.parseInt(w.qd_slaRestante ?? '', 10);
  const slaCritico = Number.isFinite(sla) && sla <= SLA_UMBRAL_CRITICO;

  // RUL-008-01 — observaciones obligatorias para devolver.
  const puedeDevolver = !!w.qd_observacionesSAC?.trim();

  const adjuntos: SoporteAdjunto[] = Array.isArray(w.qd_adjuntosSoporte) ? w.qd_adjuntosSoporte : [];

  const enviarCon = (accion: AccionRevisionSAC) => () =>
    completeTask({ ...w, qd_accion: accion } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[RevisionRespuestaSac] Error al enviar:', e));

  // ACT-008-01 Aprobar · ACT-008-03 Reasignar (no requieren observaciones).
  const onAprobar = enviarCon('APROBAR');
  const onReasignar = enviarCon('REASIGNAR');

  // ACT-008-02 Devolver con Observaciones (RUL-008-01: observaciones obligatorias).
  const onDevolver = handleSubmit(() => {
    if (!puedeDevolver) {
      setError('qd_observacionesSAC', { type: 'required', message: 'Campo requerido' });
      return;
    }
    enviarCon('DEVOLVER')();
  });

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  }
  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
          Error al cargar el formulario: {error}
        </ZrAlert>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Revisión Respuesta SAC"
        subtitle={["SP2-T04 · PAN-08", "Gestión de Quejas Directas", "Rol: Analista SAC"]}
      />

      <div className="screen-content">
        {/* RUL-008-02 / MSG-008-02 — banner SLA crítico. */}
        {slaCritico && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            ⚠ El caso tiene <strong>{w.qd_slaRestante}</strong> día(s) hábil(es). Priorice la
            revisión. {/* MSG-008-02 */}
          </ZrAlert>
        )}

        <form onSubmit={onDevolver} noValidate>

          {/* ── S1 · Contexto del Caso (SEC-025, solo lectura) ── */}
          <FormSection title="Contexto del Caso">
            <div className="form-row cols-3">
              <ZdsInput name="qd_idCasoSFC" control={control} label="ID Caso / Código SFC" readOnly />
              <ZdsInput name="qd_slaRestante" control={control} label="SLA: Días hábiles restantes" readOnly />
              <ZdsInput name="qd_versionRevision" control={control} label="Versión bajo revisión" readOnly />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_areaResponsable" control={control} label="Área Responsable" readOnly />
              <ZdsInput name="qd_fechaElaboracion" control={control} label="Fecha de elaboración del borrador" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Respuesta del Área (SEC-026, solo lectura) ── */}
          <FormSection title="Respuesta del Área">
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_respuestaCliente" control={control} label="Respuesta al Cliente" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_accionesTomadas" control={control} label="Acciones Tomadas" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsInput name="qd_reconocimiento" control={control} label="¿Reconocimiento al cliente?" readOnly />
            </div>

            {/* FLD-130 — soportes internos adjuntos (solo visualización). */}
            <div className="field-wrap">
              <span className="form-label">Soportes internos adjuntos</span>
              {adjuntos.length === 0 ? (
                <span className="field-hint">Sin soportes adjuntos.</span>
              ) : (
                <div z-flex="col:50">
                  {adjuntos.map((a, i) => (
                    <span key={i} className="file-name-chip">{a.nombre}</span>
                  ))}
                </div>
              )}
            </div>
          </FormSection>

          {/* ── S3 · Decisión del Analista SAC (SEC-027) ── */}
          <FormSection title="Decisión del Analista SAC">
            <div className="form-row cols-1">
              <ZdsTextarea
                name="qd_observacionesSAC" control={control} label="Observaciones SAC"
                maxLength={2000} error={err('qd_observacionesSAC')}
                helpText="Obligatorio al devolver; opcional al aprobar. Se envía al área responsable."
              />
            </div>

            {/* RUL-008-01 / MSG-008-01 — observaciones obligatorias para devolver. */}
            {!puedeDevolver && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe documentar las <strong>observaciones</strong> para poder devolver la respuesta al
                área responsable. {/* MSG-008-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-008-01..04) ── */}
          <ActionBar>
            <ZrButton config="secondary" onClick={() => setShowVistaPrevia(true)}>
              Vista Previa Respuesta Final
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onReasignar}>
              Reasignar Caso
            </ZrButton>
            <ZrButton config="negative" disabled={!puedeDevolver || submitting} loading={submitting}
              onClick={() => { onDevolver(); }}>
              Devolver con Observaciones
            </ZrButton>
            <ZrButton config="positive" disabled={submitting} loading={submitting} onClick={onAprobar}>
              Aprobar Respuesta ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-008-04 · Vista Previa Respuesta Final */}
      {showVistaPrevia && (
        <ZrModal model={showVistaPrevia} onChange={(open: boolean) => setShowVistaPrevia(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Vista previa — carta de respuesta final
          </h3>
          <p className="subsection-note">Caso {w.qd_idCasoSFC} · Versión {w.qd_versionRevision}</p>
          <p style={{ font: 'var(--zf-cap-14)', whiteSpace: 'pre-wrap' }}>
            {w.qd_respuestaCliente || 'Sin respuesta redactada.'}
          </p>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setShowVistaPrevia(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
