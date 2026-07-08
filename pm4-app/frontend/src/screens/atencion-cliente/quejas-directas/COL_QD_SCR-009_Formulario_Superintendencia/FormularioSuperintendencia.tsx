import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { pm4TasksUrl } from '../../../../core/useToken';
import { useCollection } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsSelect, ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  QD, QD_COLLECTIONS, SCR009_DEFAULTS as DEFAULTS,
  SCR009_OPTIONS_LGBTIQ as OPTIONS_LGBTIQ,
  SCR009_CAMPOS_SFC_OBLIGATORIOS as CAMPOS_SFC_OBLIGATORIOS,
  SCR009_CAMPOS_FRAUDE as CAMPOS_FRAUDE,
} from '../fields/fields';
import type { FormularioSuperintendenciaFormData, AccionFormularioSFC } from '../fields/fields';
import SeccionFraudeAnexos from './SeccionFraudeAnexos';

export default function FormularioSuperintendencia() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask, saveDraft } = useTask();

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<FormularioSuperintendenciaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Cargamos los catalogos de las listas desplegables
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

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<FormularioSuperintendenciaFormData>) });
  }, [task, reset]);

  const err = (in_strField: keyof FormularioSuperintendenciaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // RUL-009-03 — todos los campos SFC obligatorios completos; RUL-009-01 — fraude si aplica.
  const blnSfcComplete = CAMPOS_SFC_OBLIGATORIOS.every((strField) => !!(objWatch[strField] as string)?.trim());
  const blnFraudComplete = objWatch[QD.strFraudRelated] !== 'SI'
    || CAMPOS_FRAUDE.every((strField) => !!(objWatch[strField] as string)?.trim());
  const blnAnnexesComplete = !!objWatch[QD.strIncludesComplaintAnnex] && !!objWatch[QD.strIncludesReplyAttach];
  const blnCanSave = blnSfcComplete && blnFraudComplete && blnAnnexesComplete;

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

          {/* ── S1 · Datos Precargados M1 (SEC-028, solo lectura — RUL-009-02) ── */}
          <FormSection title="Datos Precargados M1">
            <div className="form-row cols-3">
              <ZdsInput name={QD.strSfcCode} control={control} label="Código SFC" readOnly />
              <ZdsInput name={QD.strChannel} control={control} label="Canal (precargado M1)" readOnly />
              <ZdsInput name={QD.strSfcProduct} control={control} label="Producto (precargado M1)" readOnly />
            </div>
            <div className="form-row cols-3">
              <ZdsInput name={QD.strSfcReason} control={control} label="Motivo (precargado M1)" readOnly />
              <ZdsInput name={QD.strAdmission} control={control} label="Admisión (precargado M1)" readOnly />
              <ZdsInput name={QD.strControlEntity} control={control} label="Ente de Control (precargado M1)" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Datos del Consumidor — Campos SFC (SEC-029) ── */}
          <FormSection title="Datos del Consumidor — Campos SFC">
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strSex} control={control} label="Sexo"
                options={cllSex} required rules={objReq} error={err(QD.strSex)} helpText="CAT-SEXO." />
              <ZdsSelect name={QD.strLgbtiq} control={control} label="LGBTIQ+"
                options={OPTIONS_LGBTIQ} required rules={objReq} error={err(QD.strLgbtiq)}
                helpText="CAT-LGBTIQ ⚠ pendiente confirmación con TI (CE 019/2024)." />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strSpecialCondition} control={control} label="Condición Especial"
                options={cllSpecialCond} required rules={objReq} error={err(QD.strSpecialCondition)}
                helpText="CAT-COND-ESP." />
              <ZdsSelect name={QD.strDigitalProduct} control={control} label="Producto Digital"
                options={cllDigitalProduct} required rules={objReq} error={err(QD.strDigitalProduct)}
                helpText="CAT-PROD-DIGITAL." />
            </div>
            {/* MSG-009-04 — catálogo LGBTIQ+ pendiente. */}
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              ⚠ El catálogo <strong>LGBTIQ+</strong> está pendiente de confirmación con TI. Verifique
              antes de transmitir a SmartSupervision. {/* MSG-009-04 */}
            </ZrAlert>
          </FormSection>

          {/* ── S3 · Condición de la Queja (SEC-030) ── */}
          <FormSection title="Condición de la Queja">
            <div className="form-row cols-3">
              <ZdsSelect name={QD.strComplaintStatus} control={control} label="Estado de la Queja o Reclamo"
                options={cllComplaintStatus} required rules={objReq} error={err(QD.strComplaintStatus)} helpText="CAT-ESTADO-QUEJA." />
              <ZdsSelect name={QD.strFavorability} control={control} label="Favorabilidad"
                options={cllFavorability} required rules={objReq} error={err(QD.strFavorability)} helpText="CAT-FAVORAB." />
              <ZdsSelect name={QD.strAcceptance} control={control} label="Aceptación"
                options={cllAcceptance} required rules={objReq} error={err(QD.strAcceptance)} helpText="CAT-ACEPTACION." />
            </div>
            <div className="form-row cols-3">
              <ZdsSelect name={QD.strRectification} control={control} label="Rectificación"
                options={cllRectification} required rules={objReq} error={err(QD.strRectification)} helpText="CAT-RECTIF." />
              <ZdsSelect name={QD.strWithdrawal} control={control} label="Desistimiento"
                options={cllWithdrawal} required rules={objReq} error={err(QD.strWithdrawal)} helpText="CAT-DESIST." />
              <ZdsSelect name={QD.strTutela} control={control} label="Tutela"
                options={cllTutela} required rules={objReq} error={err(QD.strTutela)} helpText="CAT-TUTELA." />
            </div>
            <div className="form-row cols-3">
              <ZdsSelect name={QD.strMarking} control={control} label="Marcación"
                options={cllMarking} required rules={objReq} error={err(QD.strMarking)} helpText="CAT-MARCACION." />
              <ZdsSelect name={QD.strExpressComplaint} control={control} label="Queja Exprés"
                options={cllExpressComplaint} required rules={objReq} error={err(QD.strExpressComplaint)} helpText="CAT-EXPRES." />
              <div />
            </div>
          </FormSection>

          {/* ── S4 Fraude (condicional) · S5 Anexos ── */}
          <SeccionFraudeAnexos form={form} err={err} />

          {/* RUL-009-03 / MSG-009-02 — bloqueo si faltan campos obligatorios SFC. */}
          {!blnCanSave && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              Existen campos obligatorios de SmartSupervision sin completar. Complete todos antes de
              guardar. {/* MSG-009-02 */}
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
