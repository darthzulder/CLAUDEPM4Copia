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
import { QD, SCR011_DEFAULTS as DEFAULTS, OPTIONS_SI_NO } from '../fields/fields';
import type { RevisionErrorTecnicoProrrogaFormData, AccionErrorTecnicoProrroga } from '../fields/fields';

export default function RevisionErrorTecnicoProrroga() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnShowLog, setBlnShowLog] = useState(false);

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<RevisionErrorTecnicoProrrogaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RevisionErrorTecnicoProrrogaFormData>) });
  }, [task, reset]);

  const err = (in_strField: keyof RevisionErrorTecnicoProrrogaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // Indica si el analista debe ajustar el payload antes de reenviar.
  const blnAdjustPayload = objWatch[QD.strPayloadAdjustNeeded] === 'SI';

  // El script de Momento 3 solo reenvía el payload editado si es un objeto JSON
  // válido; si no lo es lo descarta y reconstruye el body desde los campos del
  // caso. Validamos aquí para que el analista no crea que su edición viajó.
  const blnPayloadJsonOk = (() => {
    if (!blnAdjustPayload) return true;
    try {
      const genParsed: unknown = JSON.parse(objWatch[QD.strPayloadSent] ?? '');
      return !!genParsed && typeof genParsed === 'object' && !Array.isArray(genParsed);
    } catch {
      return false;
    }
  })();

  // RUL-011-01 (🔴 BLOQUEA): causa raíz y corrección obligatorias para autorizar.
  // Se suma el payload: con ajuste marcado, el JSON debe ser válido.
  const blnCanAuthorize =
    !!objWatch[QD.strRootCause]?.trim()
    && !!objWatch[QD.strCorrectionApplied]?.trim()
    && blnPayloadJsonOk;

  // Enviamos la tarea con la accion seleccionada
  const enviarCon = (in_strAction: AccionErrorTecnicoProrroga) => (in_objData: RevisionErrorTecnicoProrrogaFormData) =>
    completeTask({ ...in_objData, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>)
      .catch((excError) => console.error('[RevisionErrorTecnicoProrroga] Error al enviar:', excError));

  // ACT-011-01 Autorizar Reenvío (valida RUL-011-01).
  const onAutorizar = handleSubmit(enviarCon('AUTORIZAR_REENVIO'), scrollToFirstError);
  // ACT-011-02 Escalar a Proveedor (siempre disponible).
  const onEscalar = () => enviarCon('ESCALAR_PROVEEDOR')(objWatch);

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
        title="Revisión Error Técnico Prórroga"      />

      <div className="screen-content">
        <form onSubmit={onAutorizar} noValidate>

          {/* ── S1 · Detalle del Error Técnico — Prórroga (SEC-037, solo lectura) ── */}
          <FormSection
            title="Detalle del Error Técnico — Prórroga"
            color="var(--z-red)"
            action={
              <ZrButton config="link" icon="file-text:line" onClick={() => setBlnShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              El envío de la <strong>solicitud de prórroga</strong> a SmartSupervision falló por un
              error técnico. Revise el detalle, registre la corrección y autorice el reenvío.
              {objWatch[QD.strAttemptNum] && <> — Intento acumulado <strong>#{objWatch[QD.strAttemptNum]}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={QD.strHttpCode} control={control} label="Código HTTP prórroga" readOnly />
              <ZdsInput name={QD.strErrorType} control={control} label="Tipo de Error" readOnly />
              <ZdsInput name={QD.strAttemptNum} control={control} label="Número de intento prórroga" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsInput name={QD.strEndpointCalled} control={control} label="Endpoint Invocado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strApiTechMessage}
                control={control}
                label="Mensaje técnico de la API"
                readOnly
                helpText='Mensaje devuelto por la API — solo lectura. El log técnico completo está en "Ver Log Completo".'
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strPayloadSent}
                control={control}
                label="Payload de prórroga enviado (JSON)"
                readOnly={!blnAdjustPayload}
                helpText={
                  blnAdjustPayload
                    ? 'Ajuste el JSON del body: si difiere del que genera el BPM, se reenviará este.'
                    : 'JSON del payload de prórroga del intento fallido — solo lectura.'
                }
              />
            </div>
          </FormSection>

          {/* ── S2 · Registro de Corrección — Prórroga (SEC-038, editable) ── */}
          <FormSection title="Registro de Corrección — Prórroga">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strRootCause} control={control} label="Causa Raíz"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err(QD.strRootCause)}
              />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strCorrectionApplied} control={control} label="Corrección Aplicada"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err(QD.strCorrectionApplied)}
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
                Edite el <strong>Payload de prórroga enviado (JSON)</strong> en la sección superior
                antes de autorizar: el reenvío usará el payload corregido.
              </ZrAlert>
            )}

            {blnAdjustPayload && !blnPayloadJsonOk && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                El <strong>Payload de prórroga enviado (JSON)</strong> no es un objeto JSON válido.
                Corríjalo para poder autorizar el reenvío — de lo contrario la edición se descartaría
                y se reenviarían los datos del caso sin sus ajustes.
              </ZrAlert>
            )}

            {/* RUL-011-01 / MSG-011-01 — causa y corrección obligatorias. */}
            {!blnCanAuthorize && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe registrar la <strong>causa raíz</strong> y la <strong>corrección aplicada</strong>{' '}
                antes de autorizar el reenvío de la prórroga. {/* MSG-011-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-011-01/02) ── */}
          <ActionBar>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onEscalar}>
              Escalar a Proveedor
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanAuthorize || submitting} loading={submitting}
              onClick={() => { onAutorizar(); }}>
              Autorizar Reenvío Prórroga ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* Ver Log Completo — un único campo con el log que emite el script de
          Momento 2/3 en qd_strCompleteLogAPI. */}
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
