import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import RadioField from '../../components/fields/RadioField';
import { OPTIONS, CorregirErrorFuncionalSSFormData } from './variables';
import SeccionErrorSS from './SeccionErrorSS';

function ZurichLogo() {
  return (
    <svg width="80" height="40" viewBox="0 0 120 60" fill="none">
      <text x="4" y="42" fontFamily="Arial" fontSize="32" fontWeight="900" fill="#fff" letterSpacing="-1">Z</text>
      <text x="28" y="38" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#fff">ZURICH</text>
    </svg>
  );
}

export default function CorregirErrorFuncionalSS() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<CorregirErrorFuncionalSSFormData>({
    defaultValues: { qd_codigoPais: '170', ef_decision: 'CORREGIR_REENVIAR' },
  });

  const { register, control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({
        qd_codigoPais: '170',
        ef_decision: 'CORREGIR_REENVIAR',
        ...(task.data as Partial<CorregirErrorFuncionalSSFormData>),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: CorregirErrorFuncionalSSFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[CorregirErrorFuncionalSS] Error al enviar:', e);
    }
  };

  const err = (name: keyof CorregirErrorFuncionalSSFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><div className="spinner" /></div></div>;
  }
  if (error) {
    return <div className="screen-wrapper"><div className="screen-error">Error al cargar el formulario: {error}</div></div>;
  }

  const submitLabel =
    w.ef_decision === 'CORREGIR_REENVIAR'  ? 'Reenviar a SmartSupervision ▶' :
    w.ef_decision === 'ESCALAR'            ? 'Escalar a Supervisor ▶' :
                                             'Registrar Manualmente ▶';

  return (
    <div className="screen-wrapper">
      {/* ── Encabezado ── */}
      <div className="screen-header">
        <div className="title-block">
          <h1>Corregir Datos — Error Funcional SmartSupervision</h1>
          <div className="subtitle">
            <span>SP1-T05</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Gestor de Experiencia</span>
          </div>
        </div>
        <ZurichLogo />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* ── Sección 1: Error de SmartSupervision ── */}
        <SeccionErrorSS form={form} />

        {/* ── Sección 2: Datos del Consumidor ── */}
        <FormSection title="👤 Datos del Consumidor">
          <div className="info-banner">
            ℹ Corrija únicamente los campos que SmartSupervision rechazó. Los cambios reemplazarán los datos del caso.
          </div>

          <div className="form-row cols-3">
            <div style={{ gridColumn: 'span 2' }}>
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

        {/* ── Sección 3: Clasificación ── */}
        <FormSection title="📋 Clasificación de la Queja">
          <div className="form-row cols-2">
            <SelectField
              label="Canal de Recepción"
              name="qd_canalRecepcion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.canal}
              required
              error={err('qd_canalRecepcion')}
            />
            <SelectField
              label="Tipo de Solicitud"
              name="qd_tipoSolicitud"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoSolicitud}
              required
              error={err('qd_tipoSolicitud')}
            />
          </div>

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
            <SelectField
              label="Admisión"
              name="qd_admision"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.admision}
              required
              error={err('qd_admision')}
            />
          </div>

          <div className="form-row cols-2">
            <SelectField
              label="Ente de Control"
              name="qd_enteControl"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.enteControl}
              required
              error={err('qd_enteControl')}
            />
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

        {/* ── Sección 4: Registro de cambios ── */}
        <FormSection title="📝 Registro de Correcciones">
          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">
                <span className="required-star">* </span>Campos Modificados
              </label>
              <textarea
                {...register('ef_camposCambiados', {
                  required: 'Indique qué campos modificó',
                  maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
                })}
                className={`form-control textarea${errors.ef_camposCambiados && isSubmitted ? ' is-invalid' : ''}`}
                placeholder="Ej: Corregido tipo de identificación de '3-NIT' a '1-CC', actualizado correo electrónico"
                rows={2}
              />
              {isSubmitted && errors.ef_camposCambiados && (
                <div className="invalid-feedback">{String(errors.ef_camposCambiados.message)}</div>
              )}
            </div>
          </div>
        </FormSection>

        {/* ── Sección 5: Decisión ── */}
        <FormSection title="✅ Decisión">
          <div className="form-row cols-1">
            <RadioField
              label="¿Qué acción tomar con los datos corregidos?"
              name="ef_decision"
              registration={register('ef_decision', { required: 'Campo requerido' })}
              options={OPTIONS.decision}
              required
              error={err('ef_decision')}
            />
          </div>

          {w.ef_decision === 'CORREGIR_REENVIAR' && (
            <div className="info-banner">
              ℹ El sistema enviará nuevamente la queja a SmartSupervision con los datos corregidos. Si SS vuelve a rechazarla con error funcional, volverá a esta pantalla.
            </div>
          )}
          {w.ef_decision === 'ESCALAR' && (
            <div className="warn-banner">
              ⚠ La queja será asignada a un supervisor para revisión y radicación. Documente en la justificación por qué no fue posible corregir el error.
            </div>
          )}
          {w.ef_decision === 'REGISTRAR_MANUAL' && (
            <div className="error-banner">
              ⛔ Se omitirá SmartSupervision y la queja se registrará manualmente en los sistemas internos. Use esta opción solo si el error en SS es un problema del sistema externo. Requiere justificación obligatoria.
            </div>
          )}

          <div className="form-row cols-1">
            <div className="form-group">
              <label className="form-label">
                {w.ef_decision === 'REGISTRAR_MANUAL' && <span className="required-star">* </span>}
                Justificación
              </label>
              <textarea
                {...register('ef_justificacionCorreccion', {
                  required: w.ef_decision === 'REGISTRAR_MANUAL' ? 'Justificación obligatoria para registro manual' : false,
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                })}
                className={`form-control textarea${errors.ef_justificacionCorreccion && isSubmitted ? ' is-invalid' : ''}`}
                placeholder={
                  w.ef_decision === 'REGISTRAR_MANUAL'
                    ? 'Explique por qué se omite SmartSupervision y cómo se garantiza el registro de la queja'
                    : 'Observaciones adicionales sobre la corrección o el escalamiento (opcional)'
                }
                rows={3}
              />
              {isSubmitted && errors.ef_justificacionCorreccion && (
                <div className="invalid-feedback">{String(errors.ef_justificacionCorreccion.message)}</div>
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
