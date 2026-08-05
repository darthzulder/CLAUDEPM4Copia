import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import { pm4TasksUrl } from '../../../../core/useToken';
import { useHolidaySet, diasHabilesRestantes, parsePm4Date, estadoSlaPorDiasRestantes, estadoSlaVariant } from '../../../../core/businessDays';
import ScreenHeader from '../../../../components/ScreenHeader';
import InfoBar from '../../../../components/InfoBar';
import { ActionBar } from '../../../../components/ActionBar';
import { ZrButton, ZrAlert, ZrModal, ZrLoader, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import PreviewModal from '../../../../components/PreviewModal';
import { useCollection } from '../../../../core/useCollection';
import { uploadAttachments, attachIdsToPayload } from '../../../../core/attachments';
import { QD, QD_COLLECTIONS, SCR0051_DEFAULTS as DEFAULTS, SCR0051_SLA_UMBRAL_PRORROGA as SLA_UMBRAL_PRORROGA } from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData, AccionFlujoCombinado } from '../fields/fields';
import SeccionDetalleCaso from './SeccionDetalleCaso';
import SeccionAsignacion from './SeccionAsignacion';
import SeccionRespuesta from './SeccionRespuesta';
import { buildRespuestaFinalHtml, fillRespuestaFinalHtml } from './respuestaFinalTemplate';

// Correos de la colección 46 (Mails BPM) para la respuesta final. La favorabilidad
// (qd_strFavorability) decide cuál: '1' = a favor del Cliente ⇒ "09 … queja procede";
// '3' = a favor de la Compañía ⇒ "10 … queja no procede".
const EMAIL_TPL_PROCEDE_PREFIX = '09';
const EMAIL_TPL_NO_PROCEDE_PREFIX = '10';

// Campos que componen la Clasificación Regulatoria re-editable en M3 (S2 de SeccionDetalleCaso).
// Si el analista cambia cualquiera de ellos, la marcación (qd_strMarking) pasa a '2' para que
// SCR-009 traiga la Marcación preelegida con ese valor.
const CLASSIFICATION_FIELDS = [
  QD.strSfcProduct, QD.strInteraction, QD.strServiceProvided, QD.strPlate, QD.strSfcReason,
] as const;

