import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import { useCollection, useSyncDesc } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsSelect, ZdsDate,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import { QD, QD_COLLECTIONS, SCR012_DEFAULTS as DEFAULTS } from '../fields/fields';
import type { ErrorFuncionalProrrogaFormData, AccionErrorFuncionalProrroga } from '../fields/fields';

// Fecha de hoy (ISO YYYY-MM-DD) para el mínimo del calendario y la validación RUL-012-01.
const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function ErrorFuncionalProrroga() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();
  const strToday = hoyISO();

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<ErrorFuncionalProrrogaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Cargamos el catalogo de motivos de prorroga
  const { options: cllExtensionReason } = useCollection(QD_COLLECTIONS.extensionReason);
  useSyncDesc(form, QD.strExtensionReason, cllExtensionReason);

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<ErrorFuncionalProrrogaFormData>) });
  }, [task, reset]);

  const err = (in_strField: keyof ErrorFuncionalProrrogaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // RUL-012-01 — nueva fecha límite debe ser posterior a hoy.
  const blnValidDate = !!objWatch[QD.strNewDeadline] && objWatch[QD.strNewDeadline] > strToday;

  // Habilitamos el reenvio solo si todos los campos obligatorios estan completos
  const blnCanResend =
    !!objWatch[QD.strExtensionReason] && blnValidDate
    && !!objWatch[QD.strExtensionCounter]?.trim() && !!objWatch[QD.strExtensionJustif]?.trim();

  // Enviamos la tarea con la accion seleccionada
  const enviarCon = (in_strAction: AccionErrorFuncionalProrroga) => (in_objData: ErrorFuncionalProrrogaFormData) =>
    completeTask({ ...in_objData, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>)
      .catch((excError) => console.error('[ErrorFuncionalProrroga] Error al enviar:', excError));

  const onReenviar = handleSubmit(enviarCon('REENVIAR'), scrollToFirstError);       // ACT-012-01
  const onCancelar = () => enviarCon('CANCELAR')(objWatch);     // ACT-012-02

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
        title="Corrección Error Funcional Prórroga"
        subtitle={["SP4-T06 · PAN-12", "Gestión de Quejas Directas", "Rol: Analista SAC / Área Responsable"]}
      />

      <div className="screen-content">
        <form onSubmit={onReenviar} noValidate>

          {/* ── S1 · Panel de Error — Prórroga (SEC-039, solo lectura) ── */}
          <FormSection title="Panel de Error — Prórroga" color="var(--z-red)">
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              SmartSupervision <strong>rechazó la solicitud de prórroga (HTTP 400 funcional)</strong>.
              Corrija los campos señalados y reenvíe.
              {objWatch[QD.strExtCurrentAttempt] && <> — Intento actual <strong>#{objWatch[QD.strExtCurrentAttempt]}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={QD.strExtErrorCode} control={control} label="Código de Error SFC Prórroga" readOnly />
              <ZdsInput name={QD.strExtAffectedField} control={control} label="Campo Afectado" readOnly />
              <ZdsInput name={QD.strExtCurrentAttempt} control={control} label="Intento N.° actual" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strExtErrorMessage} control={control} label="Mensaje de Error SFC" readOnly
                helpText="Mensaje literal devuelto por SmartSupervision — solo lectura." />
            </div>
          </FormSection>

          {/* ── S2 · Campos de Prórroga a Corregir (SEC-040, editable) ── */}
          <FormSection title="Campos de Prórroga a Corregir">
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strExtensionReason} control={control} label="Motivo de Prórroga"
                options={cllExtensionReason} required rules={{ required: 'Campo requerido' }}
                error={err(QD.strExtensionReason)}
                helpText="Motivo aceptado por SmartSupervision (CAT-MOTIVO-PRORR)." />
              <ZdsDate name={QD.strNewDeadline} control={control} label="Nueva Fecha Límite"
                min={strToday} required
                rules={{
                  required: 'Campo requerido',
                  validate: (in_strValue: string) => (in_strValue && in_strValue > strToday) || 'La fecha debe ser posterior a hoy',
                }}
                error={err(QD.strNewDeadline)}
                helpText="Nueva fecha de respuesta solicitada (posterior a hoy)." />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={QD.strExtensionCounter} control={control} label="Contador de Prórroga"
                required
                rules={{ required: 'Campo requerido', pattern: { value: /^\d+$/, message: 'Solo dígitos' } }}
                error={err(QD.strExtensionCounter)}
                helpText="N.° de prórroga (1, 2, ...)." />
              <div />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strExtensionJustif} control={control} label="Justificación"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err(QD.strExtensionJustif)}
                helpText="Justificación de la necesidad de prórroga." />
            </div>

            {/* RUL-012-01 / MSG-012-01 — fecha posterior a hoy. */}
            {!!objWatch[QD.strNewDeadline] && !blnValidDate && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                La nueva fecha límite debe ser <strong>posterior a la fecha actual</strong>. {/* MSG-012-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-012-01/02) ── */}
          <ActionBar>
            <ZrButton config="negative" disabled={submitting} loading={submitting} onClick={onCancelar}>
              Cancelar Prórroga
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanResend || submitting} loading={submitting}
              onClick={() => { onReenviar(); }}>
              Reenviar Prórroga ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
