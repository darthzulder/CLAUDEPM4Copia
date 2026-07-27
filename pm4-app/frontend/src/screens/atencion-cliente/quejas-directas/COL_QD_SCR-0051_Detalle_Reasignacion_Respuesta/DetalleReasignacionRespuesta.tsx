import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import { pm4TasksUrl } from '../../../../core/useToken';
import ScreenHeader from '../../../../components/ScreenHeader';
import InfoBar from '../../../../components/InfoBar';
import { ActionBar } from '../../../../components/ActionBar';
import { ZrButton, ZrAlert, ZrModal, ZrLoader, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import PreviewModal from '../../../../components/PreviewModal';
import pm4 from '../../../../api/pm4Client';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, SCR0051_DEFAULTS as DEFAULTS, SCR0051_SLA_UMBRAL_PRORROGA as SLA_UMBRAL_PRORROGA } from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData, AccionFlujoCombinado } from '../fields/fields';
import SeccionDetalleCaso, { estadoVariant } from './SeccionDetalleCaso';
import SeccionAsignacion from './SeccionAsignacion';
import SeccionRespuesta from './SeccionRespuesta';
import { buildRespuestaFinalHtml, fillRespuestaFinalHtml } from './respuestaFinalTemplate';

// Correos de la colección 46 (Mails BPM) para la respuesta final. La favorabilidad
// (qd_strFavorability) decide cuál: '1' = a favor del Cliente ⇒ "09 … queja procede";
// '3' = a favor de la Compañía ⇒ "10 … queja no procede".
const EMAIL_TPL_PROCEDE_PREFIX = '09';
const EMAIL_TPL_NO_PROCEDE_PREFIX = '10';

