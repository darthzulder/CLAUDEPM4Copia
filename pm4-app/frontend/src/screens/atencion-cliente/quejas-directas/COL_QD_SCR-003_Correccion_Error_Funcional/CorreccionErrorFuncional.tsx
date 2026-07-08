import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea,
  ZrButton, ZrAlert, ZrModal, ZrLoader, ZrTable,
} from '../../../../components/fields/ZdsFields';
import { QD, SCR003_DEFAULTS as DEFAULTS, SCR003_UMBRAL_INTENTOS as UMBRAL_INTENTOS } from '../campos/fields';
import type { CorreccionErrorFuncionalFormData, AccionErrorFuncional } from '../campos/fields';

export default function CorreccionErrorFuncional() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnShowLog, setBlnShowLog] = useState(false);

  const form = useForm<CorreccionErrorFuncionalFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) {
      reset({ ...DEFAULTS, ...(task.data as Partial<CorreccionErrorFuncionalFormData>) });
    }
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof CorreccionErrorFuncionalFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // RUL-003-01 (🔴 BLOQUEA): el campo señalado debe MODIFICARSE antes de reenviar.
  // "Modificado" = no vacío y distinto del valor rechazado original (FLD-042).
  const strCorrection = (objWatch[QD.strFieldCorrection] ?? '').trim();
  const strOriginalValue = (objWatch[QD.strRejectedValue] ?? '').trim();
  const blnFieldModified = strCorrection !== '' && strCorrection !== strOriginalValue;

  // RUL-003-02 (info): a partir de UMBRAL_INTENTOS sugerir escalamiento técnico.
  const intAttempts = Number.parseInt(objWatch[QD.strM1M2AttemptNum] ?? '', 10);
  const blnMultipleAttempts = Number.isFinite(intAttempts) && intAttempts >= UMBRAL_INTENTOS;

  // Lista de intentos previos del caso.
  const lstHistory = Array.isArray(objWatch[QD.lstAttemptHistory]) ? objWatch[QD.lstAttemptHistory] : [];

  // ACT-003-02 — escalar a soporte técnico (siempre disponible; no requiere corrección).
  const onEscalar = () =>
    completeTask({ ...objWatch, [QD.strAction]: 'ESCALAR_SOPORTE' as AccionErrorFuncional } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[CorreccionErrorFuncional] Error al escalar:', exc));

  // ACT-003-01 — corregir y reenviar (valida campo obligatorio + modificación).
  const onReenviar = handleSubmit((in_objData) =>
    completeTask({ ...in_objData, [QD.strAction]: 'CORREGIR_REENVIAR' as AccionErrorFuncional } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[CorreccionErrorFuncional] Error al reenviar:', exc)),
  );

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
        title="Corrección Error Funcional M1/M2"
        subtitle={["SP1-T05", "Gestión de Quejas Directas", "Rol: Gestor de Experiencia"]}
      />

      <div className="screen-content">
        <form onSubmit={onReenviar} noValidate>

          {/* ── S1 · Panel de Error SmartSupervision (solo lectura) ── */}
          <FormSection
            title="Panel de Error SmartSupervision"
            color="var(--z-red)"
            action={
              <ZrButton config="link" icon="file-text:line" onClick={() => setBlnShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              SmartSupervision <strong>rechazó la radicación (HTTP 400 funcional)</strong> por datos
              inválidos. Corrija únicamente el campo señalado y reenvíe — no es necesario navegar por
              el formulario completo.
              {objWatch[QD.strM1M2AttemptNum] && <> Intento actual <strong>#{objWatch[QD.strM1M2AttemptNum]}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={QD.strSfcErrorCode} control={control} label="Código de Error SFC" readOnly />
              <ZdsInput name={QD.strAffectedField} control={control} label="Campo Afectado" readOnly />
              <ZdsInput name={QD.strRejectedValue} control={control} label="Valor Rechazado" readOnly />
            </div>

            <div className="form-row cols-2">
              <ZdsInput name={QD.strM1M2AttemptNum} control={control} label="Intento N.° actual (M1/M2)" readOnly />
              <ZdsInput name={QD.strRejectionDate} control={control} label="Fecha/Hora del rechazo" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strSfcErrorMessage}
                control={control}
                label="Mensaje de Error SFC"
                readOnly
                helpText="Mensaje literal devuelto por SmartSupervision — solo lectura."
              />
            </div>

            {/* RUL-003-02 / MSG-003-02 — múltiples intentos: sugerir escalamiento. */}
            {blnMultipleAttempts && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Ha intentado <strong>{objWatch[QD.strM1M2AttemptNum]}</strong> veces. Si el problema persiste,
                considere <strong>escalar a soporte técnico</strong>. {/* MSG-003-02 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── S2 · Campo a Corregir (editable) ── */}
          <FormSection title="Campo a Corregir">
            <div className="form-row cols-1">
              <ZdsInput
                name={QD.strFieldCorrection}
                control={control}
                label={objWatch[QD.strAffectedField] ? `Corrección — ${objWatch[QD.strAffectedField]}` : 'Campo específico en corrección'}
                required
                rules={{ required: 'Campo requerido' }}
                error={err(QD.strFieldCorrection)}
                helpText="Edite solo el campo señalado por SmartSupervision. No el formulario completo."
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strCorrectionJustif}
                control={control}
                label="Justificación de la corrección"
                maxLength={2000}
                helpText="Comentario opcional del gestor sobre el ajuste aplicado."
              />
            </div>

            {/* RUL-003-01 / MSG-003-01 — bloquea reenvío si el campo no fue modificado. */}
            {!blnFieldModified && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe <strong>modificar el campo señalado</strong> antes de reenviar a
                SmartSupervision. {/* MSG-003-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── S3 · Historial de Intentos (solo lectura) ── */}
          <FormSection title="Historial de Intentos">
            <ZrTable zebra>
              <table>
                <thead>
                  <tr>
                    <th>Intento</th>
                    <th>Fecha</th>
                    <th>Campo afectado</th>
                    <th>Código error</th>
                  </tr>
                </thead>
                <tbody>
                  {lstHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="record-empty">Sin intentos anteriores registrados</td>
                    </tr>
                  ) : (
                    lstHistory.map((objRow, intIndex) => (
                      <tr key={intIndex}>
                        <td>{objRow.intento}</td>
                        <td>{objRow.fecha}</td>
                        <td>{objRow.campoAfectado}</td>
                        <td>{objRow.codigoError}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ZrTable>
          </FormSection>

          {/* ── Acciones (ACT-003-01 / ACT-003-02) ── */}
          <ActionBar>
            <ZrButton
              config="secondary"
              loading={submitting}
              disabled={submitting}
              onClick={onEscalar}
            >
              Escalar a Soporte Técnico
            </ZrButton>
            <ZrButton
              config="positive"
              loading={submitting}
              disabled={submitting || !blnFieldModified}
              onClick={() => { onReenviar(); }}
            >
              Corregir y Reenviar ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-003-03 · Ver Log Completo */}
      {blnShowLog && (
        <ZrModal model={blnShowLog} onChange={(open: boolean) => setBlnShowLog(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Log completo del rechazo funcional
          </h3>
          <ZdsInput name={QD.strSfcErrorCode} control={control} label="Código de Error SFC" readOnly />
          <ZdsInput name={QD.strAffectedField} control={control} label="Campo Afectado" readOnly />
          <ZdsInput name={QD.strRejectedValue} control={control} label="Valor Rechazado" readOnly />
          <ZdsTextarea name={QD.strSfcErrorMessage} control={control} label="Mensaje de Error SFC" readOnly />
          <ZdsInput name={QD.strRejectionDate} control={control} label="Fecha/Hora del rechazo" readOnly />
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setBlnShowLog(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
