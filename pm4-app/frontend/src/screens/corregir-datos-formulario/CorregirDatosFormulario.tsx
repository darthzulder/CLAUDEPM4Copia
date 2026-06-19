import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import RadioField from '../../components/fields/RadioField';
import { OPTIONS, CorregirDatosFormData } from './variables';
import SeccionErroresValidacion from './SeccionErroresValidacion';

function ZurichLogo() {
  return (
    <svg width="80" height="40" viewBox="0 0 120 60" fill="none">
      <text x="4" y="42" fontFamily="Arial" fontSize="32" fontWeight="900" fill="#fff" letterSpacing="-1">Z</text>
      <text x="28" y="38" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#fff">ZURICH</text>
    </svg>
  );
}

export default function CorregirDatosFormulario() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<CorregirDatosFormData>({
    defaultValues: { qd_codigoPais: '170', cf_decision: 'REENVIAR' },
  });

  const { register, control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({
        qd_codigoPais: '170',
        cf_decision: 'REENVIAR',
        ...(task.data as Partial<CorregirDatosFormData>),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: CorregirDatosFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[CorregirDatosFormulario] Error al enviar:', e);
    }
  };

  const err = (name: keyof CorregirDatosFormData): string | undefined => {
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

  const submitLabel = w.cf_decision === 'REENVIAR'
    ? 'Reenviar a SmartSupervision ▶'
    : 'Escalar para Revisión Manual ▶';

  return (
    <div className="screen-wrapper">
      {/* ── Encabezado ── */}
      <div className="screen-header">
        <div className="title-block">
          <h1>Corregir Datos del Formulario</h1>
          <div className="subtitle">
            <span>P01-T07</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Gestor de Experiencia</span>
          </div>
        </div>
        <ZurichLogo />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* ── Sección 1: Errores detectados ── */}
        <SeccionErroresValidacion form={form} />

        {/* ── Sección 2: Datos del Consumidor ── */}
        <FormSection title="👤 Datos del Consumidor">
          <div className="warn-banner">
            ⚠ Revise y corrija los campos marcados con error. Los cambios reemplazarán los datos del paso P01-T01.
          </div>

          <div className="form-row cols-3">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <InputField
                label="Nombre Completo del Consumidor"
                registration={register('qd_nombreConsumidor', {
                  required: 'Campo requerido',
                  maxLength: { value: 200, message: 'Máximo 200 caracteres' },
                })}
                required
                error={err('qd_nombreConsumidor')}
                placeholder="Nombre y apellidos"
              />
            </div>
            <SelectField
              label="Tipo de Persona"
              name="qd_tipoPersona"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoPersona}
              required
              error={err('qd_tipoPersona')}
            />
          </div>

          <div className="form-row cols-3">
            <SelectField
              label="Tipo de Identificación"
              name="qd_tipoIdentificacion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoIdentificacion}
              required
              error={err('qd_tipoIdentificacion')}
            />
            <InputField
              label="Número de Identificación"
              registration={register('qd_numeroIdentificacion', {
                required: 'Campo requerido',
                maxLength: { value: 20, message: 'Máximo 20 caracteres' },
              })}
              required
              error={err('qd_numeroIdentificacion')}
              placeholder="Número de documento"
            />
            <InputField
              label="Correo Electrónico"
              registration={register('qd_correoElectronico', {
                required: 'Campo requerido',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })}
              required
              error={err('qd_correoElectronico')}
              placeholder="consumidor@ejemplo.com"
            />
          </div>

          <div className="form-row cols-3">
            <SelectField
              label="País"
              name="qd_codigoPais"
              control={control}
              options={OPTIONS.codigoPais}
            />
            <InputField
              label="Departamento"
              registration={register('qd_departamento')}
              placeholder="Ej. Bogotá D.C."
            />
            <InputField
              label="Municipio"
              registration={register('qd_municipio')}
              placeholder="Ej. Bogotá"
            />
          </div>
        </FormSection>

        {/* ── Sección 3: Clasificación de la Queja ── */}
        <FormSection title="📋 Clasificación de la Queja">
          <div className="form-row cols-2">
            <SelectField
              label="Producto SFC"
              name="qd_productoSFC"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.productoSFC}
              required
              error={err('qd_productoSFC')}
            />
            <SelectField
              label="Motivo SFC"
              name="qd_motivoSFC"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.motivoSFC}
              required
              error={err('qd_motivoSFC')}
            />
          </div>

          <div className="form-row cols-3">
            <SelectField
              label="Tipo de Solicitud"
              name="qd_tipoSolicitud"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoSolicitud}
              required
              error={err('qd_tipoSolicitud')}
            />
            <SelectField
              label="Instancia de Recepción"
              name="qd_instanciaRecepcion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.instanciaRecepcion}
              required
              error={err('qd_instanciaRecepcion')}
            />
            <SelectField
              label="Punto de Recepción"
              name="qd_puntoRecepcion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.puntoRecepcion}
              required
              error={err('qd_puntoRecepcion')}
            />
          </div>

          <div className="form-row cols-2">
            <SelectField
              label="Admisión"
              name="qd_admision"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.admision}
              required
              error={err('qd_admision')}
            />
            <SelectField
              label="Ente de Control"
              name="qd_enteControl"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.enteControl}
              required
              error={err('qd_enteControl')}
            />
          </div>

          <div className="form-row cols-1">
            <InputField
              label="Asunto"
              registration={register('qd_asunto', {
                required: 'Campo requerido',
                maxLength: { value: 300, message: 'Máximo 300 caracteres' },
              })}
              required
              error={err('qd_asunto')}
              placeholder="Resumen breve de la queja"
            />
          </div>

          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">
                <span className="required-star">* </span>Descripción de la Queja
              </label>
              <textarea
                {...register('qd_descripcionQueja', {
                  required: 'Campo requerido',
                  maxLength: { value: 4000, message: 'Máximo 4000 caracteres' },
                })}
                className={`form-control textarea${errors.qd_descripcionQueja ? ' is-invalid' : ''}`}
                placeholder="Descripción detallada de los hechos de la queja"
                rows={4}
              />
              {isSubmitted && errors.qd_descripcionQueja && (
                <div className="invalid-feedback">{String(errors.qd_descripcionQueja.message)}</div>
              )}
            </div>
          </div>
        </FormSection>

        {/* ── Sección 4: Decisión ── */}
        <FormSection title="✅ Decisión">
          <div className="form-row cols-1">
            <RadioField
              label="¿Qué desea hacer con los datos corregidos?"
              name="cf_decision"
              registration={register('cf_decision', { required: 'Campo requerido' })}
              options={OPTIONS.decision}
              required
              error={err('cf_decision')}
            />
          </div>

          {w.cf_decision === 'REENVIAR' && (
            <div className="info-banner">
              ℹ Al confirmar, el sistema volverá a ejecutar la validación preventiva con los datos corregidos y, si pasa, registrará la queja ante SmartSupervision.
            </div>
          )}
          {w.cf_decision === 'ESCALAR' && (
            <div className="warn-banner">
              ⚠ La queja será asignada a un supervisor para revisión y radicación manual ante SmartSupervision. Incluya observaciones que justifiquen el escalamiento.
            </div>
          )}

          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">Observaciones de Corrección</label>
              <textarea
                {...register('cf_observacionesCorreccion', {
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                className={`form-control textarea${errors.cf_observacionesCorreccion ? ' is-invalid' : ''}`}
                placeholder="Describa los cambios realizados o el motivo del escalamiento"
                rows={3}
              />
              {errors.cf_observacionesCorreccion && (
                <div className="invalid-feedback">{String(errors.cf_observacionesCorreccion.message)}</div>
              )}
            </div>
          </div>
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
