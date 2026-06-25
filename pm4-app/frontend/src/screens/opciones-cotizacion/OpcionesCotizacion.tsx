import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import { resolveFileId } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton, ZdsSelect, ZdsTextarea, ZrTabs, ZrAlert, ZrLoader } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import {
  DECISION_OPTIONS,
  LINEAS_CONFIG,
  type OpcionesCotizacionData,
  type DecisionValue,
} from './variables';

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
  const [activeTab, setActiveTab] = useState('');

  const data = (task?.data ?? {}) as unknown as OpcionesCotizacionData;

  // Líneas activas según los productos seleccionados en la solicitud
  const activeLineas = LINEAS_CONFIG.filter((l) => Boolean(data[l.prodField]));

  // Activar el primer tab disponible cuando carguen los datos
  useEffect(() => {
    if (activeLineas.length === 0) return;
    if (!activeLineas.find((l) => l.key === activeTab)) {
      setActiveTab(activeLineas[0].key);
    }
  }, [activeLineas.map((l) => l.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolver el fileId para el tab activo (solo desde output_slipCotizacion_{key})
  const currentLinea = activeLineas.find((l) => l.key === activeTab);
  const effectiveFileId = currentLinea ? resolveFileId(data[currentLinea.slipField]) : null;

  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      frm_respCot_decision: '',
      frm_respCot_comentarios: '',
      frm_respCot_motizoRechazo: '',
      frm_respCot_personalizacion_excepcion: '',
    },
  });

  useEffect(() => {
    if (!task?.data) return;
    reset({
      frm_respCot_decision: (data.frm_respCot_decision as DecisionValue) || '',
      frm_respCot_comentarios: data.frm_respCot_comentarios || '',
      frm_respCot_motizoRechazo: data.frm_respCot_motizoRechazo || '',
      frm_respCot_personalizacion_excepcion: data.frm_respCot_personalizacion_excepcion || '',
    });
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  const decision = watch('frm_respCot_decision');

  async function onSubmit(values: FormValues) {
    try {
      const raw = task?.data as Record<string, unknown> ?? {};
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!k.startsWith('_')) payload[k] = v;
      }
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
        <ScreenHeader title={data.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN'} />
        <div className="screen-content">
          <ResultCard variant="success" title="Decisión enviada">
            <p>
              La decisión fue enviada correctamente a ProcessMaker.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <ZrLoader />
          <span>Cargando cotización…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar la tarea: {error}</ZrAlert>
      </div>
    );
  }

  const titulo  = data.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN';
  const numCot  = data.frm_gen_num_cotizacion;
  const numCaso = data.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <ZrLoader />
        </div>
      )}

      {/* Header */}
      <ScreenHeader
        title={titulo}
        subtitle={[
          numCot ? `Cotización # ${numCot}` : null,
          numCaso ? `Caso # ${numCaso}` : null,
        ]}
      />

      {/* Body: PDF (izquierda) + Panel decisión (derecha) */}
      <div className="screen-body">

        {/* Área de slips con tabs por línea */}
        <div z-flex="col:75">
          {activeLineas.length > 1 && (
            <ZrTabs
              model={Math.max(1, activeLineas.findIndex((l) => l.key === activeTab) + 1)}
              onChange={(idx: number) => { const l = activeLineas[idx - 1]; if (l) setActiveTab(l.key); }}
              {...({ tabs: activeLineas.map((l) => ({ name: l.label })) } as Record<string, unknown>)}
            />
          )}

          {effectiveFileId ? (
            <PdfViewer
              fileId={effectiveFileId}
              label={currentLinea ? `Slip — ${currentLinea.label}` : 'Slip de Cotización'}
              height={700}
            />
          ) : (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              {activeLineas.length === 0
                ? 'No hay productos activos en este caso.'
                : 'El slip de cotización no está disponible aún.'}
            </ZrAlert>
          )}
        </div>

        {/* Panel de decisión */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormSection
            title="Decisión de Cotización"
            footer={
              <div className="decision-actions">
                <ZrButton config="primary:l" onClick={() => { handleSubmit(onSubmit)(); }} disabled={submitting} loading={submitting}>DERIVAR</ZrButton>
              </div>
            }
          >
            <ZdsSelect
              name="frm_respCot_decision"
              control={control}
              label="Decisión"
              options={DECISION_OPTIONS}
              rules={{ required: 'Campo requerido' }}
              required
              error={errors.frm_respCot_decision?.message}
            />

            <ZdsTextarea
              name="frm_respCot_comentarios"
              control={control}
              label="Comentarios"
            />

            {decision === 'RECHAZADA' && (
              <ZdsTextarea
                name="frm_respCot_motizoRechazo"
                control={control}
                label="Motivo de rechazo"
                rules={{ required: 'Campo requerido' }}
                required
                error={errors.frm_respCot_motizoRechazo?.message}
              />
            )}

            {decision === 'PERSONALIZACION_EXCEPCION' && (
              <ZdsTextarea
                name="frm_respCot_personalizacion_excepcion"
                control={control}
                label="Personalización / Excepción"
                rules={{ required: 'Campo requerido' }}
                required
                error={errors.frm_respCot_personalizacion_excepcion?.message}
              />
            )}

            {data.frm_gen_enlace_clausulado_rc && (
              <ZrButton
                config="secondary:s"
                icon="file-blank:line"
                href={data.frm_gen_enlace_clausulado_rc}
                target="_blank"
              >
                Ver clausulado RC
              </ZrButton>
            )}
          </FormSection>
        </form>
      </div>
    </div>
  );
}