export default function DetalleReasignacionRespuesta() {
  const { task, loading, error, submitting, completeTask, saveDraft, reassignTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [blnShowExpediente, setBlnShowExpediente] = useState(false);
  const [blnShowPreview, setBlnShowPreview] = useState(false);

  const form = useForm<DetalleReasignacionRespuestaFormData>({ defaultValues: DEFAULTS });
  const { watch, handleSubmit, reset, setValue, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Foto de la clasificación original (la que trae la tarea) y de la marcación original,
  // para comparar contra la selección actual. Se fija al precargar y no vuelve a cambiar.
  const objOriginal = useRef<{ classification: string[]; marking: string } | null>(null);

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (!task?.data) return;
    const objData = task.data as Partial<DetalleReasignacionRespuestaFormData>;
    reset({ ...DEFAULTS, ...objData });
    objOriginal.current = {
      classification: CLASSIFICATION_FIELDS.map((strField) => String(objData[strField] ?? '')),
      marking: String(objData[QD.strMarking] ?? ''),
    };
  }, [task, reset]);

  // Marcación derivada: si la clasificación regulatoria cambió respecto a la original,
  // qd_strMarking = '2' (para que SCR-009 traiga la Marcación preelegida con ese valor);
  // si vuelve a coincidir, restauramos la marcación original.
  useEffect(() => {
    if (!objOriginal.current) return;
    const blnChanged = CLASSIFICATION_FIELDS.some(
      (strField, intIdx) => String(objWatch[strField] ?? '') !== objOriginal.current!.classification[intIdx],
    );
    const strTarget = blnChanged ? '2' : objOriginal.current.marking;
    if (String(objWatch[QD.strMarking] ?? '') !== strTarget) {
      setValue(QD.strMarking, strTarget);
    }
  }, [objWatch, setValue]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof DetalleReasignacionRespuestaFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  const intSla = Number.parseInt(objWatch[QD.strSlaAssigned] ?? '', 10);

  // Días HÁBILES restantes = fecha de radicación SFC (filing date, qd_strFilingDate) +
  // SLA asignado (días hábiles) − hoy, contando solo días hábiles (excluye fines de
  // semana y feriados de Colombia). Misma regla que el script PM4 COL_UTIL_Dias_Habiles
  // (id 95): 'add' seguido de 'diff'.
  const { holidays } = useHolidaySet();
  const dtFilingDate = parsePm4Date(objWatch[QD.strFilingDate]);
  const blnHasTimeLeft = !!dtFilingDate && Number.isFinite(intSla);
  const intTimeLeft = blnHasTimeLeft ? diasHabilesRestantes(dtFilingDate!, intSla, holidays) : NaN;

  // RUL-0051-03 — SLA crítico: habilita prórroga y banner rojo si slaRestante <= 2.
  const blnSlaCritical = blnHasTimeLeft && intTimeLeft <= SLA_UMBRAL_PRORROGA;

  // Estado del caso por proximidad al vencimiento (Abierta/Por Vencer/Vencida), misma regla
  // y mismo umbral que el dashboard SCR-013 (SLA_UMBRAL_PRORROGA = SCR013_SLA_UMBRAL_PROXIMO = 2).
  // No distingue Cerrada/Cancelada: mientras esta pantalla está en pantalla, la tarea sigue activa.
  const strEstadoSla = estadoSlaPorDiasRestantes(intTimeLeft, blnHasTimeLeft, SLA_UMBRAL_PRORROGA);

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

  // Envía la tarea con la acción indicada, subiendo antes los adjuntos si los hay.
  const enviarCon = (in_strAction: AccionFlujoCombinado) => async (in_objData: DetalleReasignacionRespuestaFormData): Promise<boolean> => {
    try {
      const intRequestId = task?.process_request_id;
      const dicUploadedIds = intRequestId && fileRegistry.current.size > 0
        ? await uploadAttachments(intRequestId, fileRegistry.current)
        : {};
      // Marca la acción del flujo en qd_strAction (p. ej. el botón "Enviar" ⇒ 'ENVIAR').
      const objPayload = {
        ...in_objData,
        ...attachIdsToPayload(dicUploadedIds),
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
  // ACT-0051-04 Solicitar Prórroga (sin validación bloqueante — envía los valores
  // actuales del formulario directamente).
  const onSolicitarProrroga = () => enviarCon('SOLICITAR_PRORROGA')(objWatch);

  // ACT-0051-01 Reasignar — solo cambia el responsable (PUT /tasks/{id} { user_id, data },
  // mismo status): NO completa la tarea ni avanza el flujo BPM, a diferencia de las demás
  // acciones de enviarCon.
  const onReasignarQueja = async (in_strUserId?: string) => {
    if (!in_strUserId) return;
    const objPayload = { ...objWatch, [QD.strAction]: 'CONFIRMAR_ASIGNACION' } as unknown as Record<string, unknown>;
    try {
      await reassignTask(objPayload, in_strUserId);
    } catch (exc) {
      console.error('[DetalleReasignacionRespuesta] Error al reasignar:', exc);
    }
  };
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
            // Estado del caso por proximidad al vencimiento (Abierta/Por Vencer/Vencida),
            // misma lógica y píldoras que el dashboard SCR-013.
            label: 'Estado',
            value: (
              <ZdsStatusBadge variant={estadoSlaVariant(strEstadoSla)}>
                {strEstadoSla}
              </ZdsStatusBadge>
            ),
          },
          { label: 'SmartSupervision', value: objWatch[QD.strSfcCode] || '—' },
          { label: 'Radicación SFC', value: objWatch[QD.strFilingDate] || '—' },
        ]} />

        {/* RUL-0051-03 / MSG-0051-01 — banner SLA crítico. */}
        {blnSlaCritical && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            ⚠ El caso tiene <strong>{intTimeLeft}</strong> día(s) hábil(es) restante(s). Priorice
            la gestión; puede <strong>solicitar prórroga regulatoria</strong>. {/* MSG-0051-01 */}
          </ZrAlert>
        )}

        <form onSubmit={onEnviar} noValidate>
          <SeccionDetalleCaso form={form} nombre={strName} identificacion={strIdentification} requestId={task?.process_request_id ?? null} />
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
