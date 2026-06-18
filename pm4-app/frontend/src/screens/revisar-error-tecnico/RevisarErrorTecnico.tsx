import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import RadioField from '../../components/fields/RadioField';
import { OPTIONS, RevisarErrorTecnicoFormData } from './variables';
import SeccionDetalleError from './SeccionDetalleError';

function ZurichLogo() {
  return (
    <svg width="80" height="40" viewBox="0 0 120 60" fill="none">
      <text x="4" y="42" fontFamily="Arial" fontSize="32" fontWeight="900" fill="#fff" letterSpacing="-1">Z</text>
      <text x="28" y="38" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#fff">ZURICH</text>
    </svg>
  );
}

export default function RevisarErrorTecnico() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<RevisarErrorTecnicoFormData>({
    defaultValues: { et_resolucion: 'REINTENTAR' },
  });

  const { register, control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
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
      {/* ── Encabezado ── */}
      <div className="screen-header">
        <div className="title-block">
          <h1>Revisar y Corregir Error Técnico</h1>
          <div className="subtitle">
            <span>SCR-SP1-T06 · SP1-T06</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Técnico de Integración</span>
          </div>
        </div>
        <ZurichLogo />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* ── Secciones 1 y 2: Error + Queja afectada ── */}
        <SeccionDetalleError form={form} />

        {/* ── Sección 3: Análisis y Corrección ── */}
        <FormSection title="🔍 Análisis y Corrección">
          <div className="form-row cols-2">
            <SelectField
              label="Causa Raíz"
              name="et_causaRaiz"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.causaRaiz}
              required
              error={err('et_causaRaiz')}
            />
            <SelectField
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
            <div className="form-group">
              <label className="form-label">
                <span className="required-star">* </span>Descripción de la Causa
              </label>
              <textarea
                {...register('et_descripcionCausa', {
                  required: 'Campo requerido',
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                className={`form-control textarea${errors.et_descripcionCausa ? ' is-invalid' : ''}`}
                placeholder="Descripción detallada de la causa raíz identificada"
                rows={3}
              />
              {isSubmitted && errors.et_descripcionCausa && (
                <div className="invalid-feedback">{String(errors.et_descripcionCausa.message)}</div>
              )}
            </div>
          </div>

          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">Descripción de la Corrección Aplicada</label>
              <textarea
                {...register('et_descripcionCorreccion', {
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                className={`form-control textarea${errors.et_descripcionCorreccion ? ' is-invalid' : ''}`}
                placeholder="Detalle los cambios realizados para corregir el error (si aplica)"
                rows={3}
              />
              {errors.et_descripcionCorreccion && (
                <div className="invalid-feedback">{String(errors.et_descripcionCorreccion.message)}</div>
              )}
            </div>
          </div>
        </FormSection>

        {/* ── Sección 4: Resolución ── */}
        <FormSection title="✅ Resolución">
          <div className="form-row cols-2">
            <RadioField
              label="Decisión de Resolución"
              name="et_resolucion"
              registration={register('et_resolucion', { required: 'Campo requerido' })}
              options={OPTIONS.resolucion}
              required
              error={err('et_resolucion')}
            />
            <InputField
              label="Responsable Técnico"
              registration={register('et_responsableTecnico', {
                required: 'Campo requerido',
                maxLength: { value: 100, message: 'Máximo 100 caracteres' },
              })}
              required
              error={err('et_responsableTecnico')}
              placeholder="Nombre del técnico que gestiona este error"
            />
          </div>

          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">Observaciones Técnicas</label>
              <textarea
                {...register('et_observacionesTecnicas', {
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                className={`form-control textarea${errors.et_observacionesTecnicas ? ' is-invalid' : ''}`}
                placeholder="Información adicional para el equipo técnico o de gestión de quejas"
                rows={3}
              />
              {errors.et_observacionesTecnicas && (
                <div className="invalid-feedback">{String(errors.et_observacionesTecnicas.message)}</div>
              )}
            </div>
          </div>

          {w.et_resolucion === 'REINTENTAR' && (
            <div className="info-banner">
              ℹ Al confirmar <strong>Reintentar integración</strong>, el sistema ejecutará nuevamente el envío a SmartSupervision con los datos corregidos. Se generará un nuevo log de intento.
            </div>
          )}
          {w.et_resolucion === 'ESCALAR' && (
            <div className="warn-banner">
              ⚠ Al <strong>Escalar a soporte</strong>, se creará un ticket de soporte técnico nivel 2 y se notificará al equipo de sistemas. El proceso quedará pausado hasta recibir resolución.
            </div>
          )}
          {w.et_resolucion === 'CERRAR_ERROR' && (
            <div className="error-banner">
              ⛔ Al <strong>Cerrar con error</strong>, la integración quedará marcada como fallida permanentemente. Complete las observaciones técnicas con la justificación antes de continuar.
            </div>
          )}
        </FormSection>

        {/* ── Barra de acciones ── */}
        <div className="actions-bar">
          <button type="button" className="btn-cancelar" onClick={() => window.history.back()}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-borrador"
            disabled={submitting}
            onClick={() => completeTask({ ...w, _draft: true } as Record<string, unknown>)}
          >
            💾 Guardar Borrador
          </button>
          <button type="submit" className="btn-crear" disabled={submitting}>
            {submitting ? 'Enviando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
