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
import {
  QD, QD_COLLECTIONS,
  SCR000_DEFAULTS as DEFAULTS, SCR000_ADJUNTO_KEYS as ADJUNTO_KEYS,
  SCR000_WEB_ENTRY_PROCESS_ID as WEB_ENTRY_PROCESS_ID, SCR000_WEB_ENTRY_EVENT_ID as WEB_ENTRY_EVENT_ID,
} from '../fields/fields';
import type { CrearRecibirQuejaFormData } from '../fields/fields';
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
  const [blnSent, setBlnSent] = useState(false);
  const [blnCaptchaOpen, setBlnCaptchaOpen] = useState(false);
  const [strCaptchaError, setStrCaptchaError] = useState('');
  const [objPendingData, setObjPendingData] = useState<CrearRecibirQuejaFormData | null>(null);
  // Overlay de "enviando": cubre el lapso captcha-verificado → verify + envío a PM4,
  // hasta que aparece la pantalla de éxito.
  const [blnSending, setBlnSending] = useState(false);

  const form = useForm<CrearRecibirQuejaFormData>({
    mode: 'onTouched',
    defaultValues: { ...DEFAULTS },
  });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de la primera seccion del formulario.
  const { options: cllRequestType } = useCollection(QD_COLLECTIONS.requestType);
  const { options: cllRole } = useCollection(QD_COLLECTIONS.filerRole);
  const { options: cllInstance } = useCollection(QD_COLLECTIONS.receptionInstance);
  const { options: cllReceptionPoint } = useCollection(QD_COLLECTIONS.receptionPoint);
  const { options: cllChannel } = useCollection(QD_COLLECTIONS.channel);
  const { options: cllAlliance } = useCollection(QD_COLLECTIONS.alliance);

  // Empleado Zurich = rol código '3' (ver RUL-000-01). Solo este rol ve el campo Alianza.
  const blnIsZurichEmp = String(objWatch[QD.strFilerRole]) === '3';

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
    if (!objWatch[QD.strFilerRole] || cllInstance.length === 0) return;
    const strRole = String(objWatch[QD.strFilerRole]);
    let strInstanceCode = '';
    if (strRole === '4') strInstanceCode = '3';
    else if (['1', '2', '3', '5'].includes(strRole)) strInstanceCode = '2';
    const objInstance = cllInstance.find((o) => o.value === strInstanceCode);
    if (objInstance) form.setValue(QD.strReceptionInstance, objInstance.label);
  }, [objWatch[QD.strFilerRole], cllInstance, form]);

  // Punto de recepción por defecto para radicación web = "Internet" (CAT-PUNTO).
  // Ahora es un select editable, así que se precarga el código (value), no la etiqueta.
  useEffect(() => {
    if (objWatch[QD.strReceptionPoint] || cllReceptionPoint.length === 0) return;
    const objInternet = cllReceptionPoint.find((o) => /internet/i.test(o.label));
    if (objInternet) form.setValue(QD.strReceptionPoint, objInternet.value);
  }, [objWatch[QD.strReceptionPoint], cllReceptionPoint, form]);

  // La alianza solo aplica al rol Empleado Zurich; al cambiar a otro rol se limpia.
  useEffect(() => {
    if (!blnIsZurichEmp && objWatch[QD.strAlliance]) form.setValue(QD.strAlliance, '');
  }, [blnIsZurichEmp, objWatch[QD.strAlliance], form]);

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
    setStrCaptchaError('');
    setObjPendingData(in_objData);
    setBlnCaptchaOpen(true);
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
        setBlnSent(true);
      } else {
        const intRequestId = task?.process_request_id;
        if (intRequestId && fileRegistry.current.size > 0) {
          await uploadFiles(intRequestId);
        }
        await completeTask(in_objData as unknown as Record<string, unknown>);
        setBlnSent(true);
      }
    } catch (exc) {
      console.error('[CrearRecibirQueja] Error al enviar:', exc);
      setStrCaptchaError('Ocurrió un error al radicar la solicitud. Intenta nuevamente.');
    }
  };

  // Paso 2 — el usuario resolvió el checkbox "No soy un robot": verificamos el
  // token contra Google (backend) y recién ahí enviamos a PM4.
  const handleCaptchaVerified = async (in_strToken: string) => {
    setBlnCaptchaOpen(false);
    const objData = objPendingData;
    if (!objData) return;
    setObjPendingData(null);
    setBlnSending(true);
    try {
      const { data: objVerify } = await pm4.post<{ success: boolean }>('/recaptcha/verify', { token: in_strToken });
      if (!objVerify?.success) {
        setStrCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
        setBlnSending(false);
        return;
      }
    } catch {
      setStrCaptchaError('No pudimos validar la seguridad. Vuelve a intentarlo.');
      setBlnSending(false);
      return;
    }
    await sendToPm4({ ...objData, [QD.blnCaptcha]: true });
    // En éxito, sendToPm4 pone blnSent=true y se muestra la pantalla de confirmación;
    // si falló, quitamos el overlay para que el usuario vea el form y el error.
    setBlnSending(false);
  };

  // Reinicia el formulario y limpia los adjuntos cargados.
  const limpiarFormulario = () => {
    reset({ ...DEFAULTS });
    fileRegistry.current.clear();
    ADJUNTO_KEYS.forEach((strKey) => form.setValue(strKey, ''));
  };

  if (blnSent) {
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
  const blnCanSubmit = !!objWatch[QD.blnDataAuth];
  // Indica si el caso ya tiene estado ante la SFC.
  const blnHasSfcStatus = !!objWatch[QD.strSmartSupStatus] || !!objWatch[QD.strSfcFilingDate];
  // Indica si el caso ya tiene responsable asignado.
  const blnHasAssignee = !!objWatch[QD.strAssigneeRole] || !!objWatch[QD.strAssignee];

  return (
    <div className="screen-wrapper">
      {blnSending && (
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
              <ZdsSelect name={QD.strRequestType} control={control} label="¿A qué está asociado tu comentario?"
                options={cllRequestType} rules={{ required: 'Campo requerido' }} required
                error={err(QD.strRequestType)} />
              <ZdsSelect name={QD.strFilerRole} control={control} label="Selecciona tu rol"
                options={cllRole} rules={{ required: 'Campo requerido' }} required
                error={err(QD.strFilerRole)} />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strChannel} control={control} label="Canal"
                options={cllChannel} rules={{ required: 'Campo requerido' }} required
                error={err(QD.strChannel)} />
              <ZdsSelect name={QD.strReceptionPoint} control={control} label="Punto de Recepción"
                options={cllReceptionPoint} rules={{ required: 'Campo requerido' }} required
                error={err(QD.strReceptionPoint)} />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={QD.strReceptionInstance} control={control} label="Instancia de Recepción" readOnly
                helpText="Asignada automáticamente según el rol (CAT-INSTANCIA)." />
              {blnIsZurichEmp ? (
                <ZdsSelect name={QD.strAlliance} control={control} label="Alianza"
                  options={cllAlliance} error={err(QD.strAlliance)} />
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
              <ZdsCheckboxField name={QD.blnDataAuth} control={control}
                label="Autorizo el tratamiento de mis datos personales conforme a la política de privacidad." />
            </div>
            {isSubmitted && !objWatch[QD.blnDataAuth] && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Debe aceptar el tratamiento de datos personales para poder radicar su solicitud. (MSG-000-04)
              </ZrAlert>
            )}
            {/* FLD-336 — validación de seguridad: reCAPTCHA v2 (checkbox) en un modal
                que se abre al presionar "Enviar PQRS". Ver RecaptchaModal más abajo. */}
            {strCaptchaError && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                {strCaptchaError}
              </ZrAlert>
            )}
            <div className="form-row cols-2">
              <ZdsInput name={QD.strCcEmail} control={control} label="¿Quieres enviar copia de la respuesta a otro correo?"
                inputType="email"
                rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: usuario@dominio.com' } }}
                error={err(QD.strCcEmail)} />
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
                    <ZdsStatusBadge variant={estadoVariant(objWatch[QD.strSmartSupStatus] || '')}>
                      {objWatch[QD.strSmartSupStatus] || 'Sin estado'}
                    </ZdsStatusBadge>
                  </div>
                </div>
                <ZdsInput name={QD.strSfcFilingDate} control={control} label="Fecha y hora radicación SFC" readOnly />
              </div>
            </FormSection>
          )}

          {/* ── S6: Responsable Asignado (post-radicación) ── */}
          {blnHasAssignee && (
            <FormSection title="Responsable Asignado">
              <div className="form-row cols-2">
                <ZdsInput name={QD.strAssigneeRole} control={control} label="Rol (Grupo)" readOnly />
                <ZdsInput name={QD.strAssignee} control={control} label="Responsable" readOnly />
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
          open={blnCaptchaOpen}
          onVerified={handleCaptchaVerified}
          onClose={() => { setBlnCaptchaOpen(false); setObjPendingData(null); }}
        />
      </div>
    </div>
  );
}
