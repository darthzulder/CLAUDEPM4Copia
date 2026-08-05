import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import {
  ZdsInput, ZdsSelect, ZdsCheckboxField,
  ZrButton, ZrAlert, ZrLoader, ZrModal,
} from '../../../../components/fields/ZdsFields';
import pm4 from '../../../../api/pm4Client';
import { useCollection, useSyncDesc } from '../../../../core/useCollection';
import { uploadAttachments, attachIdsToPayload } from '../../../../core/attachments';
import {
  QD, QD_COLLECTIONS,
  SCR000_DEFAULTS as DEFAULTS, SCR000_ADJUNTO_KEYS as ADJUNTO_KEYS,
  SCR000_WEB_ENTRY_PROCESS_ID as WEB_ENTRY_PROCESS_ID, SCR000_WEB_ENTRY_EVENT_ID as WEB_ENTRY_EVENT_ID,
  SCR000_SIMILAR_CASES_SCRIPT_ID as SIMILAR_CASES_SCRIPT_ID,
  buildSfcCode,
} from '../fields/fields';
import type { CrearRecibirQuejaFormData } from '../fields/fields';
import SeccionConsumidor from './SeccionConsumidor';
import SeccionDetalleQueja from './SeccionDetalleQueja';
import { PqrPage, PqrSection } from './PqrPage';
import { RecaptchaWidget } from '../../../../components/RecaptchaModal';

// Puntos de recepción (CAT-PUNTO, colección 20) que ya no deben ofrecerse en el
// selector: 2 (Aplicación móvil), 6 (Audio respuesta), 99 (Otros Puntos de recepción).
const RECEPTION_POINTS_HIDDEN = ['2', '6', '99'];

// Canal (qd_strChannel) ya no es seleccionable: se deriva del punto de recepción
// elegido (colección 20 → colección 10, CAT-CANAL), según regla de negocio:
//  · Punto 5 (Call center)         → Canal 5
//  · Puntos 1, 3, 7 (Internet, Correo electrónico, Redes sociales) → Canal 13
//  · Punto 4 (Oficina)             → Canal 14
// Los puntos sin regla (ninguno queda tras ocultar 2/6/99) dejan el canal vacío.
const CHANNEL_BY_RECEPTION_POINT: Record<string, string> = {
  '5': '5',
  '1': '13',
  '3': '13',
  '7': '13',
  '4': '14',
};

// Titular y descripción del banner de la página pública de radicación.
const BANNER_TITLE = 'Radicación PQRs';
const BANNER_INTRO = 'Radica tu petición, queja, reclamo, sugerencia o felicitación. '
  + 'Completa los campos obligatorios, acepta el tratamiento de datos y valida el captcha '
  + 'para presionar Enviar PQRS.';

