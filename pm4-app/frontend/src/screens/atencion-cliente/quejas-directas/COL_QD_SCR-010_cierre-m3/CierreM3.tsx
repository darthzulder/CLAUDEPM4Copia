import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import RequestFileList from '../../../../components/RequestFileList';
import { resolveFileId } from '../../../../core/useRequestFiles';
import { useCollection, descOf, useSyncDesc } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, SCR010_DEFAULT_ENTITY_TYPE, SCR010_DEFAULT_ENTITY_CODE } from '../fields/fields';
import type { CierreM3FormData } from '../fields/fields';
import SeccionEstadoCierre from './SeccionEstadoCierre';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

// SCR-010 es una pantalla de REVISIÓN/CONFIRMACIÓN del cierre regulatorio M3:
// todos los datos de cierre los calcula el back (ver Excel PQRS, hoja
// "MomentoIII" — cada campo es "Automático" o "Por default"; hoja
// "FormularioCreacionPQRS" sección "Cierre" — todos marcados "Back"). El gestor
// solo revisa lo calculado y dispara el envío a SmartSupervision; no edita
// ningún campo de cierre. Los valores llegan pre-poblados desde PM4 en task.data
// y se reenvían intactos al completar la tarea.

export default function CierreM3() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask, saveDraft } = useTask();

  // Formulario en modo lectura: solo aloja los valores pre-poblados desde PM4
  // para reenviarlos al completar la tarea (no hay campos editables).
  const form = useForm<CierreM3FormData>({
    defaultValues: {
      [QD.strM3ClosureStatus]: '', [QD.strM3ClosureAttempts]: '0', [QD.strLastError]: '',
      [QD.strSfcCode]: '', [QD.strComplaintStatus]: '', [QD.strUpdateDate]: '', [QD.strClosureDate]: '',
      [QD.strFavorability]: '', [QD.strAcceptance]: '', [QD.strMarking]: '', [QD.strExpressComplaint]: '',
      [QD.strFinalReplyPdf]: '', [QD.strFinalReplyAttach]: 'SI',
      [QD.strFraudRelated]: '', [QD.strFraudType]: '', [QD.strFraudModality]: '',
      [QD.strClaimedAmount]: '', [QD.strAcknowledgedAmount]: '',
      [QD.strEntityType]: SCR010_DEFAULT_ENTITY_TYPE, [QD.strEntityCode]: SCR010_DEFAULT_ENTITY_CODE,
    },
  });
  const { control, watch, handleSubmit, reset } = form;

  const objWatch = watch();

  // Catálogos para resolver el CÓDIGO almacenado en PM4 a su descripción legible.
  // El valor guardado no cambia (sigue siendo el código que espera el BPM/SFC).
  const { options: cllComplaintStatus } = useCollection(QD_COLLECTIONS.complaintStatus);
  const { options: cllFavorability } = useCollection(QD_COLLECTIONS.favorability);
  const { options: cllAcceptance } = useCollection(QD_COLLECTIONS.acceptance);
  const { options: cllMarking } = useCollection(QD_COLLECTIONS.marking);
  const { options: cllExpressComplaint } = useCollection(QD_COLLECTIONS.expressComplaint);
  const { options: cllFraudType } = useCollection(QD_COLLECTIONS.fraudType);
  const { options: cllFraudModality } = useCollection(QD_COLLECTIONS.fraudModality);

  // Sincroniza la variable compañera <campo>_desc con la descripción del código guardado.
  // El campo base sigue enviando el CÓDIGO al back/SFC; _desc viaja junto para lectura.
  useSyncDesc(form, QD.strComplaintStatus, cllComplaintStatus);
  useSyncDesc(form, QD.strFavorability, cllFavorability);
  useSyncDesc(form, QD.strAcceptance, cllAcceptance);
  useSyncDesc(form, QD.strMarking, cllMarking);
  useSyncDesc(form, QD.strExpressComplaint, cllExpressComplaint);
  useSyncDesc(form, QD.strFraudType, cllFraudType);
  useSyncDesc(form, QD.strFraudModality, cllFraudModality);

  // Pre-poblamos el formulario con los datos del caso. reset() reemplaza todo el
  // estado, así que TODAS las claves de task.data (incl. los defaults "Back" que
  // no se renderizan) quedan en el form y se reenvían intactas al completar.
  // - El adjunto de respuesta final se fuerza siempre a "SI" (el PDF lo genera el proceso).
  // - Tipo/código de entidad (envío M3 SFC): respetan el valor del back si viene,
  //   si no, se inyectan con su default para que igual viajen y se guarden.
  useEffect(() => {
    if (!task?.data) return;
    const objData = task.data as Partial<CierreM3FormData>;
    reset({
      ...objData,
      [QD.strFinalReplyAttach]: 'SI',
      [QD.strEntityType]: objData[QD.strEntityType] || SCR010_DEFAULT_ENTITY_TYPE,
      [QD.strEntityCode]: objData[QD.strEntityCode] || SCR010_DEFAULT_ENTITY_CODE,
    });
  }, [task, reset]);

  // FLD-165 — el payload trae el id de PM4 del PDF de respuesta final generado.
  const intFinalReplyFileId = resolveFileId(objWatch[QD.strFinalReplyPdf]);

  const blnRejected = objWatch[QD.strM3ClosureStatus] === 'Rechazado (400)';
  const blnFraud = objWatch[QD.strFraudRelated] === 'SI';

  const onSubmit = async (in_objData: CierreM3FormData) => {
    try {
      // Completamos la tarea reenviando los datos calculados en el back.
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
              readOnly
            />
          </div>
          {blnRejected && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>Envío rechazado por SFC.</strong> Revise el error indicado y reenvíe una vez corregido en el back.
            </ZrAlert>
          )}
        </FormSection>

        {/* Sección 2 — Datos de cierre (calculados en el back, solo lectura) */}
        <FormSection title="Datos de Cierre Regulatorio">
          <div className="form-row cols-1">
            <div className="zds-field-wrap">
              <span className="info-bar-label">Estado de la Queja</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {descOf(cllComplaintStatus, objWatch[QD.strComplaintStatus])}
              </div>
            </div>
          </div>

          <div className="form-row cols-2">
            <ZdsInput name={QD.strUpdateDate} control={control} label="Fecha de Actualización" readOnly />
            <ZdsInput name={QD.strClosureDate} control={control} label="Fecha de Cierre" readOnly />
          </div>

          <div className="form-row cols-2">
            <div className="zds-field-wrap">
              <span className="info-bar-label">Favorabilidad</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {descOf(cllFavorability, objWatch[QD.strFavorability])}
              </div>
            </div>
            <div className="zds-field-wrap">
              <span className="info-bar-label">Aceptación</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {descOf(cllAcceptance, objWatch[QD.strAcceptance])}
              </div>
            </div>
          </div>

          <div className="form-row cols-2">
            <div className="zds-field-wrap">
              <span className="info-bar-label">Marcación</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {descOf(cllMarking, objWatch[QD.strMarking])}
              </div>
            </div>
            <div className="zds-field-wrap">
              <span className="info-bar-label">Queja Exprés</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {descOf(cllExpressComplaint, objWatch[QD.strExpressComplaint])}
              </div>
            </div>
          </div>
        </FormSection>

        {/* Sección 3 — Adjunto respuesta final (generado por el proceso) */}
        <FormSection title="Adjunto Respuesta Final al Consumidor">
          <div className="form-row cols-1">
            <div className="zds-field-wrap">
              <span className="info-bar-label">¿Se adjunta PDF de respuesta final?</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {objWatch[QD.strFinalReplyAttach] === 'SI' ? 'Sí' : 'No'}
              </div>
            </div>
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

        {/* Sección 4 — Datos de fraude (condicional, calculados en el back) */}
        <FormSection title="Datos de Fraude">
          <div className="form-row cols-1">
            <div className="zds-field-wrap">
              <span className="info-bar-label">¿Queja relacionada con fraude?</span>
              <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                {blnFraud ? 'Sí' : 'No'}
              </div>
            </div>
          </div>

          {blnFraud && (
            <>
              <div className="form-row cols-2">
                <div className="zds-field-wrap">
                  <span className="info-bar-label">Tipo de Fraude</span>
                  <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                    {descOf(cllFraudType, objWatch[QD.strFraudType])}
                  </div>
                </div>
                <div className="zds-field-wrap">
                  <span className="info-bar-label">Modalidad de Fraude</span>
                  <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>
                    {descOf(cllFraudModality, objWatch[QD.strFraudModality])}
                  </div>
                </div>
              </div>
              <div className="form-row cols-2">
                <ZdsInput name={QD.strClaimedAmount} control={control} label="Monto Reclamado (COP)" readOnly />
                <ZdsInput name={QD.strAcknowledgedAmount} control={control} label="Monto Reconocido (COP)" readOnly />
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
            onClick={() => saveDraft({ ...objWatch } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton
            config="positive"
            onClick={() => { handleSubmit(onSubmit)(); }}
            loading={submitting}
            disabled={submitting}
          >
            {blnRejected ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'}
          </ZrButton>
        </div>
      </form>
    </div>
  );
}
