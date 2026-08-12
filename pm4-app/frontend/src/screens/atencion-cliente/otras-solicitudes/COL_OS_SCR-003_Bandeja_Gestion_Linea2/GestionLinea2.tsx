import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import { pm4TasksUrl } from '../../../../core/useToken';
import { estadoSlaPorDiasRestantes, estadoSlaVariant } from '../../../../core/businessDays';
import { uploadAttachments, attachIdsToPayload } from '../../../../core/attachments';
import ScreenHeader from '../../../../components/ScreenHeader';
import InfoBar from '../../../../components/InfoBar';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import RequestFileList from '../../../../components/RequestFileList';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsStatusBadge,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import ReasignarCasoModal from './ReasignarCasoModal';
import {
  OS, OS_CLIENT_DOC_KEYS,
  SCR003_DEFAULTS as DEFAULTS,
  SCR003_SUPPORT_DOC_KEYS as SUPPORT_DOC_KEYS,
  SCR003_MAX_SOPORTES as MAX_SOPORTES,
  SCR003_MIN_ANALISIS as MIN_ANALISIS,
  SCR003_SLA_UMBRAL_PROXIMO as SLA_UMBRAL_PROXIMO,
} from '../fields/fields';
import type { GestionLinea2FormData, AccionGestionLinea2 } from '../fields/fields';

/**
 * SCR-003 · PAN-03 — Bandeja de Tareas / Gestión Línea 2 (P02 · P02-T12).
 *
 * El usuario del área especializada documenta el análisis técnico del caso que le
 * enrutó la compuerta "¿Requiere Línea 2?" y lo retorna al flujo principal. Todo lo
 * de S1/S2 llega precargado desde el caso (solo lectura); lo editable es el análisis
 * (S3) y los soportes internos (S4), que NO se envían al cliente.
 */
