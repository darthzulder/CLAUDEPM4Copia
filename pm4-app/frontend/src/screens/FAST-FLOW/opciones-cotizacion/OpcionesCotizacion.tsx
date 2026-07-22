import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../core/useTask';
import { resolveFileId } from '../../../core/useRequestFiles';
import PdfViewer from '../../../components/PdfViewer';
import { ZrButton, ZdsSelect, ZdsTextarea, ZrTabs, ZrAlert, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import {
  DECISION_OPTIONS,
  LINEAS_CONFIG,
  type OpcionesCotizacionData,
  type DecisionValue,
} from './variables';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface FormValues {
  frm_respCot_decision: DecisionValue | '';
  frm_respCot_comentarios: string;
  frm_respCot_motizoRechazo: string;
  frm_respCot_personalizacion_excepcion: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function OpcionesCotizacion() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnSent, setBlnSent] = useState(false);
  const [strActiveTab, setStrActiveTab] = useState('');

  const objData = (task?.data ?? {}) as unknown as OpcionesCotizacionData;

  // Líneas activas según los productos seleccionados en la solicitud
  const lstActiveLines = LINEAS_CONFIG.filter((objLine) => Boolean(objData[objLine.prodField]));

  // Activamos el primer tab disponible cuando cargan los datos
  useEffect(() => {
    if (lstActiveLines.length === 0) return;
    if (!lstActiveLines.find((objLine) => objLine.key === strActiveTab)) {
      setStrActiveTab(lstActiveLines[0].key);
    }
  }, [lstActiveLines.map((objLine) => objLine.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolvemos el fileId para el tab activo (solo desde output_slipCotizacion_{key})
  const objCurrentLine = lstActiveLines.find((objLine) => objLine.key === strActiveTab);
  const intEffectiveFileId = objCurrentLine ? resolveFileId(objData[objCurrentLine.slipField]) : null;

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

  // Pre-poblamos el formulario con la decisión previa del caso
  useEffect(() => {
    if (!task?.data) return;
    reset({
      frm_respCot_decision: (objData.frm_respCot_decision as DecisionValue) || '',
      frm_respCot_comentarios: objData.frm_respCot_comentarios || '',
      frm_respCot_motizoRechazo: objData.frm_respCot_motizoRechazo || '',
      frm_respCot_personalizacion_excepcion: objData.frm_respCot_personalizacion_excepcion || '',
    });
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  const strDecision = watch('frm_respCot_decision');

  async function onSubmit(in_objValues: FormValues) {
    try {
      // Copiamos los datos del caso omitiendo los campos internos (_)
      const objRaw = task?.data as Record<string, unknown> ?? {};
      const dicPayload: Record<string, unknown> = {};
      for (const [strKey, objVal] of Object.entries(objRaw)) {
        if (!strKey.startsWith('_')) dicPayload[strKey] = objVal;
      }
      dicPayload.frm_respCot_decision                  = in_objValues.frm_respCot_decision;
      dicPayload.frm_respCot_comentarios               = in_objValues.frm_respCot_comentarios;
      dicPayload.frm_respCot_motizoRechazo             = in_objValues.frm_respCot_motizoRechazo;
      dicPayload.frm_respCot_personalizacion_excepcion = in_objValues.frm_respCot_personalizacion_excepcion;

      await completeTask(dicPayload);
      setBlnSent(true);
    } catch (excError) {
      console.error('[OpcionesCotizacion] Error al derivar:', excError);
      alert('Error al derivar la tarea. Revise la consola.');
    }
  }

  // ── Estados ───────────────────────────────────────────────────────────────
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title={objData.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN'} />
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

  // Datos de cabecera para el encabezado
  const strTitle  = objData.frm_titulo || 'VISUALIZAR SLIP Y OPCIONES DE COTIZACIÓN';
  const strQuoteNum  = objData.frm_gen_num_cotizacion;
  const strCaseNum = objData.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <ZrLoader />
        </div>
      )}

      {/* Cabecera */}
      <ScreenHeader
        title={strTitle}
        subtitle={[
          strQuoteNum ? `Cotización # ${strQuoteNum}` : null,
          strCaseNum ? `Caso # ${strCaseNum}` : null,
        ]}
      />

      {/* Cuerpo: PDF (izquierda) + Panel decisión (derecha) */}
      <div className="screen-body">

        {/* Área de slips con tabs por línea */}
        <div z-flex="col:75">
          {lstActiveLines.length > 1 && (
            <ZrTabs
              model={Math.max(1, lstActiveLines.findIndex((objLine) => objLine.key === strActiveTab) + 1)}
              onChange={(intIdx: number) => { const objLine = lstActiveLines[intIdx - 1]; if (objLine) setStrActiveTab(objLine.key); }}
              {...({ tabs: lstActiveLines.map((objLine) => ({ name: objLine.label })) } as Record<string, unknown>)}
            />
          )}

          {intEffectiveFileId ? (
            <PdfViewer
              fileId={intEffectiveFileId}
              label={objCurrentLine ? `Slip — ${objCurrentLine.label}` : 'Slip de Cotización'}
              height={700}
            />
          ) : (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              {lstActiveLines.length === 0
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

            {strDecision === 'RECHAZADA' && (
              <ZdsTextarea
                name="frm_respCot_motizoRechazo"
                control={control}
                label="Motivo de rechazo"
                rules={{ required: 'Campo requerido' }}
                required
                error={errors.frm_respCot_motizoRechazo?.message}
              />
            )}

            {strDecision === 'PERSONALIZACION_EXCEPCION' && (
              <ZdsTextarea
                name="frm_respCot_personalizacion_excepcion"
                control={control}
                label="Personalización / Excepción"
                rules={{ required: 'Campo requerido' }}
                required
                error={errors.frm_respCot_personalizacion_excepcion?.message}
              />
            )}

            {objData.frm_gen_enlace_clausulado_rc && (
              <ZrButton
                config="secondary:s"
                icon="file-blank:line"
                href={objData.frm_gen_enlace_clausulado_rc}
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
