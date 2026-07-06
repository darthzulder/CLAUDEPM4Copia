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
import SeccionConsumidor from './SeccionConsumidor';
import SeccionDetalleQueja from './SeccionDetalleQueja';
import RecaptchaModal from '../../../../components/RecaptchaModal';

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
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [pendingData, setPendingData] = useState<CrearRecibirQuejaFormData | null>(null);

  const form = useForm<CrearRecibirQuejaFormData>({
    mode: 'onTouched',
    defaultValues: { ...DEFAULTS },
  });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const { options: tipoSolicitudOpts } = useCollection(COLLECTION_DEFS.tipoSolicitud);
  const { options: rolOpts } = useCollection(COLLECTION_DEFS.rol);
  const { options: instanciaOpts } = useCollection(COLLECTION_DEFS.instancia);
  const { options: puntoRecepcionOpts } = useCollection(COLLECTION_DEFS.puntoRecepcion);
  const { options: canalOpts } = useCollection(COLLECTION_DEFS.canal);
  const { options: alianzaOpts } = useCollection(COLLECTION_DEFS.alianza);

  // Empleado Zurich = rol código '3' (ver RUL-000-01). Solo este rol ve el campo Alianza.
  const esEmpleadoZurich = String(w.qd_rolRadicador) === '3';

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<CrearRecibirQuejaFormData>) });
  }, [task, reset]);

  // RUL-000-01 — el rol determina la instancia de recepción (back, readonly),
  // resuelta desde CAT-INSTANCIA por código:
  //   Cliente(1) / Intermediario(2) / Empleado Zurich(3) / No cliente(5) → Entidad vigilada (2)
  //   Defensor del consumidor(4)                                          → Defensor del consumidor financiero (3)
  //   SFC (instancia 1) se asigna automáticamente vía la integración SFC, no aquí.
  useEffect(() => {
    if (!w.qd_rolRadicador || instanciaOpts.length === 0) return;
    const rol = String(w.qd_rolRadicador);
    let codigoInstancia = '';
    if (rol === '4') codigoInstancia = '3';
    else if (['1', '2', '3', '5'].includes(rol)) codigoInstancia = '2';
    const instancia = instanciaOpts.find((o) => o.value === codigoInstancia);
    if (instancia) form.setValue('qd_instanciaRecepcion', instancia.label);
  }, [w.qd_rolRadicador, instanciaOpts, form]);

  // Punto de recepción por defecto para radicación web = "Internet" (CAT-PUNTO).
  // Ahora es un select editable, así que se precarga el código (value), no la etiqueta.
  useEffect(() => {
    if (w.qd_puntoRecepcion || puntoRecepcionOpts.length === 0) return;
    const internet = puntoRecepcionOpts.find((o) => /internet/i.test(o.label));
    if (internet) form.setValue('qd_puntoRecepcion', internet.value);
  }, [w.qd_puntoRecepcion, puntoRecepcionOpts, form]);

  // La alianza solo aplica al rol Empleado Zurich; al cambiar a otro rol se limpia.
  useEffect(() => {
    if (!esEmpleadoZurich && w.qd_alianza) form.setValue('qd_alianza', '');
  }, [esEmpleadoZurich, w.qd_alianza, form]);

  const uploadFiles = async (requestId: number) => {
    for (const [docKey, file] of fileRegistry.current.entries()) {
      const fd = new FormData();
      fd.append('file', file);
      await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
    }
  };

  // Paso 1 — el submit valida el formulario (react-hook-form) y, si es válido,
  // abre el modal de captcha. El envío real NO ocurre hasta pasar la validación.
  const requestCaptcha = (data: CrearRecibirQuejaFormData) => {
    setCaptchaError('');
    setPendingData(data);
    setCaptchaOpen(true);
  };

  const sendToPm4 = async (data: CrearRecibirQuejaFormData) => {
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
      setCaptchaError('Ocurrió un error al radicar la solicitud. Intenta nuevamente.');
    }
  };

  // Paso 2 — el usuario resolvió el checkbox "No soy un robot": verificamos el
  // token contra Google (backend) y recién ahí enviamos a PM4.
  const handleCaptchaVerified = async (token: string) => {
    setCaptchaOpen(false);
    const data = pendingData;
    if (!data) return;
    setPendingData(null);
    try {
      const { data: v } = await pm4.post<{ success: boolean }>('/recaptcha/verify', { token });
      if (!v?.success) {
        setCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
        return;
      }
    } catch {
      setCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
      return;
    }
    await sendToPm4({ ...data, qd_captcha: true });
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

  const err = (name: keyof CrearRecibirQuejaFormData) => errors[name]?.message;
  const puedeEnviar = !!w.qd_autorizacionDatos;
  const tieneEstadoSFC = !!w.qd_estadoSmartSupervision || !!w.qd_fechaRadicacionSFC;
  const tieneResponsable = !!w.qd_rolResponsable || !!w.qd_responsable;

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
        <form onSubmit={handleSubmit(requestCaptcha)} noValidate>

          {/* ── S1: Tipo de Solicitud y Rol ── */}
          <FormSection title="Tipo de Solicitud y Rol">
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Radica tu petición, queja, reclamo, sugerencia o felicitación. Completa los campos obligatorios
              y acepta el tratamiento de datos. Al presionar <strong>Enviar PQRS</strong> se te pedirá una
              validación de seguridad (captcha) antes de radicar.
            </ZrAlert>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_tipoSolicitud" control={control} label="¿A qué está asociado tu comentario?"
                options={tipoSolicitudOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_tipoSolicitud')} />
              <ZdsSelect name="qd_rolRadicador" control={control} label="Selecciona tu rol"
                options={rolOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_rolRadicador')} />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_canal" control={control} label="Canal"
                options={canalOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_canal')} />
              <ZdsSelect name="qd_puntoRecepcion" control={control} label="Punto de Recepción"
                options={puntoRecepcionOpts} rules={{ required: 'Campo requerido' }} required
                error={err('qd_puntoRecepcion')} />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly
                helpText="Asignada automáticamente según el rol (CAT-INSTANCIA)." />
              {esEmpleadoZurich ? (
                <ZdsSelect name="qd_alianza" control={control} label="Alianza"
                  options={alianzaOpts} error={err('qd_alianza')} />
              ) : (
                <div />
              )}
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
            {/* FLD-336 — validación de seguridad: reCAPTCHA v2 (checkbox) en un modal
                que se abre al presionar "Enviar PQRS". Ver RecaptchaModal más abajo. */}
            {captchaError && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                {captchaError}
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
                <ZdsInput name="qd_rolResponsable" control={control} label="Rol (Grupo)" readOnly />
                <ZdsInput name="qd_responsable" control={control} label="Responsable" readOnly />
              </div>
            </FormSection>
          )}

          {/* ── Acciones ── */}
          <ActionBar>
            <ZrButton config="secondary" onClick={limpiarFormulario}>Limpiar Formulario</ZrButton>
            <ZrButton config="secondary" onClick={() => window.history.back()}>Cancelar</ZrButton>
            <ZrButton
              config="positive"
              onClick={() => handleSubmit(requestCaptcha)()}
              loading={submitting}
              disabled={submitting || !puedeEnviar}
            >
              Enviar PQRS
            </ZrButton>
          </ActionBar>
        </form>

        <RecaptchaModal
          open={captchaOpen}
          onVerified={handleCaptchaVerified}
          onClose={() => { setCaptchaOpen(false); setPendingData(null); }}
        />
      </div>
    </div>
  );
}
