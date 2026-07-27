import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import RequestFileList from '../../../../components/RequestFileList';
import PreviewModal from '../../../../components/PreviewModal';
import {
  ZdsInput, ZdsTextarea,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, SCR0051_ADJUNTO_KEYS as ADJUNTO_KEYS, SCR000_ADJUNTO_KEYS, SCR008_DEFAULTS as DEFAULTS, SCR008_SLA_UMBRAL_CRITICO as SLA_UMBRAL_CRITICO } from '../fields/fields';
import type { RevisionRespuestaSacFormData, AccionRevisionSAC } from '../fields/fields';
import { buildRespuestaFinalHtml, fillRespuestaFinalHtml } from '../COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/respuestaFinalTemplate';

// Correos de la colección 46 (Mails BPM) para la respuesta final. La favorabilidad
// (qd_strFavorability) decide cuál: '1' = a favor del Cliente ⇒ "09 … queja procede";
// cualquier otro ⇒ "10 … queja no procede". (Misma lógica que SCR-0051.)
const EMAIL_TPL_PROCEDE_PREFIX = '09';
const EMAIL_TPL_NO_PROCEDE_PREFIX = '10';

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
    if (!task?.data) return;
    const objData = task.data as Partial<RevisionRespuestaSacFormData> & Record<string, unknown>;
    reset({
      ...DEFAULTS,
      ...objData,
      // "ID Caso / Código SFC": el código SFC (qd_strSfcCode) se asigna al radicar ante
      // la SFC (momentos posteriores); en SP2 aún no existe, así que mostramos el # de
      // caso BPM (qd_strBpmCaseId) como respaldo para que el campo no quede vacío.
      [QD.strSfcCode]: (objData[QD.strSfcCode] as string) || (objData[QD.strBpmCaseId] as string) || '',
    });
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

  // Clasificación Regulatoria / Asunto (solo lectura): estos campos guardan el CÓDIGO
  // (calculado en M1); para el display usamos su variable compañera <campo>_desc que
  // viaja en task.data (misma resolución que SCR-0051 en su vista de solo lectura).
  const dicWatch = objWatch as Record<string, unknown>;
  const descDe = (in_strBase: string): string => {
    const strDesc = dicWatch[`${in_strBase}_desc`] as string | undefined;
    return (strDesc && strDesc.trim()) || (dicWatch[in_strBase] as string) || '—';
  };

  // Nombre del cliente (persona jurídica o natural), para el destinatario de la carta.
  const strName = (objWatch[QD.strCompanyName] || `${objWatch[QD.strFirstName] ?? ''} ${objWatch[QD.strLastName] ?? ''}`).trim();

  // ACT-008-04 — Vista Previa Respuesta Final (igual que SCR-0051): obtenemos la carta
  // (HTML del correo) de la colección 46 según la favorabilidad y la servimos como blob a
  // PreviewModal. Se construye al abrir con la foto actual del formulario y se revoca al
  // cerrar. Si la colección aún no cargó o no trae la fila, cae a la plantilla local.
  const { options: cllEmailTpl } = useCollection(QD_COLLECTIONS.emailTemplates);
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

  // Enviamos la tarea con la accion seleccionada. qd_blnSACApproved refleja la
  // decisión booleana del SAC: Aprobar ⇒ true, Devolver ⇒ false (Reasignar no la toca).
  const enviarCon = (in_strAction: AccionRevisionSAC) => () =>
    completeTask({
      ...objWatch,
      [QD.strAction]: in_strAction,
      ...(in_strAction === 'APROBAR' ? { [QD.blnSacApproved]: true } : {}),
      ...(in_strAction === 'DEVOLVER' ? { [QD.blnSacApproved]: false } : {}),
    } as unknown as Record<string, unknown>)
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
  }, scrollToFirstError);

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
        title="Revisión Respuesta SAC"      />

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

          {/* ── Clasificación Regulatoria (solo lectura, heredada de M1) ──
              Mismo bloque de referencia que muestra SCR-0051, aquí siempre de solo
              lectura: el SAC la consulta para revisar la respuesta, no la reclasifica. */}
          <FormSection title="Clasificación Regulatoria">
            <div className="form-row cols-2">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Producto SFC (seguro)</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strSfcProduct)}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Momento</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{objWatch[QD.strInteraction] || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Motivo SFC</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strSfcReason)}</div>
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Canal de Recepción</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strChannel)}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Instancia de Recepción</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strReceptionInstance)}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Admisión</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strAdmission)}</div>
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Ente de Control</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strControlEntity)}</div>
              </div>
              <div />
              <div />
            </div>
          </FormSection>

          {/* ── Descripción de la Queja (solo lectura) ──
              Asunto (= motivo SFC) y texto original del radicador, tal cual en SCR-0051. */}
          <FormSection title="Descripción de la Queja">
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Asunto de la Queja</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{descDe(QD.strSfcReason)}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strComplaintText} control={control} label="Descripción / Texto de la Queja" readOnly />
            </div>

            {/* Adjuntos del radicador (los que subió el cliente en SCR-000, qd_strAttach01..05). */}
            <RequestFileList
              requestId={task?.process_request_id ?? null}
              docKeys={SCR000_ADJUNTO_KEYS}
              label="Documentos adjuntos del radicador"
              emptyText="El radicador no adjuntó documentos a esta queja."
              loadingText="Buscando documentos del caso…"
            />
          </FormSection>

          {/* ── S2 · Respuesta del Área (SEC-026) ──
              Respuesta al Cliente y Acciones Tomadas son editables por el SAC:
              puede corregir el texto del área antes de aprobar/devolver. */}
          <FormSection title="Respuesta del Área">
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strClientResponse} control={control} label="Respuesta al Cliente" maxLength={5000} />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strActionsTaken} control={control} label="Acciones Tomadas" maxLength={5000} />
            </div>
            <div className="form-row cols-1">
              <ZdsInput name={QD.strAcknowledgment} control={control} label="¿Reconocimiento al cliente?" readOnly />
            </div>

            {/* FLD-130 — soportes internos adjuntos (previsualizar + descargar).
                El área los subió en SCR-0051 con data_name qd_strSupport01..10. */}
            <RequestFileList
              requestId={task?.process_request_id ?? null}
              docKeys={ADJUNTO_KEYS}
              label="Soportes internos adjuntos"
              emptyText="Sin soportes adjuntos."
              loadingText="Buscando soportes internos…"
            />
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

      {/* ACT-008-04 · Vista Previa Respuesta Final (visor ancho reutilizado, igual que SCR-0051) */}
      <PreviewModal
        isOpen={blnShowPreview && !!strPreviewUrl}
        onClose={() => setBlnShowPreview(false)}
        previewDoc={{
          fileName: 'Vista previa — carta de respuesta final',
          descripcion: `Destinatario: ${strName || '—'} (${objWatch[QD.strEmail] || '—'})`,
          blobUrl: strPreviewUrl,
        }}
      />
    </div>
  );
}