export default function GestionLinea2() {
  const { task, loading, error, submitting, completeTask, saveDraft, reassignTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [strSendError, setStrSendError] = useState<string | null>(null);
  const [blnShowReasignar, setBlnShowReasignar] = useState(false);

  const form = useForm<GestionLinea2FormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Precargamos el formulario con los datos que llegan de la tarea.
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<GestionLinea2FormData>) });
  }, [task, reset]);

  // Atajo para leer el mensaje de error de un campo (solo tras el submit).
  const err = (in_strName: keyof GestionLinea2FormData): string | undefined => {
    const objErr = errors[in_strName];
    if (!objErr || (objErr.type === 'required' && !isSubmitted)) return undefined;
    return String(objErr.message);
  };

  // FLD-042 — el SLA restante llega ya calculado por el sistema (días hábiles), a
  // diferencia de Quejas Directas, donde se deriva de la fecha de radicación. Puede
  // venir vacío mientras el BPM no lo resuelve, de ahí el parse defensivo.
  const intSlaRemaining = Number.parseInt(String(objWatch[OS.intSlaRemaining] ?? ''), 10);
  const blnHasSla = Number.isFinite(intSlaRemaining);
  const strEstadoSla = estadoSlaPorDiasRestantes(intSlaRemaining, blnHasSla, SLA_UMBRAL_PROXIMO);
  const blnSlaCritical = blnHasSla && intSlaRemaining <= SLA_UMBRAL_PROXIMO;

  // RUL-003-01 (🔴 BLOQUEA): sin análisis técnico no se puede confirmar la atención.
  const blnCanSubmit = !!objWatch[OS.strTechAnalysis]?.trim();

  // Sube los soportes internos y cierra la tarea con la acción indicada.
  const enviarCon = (in_strAction: AccionGestionLinea2) => async (in_objData: GestionLinea2FormData): Promise<boolean> => {
    setStrSendError(null);
    try {
      const intRequestId = task?.process_request_id;
      const dicUploadedIds = intRequestId && fileRegistry.current.size > 0
        ? await uploadAttachments(intRequestId, fileRegistry.current)
        : {};
      const objPayload = {
        ...in_objData,
        ...attachIdsToPayload(dicUploadedIds),
        [OS.strAction]: in_strAction,
      } as unknown as Record<string, unknown>;
      if (in_strAction === 'GUARDAR_BORRADOR') {
        await saveDraft(objPayload);
        return true;
      }
      await completeTask(objPayload);
      return true;
    } catch (exc) {
      // No tragar el error: si la tarea no se completa, PM4 no cierra el iframe.
      const objErr = exc as { response?: { data?: { message?: string } }; message?: string };
      const strMsg = objErr.response?.data?.message ?? objErr.message ?? 'Error desconocido al enviar.';
      console.error('[GestionLinea2] Error al enviar:', exc);
      setStrSendError(strMsg);
      return false;
    }
  };

  // ACT-003-01 Confirmar Atención Línea 2 — valida RUL-003-01 y el mínimo de 100 caracteres.
  const onConfirmarAtencion = handleSubmit(enviarCon('CONFIRMAR_ATENCION'), scrollToFirstError);

  // ACT-003-04 Guardar Borrador: guarda sin avanzar el flujo y devuelve el frame superior
  // (fuera del iframe) al home de tareas de ProcessMaker, solo si se guardó bien.
  const onGuardarBorrador = async () => {
    const blnOk = await enviarCon('GUARDAR_BORRADOR')(objWatch);
    if (blnOk) window.top!.location.href = pm4TasksUrl();
  };

  // ACT-003-03 Cancelar: descarta los cambios volviendo a los valores del caso.
  const onCancelar = () => {
    setStrSendError(null);
    reset({ ...DEFAULTS, ...(task?.data as Partial<GestionLinea2FormData> ?? {}) });
    fileRegistry.current.clear();
  };

  // ACT-003-02 Reasignar Caso — solo cambia el responsable (PUT /tasks/{id} { user_id }):
  // NO completa la tarea ni avanza el flujo BPM, a diferencia de las demás acciones.
  const onReasignar = async (in_strUserId: string) => {
    setStrSendError(null);
    try {
      await reassignTask({ ...objWatch, [OS.strAction]: 'REASIGNAR' } as unknown as Record<string, unknown>, in_strUserId);
      setBlnShowReasignar(false);
    } catch (exc) {
      const objErr = exc as { response?: { data?: { message?: string } }; message?: string };
      console.error('[GestionLinea2] Error al reasignar:', exc);
      setStrSendError(objErr.response?.data?.message ?? objErr.message ?? 'Error desconocido al reasignar.');
    }
  };

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

  // Barra de contexto del caso (ctx-bar de la maqueta). "Estado" no es un campo del
  // Anexo02: mientras esta pantalla está abierta la tarea ES la de Línea 2 (P02-T12),
  // así que el estado se rotula fijo y solo el semáforo del SLA es dinámico.
  const arrInfoItems = [
    { label: 'Caso', value: objWatch[OS.strBpmCaseId] || '—' },
    {
      label: 'SLA',
      value: blnHasSla ? (
        <ZdsStatusBadge variant={estadoSlaVariant(strEstadoSla)}>
          {`${intSlaRemaining} días hábiles`}
        </ZdsStatusBadge>
      ) : '—',
    },
    {
      label: 'Tipología',
      value: objWatch[OS.strCaseType]
        ? <ZdsStatusBadge variant="info">{objWatch[OS.strCaseType]}</ZdsStatusBadge>
        : '—',
    },
    { label: 'Estado', value: <ZdsStatusBadge variant="neutral">Asignado a Línea 2</ZdsStatusBadge> },
  ];

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Bandeja de Tareas — Gestión Línea 2"
        subtitle="Análisis técnico especializado — documentación de respuesta y retorno al flujo principal"
      />

      <div className="screen-content">
        <InfoBar items={arrInfoItems} />

        {/* FLD-042 "Semaforizado" — aviso cuando el caso entra en zona de vencimiento. */}
        {blnSlaCritical && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            El caso tiene <strong>{intSlaRemaining}</strong> día(s) hábil(es) restante(s).
            Priorice el análisis técnico.
          </ZrAlert>
        )}

        <form onSubmit={onConfirmarAtencion} noValidate>

          {/* ── S1 · Encabezado Estado del Caso (SEC-009, solo lectura) ── */}
          <FormSection title="S1 · Encabezado Estado del Caso">
            <div className="form-row cols-4">
              <ZdsInput name={OS.strBpmCaseId} control={control} label="ID Caso / Código Radicado" readOnly />
              <div className="zds-field-wrap">
                <span className="info-bar-label">Tipología del Caso</span>
                <div style={{ marginTop: 'var(--zs-50)' }}>
                  {objWatch[OS.strCaseType]
                    ? <ZdsStatusBadge variant="info">{objWatch[OS.strCaseType]}</ZdsStatusBadge>
                    : <span className="info-bar-value">—</span>}
                </div>
              </div>
              <div className="zds-field-wrap">
                <span className="info-bar-label">SLA: Días Hábiles Restantes</span>
                <div style={{ marginTop: 'var(--zs-50)' }}>
                  {blnHasSla
                    ? (
                      <ZdsStatusBadge variant={estadoSlaVariant(strEstadoSla)}>
                        {`${intSlaRemaining} días hábiles`}
                      </ZdsStatusBadge>
                    )
                    : <span className="info-bar-value">—</span>}
                </div>
              </div>
              <ZdsInput name={OS.strDueDate} control={control} label="Fecha Límite" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Detalle del Caso Asignado (SEC-010, solo lectura) ── */}
          <FormSection title="S2 · Detalle del Caso Asignado">
            <div className="form-row cols-2">
              <ZdsInput name={OS.strConsumerName} control={control} label="Nombre del Consumidor" readOnly />
              <ZdsInput name={OS.strIdentification} control={control} label="Tipo y N.° de Identificación" readOnly />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={OS.strProductLine} control={control} label="Producto / Ramo" readOnly />
              <div />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name={OS.strCaseDescription} control={control} label="Descripción del Caso" readOnly />
            </div>
            {/* FLD-048 — documentos que cargó el cliente: solo visualización y descarga. */}
            <div className="form-row cols-1">
              <RequestFileList
                requestId={task?.process_request_id ?? null}
                docKeys={OS_CLIENT_DOC_KEYS}
                label="Documentos del Cliente"
                emptyText="El caso no tiene documentos del cliente."
              />
            </div>
          </FormSection>

          {/* ── S3 · Análisis y Respuesta Técnica (SEC-011, editable) ── */}
          <FormSection title="S3 · Análisis y Respuesta Técnica">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={OS.strTechAnalysis} control={control} label="Análisis Técnico / Resolución"
                required
                rules={{
                  required: 'Debe documentar el análisis o resolución antes de confirmar la atención.',
                  minLength: {
                    value: MIN_ANALISIS,
                    message: `El análisis debe tener al menos ${MIN_ANALISIS} caracteres.`,
                  },
                }}
                error={err(OS.strTechAnalysis)}
                placeholder={`Documente el análisis de la solicitud y la solución adoptada. Mínimo ${MIN_ANALISIS} caracteres…`}
                helpText={`Mínimo ${MIN_ANALISIS} caracteres. Debe documentar la solución adoptada.`}
              />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea
                name={OS.strSystemActions} control={control} label="Acciones Ejecutadas en Sistemas"
                placeholder="Sistemas consultados, cambios ejecutados, referencias…"
                helpText="Sistemas consultados, cambios ejecutados."
              />
            </div>
          </FormSection>

          {/* ── S4 · Soportes Internos (SEC-012, editable) ── */}
          <FormSection title="S4 · Soportes Internos">
            <DocSupportUploader
              form={form}
              fileRegistry={fileRegistry}
              docKeys={SUPPORT_DOC_KEYS}
              title="Adjuntos de Soporte Interno"
              intro={`Adjunte los soportes internos del análisis. No van al cliente: son solo de uso interno. Máx ${MAX_SOPORTES} archivos.`}
              max={MAX_SOPORTES}
            />
          </FormSection>

          {/* RUL-003-01 / MSG-003-01 — bloqueo de la confirmación si falta el análisis. */}
          {!blnCanSubmit && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Debe documentar el <strong>análisis o resolución</strong> antes de confirmar la
              atención. {/* MSG-003-01 */}
            </ZrAlert>
          )}

          {/* Error de envío — la tarea no se completó (por eso PM4 no cierra el iframe). */}
          {strSendError && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              No se pudo enviar: {strSendError}
            </ZrAlert>
          )}

          {/* ── Acciones (ACT-003-01..04, en el orden de la maqueta) ── */}
          <ActionBar>
            <ZrButton config="secondary" disabled={submitting} onClick={onCancelar}>
              Cancelar
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} onClick={() => setBlnShowReasignar(true)}>
              Reasignar Caso
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            <ZrButton
              config="positive" disabled={!blnCanSubmit || submitting} loading={submitting}
              onClick={() => { onConfirmarAtencion(); }}
            >
              Confirmar Atención ▶
            </ZrButton>
          </ActionBar>
        </form>

        <ReasignarCasoModal
          isOpen={blnShowReasignar}
          onClose={() => setBlnShowReasignar(false)}
          form={form}
          onConfirm={onReasignar}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
