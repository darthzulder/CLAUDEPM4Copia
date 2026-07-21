import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { pm4TasksUrl } from '../../../../core/useToken';
import { useCollection, descOf, useSyncDesc } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsSelect, ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  QD, QD_COLLECTIONS, SCR009_DEFAULTS as DEFAULTS, SCR009_BACK_DEFAULTS,
  SCR009_OPTIONS_LGBTIQ as OPTIONS_LGBTIQ,
} from '../fields/fields';
import type { FormularioSuperintendenciaFormData, AccionFormularioSFC } from '../fields/fields';
import SeccionFraudeAnexos from './SeccionFraudeAnexos';

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

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<FormularioSuperintendenciaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Catálogos para resolver el CÓDIGO almacenado en PM4 a su descripción legible.
  // El valor guardado no cambia (sigue siendo el código que espera el BPM/SFC).
  const { options: cllSex } = useCollection(QD_COLLECTIONS.sex);
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
  useSyncDesc(form, QD.strLgbtiq, OPTIONS_LGBTIQ);
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
    reset({ ...DEFAULTS, ...objData });
  }, [task, reset]);

  const err = (in_strField: keyof FormularioSuperintendenciaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // Alineación con el Excel PQRS V3.0: los campos regulatorios (sexo, LGBTIQ+,
  // producto digital, y toda la Condición de la Queja) los calcula el back
  // ("Back"/"Automático"/"Por default") → solo lectura. Los únicos editables que
  // condicionan el guardado son Condición Especial (Front, obligatorio SFC) y los
  // dos indicadores de anexos.
  const blnSpecialCondOk = !!(objWatch[QD.strSpecialCondition] as string)?.trim();
  const blnAnnexesComplete = !!objWatch[QD.strIncludesComplaintAnnex] && !!objWatch[QD.strIncludesReplyAttach];
  const blnCanSave = blnSpecialCondOk && blnAnnexesComplete;

  // Enviamos la tarea con la accion seleccionada
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

  const onGuardar = handleSubmit(enviarCon('GUARDAR'));         // ACT-009-01
  // ACT-009-02 Guardar Borrador: guarda sin completar la tarea y redirige el frame
  // superior al home de tareas de ProcessMaker (solo si se guardó bien).
  const onGuardarBorrador = async () => {
    const blnOk = await enviarCon('GUARDAR_BORRADOR')(objWatch);
    if (blnOk) window.top!.location.href = pm4TasksUrl();
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
        title="Formulario Superintendencia"
        subtitle={["SP2-T07 · PAN-09", "Gestión de Quejas Directas", "Rol: Analista SAC"]}
      />

      <div className="screen-content">
        <form onSubmit={onGuardar} noValidate>

          {/* ── S2 · Datos del Consumidor — Campos SFC (SEC-029) ── */}
          {/* Sexo, LGBTIQ+ y Producto Digital son "Back" (default); solo Condición
              Especial es Front editable (Excel PQRS V3.0 #23/#26). */}
          <FormSection title="Datos del Consumidor — Campos SFC">
            <div className="form-row cols-2">
              <Ro label="Sexo" value={descOf(cllSex, objWatch[QD.strSex])} />
              <Ro label="LGBTIQ+" value={descOf(OPTIONS_LGBTIQ, objWatch[QD.strLgbtiq])} />
            </div>
            <div className="form-row cols-2">
              <Ro label="Producto Digital" value={descOf(cllDigitalProduct, objWatch[QD.strDigitalProduct])} />
              <ZdsSelect name={QD.strSpecialCondition} control={control} label="Condición Especial"
                options={cllSpecialCond} required rules={objReq} error={err(QD.strSpecialCondition)}
                helpText="CAT-COND-ESP (Front, obligatorio SFC)." />
            </div>
          </FormSection>

          {/* ── S3 · Condición de la Queja (SEC-030) — solo lectura (Back) ── */}
          <FormSection title="Condición de la Queja">
            <div className="form-row cols-3">
              <Ro label="Estado de la Queja o Reclamo" value={descOf(cllComplaintStatus, objWatch[QD.strComplaintStatus])} />
              <Ro label="Favorabilidad" value={descOf(cllFavorability, objWatch[QD.strFavorability])} />
              <Ro label="Aceptación" value={descOf(cllAcceptance, objWatch[QD.strAcceptance])} />
            </div>
            <div className="form-row cols-3">
              <Ro label="Rectificación" value={descOf(cllRectification, objWatch[QD.strRectification])} />
              <Ro label="Desistimiento" value={descOf(cllWithdrawal, objWatch[QD.strWithdrawal])} />
              <Ro label="Tutela" value={descOf(cllTutela, objWatch[QD.strTutela])} />
            </div>
            <div className="form-row cols-3">
              <Ro label="Marcación" value={descOf(cllMarking, objWatch[QD.strMarking])} />
              <Ro label="Queja Exprés" value={descOf(cllExpressComplaint, objWatch[QD.strExpressComplaint])} />
              <div />
            </div>
          </FormSection>

          {/* ── S4 Fraude (solo lectura) · S5 Anexos (editables) ── */}
          <SeccionFraudeAnexos form={form} err={err} requestId={task?.process_request_id ?? null} />

          {/* MSG-009-02 — bloqueo si faltan los editables obligatorios. */}
          {!blnCanSave && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Complete <strong>Condición Especial</strong> y los indicadores de anexos antes de guardar. {/* MSG-009-02 */}
            </ZrAlert>
          )}

          {/* ── Acciones (ACT-009-01/02) ── */}
          <ActionBar>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            <ZrButton config="positive" disabled={!blnCanSave || submitting} loading={submitting}
              onClick={() => { onGuardar(); }}>
              Guardar Formulario ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
