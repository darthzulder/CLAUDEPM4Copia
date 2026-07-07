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
function estadoVariant(in_strStatus: string): 'success' | 'danger' | 'info' | 'neutral' {
  const strStatus = in_strStatus.toLowerCase();
  if (strStatus.includes('acept') || strStatus.includes('verde') || strStatus.includes('ok')) return 'success';
  if (strStatus.includes('rechaz') || strStatus.includes('error') || strStatus.includes('rojo')) return 'danger';
  if (strStatus.includes('proceso') || strStatus.includes('pendiente') || strStatus.includes('amarillo')) return 'info';
  return 'neutral';
}

export default function CrearRecibirQueja() {
  const { task, loading, error, submitting, completeTask, isWebEntry } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [sent, setSent] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [pendingData, setPendingData] = useState<CrearRecibirQuejaFormData | null>(null);
  // Overlay de "enviando": cubre el lapso captcha-verificado → verify + envío a PM4,
  // hasta que aparece la pantalla de éxito.
  const [enviando, setEnviando] = useState(false);

  const form = useForm<CrearRecibirQuejaFormData>({
    mode: 'onTouched',
    defaultValues: { ...DEFAULTS },
  });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de la primera seccion del formulario.
  const { options: cllRequestType } = useCollection(COLLECTION_DEFS.tipoSolicitud);
  const { options: cllRole } = useCollection(COLLECTION_DEFS.rol);
  const { options: cllInstance } = useCollection(COLLECTION_DEFS.instancia);
  const { options: cllReceptionPoint } = useCollection(COLLECTION_DEFS.puntoRecepcion);
  const { options: cllChannel } = useCollection(COLLECTION_DEFS.canal);
  const { options: cllAlliance } = useCollection(COLLECTION_DEFS.alianza);

  // Empleado Zurich = rol código '3' (ver RUL-000-01). Solo este rol ve el campo Alianza.
  const blnIsZurichEmp = String(objWatch.qd_rolRadicador) === '3';

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<CrearRecibirQuejaFormData>) });
  }, [task, reset]);

  // RUL-000-01 — el rol determina la instancia de recepción (back, readonly),
  // resuelta desde CAT-INSTANCIA por código:
  //   Cliente(1) / Intermediario(2) / Empleado Zurich(3) / No cliente(5) → Entidad vigilada (2)
  //   Defensor del consumidor(4)                                          → Defensor del consumidor financiero (3)
  //   SFC (instancia 1) se asigna automáticamente vía la integración SFC, no aquí.
  useEffect(() => {
    if (!objWatch.qd_rolRadicador || cllInstance.length === 0) return;
    const strRole = String(objWatch.qd_rolRadicador);
    let strInstanceCode = '';
    if (strRole === '4') strInstanceCode = '3';
    else if (['1', '2', '3', '5'].includes(strRole)) strInstanceCode = '2';
    const objInstance = cllInstance.find((o) => o.value === strInstanceCode);
    if (objInstance) form.setValue('qd_instanciaRecepcion', objInstance.label);
  }, [objWatch.qd_rolRadicador, cllInstance, form]);

  // Punto de recepción por defecto para radicación web = "Internet" (CAT-PUNTO).
  // Ahora es un select editable, así que se precarga el código (value), no la etiqueta.
  useEffect(() => {
    if (objWatch.qd_puntoRecepcion || cllReceptionPoint.length === 0) return;
    const objInternet = cllReceptionPoint.find((o) => /internet/i.test(o.label));
    if (objInternet) form.setValue('qd_puntoRecepcion', objInternet.value);
  }, [objWatch.qd_puntoRecepcion, cllReceptionPoint, form]);

  // La alianza solo aplica al rol Empleado Zurich; al cambiar a otro rol se limpia.
  useEffect(() => {
    if (!blnIsZurichEmp && objWatch.qd_alianza) form.setValue('qd_alianza', '');
  }, [blnIsZurichEmp, objWatch.qd_alianza, form]);

  // Recorremos el registro de archivos para subir cada adjunto a PM4.
  const uploadFiles = async (in_intRequestId: number) => {
    for (const [strDocKey, objFile] of fileRegistry.current.entries()) {
      const objFormData = new FormData();
      objFormData.append('file', objFile);
      await pm4.post(`/requests/${in_intRequestId}/files?data_name=${strDocKey}`, objFormData);
    }
  };

  // Paso 1 — el submit valida el formulario (react-hook-form) y, si es válido,
  // abre el modal de captcha. El envío real NO ocurre hasta pasar la validación.
  const requestCaptcha = (in_objData: CrearRecibirQuejaFormData) => {
    setCaptchaError('');
    setPendingData(in_objData);
    setCaptchaOpen(true);
  };

  // Envía la solicitud a PM4, ya sea como web entry o completando la tarea.
  const sendToPm4 = async (in_objData: CrearRecibirQuejaFormData) => {
    try {
      if (isWebEntry) {
        const objResult = await pm4.post<Record<string, unknown>>(
          `/process_events/${WEB_ENTRY_PROCESS_ID}`,
          in_objData,
          { params: { event: WEB_ENTRY_EVENT_ID } },
        );
        const intNewRequestId = (objResult.data?.request_id ?? objResult.data?.id) as number | undefined;
        if (intNewRequestId && fileRegistry.current.size > 0) {
          await uploadFiles(intNewRequestId);
        }
        setSent(true);
      } else {
        const intRequestId = task?.process_request_id;
        if (intRequestId && fileRegistry.current.size > 0) {
          await uploadFiles(intRequestId);
        }
        await completeTask(in_objData as unknown as Record<string, unknown>);
        setSent(true);
      }
    } catch (exc) {
      console.error('[CrearRecibirQueja] Error al enviar:', exc);
      setCaptchaError('Ocurrió un error al radicar la solicitud. Intenta nuevamente.');
    }
  };

  // Paso 2 — el usuario resolvió el checkbox "No soy un robot": verificamos el
  // token contra Google (backend) y recién ahí enviamos a PM4.
  const handleCaptchaVerified = async (in_strToken: string) => {
    setCaptchaOpen(false);
    const objData = pendingData;
    if (!objData) return;
    setPendingData(null);
    setEnviando(true);
    try {
      const { data: objVerify } = await pm4.post<{ success: boolean }>('/recaptcha/verify', { token: in_strToken });
      if (!objVerify?.success) {
        setCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
        setEnviando(false);
        return;
      }
    } catch {
      setCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
      setEnviando(false);
      return;
    }
    await sendToPm4({ ...objData, qd_captcha: true });
    // En éxito, sendToPm4 pone sent=true y se muestra la pantalla de confirmación;
    // si falló, quitamos el overlay para que el usuario vea el form y el error.
    setEnviando(false);
  };

  // Reinicia el formulario y limpia los adjuntos cargados.
  const limpiarFormulario = () => {
    reset({ ...DEFAULTS });
    fileRegistry.current.clear();
    ADJUNTO_KEYS.forEach((strKey) => form.setValue(strKey, ''));
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

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;
  // Habilita el envío solo si el usuario autorizó el tratamiento de datos.
  const blnCanSubmit = !!objWatch.qd_autorizacionDatos;
  // Indica si el caso ya tiene estado ante la SFC.
  const blnHasSfcStatus = !!objWatch.qd_estadoSmartSupervision || !!objWatch.qd_fechaRadicacionSFC;
  // Indica si el caso ya tiene responsable asignado.
  const blnHasAssignee = !!objWatch.qd_rolResponsable || !!objWatch.qd_responsable;

  return (
    <div className="screen-wrapper">
      {enviando && (
        <div className="loading-overlay">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--zs-100)' }}>
            <ZrLoader />
            <span style={{ font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>Radicando tu solicitud...</span>
          </div>
        </div>
      )}
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
                options={cllRequestType} rules={{ required: 'Campo requerido' }} required
                error={err('qd_tipoSolicitud')} />
              <ZdsSelect name="qd_rolRadicador" control={control} label="Selecciona tu rol"
                options={cllRole} rules={{ required: 'Campo requerido' }} required
                error={err('qd_rolRadicador')} />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_canal" control={control} label="Canal"
                options={cllChannel} rules={{ required: 'Campo requerido' }} required
                error={err('qd_canal')} />
              <ZdsSelect name="qd_puntoRecepcion" control={control} label="Punto de Recepción"
                options={cllReceptionPoint} rules={{ required: 'Campo requerido' }} required
                error={err('qd_puntoRecepcion')} />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly
                helpText="Asignada automáticamente según el rol (CAT-INSTANCIA)." />
              {blnIsZurichEmp ? (
                <ZdsSelect name="qd_alianza" control={control} label="Alianza"
                  options={cllAlliance} error={err('qd_alianza')} />
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
            {isSubmitted && !objWatch.qd_autorizacionDatos && (
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
          {blnHasSfcStatus && (
            <FormSection title="Estado ante la SFC">
              <div className="form-row cols-2">
                <div className="zds-field-wrap">
                  <span className="info-bar-label">Estado SmartSupervision</span>
                  <div style={{ marginTop: 'var(--zs-50)' }}>
                    <ZdsStatusBadge variant={estadoVariant(objWatch.qd_estadoSmartSupervision || '')}>
                      {objWatch.qd_estadoSmartSupervision || 'Sin estado'}
                    </ZdsStatusBadge>
                  </div>
                </div>
                <ZdsInput name="qd_fechaRadicacionSFC" control={control} label="Fecha y hora radicación SFC" readOnly />
              </div>
            </FormSection>
          )}

          {/* ── S6: Responsable Asignado (post-radicación) ── */}
          {blnHasAssignee && (
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
              disabled={submitting || !blnCanSubmit}
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