export default function DetalleReasignacionRespuesta() {
  const { task, loading, error, submitting, completeTask, saveDraft } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [blnShowExpediente, setBlnShowExpediente] = useState(false);
  const [blnShowPreview, setBlnShowPreview] = useState(false);

  const form = useForm<DetalleReasignacionRespuestaFormData>({ defaultValues: DEFAULTS });
  const { watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<DetalleReasignacionRespuestaFormData>) });
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof DetalleReasignacionRespuestaFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // RUL-0051-03 — SLA crítico: habilita prórroga y banner rojo si slaRestante <= 2.
  const intSla = Number.parseInt(objWatch[QD.strSlaAssigned] ?? '', 10);
  const blnSlaCritical = Number.isFinite(intSla) && intSla <= SLA_UMBRAL_PRORROGA;

  // Días restantes del SLA: PM4 los expone en `timeLeft` (nivel raíz de la tarea),
  // no es un campo del formulario. Puede llegar como number o string.
  const varTimeLeft = (task?.data as Record<string, unknown> | undefined)?.timeLeft;
  const intTimeLeft = Number.parseInt(String(varTimeLeft ?? ''), 10);
  const blnHasTimeLeft = Number.isFinite(intTimeLeft);

  // Datos del consumidor derivados de los campos granulares producidos por SCR-000.
  const strName = (objWatch[QD.strCompanyName] || `${objWatch[QD.strFirstName] ?? ''} ${objWatch[QD.strLastName] ?? ''}`).trim();
  // Mostramos el texto del tipo de identificación (companion _desc) en vez del código; fallback al código.
  const strIdTypeDesc = (objWatch as Record<string, unknown>)[`${QD.strIdType}_desc`] as string | undefined;
  const strIdentification = `${strIdTypeDesc || objWatch[QD.strIdType] || ''} ${objWatch[QD.strIdNumber] ?? ''}`.trim();

  // Plantillas HTML de correos BPM (colección 46). La vista previa elige la fila 09/10
  // según la favorabilidad; se rellena con los datos del caso.
  const { options: cllEmailTpl } = useCollection(QD_COLLECTIONS.emailTemplates);

  // ACT-0051-05 — Vista previa: obtenemos la carta de respuesta (HTML del correo) de la
  // colección 46 de PM4 y la servimos como blob a PreviewModal (mismo visor ancho que el
  // resto de vistas previas). Se construye al abrir con la foto actual del formulario y se
  // revoca al cerrar. Si la colección aún no cargó o no trae la fila, cae a la plantilla local.
  const [strPreviewUrl, setStrPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blnShowPreview) return;
    const objData = form.getValues();
    const objVars = {
      tipo: objData[QD.strRequestType] || 'queja',
      tipoDesc: (objData as Record<string, unknown>)[`${QD.strRequestType}_desc`] as string | undefined,
      numeroRadicado: objData[QD.strBpmCaseId] || '',
      nombre: (objData[QD.strCompanyName] || `${objData[QD.strFirstName] ?? ''} ${objData[QD.strLastName] ?? ''}`).trim(),
      interaccion: objData[QD.strInteraction] || '',
      loQueOcurrio: objData[QD.strComplaintText] || '',
      nuestraRespuesta: objData[QD.strClientResponse] || '',
      textoProcede: objData[QD.strActionsTaken] || '',
    };
    // '1' = a favor del Cliente ⇒ queja procede (fila 09); cualquier otro ⇒ no procede (fila 10).
    const strPrefix = objData[QD.strFavorability] === '1' ? EMAIL_TPL_PROCEDE_PREFIX : EMAIL_TPL_NO_PROCEDE_PREFIX;
    const strRawHtml = cllEmailTpl.find((o) => o.label.trim().startsWith(strPrefix))?.value;
    const strHtml = strRawHtml ? fillRespuestaFinalHtml(strRawHtml, objVars) : buildRespuestaFinalHtml(objVars);
    const strUrl = URL.createObjectURL(new Blob([strHtml], { type: 'text/html' }));
    setStrPreviewUrl(strUrl);
    return () => { URL.revokeObjectURL(strUrl); setStrPreviewUrl(null); };
  }, [blnShowPreview, form, cllEmailTpl]);

  // Recorremos el registro de archivos para subir cada adjunto a PM4.
  const uploadFiles = async (in_intRequestId: number) => {
    for (const [strDocKey, objFile] of fileRegistry.current.entries()) {
      const objFormData = new FormData();
      objFormData.append('file', objFile);
      await pm4.post(`/requests/${in_intRequestId}/files?data_name=${strDocKey}`, objFormData);
    }
  };

  // Envía la tarea con la acción indicada, subiendo antes los adjuntos si los hay.
  const enviarCon = (in_strAction: AccionFlujoCombinado) => async (in_objData: DetalleReasignacionRespuestaFormData): Promise<boolean> => {
    try {
      const intRequestId = task?.process_request_id;
      if (intRequestId && fileRegistry.current.size > 0) await uploadFiles(intRequestId);
      // Marca la acción del flujo en qd_strAction (p. ej. el botón "Enviar" ⇒ 'ENVIAR').
      const objPayload = {
        ...in_objData,
        [QD.strAction]: in_strAction,
      } as unknown as Record<string, unknown>;
      if (in_strAction === 'GUARDAR_BORRADOR') {
        await saveDraft(objPayload);
        return true;
      }
      await completeTask(objPayload);
      return true;
    } catch (exc) {
      console.error('[DetalleReasignacionRespuesta] Error al enviar:', exc);
      return false;
    }
  };

  // ACT-0051-08 Enviar (valida RUL-0051-05: respuestaCliente no vacío).
  const onEnviar = handleSubmit(enviarCon('ENVIAR'), scrollToFirstError);

  // ACT-0051-07 Guardar Borrador: guarda sin completar la tarea y redirige el frame
  // superior al home de tareas de ProcessMaker (solo si se guardó bien).
  const onGuardarBorrador = async () => {
    const blnOk = await enviarCon('GUARDAR_BORRADOR')(objWatch);
    if (blnOk) window.top!.location.href = pm4TasksUrl();
  };
  // ACT-0051-04 Solicitar Prórroga · ACT-0051-01 Reasignar
  // (sin validación bloqueante — envían los valores actuales del formulario directamente).
  const onSolicitarProrroga = () => enviarCon('SOLICITAR_PRORROGA')(objWatch);
  const onReasignarQueja = () => enviarCon('CONFIRMAR_ASIGNACION')(objWatch);
  // La sección de asignación pasa el snapshot fresco del formulario (incluye la fila
  // recién agregada al historial), evitando el stale closure de watch() tras setValue.
  const onSolicitarAyuda = (in_objData?: DetalleReasignacionRespuestaFormData) =>
    enviarCon('AYUDA')(in_objData ?? objWatch);

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

  // Habilita el envío solo con respuesta al cliente y destinatario del fallo definidos.
  const blnCanSubmit = !!objWatch[QD.strClientResponse]?.trim() && !!objWatch[QD.strFavorability];

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Detalle / Reasignación / Respuesta"
        subtitle={["SP2 · PAN-05.1", "Gestión de Quejas Directas", "Rol: Analista SAC / Área Responsable"]}
      />

      <div className="screen-content">
        <InfoBar items={[
          { label: 'Case', value: objWatch[QD.strBpmCaseId] || '—' },
          {
            label: 'SLA',
            value: objWatch[QD.strSlaAssigned] ? (
              <>
                {objWatch[QD.strSlaAssigned]} días hábiles
                {blnHasTimeLeft && (
                  <>
                    <br />
                    <span className="Capt-12">({intTimeLeft} días restantes)</span>
                  </>
                )}
              </>
            ) : '—',
          },
          {
            label: 'Estado',
            value: (
              <ZdsStatusBadge variant={estadoVariant(objWatch[QD.strSsStatus] || '')}>
                {objWatch[QD.strSsStatus] || 'Sin estado'}
              </ZdsStatusBadge>
            ),
          },
          { label: 'SmartSupervision', value: objWatch[QD.strSfcCode] || '—' },
        ]} />

        {/* RUL-0051-03 / MSG-0051-01 — banner SLA crítico. */}
        {blnSlaCritical && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            ⚠ El caso tiene <strong>{objWatch[QD.strSlaAssigned]}</strong> día(s) hábil(es) restante(s). Priorice
            la gestión; puede <strong>solicitar prórroga regulatoria</strong>. {/* MSG-0051-01 */}
          </ZrAlert>
        )}

        <form onSubmit={onEnviar} noValidate>
          <SeccionDetalleCaso form={form} estado={objWatch[QD.strSsStatus] || ''} nombre={strName} identificacion={strIdentification} requestId={task?.process_request_id ?? null} />
          <SeccionAsignacion form={form} err={err} onConfirmarReasignacion={onReasignarQueja} onSolicitarAyuda={onSolicitarAyuda} submitting={submitting} />
          <SeccionRespuesta
            form={form} fileRegistry={fileRegistry} err={err}
            onVistaPrevia={() => setBlnShowPreview(true)}
            onSolicitarProrroga={onSolicitarProrroga}
            slaCritico={blnSlaCritical}
            submitting={submitting}
            requestId={task?.process_request_id ?? null}
          />

          {/* RUL-0051-05 / MSG-0051-02 — bloqueo de envío si falta la respuesta. */}
          {!blnCanSubmit && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              El campo <strong>Respuesta al Cliente</strong> es obligatorio para enviar. {/* MSG-0051-02 */}
            </ZrAlert>
          )}

          {/* Acciones (ACT-0051-01..08) */}
          <ActionBar>
            <ZrButton config="link" icon="file-text:line" onClick={() => setBlnShowExpediente(true)}>
              Ver Expediente Completo
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting}
              onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanSubmit || submitting} loading={submitting}
              onClick={() => { onEnviar(); }}>
              Enviar ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-0051-06 · Ver Expediente Completo */}
      {blnShowExpediente && (
        <ZrModal model={blnShowExpediente} onChange={(open: boolean) => setBlnShowExpediente(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Expediente del caso
          </h3>
          <p className="subsection-note">
            {strName} · {strIdentification} · {objWatch[QD.strSfcProduct]} · {objWatch[QD.strSfcReason]}
          </p>
          <p style={{ font: 'var(--zf-cap-14)' }}>{objWatch[QD.strComplaintText] || 'Sin descripción.'}</p>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setBlnShowExpediente(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}

      {/* ACT-0051-05 · Vista Previa Respuesta Final (visor ancho reutilizado) */}
      <PreviewModal
        isOpen={blnShowPreview && !!strPreviewUrl}
        onClose={() => setBlnShowPreview(false)}
        previewDoc={{
          fileName: 'Vista previa — carta de respuesta final',
          descripcion: `Destinatario: ${strName} (${objWatch[QD.strEmail] || '—'})`,
          blobUrl: strPreviewUrl,
        }}
      />
    </div>
  );
}
