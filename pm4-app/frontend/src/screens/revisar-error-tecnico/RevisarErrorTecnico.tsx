import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio, ZrButton, ZrAlert } from '../../components/fields/ZdsFields';
import { OPTIONS, RevisarErrorTecnicoFormData } from './variables';
import SeccionDetalleError from './SeccionDetalleError';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

export default function RevisarErrorTecnico() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<RevisarErrorTecnicoFormData>({
    defaultValues: { et_resolucion: 'REINTENTAR' },
  });

  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({
        et_resolucion: 'REINTENTAR',
        ...(task.data as Partial<RevisarErrorTecnicoFormData>),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: RevisarErrorTecnicoFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[RevisarErrorTecnico] Error al enviar:', e);
    }
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

  const err = (name: keyof RevisarErrorTecnicoFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  const submitLabel = w.et_resolucion === 'REINTENTAR'
    ? 'Reintentar Integración ▶'
    : w.et_resolucion === 'ESCALAR'
      ? 'Escalar a Soporte ▶'
      : 'Confirmar Cierre ▶';

  return (
    <div className="screen-wrapper">
      {/* Encabezado */}
      <div className="screen-header">
        <div className="title-block">
          <h1>Revisar y Corregir Error Técnico</h1>
          <div className="subtitle">
            <span>SCR-SP1-T06 · SP1-T06</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Técnico de Integración</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Secciones 1 y 2: Error + Queja afectada */}
        <SeccionDetalleError form={form} />

        {/* Sección 3: Análisis y Corrección */}
        <FormSection title="Análisis y Corrección">
          <div className="form-row cols-2">
            <ZdsSelect
              label="Causa Raíz"
              name="et_causaRaiz"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.causaRaiz}
              required
              error={err('et_causaRaiz')}
            />
            <ZdsSelect
              label="Acción Correctiva"
              name="et_accionCorrectiva"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.accionCorrectiva}
              required
              error={err('et_accionCorrectiva')}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsTextarea
              name="et_descripcionCausa"
              control={control}
              label="Descripción de la Causa"
              rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsTextarea
              name="et_descripcionCorreccion"
              control={control}
              label="Descripción de la Corrección Aplicada"
              rules={{ maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
            />
          </div>
        </FormSection>

        {/* Sección 4: Resolución */}
        <FormSection title="Resolución">
          <div className="form-row cols-2">
            <ZdsRadio
              label="Decisión de Resolución"
              name="et_resolucion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.resolucion}
              required
              error={err('et_resolucion')}
            />
            <ZdsInput
              label="Responsable Técnico"
              name="et_responsableTecnico"
              control={control}
              rules={{ required: 'Campo requerido', maxLength: { value: 100, message: 'Máximo 100 caracteres' } }}
              required
              error={err('et_responsableTecnico')}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsTextarea
              name="et_observacionesTecnicas"
              control={control}
              label="Observaciones Técnicas"
              rules={{ maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
            />
          </div>

          {w.et_resolucion === 'REINTENTAR' && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Al confirmar <strong>Reintentar integración</strong>, el sistema ejecutará nuevamente el envío a SmartSupervision con los datos corregidos. Se generará un nuevo log de intento.
            </ZrAlert>
          )}
          {w.et_resolucion === 'ESCALAR' && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              Al <strong>Escalar a soporte</strong>, se creará un ticket de soporte técnico nivel 2 y se notificará al equipo de sistemas. El proceso quedará pausado hasta recibir resolución.
            </ZrAlert>
          )}
          {w.et_resolucion === 'CERRAR_ERROR' && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              Al <strong>Cerrar con error</strong>, la integración quedará marcada como fallida permanentemente. Complete las observaciones técnicas con la justificación antes de continuar.
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
