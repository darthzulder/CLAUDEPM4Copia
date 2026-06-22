import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio, ZrButton, ZrAlert } from '../../components/fields/ZdsFields';
import { OPTIONS, RevisarQuejaAsignarFormData } from './variables';
import SeccionResumenQueja from './SeccionResumenQueja';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

export default function RevisarQuejaAsignar() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<RevisarQuejaAsignarFormData>({
    defaultValues: { ra_prioridad: 'NORMAL', ra_decision: 'ASIGNAR' },
  });

  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({
        ra_prioridad: 'NORMAL',
        ra_decision: 'ASIGNAR',
        ...(task.data as Partial<RevisarQuejaAsignarFormData>),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: RevisarQuejaAsignarFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[RevisarQuejaAsignar] Error al enviar:', e);
    }
  };

  const err = (name: keyof RevisarQuejaAsignarFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
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

  const submitLabel = w.ra_decision === 'ASIGNAR'
    ? 'Asignar Responsable ▶'
    : w.ra_decision === 'DEVOLVER'
      ? 'Devolver para Corrección ▶'
      : 'Escalar a Supervisor Senior ▶';

  return (
    <div className="screen-wrapper">
      {/* Encabezado */}
      <div className="screen-header">
        <div className="title-block">
          <h1>Revisar Queja Radicada y Asignar Responsable</h1>
          <div className="subtitle">
            <span>SP2-T01</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Supervisor / Coordinador de Quejas</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Secciones 1-3: Resumen de la queja radicada (solo lectura) */}
        <SeccionResumenQueja form={form} />

        {/* Sección 4: Asignación de Responsable */}
        <FormSection title="Asignación de Responsable">

          <div className="form-row cols-2">
            <ZdsInput
              name="ra_responsableAsignado"
              control={control}
              label="Responsable Asignado"
              rules={{ required: 'Campo requerido', maxLength: { value: 150, message: 'Máximo 150 caracteres' } }}
              required
              error={err('ra_responsableAsignado')}
            />
            <ZdsSelect
              label="Área Responsable"
              name="ra_areaResponsable"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.areaResponsable}
              required
              error={err('ra_areaResponsable')}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsRadio
              name="ra_prioridad"
              control={control}
              label="Prioridad de Atención"
              options={OPTIONS.prioridad}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('ra_prioridad')}
            />
          </div>

          {w.ra_prioridad === 'CRITICA' && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>Prioridad Crítica:</strong> Esta queja requiere atención inmediata. El responsable asignado será notificado y el caso quedará marcado como prioritario en el sistema.
            </ZrAlert>
          )}
          {w.ra_prioridad === 'ALTA' && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              <strong>Prioridad Alta:</strong> Se recomienda gestionar esta queja antes del plazo SLA para evitar incumplimiento regulatorio.
            </ZrAlert>
          )}

          <div className="form-row cols-1">
            <ZdsTextarea
              name="ra_instrucciones"
              control={control}
              label="Instrucciones para el Responsable"
              rules={{ maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
              error={err('ra_instrucciones')}
            />
          </div>
        </FormSection>

        {/* Sección 5: Revisión y Decisión */}
        <FormSection title="Revisión y Decisión">

          <div className="form-row cols-1">
            <ZdsTextarea
              name="ra_observacionesRevision"
              control={control}
              label="Observaciones de la Revisión"
              rules={{ maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
              error={err('ra_observacionesRevision')}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsRadio
              name="ra_decision"
              control={control}
              label="Decisión"
              options={OPTIONS.decision}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('ra_decision')}
            />
          </div>

          {w.ra_decision === 'ASIGNAR' && (
            <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
              Al confirmar, la queja será asignada al responsable seleccionado y el proceso continuará con la gestión de la respuesta al consumidor.
            </ZrAlert>
          )}
          {w.ra_decision === 'DEVOLVER' && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              La queja será devuelta al Gestor de Experiencia para corrección de datos antes de continuar. Incluya observaciones que justifiquen la devolución.
            </ZrAlert>
          )}
          {w.ra_decision === 'ESCALAR' && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La queja será escalada a un supervisor senior para revisión adicional. El proceso quedará en espera hasta recibir la decisión del escalamiento.
            </ZrAlert>
          )}
        </FormSection>

        {/* Barra de acciones */}
        <div className="actions-bar">
          <ZrButton config="secondary:s" onClick={() => window.history.back()}>Cancelar</ZrButton>
          <ZrButton
            config="secondary:s"
            disabled={submitting}
            onClick={() => completeTask({ ...w, _draft: true } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton config="positive:s" onClick={() => { handleSubmit(onSubmit)(); }} loading={submitting} disabled={submitting}>{submitLabel}</ZrButton>
        </div>
      </form>
    </div>
  );
}
