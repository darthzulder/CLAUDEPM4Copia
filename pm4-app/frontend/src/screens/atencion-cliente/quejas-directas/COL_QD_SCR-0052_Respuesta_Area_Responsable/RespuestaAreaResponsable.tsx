import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { useCollection } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsFileInput,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import pm4 from '../../../../api/pm4Client';
import {
  DEFAULTS, ADJUNTO_KEY, MAX_ADJUNTO_MB, COLLECTION_DEFS,
  type RespuestaAreaResponsableFormData, type AccionRespuestaArea, type RespuestaAyuda,
} from './variables';
import type { AsignacionHistorial } from '../COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/variables';

export default function RespuestaAreaResponsable() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [strSendError, setStrSendError] = useState<string | null>(null);

  const form = useForm<RespuestaAreaResponsableFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, setValue, setError, clearErrors,
    formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RespuestaAreaResponsableFormData>) });
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof RespuestaAreaResponsableFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // RUL-0052-01 (🔴 BLOQUEA): el comentario es obligatorio para enviar.
  const blnCanSubmit = !!objWatch.qd_comentarioArea?.trim();

  // Datos del consumidor derivados de los campos granulares producidos por SCR-000.
  const strName = (objWatch.qd_razonSocial || `${objWatch.qd_nombres ?? ''} ${objWatch.qd_apellidos ?? ''}`).trim();
  const strIdentification = `${objWatch.qd_tipoIdentificacion ?? ''} ${objWatch.qd_numeroIdentificacion ?? ''}`.trim();

  // Solicitud de ayuda específica (fila del historial que originó este subproceso, SCR-0051).
  // Se matchea por qd_numeroAyuda (1-based) → índice del historial.
  const intHelpNumber = Number(objWatch.qd_numeroAyuda) || 0;
  const lstHistory: AsignacionHistorial[] = Array.isArray(objWatch.qd_historialAsignaciones) ? objWatch.qd_historialAsignaciones : [];
  const objRequest = lstHistory[intHelpNumber - 1];

  // Estos campos guardan el CÓDIGO en PM4; resolvemos su descripción vía catálogo para mostrar.
  const { options: cllChannel } = useCollection(COLLECTION_DEFS.canal);
  const { options: cllProduct } = useCollection(COLLECTION_DEFS.producto);
  const { options: cllReason } = useCollection(COLLECTION_DEFS.motivo);
  const { options: cllAdmission } = useCollection(COLLECTION_DEFS.admision);

  // Resuelve la descripción de un código contra su catálogo.
  const desc = (in_lstOptions: { value: string; label: string }[], in_strCode: string | undefined): string => {
    if (!in_strCode) return '—';
    return in_lstOptions.find((o) => o.value === in_strCode)?.label ?? in_strCode;
  };
  const strChannelDesc = desc(cllChannel, objWatch.qd_canal);
  const strProductDesc = desc(cllProduct, objWatch.qd_productoSFC);
  const strReasonDesc = desc(cllReason, objWatch.qd_motivoSFC);
  const strAdmissionDesc = desc(cllAdmission, objWatch.qd_admision);

  // Sube cada archivo y devuelve un mapa docKey → file_id (fileUploadId de PM4),
  // para poder guardar el id del adjunto en el historial y descargarlo luego.
  const uploadFiles = async (in_intRequestId: number): Promise<Record<string, number>> => {
    const dicIds: Record<string, number> = {};
    for (const [strDocKey, objFile] of fileRegistry.current.entries()) {
      const objFormData = new FormData();
      objFormData.append('file', objFile);
      const objResponse = await pm4.post(`/requests/${in_intRequestId}/files?data_name=${strDocKey}`, objFormData);
      const intId = (objResponse.data as { fileUploadId?: number })?.fileUploadId;
      if (typeof intId === 'number') dicIds[strDocKey] = intId;
    }
    return dicIds;
  };

  // Registra la respuesta del ayudante en el array diferenciado (qd_respuestasAyuda) y
  // completa la fila correspondiente del historial (qd_historialAsignaciones), matcheando
  // por qd_numeroAyuda (1-based) → índice del array. Solo se aplica al ENVIAR definitivo.
  //
  // IMPORTANTE: este subproceso arrancó con un SNAPSHOT del historial del momento en que se
  // pidió la ayuda. Si después se pidieron más ayudas, ese snapshot está desactualizado y
  // escribirlo de vuelta borraría las ayudas posteriores. Por eso releemos el estado FRESCO
  // del request padre y fusionamos la respuesta sobre esa versión antes de guardar.
  const registrarRespuesta = async (in_objData: RespuestaAreaResponsableFormData, in_intAttachFileId?: number) => {
    const intNumber = Number(in_objData.qd_numeroAyuda) || 0;
    const intIndex = intNumber - 1;
    const strResponder = in_objData.qd_usuarioResponsable || in_objData.qd_areaResponsable || '—';
    const strDate = new Date().toISOString().slice(0, 10);
    const strAttachment = in_objData.qd_adjuntoArea || '';

    // Partimos del snapshot local como fallback.
    let lstAssignHistory: AsignacionHistorial[] = Array.isArray(in_objData.qd_historialAsignaciones)
      ? [...in_objData.qd_historialAsignaciones] : [];
    let lstResponses: RespuestaAyuda[] = Array.isArray(in_objData.qd_respuestasAyuda)
      ? [...in_objData.qd_respuestasAyuda] : [];

    // Releer el request padre para tener el historial completo y actualizado.
    const objParentData = task?.data as Record<string, unknown> | undefined;
    const intParentRequestId =
      (objParentData?._request as { parent_request_id?: number } | undefined)?.parent_request_id ??
      (objParentData?._parent as { request_id?: number } | undefined)?.request_id;
    if (intParentRequestId) {
      try {
        // include=data es obligatorio: sin él PM4 no devuelve las variables del caso.
        const objResponse = await pm4.get(`/requests/${intParentRequestId}`, { params: { include: 'data' } });
        const objFresh = (objResponse.data?.data ?? objResponse.data ?? {}) as Record<string, unknown>;
        if (Array.isArray(objFresh.qd_historialAsignaciones)) lstAssignHistory = [...objFresh.qd_historialAsignaciones];
        if (Array.isArray(objFresh.qd_respuestasAyuda)) lstResponses = [...objFresh.qd_respuestasAyuda];
        console.log(`[RespuestaAreaResponsable] Historial padre (req ${intParentRequestId}): ${lstAssignHistory.length} filas`, lstAssignHistory);
      } catch (exc) {
        console.warn('[RespuestaAreaResponsable] No se pudo leer el request padre; se usa el snapshot local:', exc);
      }
    }

    // Completamos la fila del historial que corresponde a esta ayuda.
    if (intIndex >= 0 && intIndex < lstAssignHistory.length) {
      lstAssignHistory[intIndex] = {
        ...lstAssignHistory[intIndex],
        respondio: 'si', // marca que el ayudante ya respondió (SCR-0051 lo pinta con un check verde)
        comentario: in_objData.qd_comentarioArea,
        adjunto: strAttachment, // nombre real del archivo ('' si no adjuntó) → SCR-0051 lo enlaza para descarga
        adjuntoFileId: in_intAttachFileId, // file_id en PM4 para descarga exacta
      };
    }

    // Registramos la respuesta en el array diferenciado por número de ayuda.
    const objNewResponse: RespuestaAyuda = { numero: intNumber, fecha: strDate, respondio: strResponder, comentario: in_objData.qd_comentarioArea, adjunto: strAttachment, adjuntoFileId: in_intAttachFileId };
    if (intIndex >= 0) lstResponses[intIndex] = objNewResponse;
    else lstResponses.push(objNewResponse);

    return { qd_historialAsignaciones: lstAssignHistory, qd_respuestasAyuda: lstResponses };
  };

  // Sube adjuntos, registra la respuesta si aplica y completa la tarea.
  const enviarCon = (in_strAction: AccionRespuestaArea) => async (in_objData: RespuestaAreaResponsableFormData): Promise<boolean> => {
    setStrSendError(null);
    try {
      const intRequestId = task?.process_request_id;
      let dicUploadedIds: Record<string, number> = {};
      if (intRequestId && fileRegistry.current.size > 0) dicUploadedIds = await uploadFiles(intRequestId);
      const objExtra = in_strAction === 'ENVIAR' ? await registrarRespuesta(in_objData, dicUploadedIds[ADJUNTO_KEY]) : {};
      await completeTask({ ...in_objData, ...objExtra, qd_accion: in_strAction } as unknown as Record<string, unknown>);
      return true;
    } catch (exc) {
      // No tragar el error: si la tarea no se completa, PM4 no cierra el iframe.
      // Mostrarlo en pantalla para saber la causa real del fallo.
      const objErr = exc as { response?: { data?: { message?: string } }; message?: string };
      const strMsg = objErr.response?.data?.message ?? objErr.message ?? 'Error desconocido al enviar.';
      console.error('[RespuestaAreaResponsable] Error al enviar:', exc);
      setStrSendError(strMsg);
      return false;
    }
  };

  // ACT-0052-01 Enviar comentario (valida RUL-0052-01) · ACT-0052-02 Guardar Borrador.
  const onEnviar = handleSubmit(enviarCon('ENVIAR'));
  // Guardar Borrador: guarda los datos del formulario y sale a la URL base (solo si se guardó bien).
  const onGuardarBorrador = async () => {
    const blnOk = await enviarCon('GUARDAR_BORRADOR')(objWatch);
    if (blnOk) window.location.href = window.location.origin;
  };

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
        title="Respuesta del Área Responsable"
        subtitle={["SP2-T02 · PAN-05.2", "Gestión de Quejas Directas", "Rol: Área Responsable"]}
      />

      <div className="screen-content">
        <form onSubmit={onEnviar} noValidate>

          {/* ── S1 · Datos del Consumidor (SEC-059, solo lectura) ── */}
          <FormSection title="Datos del Consumidor">
            <div className="form-row cols-2">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Nombre del Consumidor</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strName || '—'}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Tipo y N.° de Identificación</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strIdentification || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_correoElectronico" control={control} label="Correo Electrónico" readOnly
                helpText="Destino del correo de respuesta final." />
              <ZdsInput name="qd_tipoPersona" control={control} label="Tipo de Persona" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Clasificación Regulatoria (SEC-060, solo lectura) ── */}
          {/* Canal/Producto/Motivo/Admisión guardan código → se muestra la descripción del catálogo. */}
          <FormSection title="Clasificación Regulatoria">
            <div className="form-row cols-3">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Canal de Recepción</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strChannelDesc}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Producto SFC</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strProductDesc}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Motivo SFC</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strReasonDesc}</div>
              </div>
            </div>
            <div className="form-row cols-3">
              <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly />
              <div className="zds-field-wrap">
                <span className="info-bar-label">Admisión</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strAdmissionDesc}</div>
              </div>
              <ZdsInput name="qd_enteControl" control={control} label="Ente de Control" readOnly />
            </div>
          </FormSection>

          {/* ── S3 · Descripción de la Queja (SEC-061, solo lectura) ── */}
          <FormSection title="Descripción de la Queja">
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Asunto de la Queja</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strReasonDesc}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_textoQueja" control={control} label="Descripción / Texto de la Queja" readOnly />
            </div>
          </FormSection>

          {/* ── S4 · Solicitud de Ayuda (datos que vienen de SCR-0051 para esta petición) ── */}
          <FormSection title="Solicitud de Ayuda">
            <div className="form-row cols-2">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Fecha de solicitud</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{objRequest?.fecha || '—'}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Solicitado por</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{objRequest?.de || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Motivo</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{objRequest?.motivo || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Observaciones</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)', whiteSpace: 'pre-wrap' }}>
                  {objRequest?.observaciones || '—'}
                </div>
              </div>
            </div>
          </FormSection>

          {/* ── S5 · Comentario y Adjunto (SEC-058, editable) ── */}
          <FormSection title="Comentario y Adjunto">
            <div className="form-row cols-1">
              <ZdsTextarea
                name="qd_comentarioArea" control={control} label="Comentario"
                required maxLength={2000}
                rules={{ required: 'Campo requerido' }} error={err('qd_comentarioArea')}
                helpText="Comentario visible en el historial del caso."
              />
            </div>
            <div className="form-row cols-1">
              <ZdsFileInput
                control={control} name={ADJUNTO_KEY} label="Adjuntar archivo"
                fileRegistry={fileRegistry}
                setValue={setValue} setError={setError} clearErrors={clearErrors}
                error={err('qd_adjuntoArea')}
                allowedExtensions={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']}
                maxSizeMb={MAX_ADJUNTO_MB}
                errorMessage={`Solo se permiten archivos PDF, DOCX, XLSX, JPG o PNG, máx ${MAX_ADJUNTO_MB} MB`}
              />
            </div>

            {/* RUL-0052-01 / MSG-0052-01 — comentario obligatorio. */}
            {!blnCanSubmit && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe escribir un <strong>comentario</strong> antes de enviarlo. {/* MSG-0052-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* Error de envío — la tarea no se completó (por eso PM4 no cierra el iframe). */}
          {strSendError && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              No se pudo enviar: {strSendError}
            </ZrAlert>
          )}

          {/* ── Acciones (ACT-0052-01/02/03) ── */}
          <ActionBar>
            <ZrButton config="link" icon="arrow-left:line" onClick={() => window.history.back()}>
              Volver
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting}
              onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanSubmit || submitting} loading={submitting}
              onClick={() => { onEnviar(); }}>
              Enviar comentario ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
