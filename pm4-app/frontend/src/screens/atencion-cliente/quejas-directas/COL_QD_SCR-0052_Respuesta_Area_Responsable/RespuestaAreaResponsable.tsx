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
  const { task, loading, error, submitting, completeTask, saveDraft } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [enviarError, setEnviarError] = useState<string | null>(null);

  const form = useForm<RespuestaAreaResponsableFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, setValue, setError, clearErrors,
    formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RespuestaAreaResponsableFormData>) });
  }, [task, reset]);

  const err = (name: keyof RespuestaAreaResponsableFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-0052-01 (🔴 BLOQUEA): el comentario es obligatorio para enviar.
  const puedeEnviar = !!w.qd_comentarioArea?.trim();

  // Datos del consumidor derivados de los campos granulares producidos por SCR-000.
  const nombre = (w.qd_razonSocial || `${w.qd_nombres ?? ''} ${w.qd_apellidos ?? ''}`).trim();
  const identificacion = `${w.qd_tipoIdentificacion ?? ''} ${w.qd_numeroIdentificacion ?? ''}`.trim();

  // Solicitud de ayuda específica (fila del historial que originó este subproceso, SCR-0051).
  // Se matchea por qd_numeroAyuda (1-based) → índice del historial.
  const numeroAyuda = Number(w.qd_numeroAyuda) || 0;
  const historialAsig: AsignacionHistorial[] = Array.isArray(w.qd_historialAsignaciones) ? w.qd_historialAsignaciones : [];
  const solicitud = historialAsig[numeroAyuda - 1];

  // Estos campos guardan el CÓDIGO en PM4; resolvemos su descripción vía catálogo para mostrar.
  const { options: canalOpts } = useCollection(COLLECTION_DEFS.canal);
  const { options: productoOpts } = useCollection(COLLECTION_DEFS.producto);
  const { options: motivoOpts } = useCollection(COLLECTION_DEFS.motivo);
  const { options: admisionOpts } = useCollection(COLLECTION_DEFS.admision);

  const desc = (opts: { value: string; label: string }[], code: string | undefined): string => {
    if (!code) return '—';
    return opts.find((o) => o.value === code)?.label ?? code;
  };
  const canalDesc = desc(canalOpts, w.qd_canal);
  const productoDesc = desc(productoOpts, w.qd_productoSFC);
  const motivoDesc = desc(motivoOpts, w.qd_motivoSFC);
  const admisionDesc = desc(admisionOpts, w.qd_admision);

  // Sube cada archivo y devuelve un mapa docKey → file_id (fileUploadId de PM4),
  // para poder guardar el id del adjunto en el historial y descargarlo luego.
  const uploadFiles = async (requestId: number): Promise<Record<string, number>> => {
    const ids: Record<string, number> = {};
    for (const [docKey, file] of fileRegistry.current.entries()) {
      const fd = new FormData();
      fd.append('file', file);
      const r = await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
      const id = (r.data as { fileUploadId?: number })?.fileUploadId;
      if (typeof id === 'number') ids[docKey] = id;
    }
    return ids;
  };

  // Registra la respuesta del ayudante en el array diferenciado (qd_respuestasAyuda) y
  // completa la fila correspondiente del historial (qd_historialAsignaciones), matcheando
  // por qd_numeroAyuda (1-based) → índice del array. Solo se aplica al ENVIAR definitivo.
  //
  // IMPORTANTE: este subproceso arrancó con un SNAPSHOT del historial del momento en que se
  // pidió la ayuda. Si después se pidieron más ayudas, ese snapshot está desactualizado y
  // escribirlo de vuelta borraría las ayudas posteriores. Por eso releemos el estado FRESCO
  // del request padre y fusionamos la respuesta sobre esa versión antes de guardar.
  const registrarRespuesta = async (data: RespuestaAreaResponsableFormData, adjuntoFileId?: number) => {
    const numero = Number(data.qd_numeroAyuda) || 0;
    const idx = numero - 1;
    const respondio = data.qd_usuarioResponsable || data.qd_areaResponsable || '—';
    const fecha = new Date().toISOString().slice(0, 10);
    const adjunto = data.qd_adjuntoArea || '';

    // Partimos del snapshot local como fallback.
    let historial: AsignacionHistorial[] = Array.isArray(data.qd_historialAsignaciones)
      ? [...data.qd_historialAsignaciones] : [];
    let respuestas: RespuestaAyuda[] = Array.isArray(data.qd_respuestasAyuda)
      ? [...data.qd_respuestasAyuda] : [];

    // Releer el request padre para tener el historial completo y actualizado.
    const pdata = task?.data as Record<string, unknown> | undefined;
    const parentRequestId =
      (pdata?._request as { parent_request_id?: number } | undefined)?.parent_request_id ??
      (pdata?._parent as { request_id?: number } | undefined)?.request_id;
    if (parentRequestId) {
      try {
        // include=data es obligatorio: sin él PM4 no devuelve las variables del caso.
        const r = await pm4.get(`/requests/${parentRequestId}`, { params: { include: 'data' } });
        const fresh = (r.data?.data ?? r.data ?? {}) as Record<string, unknown>;
        if (Array.isArray(fresh.qd_historialAsignaciones)) historial = [...fresh.qd_historialAsignaciones];
        if (Array.isArray(fresh.qd_respuestasAyuda)) respuestas = [...fresh.qd_respuestasAyuda];
        console.log(`[RespuestaAreaResponsable] Historial padre (req ${parentRequestId}): ${historial.length} filas`, historial);
      } catch (e) {
        console.warn('[RespuestaAreaResponsable] No se pudo leer el request padre; se usa el snapshot local:', e);
      }
    }

    if (idx >= 0 && idx < historial.length) {
      historial[idx] = {
        ...historial[idx],
        respondio: 'si', // marca que el ayudante ya respondió (SCR-0051 lo pinta con un check verde)
        comentario: data.qd_comentarioArea,
        adjunto, // nombre real del archivo ('' si no adjuntó) → SCR-0051 lo enlaza para descarga
        adjuntoFileId, // file_id en PM4 para descarga exacta
      };
    }

    const nuevaRespuesta: RespuestaAyuda = { numero, fecha, respondio, comentario: data.qd_comentarioArea, adjunto, adjuntoFileId };
    if (idx >= 0) respuestas[idx] = nuevaRespuesta;
    else respuestas.push(nuevaRespuesta);

    return { qd_historialAsignaciones: historial, qd_respuestasAyuda: respuestas };
  };

  const enviarCon = (accion: AccionRespuestaArea) => async (data: RespuestaAreaResponsableFormData): Promise<boolean> => {
    setEnviarError(null);
    try {
      const requestId = task?.process_request_id;
      let uploadedIds: Record<string, number> = {};
      if (requestId && fileRegistry.current.size > 0) uploadedIds = await uploadFiles(requestId);
      if (accion === 'GUARDAR_BORRADOR') {
        await saveDraft({ ...data, qd_accion: accion } as unknown as Record<string, unknown>);
        return true;
      }
      const extra = await registrarRespuesta(data, uploadedIds[ADJUNTO_KEY]);
      await completeTask({ ...data, ...extra, qd_accion: accion } as unknown as Record<string, unknown>);
      return true;
    } catch (e) {
      // No tragar el error: si la tarea no se completa, PM4 no cierra el iframe.
      // Mostrarlo en pantalla para saber la causa real del fallo.
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message ?? err.message ?? 'Error desconocido al enviar.';
      console.error('[RespuestaAreaResponsable] Error al enviar:', e);
      setEnviarError(msg);
      return false;
    }
  };

  // ACT-0052-01 Enviar comentario (valida RUL-0052-01) · ACT-0052-02 Guardar Borrador.
  const onEnviar = handleSubmit(enviarCon('ENVIAR'));
  // Guardar Borrador: guarda los datos del formulario y sale a la URL base (solo si se guardó bien).
  const onGuardarBorrador = async () => {
    const ok = await enviarCon('GUARDAR_BORRADOR')(w);
    if (ok) window.location.href = window.location.origin;
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
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{nombre || '—'}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Tipo y N.° de Identificación</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{identificacion || '—'}</div>
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
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{canalDesc}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Producto SFC</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{productoDesc}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Motivo SFC</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{motivoDesc}</div>
              </div>
            </div>
            <div className="form-row cols-3">
              <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly />
              <div className="zds-field-wrap">
                <span className="info-bar-label">Admisión</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{admisionDesc}</div>
              </div>
              <ZdsInput name="qd_enteControl" control={control} label="Ente de Control" readOnly />
            </div>
          </FormSection>

          {/* ── S3 · Descripción de la Queja (SEC-061, solo lectura) ── */}
          <FormSection title="Descripción de la Queja">
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Asunto de la Queja</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{motivoDesc}</div>
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
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{solicitud?.fecha || '—'}</div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">Solicitado por</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{solicitud?.de || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Motivo</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{solicitud?.motivo || '—'}</div>
              </div>
            </div>
            <div className="form-row cols-1">
              <div className="zds-field-wrap">
                <span className="info-bar-label">Observaciones</span>
                <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)', whiteSpace: 'pre-wrap' }}>
                  {solicitud?.observaciones || '—'}
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
            {!puedeEnviar && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe escribir un <strong>comentario</strong> antes de enviarlo. {/* MSG-0052-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* Error de envío — la tarea no se completó (por eso PM4 no cierra el iframe). */}
          {enviarError && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              No se pudo enviar: {enviarError}
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
            <ZrButton config="positive" disabled={!puedeEnviar || submitting} loading={submitting}
              onClick={() => { onEnviar(); }}>
              Enviar comentario ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
