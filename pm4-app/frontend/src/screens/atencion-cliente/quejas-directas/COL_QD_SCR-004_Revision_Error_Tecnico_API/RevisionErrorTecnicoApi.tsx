import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsRadio,
  ZrButton, ZrAlert, ZrModal, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import { QD, SCR004_DEFAULTS as DEFAULTS, OPTIONS_SI_NO } from '../fields/fields';
import type { RevisionErrorTecnicoApiFormData, AccionErrorTecnico } from '../fields/fields';

export default function RevisionErrorTecnicoApi() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnShowLog, setBlnShowLog] = useState(false);

  const form = useForm<RevisionErrorTecnicoApiFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) {
      reset({ ...DEFAULTS, ...(task.data as Partial<RevisionErrorTecnicoApiFormData>) });
    }
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof RevisionErrorTecnicoApiFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // RUL-004-01 (🔴 BLOQUEA): causaRaiz o correccionAplicada vacíos ⇒ no se puede autorizar.
  const blnCanAuthorize =
    !!objWatch[QD.strRootCause]?.trim() && !!objWatch[QD.strCorrectionApplied]?.trim();

  // ACT-004-01 / ACT-004-02 — ambos completan la tarea; difieren en la acción registrada.
  const enviar = (in_strAction: AccionErrorTecnico) =>
    completeTask({ ...objWatch, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[RevisionErrorTecnicoApi] Error al enviar:', exc));

  // ACT-004-01 — autorizar el reenvío (valida causa raíz y corrección).
  const onAutorizar = handleSubmit((in_objData) =>
    completeTask({ ...in_objData, [QD.strAction]: 'AUTORIZAR_REENVIO' } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[RevisionErrorTecnicoApi] Error al autorizar:', exc)),
  scrollToFirstError);

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

  // Indica si el analista debe ajustar el payload antes de reenviar.
  const blnAdjustPayload = objWatch[QD.strPayloadAdjustNeeded] === 'SI';

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Revisión Error Técnico API"      />

      <div className="screen-content">
        <form onSubmit={onAutorizar} noValidate>

          {/* ── S1 · Detalle del Error Técnico (solo lectura) ── */}
          <FormSection
            title="Detalle del Error Técnico"
            color="var(--z-red)"
            action={
              <ZrButton config="link" icon="file-text:line" onClick={() => setBlnShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La integración con SmartSupervision <strong>falló por un error técnico</strong> tras
              varios intentos. Revise el detalle, registre la corrección y autorice el reenvío.
              {objWatch[QD.strAttemptNum] && <> — Intento acumulado <strong>#{objWatch[QD.strAttemptNum]}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={QD.strHttpCode} control={control} label="Código HTTP" readOnly />
              <ZdsInput name={QD.strErrorType} control={control} label="Tipo de Error" readOnly />
              <ZdsInput name={QD.strAttemptNum} control={control} label="Número de Intento Acumulado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsInput name={QD.strEndpointCalled} control={control} label="Endpoint Invocado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strApiTechMessage}
                control={control}
                label="Mensaje Técnico de la API"
                readOnly
                helpText='Mensaje devuelto por la API — solo lectura. El log técnico completo está en "Ver Log Completo".'
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strPayloadSent}
                control={control}
                label="Payload Enviado (JSON)"
                readOnly={!blnAdjustPayload}
                helpText={
                  blnAdjustPayload
                    ? 'Ajuste el JSON del payload que se reenviará a SmartSupervision.'
                    : 'JSON del payload del intento fallido — solo lectura.'
                }
              />
            </div>
          </FormSection>

          {/* ── S2 · Registro de Corrección Técnica (editable) ── */}
          <FormSection title="Registro de Corrección Técnica">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strRootCause}
                control={control}
                label="Causa Raíz Identificada"
                required
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                maxLength={2000}
                error={isSubmitted ? err(QD.strRootCause) : undefined}
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strCorrectionApplied}
                control={control}
                label="Corrección Aplicada"
                required
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                maxLength={2000}
                error={isSubmitted ? err(QD.strCorrectionApplied) : undefined}
              />
            </div>

            <div className="form-row cols-1">
              <ZdsRadio
                label="¿Requiere ajuste en payload?"
                name={QD.strPayloadAdjustNeeded}
                control={control}
                options={OPTIONS_SI_NO}
                inline
                rules={{ required: 'Campo requerido' }}
                required
                error={err(QD.strPayloadAdjustNeeded)}
              />
            </div>

            {blnAdjustPayload && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Edite el <strong>Payload Enviado (JSON)</strong> en la sección superior antes de
                autorizar: el reenvío usará el payload corregido.
              </ZrAlert>
            )}

            {!blnCanAuthorize && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe registrar la <strong>causa raíz</strong> y la <strong>corrección aplicada</strong>{' '}
                antes de autorizar el reenvío. {/* MSG-004-01 / RUL-004-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-004-01 / ACT-004-02) ── */}
          <ActionBar>
            <ZrButton
              config="secondary"
              loading={submitting}
              disabled={submitting}
              onClick={() => enviar('ESCALAR_PROVEEDOR')}
            >
              Escalar a Proveedor
            </ZrButton>
            <ZrButton
              config="positive"
              loading={submitting}
              disabled={submitting || !blnCanAuthorize}
              onClick={() => { onAutorizar(); }}
            >
              Autorizar Reenvío ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-004-03 · Ver Log Completo — un único campo con el log que emite el
          script de Momento 3 en qd_strCompleteLogAPI. */}
      {blnShowLog && (
        <ZrModal model={blnShowLog} onChange={(open: boolean) => setBlnShowLog(open)}>
          <div className="modal-wide">
            <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
              Log completo del error técnico
            </h3>
            <div className="modal-scroll-body">
              <ZdsTextarea name={QD.strCompleteLogAPI} control={control} label="Log Completo" readOnly />
            </div>
            <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
              <ZrButton config="secondary:s" onClick={() => setBlnShowLog(false)}>Cerrar</ZrButton>
            </div>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
