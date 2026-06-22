import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio, ZrButton, ZrAlert } from '../../components/fields/ZdsFields';
import { OPTIONS, CorregirDatosFormData } from './variables';
import SeccionErroresValidacion from './SeccionErroresValidacion';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

export default function CorregirDatosFormulario() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<CorregirDatosFormData>({
    defaultValues: { qd_codigoPais: '170', cf_decision: 'REENVIAR' },
  });

  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
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
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* ── Sección 1: Errores detectados ── */}
        <SeccionErroresValidacion form={form} />

        {/* ── Sección 2: Datos del Consumidor ── */}
        <FormSection title="Datos del Consumidor">
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            Revise y corrija los campos marcados con error. Los cambios reemplazarán los datos del paso P01-T01.
          </ZrAlert>

          <div className="form-row cols-3">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <ZdsInput
                name="qd_nombreConsumidor"
                control={control}
                label="Nombre Completo del Consumidor"
                required
                error={err('qd_nombreConsumidor')}
                rules={{ required: 'Campo requerido', maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
              />
            </div>
            <ZdsSelect
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
            <ZdsSelect
              label="Tipo de Identificación"
              name="qd_tipoIdentificacion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoIdentificacion}
              required
              error={err('qd_tipoIdentificacion')}
            />
            <ZdsInput
              name="qd_numeroIdentificacion"
              control={control}
              label="Número de Identificación"
              required
              error={err('qd_numeroIdentificacion')}
              rules={{ required: 'Campo requerido', maxLength: { value: 20, message: 'Máximo 20 caracteres' } }}
            />
            <ZdsInput
              name="qd_correoElectronico"
              control={control}
              label="Correo Electrónico"
              required
              error={err('qd_correoElectronico')}
              inputType="email"
              rules={{ required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }}
            />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect
              label="País"
              name="qd_codigoPais"
              control={control}
              options={OPTIONS.codigoPais}
            />
            <ZdsInput
              name="qd_departamento"
              control={control}
              label="Departamento"
            />
            <ZdsInput
              name="qd_municipio"
              control={control}
              label="Municipio"
            />
          </div>
        </FormSection>

        {/* ── Sección 3: Clasificación de la Queja ── */}
        <FormSection title="Clasificación de la Queja">
          <div className="form-row cols-2">
            <ZdsSelect
              label="Producto SFC"
              name="qd_productoSFC"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.productoSFC}
              required
              error={err('qd_productoSFC')}
            />
            <ZdsSelect
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
            <ZdsSelect
              label="Tipo de Solicitud"
              name="qd_tipoSolicitud"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoSolicitud}
              required
              error={err('qd_tipoSolicitud')}
            />
            <ZdsSelect
              label="Instancia de Recepción"
              name="qd_instanciaRecepcion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.instanciaRecepcion}
              required
              error={err('qd_instanciaRecepcion')}
            />
            <ZdsSelect
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
            <ZdsSelect
              label="Admisión"
              name="qd_admision"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.admision}
              required
              error={err('qd_admision')}
            />
            <ZdsSelect
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
            <ZdsInput
              name="qd_asunto"
              control={control}
              label="Asunto"
              required
              error={err('qd_asunto')}
              rules={{ required: 'Campo requerido', maxLength: { value: 300, message: 'Máximo 300 caracteres' } }}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsTextarea
              name="qd_descripcionQueja"
              control={control}
              label="Descripción de la Queja"
              required
              error={isSubmitted ? err('qd_descripcionQueja') : undefined}
              rules={{ required: 'Campo requerido', maxLength: { value: 4000, message: 'Máximo 4000 caracteres' } }}
              maxLength={4000}
            />
          </div>
        </FormSection>

        {/* ── Sección 4: Decisión ── */}
        <FormSection title="Decisión">
          <div className="form-row cols-1">
            <ZdsRadio
              label="¿Qué desea hacer con los datos corregidos?"
              name="cf_decision"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.decision}
              required
              error={err('cf_decision')}
            />
          </div>

          {w.cf_decision === 'REENVIAR' && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Al confirmar, el sistema volverá a ejecutar la validación preventiva con los datos corregidos y, si pasa, registrará la queja ante SmartSupervision.
            </ZrAlert>
          )}
          {w.cf_decision === 'ESCALAR' && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              La queja será asignada a un supervisor para revisión y radicación manual ante SmartSupervision. Incluya observaciones que justifiquen el escalamiento.
            </ZrAlert>
          )}

          <div className="form-row cols-1">
            <ZdsTextarea
              name="cf_observacionesCorreccion"
              control={control}
              label="Observaciones de Corrección"
              error={err('cf_observacionesCorreccion')}
              rules={{ maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
              maxLength={2000}
            />
          </div>
        </FormSection>

        {/* ── Barra de acciones ── */}
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
