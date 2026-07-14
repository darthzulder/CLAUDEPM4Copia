import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsDate, ZdsRadio, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import RequestFileList from '../../../../components/RequestFileList';
import { resolveFileId } from '../../../../core/useRequestFiles';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO } from '../fields/fields';
import type { CierreM3FormData } from '../fields/fields';
import SeccionEstadoCierre from './SeccionEstadoCierre';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

// El adjunto de respuesta final siempre va marcado en "Sí" y no es editable:
// el PDF lo genera el proceso, no se sube a mano (mismo criterio que SCR-009).
const OPTIONS_SI_NO_READONLY = OPTIONS_SI_NO.map((o) => ({ ...o, disabled: true }));

export default function CierreM3() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();

  // Inicializamos el formulario con los valores por defecto
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = useForm<CierreM3FormData>({
    defaultValues: {
      [QD.strM3ClosureStatus]: '', [QD.strM3ClosureAttempts]: '0', [QD.strLastError]: '',
      [QD.strSfcCode]: '', [QD.strComplaintStatus]: '', [QD.strUpdateDate]: '', [QD.strClosureDate]: '',
      [QD.strFavorability]: '', [QD.strAcceptance]: '', [QD.strMarking]: '', [QD.strExpressComplaint]: '',
      [QD.strFinalReplyPdf]: '', [QD.strNamingValidation]: '', [QD.strFinalReplyAttach]: 'SI',
      [QD.strFraudRelated]: '', [QD.strFraudType]: '', [QD.strClaimedAmount]: '', [QD.strAcknowledgedAmount]: '',
    },
  });

  const objWatch = watch();

  // Cargamos los catalogos de las listas desplegables
  const { options: cllComplaintStatus } = useCollection(QD_COLLECTIONS.complaintStatus);
  const { options: cllFavorability } = useCollection(QD_COLLECTIONS.favorability);
  const { options: cllAcceptance } = useCollection(QD_COLLECTIONS.acceptance);
  const { options: cllMarking } = useCollection(QD_COLLECTIONS.marking);
  const { options: cllExpressComplaint } = useCollection(QD_COLLECTIONS.expressComplaint);
  const { options: cllFraudType } = useCollection(QD_COLLECTIONS.fraudType);

  // Pre-poblamos el formulario con los datos del caso. El adjunto de respuesta
  // final se fuerza siempre a "SI" (el PDF lo genera el proceso).
  useEffect(() => {
    if (task?.data) reset({ ...(task.data as Partial<CierreM3FormData>), [QD.strFinalReplyAttach]: 'SI' });
  }, [task, reset]);

  // FLD-165 — el payload trae el id de PM4 del PDF de respuesta final generado.
  const intFinalReplyFileId = resolveFileId(objWatch[QD.strFinalReplyPdf]);

  // RUL-010-01: fechaActualizacion debe coincidir con fechaCierre
  const blnDatesMatch = !objWatch[QD.strUpdateDate] || !objWatch[QD.strClosureDate] || objWatch[QD.strUpdateDate] === objWatch[QD.strClosureDate];
  // RUL-010-03: todos los obligatorios completos + reglas anteriores
  const arrRequiredFields: (keyof CierreM3FormData)[] = [
    QD.strSfcCode, QD.strComplaintStatus, QD.strUpdateDate, QD.strClosureDate,
    QD.strFavorability, QD.strAcceptance, QD.strMarking, QD.strExpressComplaint, QD.strFinalReplyAttach,
  ];
  const blnAllComplete = arrRequiredFields.every(strField => !!objWatch[strField]);
  const blnCanSubmit = blnDatesMatch && blnAllComplete;

  const blnRejected = objWatch[QD.strM3ClosureStatus] === 'Rechazado (400)';

  const err = (in_strField: keyof CierreM3FormData) => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  const onSubmit = async (in_objData: CierreM3FormData) => {
    if (!blnCanSubmit) return;
    try {
      // Completamos la tarea con los datos del formulario
      await completeTask(in_objData as unknown as Record<string, unknown>);
    } catch (excError) {
      console.error('[CierreM3] Error al enviar:', excError);
    }
  };

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">Error al cargar el formulario: {error}</div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <div className="screen-header">
        <div className="title-block">
          <h1>Cierre Regulatorio Momento 3</h1>
          <div className="subtitle">
            <span>SP3-T01 / SP3-T04 / SP3-T08</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Gestor de Experiencia / Backoffice SFC</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Sección 1 — Estado del envío a SFC */}
        <FormSection title="Estado del Envío a SmartSupervision (SFC)">
          <SeccionEstadoCierre
            estadoCierreM3={objWatch[QD.strM3ClosureStatus]}
            intentosCierreM3={objWatch[QD.strM3ClosureAttempts]}
            ultimoError={objWatch[QD.strLastError]}
          />
          <div className="form-row cols-1">
            <ZdsInput
              name={QD.strSfcCode}
              control={control}
              label="Código SFC / Número de Radicado"
              rules={{ required: 'Campo requerido', maxLength: { value: 100, message: 'Máximo 100 caracteres' } }}
              required
              error={err(QD.strSfcCode)}
            />
          </div>
          {blnRejected && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>Envío rechazado por SFC.</strong> Revise el error indicado, corrija los datos y reenvíe.
            </ZrAlert>
          )}
        </FormSection>

        {/* Sección 2 — Datos de cierre */}
        <FormSection title="Datos de Cierre Regulatorio">
          <div className="form-row cols-1">
            <ZdsSelect
              name={QD.strComplaintStatus}
              control={control}
              label="Estado de la Queja"
              options={cllComplaintStatus}
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strComplaintStatus)}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsDate
              name={QD.strUpdateDate}
              control={control}
              label="Fecha de Actualización"
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strUpdateDate)}
            />
            <ZdsDate
              name={QD.strClosureDate}
              control={control}
              label="Fecha de Cierre"
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strClosureDate)}
            />
          </div>

          {!blnDatesMatch && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La Fecha de Actualización debe coincidir con la Fecha de Cierre (RUL-010-01).
            </ZrAlert>
          )}

          <div className="form-row cols-2">
            <ZdsSelect
              name={QD.strFavorability}
              control={control}
              label="Favorabilidad"
              options={cllFavorability}
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strFavorability)}
            />
            <ZdsSelect
              name={QD.strAcceptance}
              control={control}
              label="Aceptación"
              options={cllAcceptance}
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strAcceptance)}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsSelect
              name={QD.strMarking}
              control={control}
              label="Marcación"
              options={cllMarking}
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strMarking)}
            />
            <ZdsSelect
              name={QD.strExpressComplaint}
              control={control}
              label="Queja Exprés"
              options={cllExpressComplaint}
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strExpressComplaint)}
            />
          </div>
        </FormSection>

        {/* Sección 3 — Adjunto respuesta final */}
        <FormSection title="Adjunto Respuesta Final al Consumidor">
          <div className="form-row cols-1">
            <ZdsRadio
              name={QD.strFinalReplyAttach}
              control={control}
              label="¿Se adjunta PDF de respuesta final?"
              options={OPTIONS_SI_NO_READONLY}
              required
              error={err(QD.strFinalReplyAttach)}
            />
          </div>

          {/* El PDF lo genera el proceso; se muestra en solo lectura (como SCR-009). */}
          <RequestFileList
            requestId={task?.process_request_id ?? null}
            fileIds={[intFinalReplyFileId]}
            label="PDF Respuesta Final (generado)"
            emptyText="Aún no se ha generado el PDF de respuesta final."
            loadingText="Buscando el PDF de respuesta final…"
          />
        </FormSection>

        {/* Sección 4 — Datos de fraude (condicional) */}
        <FormSection title="Datos de Fraude">
          <div className="form-row cols-1">
            <ZdsRadio
              name={QD.strFraudRelated}
              control={control}
              label="¿Queja relacionada con fraude?"
              options={OPTIONS_SI_NO}
              error={err(QD.strFraudRelated)}
            />
          </div>

          {objWatch[QD.strFraudRelated] === 'SI' && (
            <>
              <div className="form-row cols-1">
                <ZdsSelect
                  name={QD.strFraudType}
                  control={control}
                  label="Tipo de Fraude"
                  options={cllFraudType}
                  rules={{ required: 'Campo requerido' }}
                  required
                  error={err(QD.strFraudType)}
                />
              </div>
              <div className="form-row cols-2">
                <ZdsInput
                  name={QD.strClaimedAmount}
                  control={control}
                  label="Monto Reclamado (COP)"
                  rules={{ required: 'Campo requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  required
                  error={err(QD.strClaimedAmount)}
                />
                <ZdsInput
                  name={QD.strAcknowledgedAmount}
                  control={control}
                  label="Monto Reconocido (COP)"
                  rules={{ pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  error={err(QD.strAcknowledgedAmount)}
                />
              </div>
            </>
          )}
        </FormSection>

        {/* Barra de acciones */}
        <div className="actions-bar">
          <ZrButton config="secondary" onClick={() => window.history.back()}>Cancelar</ZrButton>
          <ZrButton
            config="secondary"
            disabled={submitting}
            onClick={() => completeTask({ ...objWatch, _draft: true } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton
            config="positive"
            onClick={() => { handleSubmit(onSubmit)(); }}
            loading={submitting}
            disabled={submitting || !blnCanSubmit}
          >
            {blnRejected ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'}
          </ZrButton>
        </div>
      </form>
    </div>
  );
}
