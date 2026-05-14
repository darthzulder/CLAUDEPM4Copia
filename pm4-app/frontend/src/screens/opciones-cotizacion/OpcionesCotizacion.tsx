import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton } from '@zurich/web-components/react/button';
import {
  DECISION_OPTIONS,
  type OpcionesCotizacionData,
  type DecisionValue,
} from './variables';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import './styles.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormValues {
  frm_respCot_decision: DecisionValue | '';
  frm_respCot_comentarios: string;
  frm_respCot_motizoRechazo: string;
  frm_respCot_personalizacion_excepcion: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OpcionesCotizacion() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [sent, setSent] = useState(false);

  const data = (task?.data ?? {}) as unknown as OpcionesCotizacionData;

  // Archivos adjuntos del caso
  const requestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading } = useRequestFiles(requestId);

  // Intentar resolver el fileId desde el campo output del slip
  const slipFileId = resolveFileId(data.output_slipCotizacionCo);

  // Si no hay fileId directo en el campo output, buscar en los archivos del caso
  // por nombre de archivo que contenga "slip" (fallback)
  const slipFromFiles = !slipFileId
    ? files.find((f) => f.file_name.toLowerCase().includes('slip'))
    : null;

  const effectiveFileId = slipFileId ?? slipFromFiles?.id ?? null;

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      frm_respCot_decision: '',
      frm_respCot_comentarios: '',
      frm_respCot_motizoRechazo: '',
      frm_respCot_personalizacion_excepcion: '',
    },
  });

  // Pre-poblar si vienen datos de PM4
  useEffect(() => {
    if (!task?.data) return;
    if (data.frm_respCot_decision)
      setValue('frm_respCot_decision', data.frm_respCot_decision as DecisionValue);
    if (data.frm_respCot_comentarios)
      setValue('frm_respCot_comentarios', data.frm_respCot_comentarios);
    if (data.frm_respCot_motizoRechazo)
      setValue('frm_respCot_motizoRechazo', data.frm_respCot_motizoRechazo);
    if (data.frm_respCot_personalizacion_excepcion)
      setValue('frm_respCot_personalizacion_excepcion', data.frm_respCot_personalizacion_excepcion);
  }, [task]);

  const decision = watch('frm_respCot_decision');

  async function onSubmit(values: FormValues) {
    try {
      const raw = task?.data as Record<string, unknown> ?? {};
      const payload: Record<string, unknown> = {};
      // Pasar todos los campos existentes del task (sin _ internos)
      for (const [k, v] of Object.entries(raw)) {
        if (!k.startsWith('_')) payload[k] = v;
      }
      // Sobreescribir con los valores del formulario
      payload.frm_respCot_decision                  = values.frm_respCot_decision;
      payload.frm_respCot_comentarios               = values.frm_respCot_comentarios;
      payload.frm_respCot_motizoRechazo             = values.frm_respCot_motizoRechazo;
      payload.frm_respCot_personalizacion_excepcion = values.frm_respCot_personalizacion_excepcion;

      await completeTask(payload);
      setSent(true);
    } catch (err) {
      console.error('[OpcionesCotizacion] Error al derivar:', err);
      alert('Error al derivar la tarea. Revise la consola.');
    }
  }

  // ── States ──────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>{data.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN'}</h1>
          </div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <div className="screen-sent">
            <div className="screen-sent-icon">✓</div>
            <div className="screen-sent-title">Decisión enviada</div>
            <div className="screen-sent-sub">
              La decisión fue enviada correctamente a ProcessMaker.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <div className="spinner" />
          <span>Cargando cotización…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">⚠ Error al cargar la tarea: {error}</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const titulo   = data.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN';
  const numCot   = data.frm_gen_num_cotizacion;
  const numCaso  = data.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Header */}
      <div className="screen-header">
        <div className="title-block">
          <h1>{titulo}</h1>
          <div className="subtitle">
            {numCot  && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      {/* Body: PDF (izquierda) + Panel decisión (derecha) */}
      <div className="screen-body">

        {/* Slip PDF */}
        <div>
          {effectiveFileId ? (
            <PdfViewer
              fileId={effectiveFileId}
              label="Slip de Cotización"
              height={700}
            />
          ) : filesLoading ? (
            <div className="pdf-viewer-state">
              <div className="pdf-spinner" />
              <span>Buscando slip de cotización…</span>
            </div>
          ) : (
            <div className="no-file-card">
              <div className="no-file-icon">📄</div>
              <p>El slip de cotización no está disponible aún.</p>
            </div>
          )}
        </div>

        {/* Panel de decisión */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="decision-panel">
            <div className="decision-panel-header">Decisión de Cotización</div>
            <div className="decision-panel-body">

              {/* Decisión */}
              <div className="field-group">
                <label>
                  Decisión<span className="required">*</span>
                </label>
                <select
                  {...register('frm_respCot_decision', { required: 'Campo requerido' })}
                >
                  <option value="">— Seleccione —</option>
                  {DECISION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.frm_respCot_decision && (
                  <div className="field-error">{errors.frm_respCot_decision.message}</div>
                )}
              </div>

              {/* Comentarios */}
              <div className="field-group">
                <label>Comentarios</label>
                <textarea {...register('frm_respCot_comentarios')} rows={4} />
              </div>

              {/* Motivo de rechazo — solo cuando RECHAZADA */}
              {decision === 'RECHAZADA' && (
                <div className="field-group">
                  <label>
                    Motivo de rechazo<span className="required">*</span>
                  </label>
                  <textarea
                    {...register('frm_respCot_motizoRechazo', {
                      required: decision === 'RECHAZADA' ? 'Campo requerido' : false,
                    })}
                    rows={3}
                  />
                  {errors.frm_respCot_motizoRechazo && (
                    <div className="field-error">{errors.frm_respCot_motizoRechazo.message}</div>
                  )}
                </div>
              )}

              {/* Personalización/excepción — solo cuando PERSONALIZACION_EXCEPCION */}
              {decision === 'PERSONALIZACION_EXCEPCION' && (
                <div className="field-group">
                  <label>
                    Personalización / Excepción<span className="required">*</span>
                  </label>
                  <textarea
                    {...register('frm_respCot_personalizacion_excepcion', {
                      required: decision === 'PERSONALIZACION_EXCEPCION' ? 'Campo requerido' : false,
                    })}
                    rows={3}
                  />
                  {errors.frm_respCot_personalizacion_excepcion && (
                    <div className="field-error">{errors.frm_respCot_personalizacion_excepcion.message}</div>
                  )}
                </div>
              )}

              {/* Enlace clausulado RC */}
              {data.frm_gen_enlace_clausulado_rc && (
                <div className="field-group">
                  <label>Clausulado RC</label>
                  <a
                    href={data.frm_gen_enlace_clausulado_rc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download"
                  >
                    Ver clausulado
                  </a>
                </div>
              )}
            </div>

            <div className="decision-actions">
              <ZrButton config="primary:l" as-submit disabled={submitting} loading={submitting}>
                DERIVAR
              </ZrButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
