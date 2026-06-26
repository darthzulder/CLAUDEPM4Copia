import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsSelect, ZdsCheckboxField,
  ZdsStatusBadge, ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import pm4 from '../../../../api/pm4Client';
import { useCollection } from '../../../../core/useCollection';
import { COLLECTION_DEFS, DEFAULTS, ADJUNTO_KEYS, CrearRecibirQuejaFormData, WEB_ENTRY_PROCESS_ID, WEB_ENTRY_EVENT_ID } from './variables';
import { fieldError } from './errorHelper';
import SeccionConsumidor from './SeccionConsumidor';
import SeccionDetalleQueja from './SeccionDetalleQueja';

// Mapea el estado SmartSupervision (FLD-338) al color del semáforo.
function estadoVariant(estado: string): 'success' | 'danger' | 'info' | 'neutral' {
  const e = estado.toLowerCase();
  if (e.includes('acept') || e.includes('verde') || e.includes('ok')) return 'success';
  if (e.includes('rechaz') || e.includes('error') || e.includes('rojo')) return 'danger';
  if (e.includes('proceso') || e.includes('pendiente') || e.includes('amarillo')) return 'info';
  return 'neutral';
}

export default function CrearRecibirQueja() {
  const { task, loading, error, submitting, completeTask, isWebEntry } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [sent, setSent] = useState(false);

  const form = useForm<CrearRecibirQuejaFormData>({ defaultValues: { ...DEFAULTS } });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const { options: tipoSolicitudOpts } = useCollection(COLLECTION_DEFS.tipoSolicitud);
  const { options: rolOpts } = useCollection(COLLECTION_DEFS.rol);

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<CrearRecibirQuejaFormData>) });
  }, [task, reset]);

  // RUL-000-01 — el rol determina instancia y punto de recepción (back, readonly).
  useEffect(() => {
    const esDefensor = w.qd_rol === 'DEFENSOR';
    form.setValue('qd_instanciaRecepcion', esDefensor ? '1. Defensor del Consumidor Financiero' : '2. Entidad vigilada');
    form.setValue('qd_puntoRecepcion', '2. Virtual');
  }, [w.qd_rol, form]);

  const uploadFiles = async (requestId: number) => {
    for (const [docKey, file] of fileRegistry.current.entries()) {
      const fd = new FormData();
      fd.append('file', file);
      await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
    }
  };

  const onSubmit = async (data: CrearRecibirQuejaFormData) => {
    try {
      if (isWebEntry) {
        const result = await pm4.post<Record<string, unknown>>(
          `/process_events/${WEB_ENTRY_PROCESS_ID}`,
          data,
          { params: { event: WEB_ENTRY_EVENT_ID } },
        );
        const newRequestId = (result.data?.request_id ?? result.data?.id) as number | undefined;
        if (newRequestId && fileRegistry.current.size > 0) {
          await uploadFiles(newRequestId);
        }
        setSent(true);
      } else {
        const requestId = task?.process_request_id;
        if (requestId && fileRegistry.current.size > 0) {
          await uploadFiles(requestId);
        }
        await completeTask(data as unknown as Record<string, unknown>);
        setSent(true);
      }
    } catch (err) {
      console.error('[CrearRecibirQueja] Error al enviar:', err);
    }
  };

  const limpiarFormulario = () => {
    reset({ ...DEFAULTS });
    fileRegistry.current.clear();
    ADJUNTO_KEYS.forEach((k) => form.setValue(k, ''));
  };

  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Radicación de PQRS" />
        <div className="screen-content">
          <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
            Tu solicitud fue radicada exitosamente. Recibirás una confirmación en el correo registrado.
          </ZrAlert>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  }
  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar el formulario: {error}</ZrAlert>
      </div>
    );
  }

  const err = (name: keyof CrearRecibirQuejaFormData) => fieldError(errors, name, w[name], isSubmitted);
  const puedeEnviar = !!w.qd_autorizacionDatos && !!w.qd_captcha;
  const tieneEstadoSFC = !!w.qd_estadoSmartSupervision || !!w.qd_fechaRadicacionSFC;
  const tieneResponsable = !!w.qd_rolGrupo || !!w.qd_responsable;

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Radicación de PQRS"
        subtitle={[
          'SCR-000 · P01-T00',
          'Gestión de Quejas Directas.',
          'Atención al Consumidor Financiero.',
        ]}
      />

      <div className="screen-content">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── S1: Tipo de Solicitud y Rol ── */}
          <FormSection title="Tipo de Solicitud y Rol">
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Radica tu petición, queja, reclamo, sugerencia o felicitación. Completa los campos obligatorios,
              acepta el tratamiento de datos y valida el captcha para presionar <strong>Enviar PQRS</strong>.
            </ZrAlert>
            <div className="form-row cols-2">
              <ZdsInput name="qd_numeroCaso" control={control} label="Número de Caso (ID BPM)" readOnly
                helpText="Se asigna automáticamente al radicar." />
              <ZdsInput name="qd_fechaHoraCreacion" control={control} label="Fecha y Hora de Creación" readOnly
                helpText="Timestamp automático del sistema." />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_tipoSolicitud" control={control} label="¿A qué está asociado tu comentario?"
                options={tipoSolicitudOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_tipoSolicitud')} />
              <ZdsSelect name="qd_rol" control={control} label="Selecciona tu rol"
                options={rolOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_rol')} />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_puntoRecepcion" control={control} label="Punto de Recepción" readOnly
                helpText="Asignado automáticamente según canal/rol." />
              <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly
                helpText="Asignada automáticamente según el rol." />
            </div>
          </FormSection>

          {/* ── S2: Datos del Consumidor Financiero ── */}
          <SeccionConsumidor form={form} />

          {/* ── S3: Detalle de la Queja ── */}
          <SeccionDetalleQueja form={form} fileRegistry={fileRegistry} />

          {/* ── S4: Autorización y Envío ── */}
          <FormSection title="Autorización y Envío">
            <div className="form-row cols-1">
              <ZdsCheckboxField name="qd_autorizacionDatos" control={control}
                label="Autorizo el tratamiento de mis datos personales conforme a la política de privacidad." />
            </div>
            {isSubmitted && !w.qd_autorizacionDatos && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Debe aceptar el tratamiento de datos personales para poder radicar su solicitud. (MSG-000-04)
              </ZrAlert>
            )}
            <div className="form-row cols-1">
              {/* FLD-336 — validación de seguridad. Representada con un checkbox de
                  confirmación (mismo patrón visual que reCAPTCHA v2) hasta integrar
                  el widget real; el DS no provee componente captcha. */}
              <ZdsCheckboxField name="qd_captcha" control={control}
                label="No soy un robot (validación de seguridad)." />
            </div>
            {isSubmitted && !w.qd_captcha && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                Debe completar la validación de seguridad (captcha) antes de enviar. (MSG-000-05)
              </ZrAlert>
            )}
            <div className="form-row cols-2">
              <ZdsInput name="qd_correoCopia" control={control} label="¿Quieres enviar copia de la respuesta a otro correo?"
                inputType="email"
                rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: usuario@dominio.com' } }}
                error={err('qd_correoCopia')} />
              <div />
            </div>
          </FormSection>

          {/* ── S5: Estado ante la SFC (post-radicación) ── */}
          {tieneEstadoSFC && (
            <FormSection title="Estado ante la SFC">
              <div className="form-row cols-2">
                <div className="zds-field-wrap">
                  <span className="info-bar-label">Estado SmartSupervision</span>
                  <div style={{ marginTop: 'var(--zs-50)' }}>
                    <ZdsStatusBadge variant={estadoVariant(w.qd_estadoSmartSupervision || '')}>
                      {w.qd_estadoSmartSupervision || 'Sin estado'}
                    </ZdsStatusBadge>
                  </div>
                </div>
                <ZdsInput name="qd_fechaRadicacionSFC" control={control} label="Fecha y hora radicación SFC" readOnly />
              </div>
            </FormSection>
          )}

          {/* ── S6: Responsable Asignado (post-radicación) ── */}
          {tieneResponsable && (
            <FormSection title="Responsable Asignado">
              <div className="form-row cols-2">
                <ZdsInput name="qd_rolGrupo" control={control} label="Rol (Grupo)" readOnly />
                <ZdsInput name="qd_responsable" control={control} label="Responsable" readOnly />
              </div>
            </FormSection>
          )}

          {/* ── Acciones ── */}
          <ActionBar>
            <ZrButton config="secondary:s" onClick={limpiarFormulario}>Limpiar Formulario</ZrButton>
            <ZrButton config="secondary:s" onClick={() => window.history.back()}>Cancelar</ZrButton>
            <ZrButton
              config="positive:s"
              onClick={() => handleSubmit(onSubmit)()}
              loading={submitting}
              disabled={submitting || !puedeEnviar}
            >
              Enviar PQRS
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
