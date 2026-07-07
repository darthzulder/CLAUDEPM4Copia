import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { useCollection } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsSelect, ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  DEFAULTS, OPTIONS, COLLECTION_DEFS, CAMPOS_SFC_OBLIGATORIOS, CAMPOS_FRAUDE,
  type FormularioSuperintendenciaFormData, type AccionFormularioSFC,
} from './variables';
import SeccionFraudeAnexos from './SeccionFraudeAnexos';

export default function FormularioSuperintendencia() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<FormularioSuperintendenciaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Cargamos los catalogos de las listas desplegables
  const { options: cllSex } = useCollection(COLLECTION_DEFS.sexo);
  const { options: cllSpecialCond } = useCollection(COLLECTION_DEFS.condicionEspecial);
  const { options: cllDigitalProduct } = useCollection(COLLECTION_DEFS.productoDigital);
  const { options: cllComplaintStatus } = useCollection(COLLECTION_DEFS.estadoQueja);
  const { options: cllFavorability } = useCollection(COLLECTION_DEFS.favorabilidad);
  const { options: cllAcceptance } = useCollection(COLLECTION_DEFS.aceptacion);
  const { options: cllRectification } = useCollection(COLLECTION_DEFS.rectificacion);
  const { options: cllWithdrawal } = useCollection(COLLECTION_DEFS.desistimiento);
  const { options: cllTutela } = useCollection(COLLECTION_DEFS.tutela);
  const { options: cllMarking } = useCollection(COLLECTION_DEFS.marcacion);
  const { options: cllExpressComplaint } = useCollection(COLLECTION_DEFS.quejaExpres);

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
  const blnFraudComplete = objWatch.qd_relacionadaFraude !== 'SI'
    || CAMPOS_FRAUDE.every((strField) => !!(objWatch[strField] as string)?.trim());
  const blnAnnexesComplete = !!objWatch.qd_incluyeAnexosQueja && !!objWatch.qd_incluyeAdjuntoRespuesta;
  const blnCanSave = blnSfcComplete && blnFraudComplete && blnAnnexesComplete;

  // Enviamos la tarea con la accion seleccionada
  const enviarCon = (in_strAction: AccionFormularioSFC) => (in_objData: FormularioSuperintendenciaFormData) =>
    completeTask({ ...in_objData, qd_accion: in_strAction } as unknown as Record<string, unknown>)
      .catch((excError) => console.error('[FormularioSuperintendencia] Error al enviar:', excError));

  const onGuardar = handleSubmit(enviarCon('GUARDAR'));         // ACT-009-01
  const onGuardarBorrador = () => enviarCon('GUARDAR_BORRADOR')(objWatch); // ACT-009-02

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
              <ZdsInput name="qd_codigoSFC" control={control} label="Código SFC" readOnly />
              <ZdsInput name="qd_canal" control={control} label="Canal (precargado M1)" readOnly />
              <ZdsInput name="qd_productoSFC" control={control} label="Producto (precargado M1)" readOnly />
            </div>
            <div className="form-row cols-3">
              <ZdsInput name="qd_motivoSFC" control={control} label="Motivo (precargado M1)" readOnly />
              <ZdsInput name="qd_admision" control={control} label="Admisión (precargado M1)" readOnly />
              <ZdsInput name="qd_enteControl" control={control} label="Ente de Control (precargado M1)" readOnly />
            </div>
          </FormSection>

          {/* ── S2 · Datos del Consumidor — Campos SFC (SEC-029) ── */}
          <FormSection title="Datos del Consumidor — Campos SFC">
            <div className="form-row cols-2">
              <ZdsSelect name="qd_sexo" control={control} label="Sexo"
                options={cllSex} required rules={objReq} error={err('qd_sexo')} helpText="CAT-SEXO." />
              <ZdsSelect name="qd_lgbtiq" control={control} label="LGBTIQ+"
                options={OPTIONS.lgbtiq} required rules={objReq} error={err('qd_lgbtiq')}
                helpText="CAT-LGBTIQ ⚠ pendiente confirmación con TI (CE 019/2024)." />
            </div>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_condicionEspecial" control={control} label="Condición Especial"
                options={cllSpecialCond} required rules={objReq} error={err('qd_condicionEspecial')}
                helpText="CAT-COND-ESP." />
              <ZdsSelect name="qd_productoDigital" control={control} label="Producto Digital"
                options={cllDigitalProduct} required rules={objReq} error={err('qd_productoDigital')}
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
              <ZdsSelect name="qd_estadoQueja" control={control} label="Estado de la Queja o Reclamo"
                options={cllComplaintStatus} required rules={objReq} error={err('qd_estadoQueja')} helpText="CAT-ESTADO-QUEJA." />
              <ZdsSelect name="qd_favorabilidad" control={control} label="Favorabilidad"
                options={cllFavorability} required rules={objReq} error={err('qd_favorabilidad')} helpText="CAT-FAVORAB." />
              <ZdsSelect name="qd_aceptacion" control={control} label="Aceptación"
                options={cllAcceptance} required rules={objReq} error={err('qd_aceptacion')} helpText="CAT-ACEPTACION." />
            </div>
            <div className="form-row cols-3">
              <ZdsSelect name="qd_rectificacion" control={control} label="Rectificación"
                options={cllRectification} required rules={objReq} error={err('qd_rectificacion')} helpText="CAT-RECTIF." />
              <ZdsSelect name="qd_desistimiento" control={control} label="Desistimiento"
                options={cllWithdrawal} required rules={objReq} error={err('qd_desistimiento')} helpText="CAT-DESIST." />
              <ZdsSelect name="qd_tutela" control={control} label="Tutela"
                options={cllTutela} required rules={objReq} error={err('qd_tutela')} helpText="CAT-TUTELA." />
            </div>
            <div className="form-row cols-3">
              <ZdsSelect name="qd_marcacion" control={control} label="Marcación"
                options={cllMarking} required rules={objReq} error={err('qd_marcacion')} helpText="CAT-MARCACION." />
              <ZdsSelect name="qd_quejaExpres" control={control} label="Queja Exprés"
                options={cllExpressComplaint} required rules={objReq} error={err('qd_quejaExpres')} helpText="CAT-EXPRES." />
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
