import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsFileInput,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import pm4 from '../../../../api/pm4Client';
import {
  DEFAULTS, ADJUNTO_KEY, MAX_ADJUNTO_MB,
  type RespuestaAreaResponsableFormData, type AccionRespuestaArea,
} from './variables';

export default function RespuestaAreaResponsable() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());

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

  const uploadFiles = async (requestId: number) => {
    for (const [docKey, file] of fileRegistry.current.entries()) {
      const fd = new FormData();
      fd.append('file', file);
      await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
    }
  };

  const enviarCon = (accion: AccionRespuestaArea) => async (data: RespuestaAreaResponsableFormData) => {
    try {
      const requestId = task?.process_request_id;
      if (requestId && fileRegistry.current.size > 0) await uploadFiles(requestId);
      await completeTask({ ...data, qd_accion: accion } as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[RespuestaAreaResponsable] Error al enviar:', e);
    }
  };

  // ACT-0052-01 Enviar comentario (valida RUL-0052-01) · ACT-0052-02 Guardar Borrador.
  const onEnviar = handleSubmit(enviarCon('ENVIAR'));
  const onGuardarBorrador = () => enviarCon('GUARDAR_BORRADOR')(w);

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
              <ZdsInput name="qd_nombreConsumidor" control={control} label="Nombre del Consumidor" readOnly />
              <ZdsInput name="qd_identificacion" control={control} label="Tipo y N.° de Identificación" readOnly />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_correoElectronico" control={control} label="Correo Electrónico" readOnly
                helpText="Destino del correo de respuesta final." />
              <ZdsInput name="qd_tipoPersona" control={control} label="Tipo de Persona" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Clasificación Regulatoria (SEC-060, solo lectura) ── */}
          <FormSection title="Clasificación Regulatoria">
            <div className="form-row cols-3">
              <ZdsInput name="qd_canal" control={control} label="Canal de Recepción" readOnly />
              <ZdsInput name="qd_productoSFC" control={control} label="Producto SFC" readOnly />
              <ZdsInput name="qd_motivoSFC" control={control} label="Motivo SFC" readOnly />
            </div>
            <div className="form-row cols-3">
              <ZdsInput name="qd_instanciaPunto" control={control} label="Instancia / Punto de Recepción" readOnly />
              <ZdsInput name="qd_admision" control={control} label="Admisión" readOnly />
              <ZdsInput name="qd_enteControl" control={control} label="Ente de Control" readOnly />
            </div>
          </FormSection>

          {/* ── S3 · Descripción de la Queja (SEC-061, solo lectura) ── */}
          <FormSection title="Descripción de la Queja">
            <div className="form-row cols-1">
              <ZdsInput name="qd_resumen" control={control} label="Asunto de la Queja" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_textoQueja" control={control} label="Descripción / Texto de la Queja" readOnly />
            </div>
          </FormSection>

          {/* ── S4 · Datos de la Asignación (SEC-057, solo lectura) ── */}
          <FormSection title="Datos de la Asignación">
            <div className="form-row cols-2">
              <ZdsInput name="qd_areaAsignada" control={control} label="Área" readOnly
                helpText="Área responsable asignada al caso." />
              <ZdsInput name="qd_responsableAsignado" control={control} label="Responsable" readOnly
                helpText="Usuario asignado para gestionar el caso." />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_observacionesAsignacion" control={control} label="Observaciones" readOnly
                helpText="Observaciones registradas al momento de la asignación." />
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
