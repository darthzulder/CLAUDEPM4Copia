import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio, ZrButton, ZrAlert } from '../../components/fields/ZdsFields';
import { OPTIONS, CorregirErrorFuncionalSSFormData } from './variables';
import SeccionErrorSS from './SeccionErrorSS';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

export default function CorregirErrorFuncionalSS() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<CorregirErrorFuncionalSSFormData>({
    defaultValues: { qd_codigoPais: '170', ef_decision: 'CORREGIR_REENVIAR' },
  });

  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
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
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* ── Sección 1: Error de SmartSupervision ── */}
        <SeccionErrorSS form={form} />

        {/* ── Sección 2: Datos del Consumidor ── */}
        <FormSection title="Datos del Consumidor">
          <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
            Corrija únicamente los campos que SmartSupervision rechazó. Los cambios reemplazarán los datos del caso.
          </ZrAlert>

          <div className="form-row cols-3">
            <div style={{ gridColumn: 'span 2' }}>
              <ZdsInput
                label="Nombre Completo del Consumidor"
                name="qd_nombreConsumidor"
                control={control}
                rules={{ required: 'Campo requerido', maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
                required
                error={err('qd_nombreConsumidor')}
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
              label="Número de Identificación"
              name="qd_numeroIdentificacion"
              control={control}
              rules={{ required: 'Campo requerido', maxLength: { value: 20, message: 'Máximo 20 caracteres' } }}
              required
              error={err('qd_numeroIdentificacion')}
            />
            <ZdsInput
              label="Correo Electrónico"
              name="qd_correoElectronico"
              control={control}
              rules={{ required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }}
              required
              inputType="email"
              error={err('qd_correoElectronico')}
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
              label="Departamento"
              name="qd_departamento"
              control={control}
            />
            <ZdsInput
              label="Municipio"
              name="qd_municipio"
              control={control}
            />
          </div>
        </FormSection>

        {/* ── Sección 3: Clasificación ── */}
        <FormSection title="Clasificación de la Queja">
          <div className="form-row cols-2">
            <ZdsSelect
              label="Canal de Recepción"
              name="qd_canalRecepcion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.canal}
              required
              error={err('qd_canalRecepcion')}
            />
            <ZdsSelect
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
            <ZdsSelect
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
            <ZdsSelect
              label="Ente de Control"
              name="qd_enteControl"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.enteControl}
              required
              error={err('qd_enteControl')}
            />
            <ZdsInput
              label="Asunto"
              name="qd_asunto"
              control={control}
              rules={{ required: 'Campo requerido', maxLength: { value: 300, message: 'Máximo 300 caracteres' } }}
              required
              error={err('qd_asunto')}
            />
          </div>

          <div className="form-row cols-1">
            <ZdsTextarea
              name="qd_descripcionQueja"
              control={control}
              label="Descripción de la Queja"
              required
              rules={{ required: 'Campo requerido', maxLength: { value: 4000, message: 'Máximo 4000 caracteres' } }}
              maxLength={4000}
              error={isSubmitted ? err('qd_descripcionQueja') : undefined}
            />
          </div>
        </FormSection>

        {/* ── Sección 4: Registro de cambios ── */}
        <FormSection title="Registro de Correcciones">
          <div className="form-row cols-1">
            <ZdsTextarea
              name="ef_camposCambiados"
              control={control}
              label="Campos Modificados"
              required
              rules={{ required: 'Indique qué campos modificó', maxLength: { value: 1000, message: 'Máximo 1000 caracteres' } }}
              maxLength={1000}
              error={isSubmitted ? err('ef_camposCambiados') : undefined}
            />
          </div>
        </FormSection>

        {/* ── Sección 5: Decisión ── */}
        <FormSection title="Decisión">
          <div className="form-row cols-1">
            <ZdsRadio
              label="¿Qué acción tomar con los datos corregidos?"
              name="ef_decision"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.decision}
              required
              error={err('ef_decision')}
            />
          </div>

          {w.ef_decision === 'CORREGIR_REENVIAR' && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              El sistema enviará nuevamente la queja a SmartSupervision con los datos corregidos. Si SS vuelve a rechazarla con error funcional, volverá a esta pantalla.
            </ZrAlert>
          )}
          {w.ef_decision === 'ESCALAR' && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              La queja será asignada a un supervisor para revisión y radicación. Documente en la justificación por qué no fue posible corregir el error.
            </ZrAlert>
          )}
          {w.ef_decision === 'REGISTRAR_MANUAL' && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              Se omitirá SmartSupervision y la queja se registrará manualmente en los sistemas internos. Use esta opción solo si el error en SS es un problema del sistema externo. Requiere justificación obligatoria.
            </ZrAlert>
          )}

          <div className="form-row cols-1">
            <ZdsTextarea
              name="ef_justificacionCorreccion"
              control={control}
              label="Justificación"
              required={w.ef_decision === 'REGISTRAR_MANUAL'}
              rules={{
                required: w.ef_decision === 'REGISTRAR_MANUAL' ? 'Justificación obligatoria para registro manual' : false,
                maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
              }}
              maxLength={2000}
              error={isSubmitted ? err('ef_justificacionCorreccion') : undefined}
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
