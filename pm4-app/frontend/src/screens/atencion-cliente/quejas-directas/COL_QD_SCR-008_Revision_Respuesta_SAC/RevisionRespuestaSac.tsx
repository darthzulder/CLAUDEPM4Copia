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
import { QD, SCR008_DEFAULTS as DEFAULTS, SCR008_SLA_UMBRAL_CRITICO as SLA_UMBRAL_CRITICO } from '../fields/fields';
import type { RevisionRespuestaSacFormData, AccionRevisionSAC } from '../fields/fields';
import type { SoporteAdjunto } from '../fields/types';

export default function RevisionRespuestaSac() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();
  // Controlamos la visibilidad de la vista previa
  const [blnShowPreview, setBlnShowPreview] = useState(false);

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<RevisionRespuestaSacFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, setError,
    formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RevisionRespuestaSacFormData>) });
  }, [task, reset]);

  const err = (in_strField: keyof RevisionRespuestaSacFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // RUL-008-02 — SLA crítico: banner rojo si slaRestante <= 3.
  const intSla = Number.parseInt(objWatch[QD.strSlaAssigned] ?? '', 10);
  const blnSlaCritical = Number.isFinite(intSla) && intSla <= SLA_UMBRAL_CRITICO;

  // RUL-008-01 — observaciones obligatorias para devolver.
  const blnCanReturn = !!objWatch[QD.strSacRemarks]?.trim();

  // Normalizamos la lista de soportes adjuntos
  const lstAttachments: SoporteAdjunto[] = Array.isArray(objWatch[QD.lstSupportAttach]) ? objWatch[QD.lstSupportAttach] : [];

  // Enviamos la tarea con la accion seleccionada
  const enviarCon = (in_strAction: AccionRevisionSAC) => () =>
    completeTask({ ...objWatch, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>)
      .catch((excError) => console.error('[RevisionRespuestaSac] Error al enviar:', excError));

  // ACT-008-01 Aprobar · ACT-008-03 Reasignar (no requieren observaciones).
  const onAprobar = enviarCon('APROBAR');
  const onReasignar = enviarCon('REASIGNAR');

  // ACT-008-02 Devolver con Observaciones (RUL-008-01: observaciones obligatorias).
  const onDevolver = handleSubmit(() => {
    if (!blnCanReturn) {
      setError(QD.strSacRemarks, { type: 'required', message: 'Campo requerido' });
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
        {blnSlaCritical && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            ⚠ El caso tiene <strong>{objWatch[QD.strSlaAssigned]}</strong> día(s) hábil(es). Priorice la
            revisión. {/* MSG-008-02 */}
          </ZrAlert>
        )}

        <form onSubmit={onDevolver} noValidate>

          {/* ── S1 · Contexto del Caso (SEC-025, solo lectura) ── */}
          <FormSection title="Contexto del Caso">
            <div className="form-row cols-3">
              <ZdsInput name={QD.strSfcCode} control={control} label="ID Caso / Código SFC" readOnly />
              <ZdsInput name={QD.strSlaAssigned} control={control} label="SLA: Días hábiles restantes" readOnly />
              <ZdsInput name={QD.strRevisionVersion} control={control} label="Versión bajo revisión" readOnly />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={QD.strAssigneeArea} control={control} label="Área Responsable" readOnly />
              <ZdsInput name={QD.strDraftDate} control={control} label="Fecha de elaboración del borrador" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Respuesta del Área (SEC-026, solo lectura) ── */}
          <FormSection title="Respuesta del Área">
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strClientResponse} control={control} label="Respuesta al Cliente" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strActionsTaken} control={control} label="Acciones Tomadas" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsInput name={QD.strAcknowledgment} control={control} label="¿Reconocimiento al cliente?" readOnly />
            </div>

            {/* FLD-130 — soportes internos adjuntos (solo visualización). */}
            <div className="field-wrap">
              <span className="form-label">Soportes internos adjuntos</span>
              {lstAttachments.length === 0 ? (
                <span className="field-hint">Sin soportes adjuntos.</span>
              ) : (
                <div z-flex="col:50">
                  {lstAttachments.map((objSupport, intIndex) => (
                    <span key={intIndex} className="file-name-chip">{objSupport.nombre}</span>
                  ))}
                </div>
              )}
            </div>
          </FormSection>

          {/* ── S3 · Decisión del Analista SAC (SEC-027) ── */}
          <FormSection title="Decisión del Analista SAC">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strSacRemarks} control={control} label="Observaciones SAC"
                maxLength={2000} error={err(QD.strSacRemarks)}
                helpText="Obligatorio al devolver; opcional al aprobar. Se envía al área responsable."
              />
            </div>

            {/* RUL-008-01 / MSG-008-01 — observaciones obligatorias para devolver. */}
            {!blnCanReturn && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe documentar las <strong>observaciones</strong> para poder devolver la respuesta al
                área responsable. {/* MSG-008-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-008-01..04) ── */}
          <ActionBar>
            <ZrButton config="secondary" onClick={() => setBlnShowPreview(true)}>
              Vista Previa Respuesta Final
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onReasignar}>
              Reasignar Caso
            </ZrButton>
            <ZrButton config="negative" disabled={!blnCanReturn || submitting} loading={submitting}
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
      {blnShowPreview && (
        <ZrModal model={blnShowPreview} onChange={(in_blnOpen: boolean) => setBlnShowPreview(in_blnOpen)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Vista previa — carta de respuesta final
          </h3>
          <p className="subsection-note">Caso {objWatch[QD.strSfcCode]} · Versión {objWatch[QD.strRevisionVersion]}</p>
          <p style={{ font: 'var(--zf-cap-14)', whiteSpace: 'pre-wrap' }}>
            {objWatch[QD.strClientResponse] || 'Sin respuesta redactada.'}
          </p>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setBlnShowPreview(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