export default function CrearRecibirQueja() {
  const { task, loading, error, submitting, completeTask, isWebEntry } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [blnSent, setBlnSent] = useState(false);
  // FLD-336 — token del reCAPTCHA resuelto en el propio formulario (sección
  // "Autorización y envío"). Se verifica server-side al radicar; si caduca, Google
  // resetea el widget y lo limpiamos para exigir una nueva validación.
  const [strCaptchaToken, setStrCaptchaToken] = useState('');
  const [strCaptchaError, setStrCaptchaError] = useState('');
  const [objPendingData, setObjPendingData] = useState<CrearRecibirQuejaFormData | null>(null);
  // Overlay de "enviando": cubre el lapso submit → chequeo de similares → verify +
  // envío a PM4, hasta que aparece la pantalla de éxito.
  const [blnSending, setBlnSending] = useState(false);
  // Cuando el watcher (script 70) detecta casos similares (qd_intCountSimilarCases > 0),
  // guardamos aquí el detalle para mostrar el modal de confirmación. El flujo queda en
  // pausa hasta que el usuario decida continuar.
  const [objSimilarPrompt, setObjSimilarPrompt] = useState<{
    ids: number[];
    count: number;
    cases: Record<string, unknown>[];
  } | null>(null);
  // Salida del watcher (qd_arridSimilarCases, etc.) que se fusiona en el payload al radicar.
  const [objPendingSimilar, setObjPendingSimilar] = useState<Partial<CrearRecibirQuejaFormData>>({});

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
  // Puntos de recepción ofrecidos en el selector, sin los ocultos (ver RECEPTION_POINTS_HIDDEN).
  const cllReceptionPointVisible = cllReceptionPoint.filter((o) => !RECEPTION_POINTS_HIDDEN.includes(o.value));

  // Sincroniza la variable compañera <campo>_desc con la descripción del código guardado.
  // El campo base guarda el CÓDIGO (numérico); _desc viaja junto a PM4 para lectura.
  useSyncDesc(form, QD.strRequestType, cllRequestType);
  useSyncDesc(form, QD.strFilerRole, cllRole);
  useSyncDesc(form, QD.strChannel, cllChannel);
  useSyncDesc(form, QD.strReceptionPoint, cllReceptionPoint);
  useSyncDesc(form, QD.strReceptionInstance, cllInstance);
  useSyncDesc(form, QD.strAlliance, cllAlliance);

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
    // Guardamos el CÓDIGO (la descripción viaja en qd_strReceptionInstance_desc vía useSyncDesc).
    if (objInstance) form.setValue(QD.strReceptionInstance, objInstance.value);
  }, [objWatch[QD.strFilerRole], cllInstance, form]);

  // Punto de recepción por defecto para radicación web = "Internet" (CAT-PUNTO).
  // Ahora es un select editable, así que se precarga el código (value), no la etiqueta.
  useEffect(() => {
    if (objWatch[QD.strReceptionPoint] || cllReceptionPointVisible.length === 0) return;
    const objInternet = cllReceptionPointVisible.find((o) => /internet/i.test(o.label));
    if (objInternet) form.setValue(QD.strReceptionPoint, objInternet.value);
  }, [objWatch[QD.strReceptionPoint], cllReceptionPointVisible, form]);

  // El canal ya no se selecciona manualmente: se deriva del punto de recepción
  // elegido (ver CHANNEL_BY_RECEPTION_POINT). Sin regla → canal vacío.
  useEffect(() => {
    const strChannelCode = CHANNEL_BY_RECEPTION_POINT[String(objWatch[QD.strReceptionPoint])] ?? '';
    if (objWatch[QD.strChannel] !== strChannelCode) form.setValue(QD.strChannel, strChannelCode);
  }, [objWatch[QD.strReceptionPoint], objWatch[QD.strChannel], form]);

  // La alianza solo aplica al rol Empleado Zurich; al cambiar a otro rol se limpia.
  useEffect(() => {
    if (!blnIsZurichEmp && objWatch[QD.strAlliance]) form.setValue(QD.strAlliance, '');
  }, [blnIsZurichEmp, objWatch[QD.strAlliance], form]);

  // Resuelve el case_number de PM4 (número de caso/queja, el mismo valor que
  // otras pantallas leen como qd_strBpmCaseId) a partir del id interno del
  // request. NO es lo mismo que el `id`/`request_id` interno: PM4 expone ambos
  // como campos independientes (ver `processRequest` en docs (4).json).
  const fetchCaseNumber = async (in_intRequestId: number): Promise<number | undefined> => {
    const { data } = await pm4.get<{ case_number?: number }>(`/requests/${in_intRequestId}`);
    return data?.case_number;
  };

  // Watcher pre-envío — ejecuta el script PM4 (id 70) que detecta casos ACTIVOS
  // del mismo proceso con idéntico motivo + producto + identificación. Se corre
  // al enviar; su salida (qd_arridSimilarCases, qd_intCountSimilarCases,
  // qd_arrSimilarCases) se fusiona en el payload al radicar.
  // Es best-effort: si el script falla, se registra y la radicación continúa.
  const checkSimilarCases = async (
    in_objData: CrearRecibirQuejaFormData,
  ): Promise<Partial<CrearRecibirQuejaFormData>> => {
    // ⚠ NO enviar la clave `_request`: PM4 la trata como reservada y sobrescribe el
    // `$data` del script, borrando las variables de entrada (el script devolvía
    // "Faltan variables obligatorias"). El script usa `process_id` para acotar la
    // búsqueda; la exclusión del caso actual (por `_request.id`) no aplica en la
    // radicación web, donde el caso todavía no existe.
    const objScriptData = {
      [QD.strSfcReason]: in_objData[QD.strSfcReason],
      [QD.strSfcProduct]: in_objData[QD.strSfcProduct],
      [QD.strIdNumber]: in_objData[QD.strIdNumber],
      process_id: WEB_ENTRY_PROCESS_ID,
    };
    // PM4 espera data/config como strings JSON y sync:true (mismo patrón que los demás watchers).
    const objBody = { data: JSON.stringify(objScriptData), config: JSON.stringify({}), sync: true };
    try {
      const objRes = await pm4.post(`/scripts/${SIMILAR_CASES_SCRIPT_ID}/execute`, objBody);
      // La salida puede venir en .response, .output o directamente en .data.
      const objRaw = objRes.data as Record<string, unknown>;
      const objOut = (objRaw?.response ?? objRaw?.output ?? objRaw) as Record<string, unknown>;
      return {
        [QD.strSimilarCheckStatus]: objOut[QD.strSimilarCheckStatus] as string,
        [QD.arridSimilarCases]: (objOut[QD.arridSimilarCases] ?? []) as number[],
        [QD.intCountSimilarCases]: (objOut[QD.intCountSimilarCases] ?? 0) as number,
        [QD.arrSimilarCases]: (objOut[QD.arrSimilarCases] ?? []) as Record<string, unknown>[],
      };
    } catch (exc) {
      // No bloqueamos la radicación por un fallo del chequeo de duplicados.
      console.warn('[casos-similares] el script falló; se radica sin el chequeo:', exc);
      return {};
    }
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
        const intNewRequestId = (objResult.data?.id ?? objResult.data?.request_id) as number | undefined;
        // El case_number (número de queja/caso BPM) ya viene en la misma respuesta
        // de process_events, junto al id interno del request.
        const numBpmCaseId = (objResult.data?.case_number ?? intNewRequestId) as number | undefined;
        if (intNewRequestId) {
          // Subimos primero los adjuntos (si hay) para poder incluir su fileUploadId
          // (<docKey>_id) en la misma actualización que qd_strSfcCode.
          const dicUploadedIds = fileRegistry.current.size > 0
            ? await uploadAttachments(intNewRequestId, fileRegistry.current)
            : {};
          const objExtraData: Record<string, unknown> = { ...attachIdsToPayload(dicUploadedIds) };
          // qd_strSfcCode solo puede construirse tras crear el caso: su tercer
          // componente es el número de queja (caso BPM) que PM4 acaba de asignar.
          if (numBpmCaseId) objExtraData[QD.strSfcCode] = buildSfcCode(numBpmCaseId);
          if (Object.keys(objExtraData).length > 0) {
            await pm4.put(`/requests/${intNewRequestId}`, { data: objExtraData });
          }
        }
        setBlnSent(true);
      } else {
        const intRequestId = task?.process_request_id;
        let numBpmCaseId: number | undefined;
        let dicUploadedIds: Record<string, number> = {};
        if (intRequestId) {
          if (fileRegistry.current.size > 0) dicUploadedIds = await uploadAttachments(intRequestId, fileRegistry.current);
          // task.process_request_id es el id interno del request, no el case_number.
          numBpmCaseId = await fetchCaseNumber(intRequestId);
        }
        await completeTask({
          ...in_objData,
          ...attachIdsToPayload(dicUploadedIds),
          ...(numBpmCaseId ? { [QD.strSfcCode]: buildSfcCode(numBpmCaseId) } : {}),
        } as unknown as Record<string, unknown>);
        setBlnSent(true);
      }
    } catch (exc) {
      console.error('[CrearRecibirQueja] Error al enviar:', exc);
      setStrCaptchaError('Ocurrió un error al radicar la solicitud. Intenta nuevamente.');
    }
  };

  // Paso final — verifica el token del captcha contra Google (backend) y recién
  // ahí envía a PM4, fusionando la salida del watcher de casos similares.
  const radicar = async (
    in_objData: CrearRecibirQuejaFormData,
    in_objSimilar: Partial<CrearRecibirQuejaFormData>,
  ) => {
    setBlnSending(true);
    try {
      const { data: objVerify } = await pm4.post<{ success: boolean }>('/recaptcha/verify', { token: strCaptchaToken });
      if (!objVerify?.success) {
        setStrCaptchaError('No pudimos validar la seguridad. Vuelve a marcar "No soy un robot".');
        setStrCaptchaToken('');
        setBlnSending(false);
        return;
      }
    } catch {
      setStrCaptchaError('No pudimos validar la seguridad. Vuelve a marcar "No soy un robot".');
      setStrCaptchaToken('');
      setBlnSending(false);
      return;
    }
    const intSimilarCount = Number(in_objSimilar[QD.intCountSimilarCases] ?? 0);
    const blnIsReply = in_objData[QD.strReply] === 'SI';
    // Escalamiento de reconsideración a SAC (valor booleano): el radicador declaró que
    // ya había radicado la misma queja (réplica "Sí") pero el chequeo de casos similares
    // NO disparó la advertencia (0 casos abiertos coincidentes) → SAC debe escalarla a mano.
    const blnReconsiderationEscalation = blnIsReply && intSimilarCount === 0;
    // Marcación (qd_strMarking = '1'): réplica "Sí" Y el chequeo de casos similares NO
    // encontró coincidencias (el detector automático no "atrapó" la duplicidad) → misma
    // condición que blnReconsiderationEscalation, para que quede marcada y SAC la revise a mano.
    const strMarking = blnIsReply && intSimilarCount === 0 ? '1' : in_objData[QD.strMarking];
    await sendToPm4({
      ...in_objData,
      [QD.blnCaptcha]: true,
      ...in_objSimilar,
      [QD.strReconsiderationSacEscalation]: blnReconsiderationEscalation,
      [QD.strMarking]: strMarking,
      // Siempre false al radicar desde SCR-000: la solicitud aún no tiene caso SmartSupervision.
      [QD.blnSmartSupervisionCase]: false,
    });
    // En éxito, sendToPm4 pone blnSent=true y se muestra la pantalla de confirmación;
    // si falló, quitamos el overlay para que el usuario vea el form y el error.
    setBlnSending(false);
  };

  // Paso 1 — el submit valida el formulario (react-hook-form) y, si es válido,
  // ejecuta el watcher de casos similares (script 70) antes de radicar:
  //  · si hay casos similares → abre el modal de confirmación y espera decisión.
  //  · si no hay → radica directamente.
  const onSubmit = async (in_objData: CrearRecibirQuejaFormData) => {
    setStrCaptchaError('');
    if (!strCaptchaToken) {
      setStrCaptchaError('Marca "No soy un robot" para completar la validación de seguridad.');
      return;
    }
    setObjPendingData(in_objData);
    setBlnSending(true); // overlay mientras corre el chequeo
    const objSimilar = await checkSimilarCases(in_objData);
    setObjPendingSimilar(objSimilar);
    setBlnSending(false);

    const intCount = Number(objSimilar[QD.intCountSimilarCases] ?? 0);
    if (intCount > 0) {
      setObjSimilarPrompt({
        ids: (objSimilar[QD.arridSimilarCases] ?? []) as number[],
        count: intCount,
        cases: (objSimilar[QD.arrSimilarCases] ?? []) as Record<string, unknown>[],
      });
      return; // esperamos la decisión del usuario en el modal
    }
    await radicar(in_objData, objSimilar);
  };

  // Paso 2 — tras ver los casos similares, el usuario decide radicar de todas formas.
  const handleConfirmSimilar = async () => {
    setObjSimilarPrompt(null);
    const objData = objPendingData;
    if (!objData) return;
    await radicar(objData, objPendingSimilar);
  };

  // El usuario decide NO continuar: cerramos el modal y lo dejamos en el formulario.
  const handleCancelSimilar = () => {
    setObjSimilarPrompt(null);
    setObjPendingData(null);
    setObjPendingSimilar({});
  };

  // Reinicia el formulario y limpia los adjuntos cargados, y devuelve al usuario al
  // inicio de la página (si no, queda viendo la mitad del form ya vacío más abajo).
  // setTimeout(0), no requestAnimationFrame: rAF puede quedar suspendido si el
  // iframe no está en primer plano en el momento del clic (ver scrollToFirstError).
  const limpiarFormulario = () => {
    reset({ ...DEFAULTS });
    fileRegistry.current.clear();
    ADJUNTO_KEYS.forEach((strKey) => form.setValue(strKey, ''));
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  if (blnSent) {
    return (
      <PqrPage title={BANNER_TITLE} intro={BANNER_INTRO}>
        <div className="pqr-form">
          <PqrSection title="Radicación exitosa">
            <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
              Tu solicitud fue radicada exitosamente. Recibirás una confirmación en el correo registrado.
            </ZrAlert>
          </PqrSection>
        </div>
      </PqrPage>
    );
  }

  if (loading) {
    return (
      <PqrPage title={BANNER_TITLE} intro={BANNER_INTRO}>
        <div className="pqr-form"><div className="screen-loading"><ZrLoader /></div></div>
      </PqrPage>
    );
  }
  if (error) {
    return (
      <PqrPage title={BANNER_TITLE} intro={BANNER_INTRO}>
        <div className="pqr-form">
          <PqrSection title="Radicación PQRs">
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar el formulario: {error}</ZrAlert>
          </PqrSection>
        </div>
      </PqrPage>
    );
  }

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;
  // Habilita el envío solo si el usuario autorizó el tratamiento de datos y resolvió el captcha.
  const blnCanSubmit = !!objWatch[QD.blnDataAuth] && !!strCaptchaToken;
  // Indica si el caso ya tiene responsable asignado.
  const blnHasAssignee = !!objWatch[QD.strAssigneeRole] || !!objWatch[QD.strAssignee];

  return (
    <PqrPage title={BANNER_TITLE} intro={BANNER_INTRO}>
      {blnSending && (
        <div className="loading-overlay">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--zs-100)' }}>
            <ZrLoader />
            <span style={{ font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>Radicando tu solicitud...</span>
          </div>
        </div>
      )}

      <form className="pqr-form" onSubmit={handleSubmit(onSubmit, scrollToFirstError)} noValidate>

        {/* ── S1: Tipo de solicitud y rol ── */}
        <PqrSection title="Tipo de solicitud y rol">
          {/* Tipo de solicitud: primer campo del formulario, en su propia fila. */}
          <div className="form-row cols-1">
            <ZdsSelect name={QD.strRequestType} control={control} label="¿A qué está asociado tu comentario?"
              options={cllRequestType} rules={{ required: 'Campo requerido' }} required
              error={err(QD.strRequestType)} />
          </div>
          {/* Número de caso (ID BPM) + fecha/hora de creación se quitaron: SCR-000 es
              la pantalla que CREA el caso, así que en este punto ninguno de los tres
              existe todavía (PM4 los asigna recién al radicar) — mostrarlos, aunque
              sea con un placeholder, es confuso. */}
          {/* Canal de recepción ya no existe como campo: se deriva del punto de
              recepción (ver CHANNEL_BY_RECEPTION_POINT). */}
          <div className="form-row cols-2">
            <ZdsSelect name={QD.strReceptionPoint} control={control} label="Punto de recepción"
              options={cllReceptionPointVisible} rules={{ required: 'Campo requerido' }} required
              error={err(QD.strReceptionPoint)} />
            {/* Instancia de recepción: la asigna la RUL-000-01 según el rol, se
                muestra deshabilitada para que el usuario la vea sin poder cambiarla. */}
            <ZdsSelect name={QD.strReceptionInstance} control={control} label="Instancia de recepción"
              options={cllInstance} disabled
              helpText="Se asigna automáticamente según tu rol." />
          </div>
          <div className="form-row cols-2">
            <ZdsSelect name={QD.strFilerRole} control={control} label="Selecciona tu rol"
              options={cllRole} rules={{ required: 'Campo requerido' }} required
              error={err(QD.strFilerRole)} />
            {blnIsZurichEmp ? (
              <ZdsSelect name={QD.strAlliance} control={control} label="Alianza"
                options={cllAlliance} error={err(QD.strAlliance)} />
            ) : (
              <div />
            )}
          </div>
        </PqrSection>

        {/* ── S2: Datos del Consumidor Financiero ── */}
        <SeccionConsumidor form={form} />

        {/* ── S3: Detalle de la queja ── */}
        <SeccionDetalleQueja form={form} fileRegistry={fileRegistry} />

        {/* ── S4: Autorización y envío ── */}
        <PqrSection title="Autorización y envío">
          <ZdsCheckboxField name={QD.blnDataAuth} control={control}
            label="Autorizo el tratamiento de mis datos personales de conformidad a la Política de Privacidad" />
          {isSubmitted && !objWatch[QD.blnDataAuth] && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              Debe aceptar el tratamiento de datos personales para poder radicar su solicitud.
            </ZrAlert>
          )}

          {/* FLD-336 — validación de seguridad: reCAPTCHA v2 (checkbox) dentro del
              formulario; el token se verifica server-side al radicar. */}
          <div className="pqr-toggle-row">
            <RecaptchaWidget
              onVerified={(in_strToken) => { setStrCaptchaToken(in_strToken); setStrCaptchaError(''); }}
              onExpired={() => setStrCaptchaToken('')}
            />
          </div>
          {strCaptchaError && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              {strCaptchaError}
            </ZrAlert>
          )}

          <p className="pqr-note">
            Si deseas recibir una copia de la respuesta en otro correo electrónico, ingrésalo a continuación
          </p>
          <div className="form-row cols-2">
            <ZdsInput name={QD.strCcEmail} control={control} label="Correo"
              inputType="email"
              rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: usuario@dominio.com' } }}
              error={err(QD.strCcEmail)} />
            <div />
          </div>
        </PqrSection>

        {/* S5 "Estado ante la SFC" (Estado SmartSupervision + Fecha y hora radicación
            SFC) se eliminó: SCR-000 es la pantalla que CREA el caso, así que al
            mostrarse todavía no existe estado ante la SFC ni fecha de radicación —
            esos datos solo pueden existir después de radicar (mismo criterio ya
            aplicado en SCR-0051, ver DetalleReasignacionRespuesta.tsx). */}

        {/* ── S6: Responsable Asignado (post-radicación) ── */}
        {blnHasAssignee && (
          <PqrSection title="Responsable asignado">
            <div className="form-row cols-2">
              <ZdsInput name={QD.strAssigneeRole} control={control} label="Rol (Grupo)" readOnly />
              <ZdsInput name={QD.strAssignee} control={control} label="Responsable" readOnly />
            </div>
          </PqrSection>
        )}

        {/* ── Acciones ── */}
        <div className="pqr-actions">
          <ZrButton config="secondary" onClick={limpiarFormulario}>Limpiar queja</ZrButton>
          <ZrButton
            config="positive"
            icon="send:line"
            onClick={() => handleSubmit(onSubmit, scrollToFirstError)()}
            loading={submitting}
            disabled={submitting || !blnCanSubmit}
          >
            Enviar PQR
          </ZrButton>
        </div>
      </form>

      {/* Confirmación de casos similares — el watcher (script 70) detectó PQRS
          activas con el mismo motivo + producto + identificación. */}
      {objSimilarPrompt && (
        <ZrModal model={!!objSimilarPrompt} onChange={(open: boolean) => { if (!open) handleCancelSimilar(); }}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Encontramos casos similares
          </h3>
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            {objSimilarPrompt.count === 1
              ? 'Ya existe 1 caso activo con el mismo motivo, producto e identificación. Revisa antes de radicar uno nuevo.'
              : `Ya existen ${objSimilarPrompt.count} casos activos con el mismo motivo, producto e identificación. Revisa antes de radicar uno nuevo.`}
          </ZrAlert>
          <ul style={{ margin: 'var(--zs-100) 0', paddingLeft: 'var(--zs-150)', color: 'var(--z-text)', font: 'var(--zf-body-14--400)' }}>
            {(objSimilarPrompt.cases.length > 0
              ? objSimilarPrompt.cases.map((objCase) => {
                  const strNumber = (objCase.case_number ?? objCase.id) as string | number;
                  const strStatus = objCase.status as string | undefined;
                  const strDate = objCase.created_at as string | undefined;
                  return `Caso #${strNumber}${strStatus ? ` · ${strStatus}` : ''}${strDate ? ` · ${strDate.slice(0, 10)}` : ''}`;
                })
              : objSimilarPrompt.ids.map((intId) => `Caso #${intId}`)
            ).map((strLine, intIdx) => (
              <li key={intIdx}>{strLine}</li>
            ))}
          </ul>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary" onClick={handleCancelSimilar}>No continuar</ZrButton>
            <ZrButton config="positive" onClick={handleConfirmSimilar}>Continuar</ZrButton>
          </div>
        </ZrModal>
      )}
    </PqrPage>
  );
}
