import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea,
  ZrButton, ZrAlert, ZrModal, ZrLoader, ZrTable,
} from '../../../../components/fields/ZdsFields';
import {
  QD, SCR003_DEFAULTS as DEFAULTS, SCR003_UMBRAL_INTENTOS as UMBRAL_INTENTOS,
  SCR003_PAYLOAD_M2_FIELDS,
} from '../fields/fields';
import type { CorreccionErrorFuncionalFormData, AccionErrorFuncional } from '../fields/fields';
import SeccionCamposPayload from './SeccionCamposPayload';

export default function CorreccionErrorFuncional() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnShowLog, setBlnShowLog] = useState(false);
  // Variables con el checkbox "Editar" marcado en S2 (estado de UI: no viaja a PM4).
  const [dicEditables, setDicEditables] = useState<Record<string, boolean>>({});
  // Valor de cada variable del payload tal como llegó en task.data (para revertir/comparar).
  const [dicOriginales, setDicOriginales] = useState<Record<string, string>>({});

  const form = useForm<CorreccionErrorFuncionalFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, getValues, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea y congelamos los
  // valores originales de los campos del payload (base de comparación de S2).
  useEffect(() => {
    if (!task?.data) return;
    const dicData = task.data as Record<string, unknown>;
    reset({ ...DEFAULTS, ...(dicData as Partial<CorreccionErrorFuncionalFormData>) });
    const dicOrig: Record<string, string> = {};
    for (const objDef of SCR003_PAYLOAD_M2_FIELDS) {
      if (!objDef.variable) continue;
      dicOrig[objDef.variable] = String(dicData[objDef.variable] ?? '');
    }
    setDicOriginales(dicOrig);
    setDicEditables({});
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof CorreccionErrorFuncionalFormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // ── S1 · el script de Momento 2 NO escribe FLD-040..045 ────────────────────
  // sfcCamposErrorTecnico() emite qd_strHttpCode / qd_strErrorType /
  // qd_strApiTechMessage / qd_strCompleteLogAPI / qd_strAttemptNum / qd_strPayloadSent
  // (el juego que consumía la ex SCR-004; hoy esta pantalla es la única que lo
  // pinta, pero quien lo escribe sigue siendo el script). Si el caso trae los campos propios de
  // SCR-003 se muestran esos; si no, se cae a las variables que el script sí emite.
  const nmErrorCode = objWatch[QD.strSfcErrorCode] ? QD.strSfcErrorCode : QD.strHttpCode;
  const nmErrorMessage = objWatch[QD.strSfcErrorMessage] ? QD.strSfcErrorMessage : QD.strApiTechMessage;
  const nmAttempt = objWatch[QD.strM1M2AttemptNum] ? QD.strM1M2AttemptNum : QD.strAttemptNum;
  const strAttempt = objWatch[nmAttempt] ?? '';

  // RUL-003-02 (info): a partir de UMBRAL_INTENTOS sugerir escalamiento técnico.
  const intAttempts = Number.parseInt(strAttempt, 10);
  const blnMultipleAttempts = Number.isFinite(intAttempts) && intAttempts >= UMBRAL_INTENTOS;

  // Body que el script alcanzó a enviar — referencia de solo lectura para S2.
  const strPayloadRaw = objWatch[QD.strPayloadSent] ?? '';
  const objPayloadEnviado = useMemo<Record<string, unknown> | null>(() => {
    if (!strPayloadRaw) return null;
    try {
      const genParsed: unknown = JSON.parse(strPayloadRaw);
      return genParsed && typeof genParsed === 'object' && !Array.isArray(genParsed)
        ? genParsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }, [strPayloadRaw]);

  // Campo señalado por la SFC: el explícito si viene, si no el mensaje de error
  // (SeccionCamposPayload busca en él el nombre de la clave del payload).
  // qd_strAffectedField / qd_strRejectedValue ya no se muestran en S1 (ningún script
  // los escribe → salían vacíos), pero si el caso los trae siguen alimentando esta
  // pista y viajan en el payload de completeTask.
  const strSenalado = objWatch[QD.strAffectedField] || objWatch[nmErrorMessage] || '';

  // Lista de intentos previos del caso.
  const lstHistory = Array.isArray(objWatch[QD.lstAttemptHistory]) ? objWatch[QD.lstAttemptHistory] : [];

  const onEditable = (in_strVariable: string, in_blnOn: boolean) =>
    setDicEditables((in_dicPrev) => (in_dicPrev[in_strVariable] === in_blnOn
      ? in_dicPrev
      : { ...in_dicPrev, [in_strVariable]: in_blnOn }));

  // Resumen de los cambios aplicados (alimenta qd_strFieldCorrection, FLD-046).
  const lstCambios = (): string[] => {
    const dicNow = getValues() as unknown as Record<string, unknown>;
    const lstOut: string[] = [];
    for (const objDef of SCR003_PAYLOAD_M2_FIELDS) {
      if (!objDef.variable) continue;
      const strNow = String(dicNow[objDef.variable] ?? '');
      const strWas = dicOriginales[objDef.variable] ?? '';
      if (strNow === strWas) continue;
      const strDesc = String(dicNow[`${objDef.variable}_desc`] ?? '');
      const strLabel = objDef.aux ? objDef.variable : objDef.key;
      lstOut.push(`${strLabel}: ${strWas || '(vacío)'} → ${strNow || '(vacío)'}${strDesc ? ` (${strDesc})` : ''}`);
    }
    return lstOut;
  };

  // ACT-003-02 — escalar a soporte técnico (no toca el payload: se conserva como evidencia).
  const onEscalar = () =>
    completeTask({ ...objWatch, [QD.strAction]: 'ESCALAR_SOPORTE' as AccionErrorFuncional } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[CorreccionErrorFuncional] Error al escalar:', exc));

  // ACT-003-01 — corregir y reenviar. Las correcciones viajan como variables del
  // caso y se VACÍA qd_strPayloadSent: así opMomento2 reconstruye el body con
  // buildBodyMomento2 desde los campos corregidos. Si no se vaciara, el script
  // compararía el body regenerado contra el payload viejo, vería diferencia y
  // reenviaría el VIEJO (Solo Momento 2.php → opMomento2).
  const onReenviar = handleSubmit((in_objData) => {
    const lstResumen = lstCambios();
    return completeTask({
      ...in_objData,
      [QD.strFieldCorrection]: lstResumen.length ? lstResumen.join('; ') : 'Reenvío sin cambios en el payload',
      [QD.strPayloadSent]: '',
      [QD.strPayloadAdjustNeeded]: 'NO',
      [QD.strAction]: 'CORREGIR_REENVIAR' as AccionErrorFuncional,
    } as unknown as Record<string, unknown>)
      .catch((exc) => console.error('[CorreccionErrorFuncional] Error al reenviar:', exc));
  }, scrollToFirstError);

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  }
  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
          Error al cargar el formulario: {error}
        </ZrAlert>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Corrección Error Funcional M1/M2"
      />

      <div className="screen-content">
        <form onSubmit={onReenviar} noValidate>

          {/* ── S1 · Panel de Error SmartSupervision (solo lectura) ── */}
          <FormSection
            title="Panel de Error SmartSupervision"
            color="var(--z-red)"
            action={
              <ZrButton config="link" icon="file-text:line" onClick={() => setBlnShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              SmartSupervision <strong>rechazó la radicación (HTTP 400 funcional)</strong> por datos
              inválidos. Corrija los campos señalados en la sección siguiente y reenvíe — el body se
              regenera con las variables corregidas.
              {strAttempt && <> Intento actual <strong>#{strAttempt}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={nmErrorCode} control={control} label="Código de Error SFC / HTTP" readOnly />
              <ZdsInput name={QD.strErrorType} control={control} label="Tipo de Error" readOnly />
              <ZdsInput name={nmAttempt} control={control} label="Intento N.° actual (M1/M2)" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsInput name={QD.strEndpointCalled} control={control} label="Endpoint Invocado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={nmErrorMessage}
                control={control}
                label="Mensaje de Error SFC"
                readOnly
                helpText="Mensaje literal devuelto por SmartSupervision — solo lectura."
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strPayloadSent}
                control={control}
                label="Payload Enviado (JSON)"
                readOnly
                helpText="JSON del body que se envió en el intento fallido — solo lectura. Para corregirlo use la sección Campos a Corregir: el body se regenera con las variables del caso."
              />
            </div>

            {/* RUL-003-02 / MSG-003-02 — múltiples intentos: sugerir escalamiento. */}
            {blnMultipleAttempts && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Ha intentado <strong>{strAttempt}</strong> veces. Si el problema persiste,
                considere <strong>escalar a soporte técnico</strong>. {/* MSG-003-02 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── S2 · Campos a Corregir (editor del payload de Momento 2) ── */}
          <SeccionCamposPayload
            form={form}
            originales={dicOriginales}
            editables={dicEditables}
            onEditable={onEditable}
            payloadEnviado={objPayloadEnviado}
            senalado={strSenalado}
          />

          <FormSection title="Justificación de la Corrección">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strCorrectionJustif}
                control={control}
                label="Justificación de la corrección"
                maxLength={2000}
                error={err(QD.strCorrectionJustif)}
                helpText="Comentario opcional del gestor sobre el ajuste aplicado. El detalle de los campos modificados se registra automáticamente."
              />
            </div>
          </FormSection>

          {/* ── S3 · Historial de Intentos (solo lectura) ── */}
          <FormSection title="Historial de Intentos">
            <ZrTable zebra>
              <table>
                <thead>
                  <tr>
                    <th>Intento</th>
                    <th>Fecha</th>
                    <th>Campo afectado</th>
                    <th>Código error</th>
                  </tr>
                </thead>
                <tbody>
                  {lstHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="record-empty">Sin intentos anteriores registrados</td>
                    </tr>
                  ) : (
                    lstHistory.map((objRow, intIndex) => (
                      <tr key={intIndex}>
                        <td>{objRow.intento}</td>
                        <td>{objRow.fecha}</td>
                        <td>{objRow.campoAfectado}</td>
                        <td>{objRow.codigoError}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ZrTable>
          </FormSection>

          {/* ── Acciones (ACT-003-01 / ACT-003-02) ── */}
          <ActionBar>
            <ZrButton
              config="secondary"
              loading={submitting}
              disabled={submitting}
              onClick={onEscalar}
            >
              Escalar a Soporte Técnico
            </ZrButton>
            <ZrButton
              config="positive"
              loading={submitting}
              disabled={submitting}
              onClick={() => { onReenviar(); }}
            >
              Corregir y Reenviar ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-003-03 · Ver Log Completo — un único campo con el log que emite el
          script de Momento 2 en qd_strCompleteLogAPI (mismo patrón que la ex SCR-004). */}
      {blnShowLog && (
        <ZrModal model={blnShowLog} onChange={(open: boolean) => setBlnShowLog(open)}>
          <div className="modal-wide">
            <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
              Log completo del rechazo funcional
            </h3>
            <div className="modal-scroll-body">
              <ZdsTextarea name={QD.strCompleteLogAPI} control={control} label="Log Completo" readOnly />
            </div>
            <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
              <ZrButton config="secondary:s" onClick={() => setBlnShowLog(false)}>Cerrar</ZrButton>
            </div>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
