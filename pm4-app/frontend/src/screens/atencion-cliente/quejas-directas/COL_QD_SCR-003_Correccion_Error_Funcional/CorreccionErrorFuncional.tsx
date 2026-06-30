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
import {
  DEFAULTS, UMBRAL_INTENTOS,
  CorreccionErrorFuncionalFormData, AccionErrorFuncional,
} from './variables';

export default function CorreccionErrorFuncional() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [showLog, setShowLog] = useState(false);

  const form = useForm<CorreccionErrorFuncionalFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({ ...DEFAULTS, ...(task.data as Partial<CorreccionErrorFuncionalFormData>) });
    }
  }, [task, reset]);

  const err = (name: keyof CorreccionErrorFuncionalFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-003-01 (🔴 BLOQUEA): el campo señalado debe MODIFICARSE antes de reenviar.
  // "Modificado" = no vacío y distinto del valor rechazado original (FLD-042).
  const correccion = (w.ef_campoCorreccion ?? '').trim();
  const valorOriginal = (w.ef_valorRechazado ?? '').trim();
  const campoModificado = correccion !== '' && correccion !== valorOriginal;

  // RUL-003-02 (info): a partir de UMBRAL_INTENTOS sugerir escalamiento técnico.
  const intentos = Number.parseInt(w.ef_numeroIntento ?? '', 10);
  const multiplesIntentos = Number.isFinite(intentos) && intentos >= UMBRAL_INTENTOS;

  const historial = Array.isArray(w.ef_historialIntentos) ? w.ef_historialIntentos : [];

  // ACT-003-02 — escalar a soporte técnico (siempre disponible; no requiere corrección).
  const onEscalar = () =>
    completeTask({ ...w, ef_accion: 'ESCALAR_SOPORTE' as AccionErrorFuncional } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[CorreccionErrorFuncional] Error al escalar:', e));

  // ACT-003-01 — corregir y reenviar (valida campo obligatorio + modificación).
  const onReenviar = handleSubmit((data) =>
    completeTask({ ...data, ef_accion: 'CORREGIR_REENVIAR' as AccionErrorFuncional } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[CorreccionErrorFuncional] Error al reenviar:', e)),
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
              <ZrButton config="link" icon="file-text:line" onClick={() => setShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              SmartSupervision <strong>rechazó la radicación (HTTP 400 funcional)</strong> por datos
              inválidos. Corrija únicamente el campo señalado y reenvíe — no es necesario navegar por
              el formulario completo.
              {w.ef_numeroIntento && <> Intento actual <strong>#{w.ef_numeroIntento}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name="ef_codigoErrorSFC" control={control} label="Código de Error SFC" readOnly />
              <ZdsInput name="ef_campoAfectado" control={control} label="Campo Afectado" readOnly />
              <ZdsInput name="ef_valorRechazado" control={control} label="Valor Rechazado" readOnly />
            </div>

            <div className="form-row cols-2">
              <ZdsInput name="ef_numeroIntento" control={control} label="Intento N.° actual (M1/M2)" readOnly />
              <ZdsInput name="ef_fechaRechazo" control={control} label="Fecha/Hora del rechazo" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name="ef_mensajeErrorSFC"
                control={control}
                label="Mensaje de Error SFC"
                readOnly
                helpText="Mensaje literal devuelto por SmartSupervision — solo lectura."
              />
            </div>

            {/* RUL-003-02 / MSG-003-02 — múltiples intentos: sugerir escalamiento. */}
            {multiplesIntentos && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Ha intentado <strong>{w.ef_numeroIntento}</strong> veces. Si el problema persiste,
                considere <strong>escalar a soporte técnico</strong>. {/* MSG-003-02 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── S2 · Campo a Corregir (editable) ── */}
          <FormSection title="Campo a Corregir">
            <div className="form-row cols-1">
              <ZdsInput
                name="ef_campoCorreccion"
                control={control}
                label={w.ef_campoAfectado ? `Corrección — ${w.ef_campoAfectado}` : 'Campo específico en corrección'}
                required
                rules={{ required: 'Campo requerido' }}
                error={err('ef_campoCorreccion')}
                helpText="Edite solo el campo señalado por SmartSupervision. No el formulario completo."
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name="ef_justificacionCorreccion"
                control={control}
                label="Justificación de la corrección"
                maxLength={2000}
                helpText="Comentario opcional del gestor sobre el ajuste aplicado."
              />
            </div>

            {/* RUL-003-01 / MSG-003-01 — bloquea reenvío si el campo no fue modificado. */}
            {!campoModificado && (
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
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="record-empty">Sin intentos anteriores registrados</td>
                    </tr>
                  ) : (
                    historial.map((row, i) => (
                      <tr key={i}>
                        <td>{row.intento}</td>
                        <td>{row.fecha}</td>
                        <td>{row.campoAfectado}</td>
                        <td>{row.codigoError}</td>
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
              disabled={submitting || !campoModificado}
              onClick={() => { onReenviar(); }}
            >
              Corregir y Reenviar ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-003-03 · Ver Log Completo */}
      {showLog && (
        <ZrModal model={showLog} onChange={(open: boolean) => setShowLog(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Log completo del rechazo funcional
          </h3>
          <ZdsInput name="ef_codigoErrorSFC" control={control} label="Código de Error SFC" readOnly />
          <ZdsInput name="ef_campoAfectado" control={control} label="Campo Afectado" readOnly />
          <ZdsInput name="ef_valorRechazado" control={control} label="Valor Rechazado" readOnly />
          <ZdsTextarea name="ef_mensajeErrorSFC" control={control} label="Mensaje de Error SFC" readOnly />
          <ZdsInput name="ef_fechaRechazo" control={control} label="Fecha/Hora del rechazo" readOnly />
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setShowLog(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
