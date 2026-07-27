import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { scrollToFirstError } from '../../../../core/scrollToFirstError';
import { pm4TasksUrl } from '../../../../core/useToken';
import { useCollection, descOf, useSyncDesc } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsSelect, ZrButton, ZrAlert, ZrLoader, ZrModal,
} from '../../../../components/fields/ZdsFields';
import {
  QD, QD_COLLECTIONS, SCR009_DEFAULTS as DEFAULTS, SCR009_BACK_DEFAULTS,
  SCR009_DEFAULT_ENTITY_TYPE, SCR009_DEFAULT_ENTITY_CODE,
} from '../fields/fields';
import type { FormularioSuperintendenciaFormData, AccionFormularioSFC } from '../fields/fields';
import SeccionFraudeAnexos from './SeccionFraudeAnexos';
import SeccionCierreEnvio from './SeccionCierreEnvio';

// Par etiqueta/valor de solo lectura (mismo patrón que SCR-0051 / SCR-010).
export function Ro({ label, value }: { label: string; value: string }) {
  return (
    <div className="zds-field-wrap">
      <span className="info-bar-label">{label}</span>
      <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{value}</div>
    </div>
  );
}

export default function FormularioSuperintendencia() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask, saveDraft } = useTask();

  // Popup de confirmación previo al envío a SmartSupervision (cierra el caso).
  const [blnShowConfirm, setBlnShowConfirm] = useState(false);

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<FormularioSuperintendenciaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Catálogos para resolver el CÓDIGO almacenado en PM4 a su descripción legible.
  // El valor guardado no cambia (sigue siendo el código que espera el BPM/SFC).
  const { options: cllSex } = useCollection(QD_COLLECTIONS.sex);
  const { options: cllLgbtiq } = useCollection(QD_COLLECTIONS.lgbtiq);
  const { options: cllSpecialCond } = useCollection(QD_COLLECTIONS.specialCondition);
  const { options: cllDigitalProduct } = useCollection(QD_COLLECTIONS.digitalProduct);
  const { options: cllComplaintStatus } = useCollection(QD_COLLECTIONS.complaintStatus);
  const { options: cllFavorability } = useCollection(QD_COLLECTIONS.favorability);
  const { options: cllAcceptance } = useCollection(QD_COLLECTIONS.acceptance);
  const { options: cllRectification } = useCollection(QD_COLLECTIONS.rectification);
  const { options: cllWithdrawal } = useCollection(QD_COLLECTIONS.withdrawal);
  const { options: cllTutela } = useCollection(QD_COLLECTIONS.tutela);
  const { options: cllMarking } = useCollection(QD_COLLECTIONS.marking);
  const { options: cllExpressComplaint } = useCollection(QD_COLLECTIONS.expressComplaint);

  // Sincroniza la variable compañera <campo>_desc con la descripción del código guardado.
  // El campo base mantiene el CÓDIGO que espera el BPM/SFC; _desc viaja junto para lectura.
  useSyncDesc(form, QD.strSpecialCondition, cllSpecialCond);
  useSyncDesc(form, QD.strSex, cllSex);
  useSyncDesc(form, QD.strLgbtiq, cllLgbtiq);
  useSyncDesc(form, QD.strDigitalProduct, cllDigitalProduct);
  useSyncDesc(form, QD.strComplaintStatus, cllComplaintStatus);
  useSyncDesc(form, QD.strFavorability, cllFavorability);
  useSyncDesc(form, QD.strAcceptance, cllAcceptance);
  useSyncDesc(form, QD.strRectification, cllRectification);
  useSyncDesc(form, QD.strWithdrawal, cllWithdrawal);
  useSyncDesc(form, QD.strTutela, cllTutela);
  useSyncDesc(form, QD.strMarking, cllMarking);
  useSyncDesc(form, QD.strExpressComplaint, cllExpressComplaint);

  // Pre-poblamos el formulario con los datos del caso. reset() reemplaza todo el
  // estado, así que TODAS las claves de task.data (incl. los campos "Back"
  // calculados que no son editables) quedan en el form y se reenvían intactas.
  // Además, los defaults "Back" con código confirmado (SCR009_BACK_DEFAULTS) se
  // GARANTIZAN al llegar aquí: si el proceso no los trae o los manda vacíos, se
  // rellenan con su valor marcado (Excel PQRS V3.0) para que existan y viajen.
  useEffect(() => {
    if (!task?.data) return;
    const objData = { ...(task.data as Partial<FormularioSuperintendenciaFormData>) };
    for (const [strKey, strDefault] of Object.entries(SCR009_BACK_DEFAULTS)) {
      const strCurrent = objData[strKey as keyof FormularioSuperintendenciaFormData] as string | undefined;
      if (!strCurrent) objData[strKey as keyof FormularioSuperintendenciaFormData] = strDefault as never;
    }
    // Cierre M3 (fusionado desde la ex SCR-010): tipo/código de entidad respetan
    // el valor del back si viene; si no, se inyectan con su default para que
    // igual viajen. El adjunto de respuesta final se fuerza siempre a "SI"
    // (el PDF lo genera el proceso).
    // Fecha de Actualización y Fecha de Cierre se autocompletan con la fecha de
    // hoy (YYYY-MM-DD) y son idénticas; en la sección de cierre son readOnly, así
    // que el gestor no puede modificarlas.
    const strHoyISO = new Date().toISOString().slice(0, 10);
    reset({
      ...DEFAULTS,
      ...objData,
      [QD.strEntityType]: objData[QD.strEntityType] || SCR009_DEFAULT_ENTITY_TYPE,
      [QD.strEntityCode]: objData[QD.strEntityCode] || SCR009_DEFAULT_ENTITY_CODE,
      [QD.strFinalReplyAttach]: 'SI',
      [QD.strUpdateDate]: strHoyISO,
      [QD.strClosureDate]: strHoyISO,
    });
  }, [task, reset]);

  const err = (in_strField: keyof FormularioSuperintendenciaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // Alineación con el Excel PQRS V3.0: los campos regulatorios (sexo, LGBTIQ+,
  // producto digital, y toda la Condición de la Queja) los calcula el back
  // ("Back"/"Automático"/"Por default") → solo lectura. Los editables que
  // condicionan el guardado son Condición Especial (Front, obligatorio SFC),
  // los dos indicadores de anexos y, si ¿Relacionada con Fraude? = Sí, los 4
  // campos de fraude (RUL-009-01 / MSG-009-01).
  const blnSpecialCondOk = !!(objWatch[QD.strSpecialCondition] as string)?.trim();
  const blnAnnexesComplete = !!objWatch[QD.strIncludesComplaintAnnex] && !!objWatch[QD.strIncludesReplyAttach];
  const blnIsFraud = objWatch[QD.strFraudRelated] === 'SI';
  const blnFraudComplete = !blnIsFraud || (
    !!(objWatch[QD.strFraudType] as string)?.trim()
    && !!(objWatch[QD.strFraudModality] as string)?.trim()
    && !!(objWatch[QD.strClaimedAmount] as string)?.trim()
    && !!(objWatch[QD.strAcknowledgedAmount] as string)?.trim()
  );
  const blnCanSave = blnSpecialCondOk && blnAnnexesComplete && blnFraudComplete;

  // Cierre M3 (fusionado desde la ex SCR-010): si la SFC rechazó el envío, la
  // acción de envío pasa a "Reenviar Cierre (corrección)".
  const blnRejected = objWatch[QD.strM3ClosureStatus] === 'Rechazado (400)';

  // Enviamos la tarea con la acción seleccionada (ENVIAR_SFC completa; GUARDAR_BORRADOR
  // guarda sin completar).
  const enviarCon = (in_strAction: AccionFormularioSFC) => async (in_objData: FormularioSuperintendenciaFormData): Promise<boolean> => {
    try {
      if (in_strAction === 'GUARDAR_BORRADOR') {
        await saveDraft({ ...in_objData, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>);
        return true;
      }
      await completeTask({ ...in_objData, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>);
      return true;
    } catch (exc) {
      console.error('[FormularioSuperintendencia] Error al enviar:', exc);
      return false;
    }
  };

  // ACT-009-02 Guardar Borrador: guarda sin completar la tarea y redirige el frame
  // superior al home de tareas de ProcessMaker (solo si se guardó bien).
  const onGuardarBorrador = async () => {
    const blnOk = await enviarCon('GUARDAR_BORRADOR')(objWatch);
    if (blnOk) window.top!.location.href = pm4TasksUrl();
  };

  // Al pulsar "Enviar a SmartSupervision": valida el formulario y, si está OK,
  // abre el popup de confirmación (el envío real ocurre al confirmar).
  const onSolicitarEnvio = handleSubmit(() => setBlnShowConfirm(true), scrollToFirstError);
  // Confirmación del popup → completa la tarea y cierra el caso.
  const onConfirmarEnvio = async () => {
    setBlnShowConfirm(false);
    await handleSubmit(enviarCon('ENVIAR_SFC'))();
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

  // Regla de validación reutilizable para campos requeridos
  const objReq = { required: 'Campo requerido' };

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Formulario Superintendencia"      />

      <div className="screen-content">
        <form onSubmit={(e) => { e.preventDefault(); onSolicitarEnvio(); }} noValidate>

          {/* ── S2 · Datos del Consumidor — Campos SFC (SEC-029) ── */}
          {/* Sexo y LGBTIQ+ llegan precargados desde SCR-000 (default "No Aplica"/
              "No") y aquí son seleccionables por el Analista SAC: el ZdsSelect
              muestra la descripción (label) pero guarda el código; su _desc
              compañera viaja sola vía useSyncDesc, sin campo visible propio.
              Producto Digital ahora es editable (ZdsSelect sobre la colección
              25, default "No"=código '2'); Condición Especial sigue siendo Front
              editable (Excel PQRS V3.0 #23/#26). */}
          <FormSection title="Datos del Consumidor — Campos SFC">
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strSex} control={control} label="Sexo" options={cllSex} />
              <ZdsSelect name={QD.strLgbtiq} control={control} label="LGBTIQ+" options={cllLgbtiq} />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strDigitalProduct} control={control} label="Producto Digital"
                options={cllDigitalProduct} />
              <ZdsSelect name={QD.strSpecialCondition} control={control} label="Condición Especial"
                options={cllSpecialCond} required rules={objReq} error={err(QD.strSpecialCondition)}
                helpText="CAT-COND-ESP (Front, obligatorio SFC)." />
            </div>
          </FormSection>

          {/* ── S3 · Condición de la Queja (SEC-030) — Back/solo lectura, salvo:
                 Estado de la Queja (ZdsSelect colección 42, default "Cerrada"='4')
                 y Marcación (ZdsSelect colección 31, opción inicial "-" sin valor). ── */}
          <FormSection title="Condición de la Queja">
            <div className="form-row cols-3">
              <ZdsSelect name={QD.strComplaintStatus} control={control} label="Estado de la Queja o Reclamo"
                options={cllComplaintStatus} />
              <Ro label="Favorabilidad" value={descOf(cllFavorability, objWatch[QD.strFavorability])} />
              <Ro label="Aceptación" value={descOf(cllAcceptance, objWatch[QD.strAcceptance])} />
            </div>
            <div className="form-row cols-3">
              <Ro label="Rectificación" value={descOf(cllRectification, objWatch[QD.strRectification])} />
              <Ro label="Desistimiento" value={descOf(cllWithdrawal, objWatch[QD.strWithdrawal])} />
              <Ro label="Tutela" value={descOf(cllTutela, objWatch[QD.strTutela])} />
            </div>
            {/* Marcación tiene etiquetas de opción largas → a ancho completo (cols-1)
                para que el dropdown no trunque el texto. */}
            <div className="form-row cols-1">
              <ZdsSelect name={QD.strMarking} control={control} label="Marcación"
                options={cllMarking} placeholder="-" />
            </div>
            <div className="form-row cols-3">
              <Ro label="Queja Exprés" value={descOf(cllExpressComplaint, objWatch[QD.strExpressComplaint])} />
              <div />
              <div />
            </div>
          </FormSection>

          {/* ── S4 Fraude (tipo/modalidad/montos editables) · S5 Anexos (editables) ── */}
          <SeccionFraudeAnexos form={form} err={err} requestId={task?.process_request_id ?? null} />

          {/* ── Cierre Regulatorio M3 (fusionado desde la ex SCR-010) ── */}
          <SeccionCierreEnvio form={form} />

          {/* MSG-009-02 — bloqueo si faltan los editables obligatorios. */}
          {!blnCanSave && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              <span>
                Complete <strong>Condición Especial</strong>, los indicadores de anexos
                {blnIsFraud && <> y los <strong>datos de fraude</strong> (tipo, modalidad y montos)</>} antes de enviar. {/* MSG-009-02 */}
              </span>
            </ZrAlert>
          )}

          {/* ── Acciones: Guardar Borrador (ACT-009-02) y Enviar (ACT-009-03). ── */}
          <ActionBar>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanSave || submitting} loading={submitting}
              onClick={() => { onSolicitarEnvio(); }}>
              {blnRejected ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'}
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* Popup de confirmación previo al envío (el envío cierra el caso). */}
      {blnShowConfirm && (
        <ZrModal model={blnShowConfirm} onChange={(in_blnOpen: boolean) => setBlnShowConfirm(in_blnOpen)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Confirmar envío a SmartSupervision
          </h3>
          <p style={{ margin: '0 0 var(--zs-100)', color: 'var(--z-text)' }}>
            ¿Está seguro de enviar estos datos? Se enviarán a <strong>SmartSupervision (SFC)</strong> y
            el caso quedará <strong>cerrado</strong>. Esta acción no se puede deshacer.
          </p>
          <div z-flex="75" z-align="right:center">
            <ZrButton config="secondary" disabled={submitting} onClick={() => setBlnShowConfirm(false)}>
              Atrás
            </ZrButton>
            <ZrButton config="positive" disabled={submitting} loading={submitting} onClick={onConfirmarEnvio}>
              Enviar ▶
            </ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
