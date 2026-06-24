import { useEffect, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useForm, FieldError } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import { useCollection } from '../../core/useCollection';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsDate, ZrButton } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import pm4 from '../../api/pm4Client';
import { OPTIONS, COLLECTION_DEFS, CotizadorFormData, CONSULTAR_CLIENTE_SCRIPT_ID, parseClienteTia } from './variables';

// ---------------------------------------------------------------------------
// Helper: muestra el error solo si el campo tiene valor O el form fue enviado.
// Campos requeridos vacíos no se marcan en rojo hasta el primer intento de submit.
// ---------------------------------------------------------------------------
function fieldError(
  err: FieldError | undefined,
  value: unknown,
  isSubmitted: boolean
): string | undefined {
  if (!err) return undefined;
  const isEmpty = value === '' || value === null || value === undefined;
  if (err.type === 'required' && isEmpty) return isSubmitted ? String(err.message) : undefined;
  return String(err.message);
}

// ---------------------------------------------------------------------------
// Sección: Información general
// ---------------------------------------------------------------------------
function InfoGeneral({ form }: { form: ReturnType<typeof useForm<CotizadorFormData>> }) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();

  const { options: intermediarios, loading: loadingInt } = useCollection(
    COLLECTION_DEFS.intermediarios
  );
  const { options: correos, loading: loadingCorreos } = useCollection(
    COLLECTION_DEFS.correosIntermediari,
    { frm_gen_intermediario_principal: w.frm_gen_intermediario_principal }
  );

  const fe = (name: keyof CotizadorFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <FormSection title="Información General">
      <div className="form-row cols-2">
        <ZdsDate
          label="Fecha de cotización"
          name="frm_gen_fecha_cotizacion"
          control={control}
          readOnly
        />
        <ZdsSelect
          label="Producto"
          name="frm_gen_producto"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.producto}
          required
          error={fe('frm_gen_producto')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          label="Sucursal"
          name="frm_gen_sucursal"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.sucursal}
          required
          error={fe('frm_gen_sucursal')}
        />
        <ZdsSelect
          label="Nueva/Renovación"
          name="frm_gen_nueva_o_renovacion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.nuevaRenovacion}
          required
          error={fe('frm_gen_nueva_o_renovacion')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect
          label="Intermediario"
          name="frm_gen_intermediario_principal"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={intermediarios}
          loading={loadingInt}
          required
          error={fe('frm_gen_intermediario_principal')}
        />
        <ZdsSelect
          label="Correo Intermediario"
          name="frm_gen_intermediario_principal_correo_test"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={correos}
          loading={loadingCorreos}
          placeholder={w.frm_gen_intermediario_principal ? 'Seleccione...' : 'Seleccione un intermediario primero'}
          required
          error={fe('frm_gen_intermediario_principal_correo_test')}
        />
        <ZdsRadio
          label="¿Incluye brokerage-row?"
          name="frm_gen_incluye_cocorretaje_flag"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.siNo}
          required
          error={fe('frm_gen_incluye_cocorretaje_flag')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsInput
          label="Correo intermediario (para pruebas)"
          name="frm_gen_intermediario_principal_correo"
          control={control}
          rules={{
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Correo electrónico inválido',
            },
          }}
          inputType="email"
          helpText="Campo para pruebas. Para producción se utilizará el campo anterior."
          error={fe('frm_gen_intermediario_principal_correo')}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Información del tomador + Territorialidad
// ---------------------------------------------------------------------------
function InfoTomador({
  form,
  onConsultarCliente,
  consultarLoading,
  tiaFilledFields,
}: {
  form: ReturnType<typeof useForm<CotizadorFormData>>;
  onConsultarCliente: () => void;
  consultarLoading: boolean;
  tiaFilledFields: Set<string>;
}) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fromTia = (f: keyof CotizadorFormData) => tiaFilledFields.has(f);

  const fe = (name: keyof CotizadorFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <FormSection title="">
      <div className="form-subsection">
        <div className="form-subsection-title">Información del tomador</div>
        <div className="form-row cols-3 row-align-bottom">
          <ZdsSelect
            label="Tipo de documento"
            name="frm_tomador_tipo_documento"
            control={control}
            options={OPTIONS.tipoDocumento}
            disabled
          />
          <ZdsInput
            label="Nro. de documento"
            name="frm_tomador_numDoc"
            control={control}
            rules={{
              required: 'Campo requerido',
              minLength: { value: 5, message: 'Mínimo 5 caracteres' },
              pattern: { value: /^\d+$/, message: 'Solo dígitos' },
            }}
            required
            error={fe('frm_tomador_numDoc')}
          />
          <div className="form-group lookup-wrapper">
            <ZrButton config="secondary" icon="search:line" onClick={onConsultarCliente} loading={consultarLoading} disabled={consultarLoading}>
              Consultar Cliente
            </ZrButton>
          </div>
        </div>

        <div className="form-row cols-1">
          <ZdsInput
            label="Tomador"
            name="frm_tomador_tomador"
            control={control}
            readOnly={fromTia('frm_tomador_tomador')}
            helpText={fromTia('frm_tomador_tomador') ? 'Dato de TIA' : undefined}
          />
        </div>
        <div className="form-row cols-2">
          <ZdsInput
            label="Dirección"
            name="frm_tomador_direccion"
            control={control}
            readOnly={fromTia('frm_tomador_direccion')}
            helpText={fromTia('frm_tomador_direccion') ? 'Dato de TIA' : undefined}
          />
          <ZdsInput
            label="Correo de facturación"
            name="frm_tomador_correo_facturacion"
            control={control}
            inputType="email"
            readOnly={fromTia('frm_tomador_correo_facturacion')}
            helpText={fromTia('frm_tomador_correo_facturacion') ? 'Dato de TIA' : undefined}
          />
        </div>
      </div>

      <div className="section-spacer" />

      <div className="form-row cols-3">
        <ZdsSelect
          label="Territorialidad"
          name="frm_tom_territorialidad"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={[]}
          required
          error={fe('frm_tom_territorialidad')}
        />
        <ZdsSelect
          label="N° de ubicaciones"
          name="frm_tom_num_ubicaciones"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={[]}
          required
          error={fe('frm_tom_num_ubicaciones')}
        />
        <ZdsRadio
          label="Realiza exportaciones"
          name="frm_tom_realiza_exportaciones"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.siNo}
          required
          error={fe('frm_tom_realiza_exportaciones')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsRadio
          label="¿El tomador es el asegurado?"
          name="frm_tom_es_asegurado"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.siNo}
          required
          error={fe('frm_tom_es_asegurado')}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Datos de la cotización
// ---------------------------------------------------------------------------
function DatosCotizacion({ form }: { form: ReturnType<typeof useForm<CotizadorFormData>> }) {
  const { control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();

  const { options: naicOptions, loading: loadingNaic } = useCollection(
    COLLECTION_DEFS.naic,
    { frm_gen_pais: w.frm_gen_pais }
  );

  const fe = (name: keyof CotizadorFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  // Calcula fin de vigencia automáticamente (365 días)
  useEffect(() => {
    if (!w.frm_cot_fecha_inicio_vigencia) return;
    const d = new Date(w.frm_cot_fecha_inicio_vigencia);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    setValue('frm_cot_fecha_fin_vigencia', d.toISOString().split('T')[0]);
    setValue('frm_cot_dias_inicio_fin_vigencia', 365);
  }, [w.frm_cot_fecha_inicio_vigencia, setValue]);

  return (
    <FormSection title="Datos de la Cotización">
      <div className="form-row cols-2">
        <ZdsDate
          label="Inicio de vigencia"
          name="frm_cot_fecha_inicio_vigencia"
          control={control}
          rules={{ required: 'Campo requerido' }}
          required
          helpText="a las 00:00 horas"
          error={fe('frm_cot_fecha_inicio_vigencia')}
        />
        <ZdsDate
          label="Fin de vigencia"
          name="frm_cot_fecha_fin_vigencia"
          control={control}
          readOnly
          helpText="a las 24:00 horas"
        />
      </div>

      <div className="form-row cols-1">
        <ZdsInput
          label="Días"
          name="frm_cot_dias_inicio_fin_vigencia"
          control={control}
          readOnly
          helpText="Campo automático"
        />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          label="Ingresos operacionales anuales"
          name="frm_cot_ingresos_operaciones_anuales"
          control={control}
          rules={{
            required: 'Campo requerido',
            min: { value: 1, message: 'Debe ser mayor a 0' },
          }}
          required
          error={fe('frm_cot_ingresos_operaciones_anuales')}
        />
        <ZdsInput
          label="Ingresos proyectados anuales"
          name="frm_cot_ingresos_proyectados_anuales"
          control={control}
          rules={{
            required: 'Campo requerido',
            min: { value: 1, message: 'Debe ser mayor a 0' },
          }}
          required
          error={fe('frm_cot_ingresos_proyectados_anuales')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsSelect
          label="Actividad NAIC"
          name="frm_cot_actividad_naic"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={naicOptions}
          loading={loadingNaic}
          required
          error={fe('frm_cot_actividad_naic')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          label="Modalidad de cobertura"
          name="frm_cot_modalidad_cobertura"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.modalidadCobertura}
          required
          error={fe('frm_cot_modalidad_cobertura')}
        />
        <ZdsRadio
          label="Siniestralidad"
          name="frm_cot_siniestralidad_flag"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.siNo}
          required
          error={fe('frm_cot_siniestralidad_flag')}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Propuesta económica
// ---------------------------------------------------------------------------
function PropuestaEconomica({ form }: { form: ReturnType<typeof useForm<CotizadorFormData>> }) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();

  const fe = (name: keyof CotizadorFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <FormSection title="Propuesta Económica">
      <div className="form-row cols-2">
        <ZdsInput
          control={control}
          name="frm_valor_asegurado_opcion1"
          label="Valor asegurado — Opción 1 (COP)"
          helpText="Para continuar, debe ingresar al menos una opción de valor asegurado"
          rules={{ min: { value: 0, message: 'Debe ser 0 o mayor' } }}
          error={fe('frm_valor_asegurado_opcion1')}
        />

        <ZdsRadio
          control={control}
          name="frm_modal_propuesta_deducible"
          label="Deducible"
          options={OPTIONS.deducible}
          rules={{ required: 'Debe seleccionar una opción de deducible' }}
          required
          error={fe('frm_modal_propuesta_deducible')}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Plan de pago
// ---------------------------------------------------------------------------
function PlanPago({ form }: { form: ReturnType<typeof useForm<CotizadorFormData>> }) {
  const { formState: { errors, isSubmitted }, watch } = form;
  const w = watch();

  const fe = (name: keyof CotizadorFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <FormSection title="Plan de Pago">
      <div className="form-row cols-2">
        <ZdsSelect
          label="Plan de pago"
          name="frm_plan_pago"
          control={form.control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.planPago}
          required
          error={fe('frm_plan_pago')}
        />
        <ZdsSelect
          label="Número de cuotas"
          name="frm_num_cuotas"
          control={form.control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.numCuotas}
          required
          error={fe('frm_num_cuotas')}
        />
      </div>
      <div className="form-row cols-2">
        <ZdsSelect
          label="Método de pago"
          name="frm_metodo_pago"
          control={form.control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.metodoPago}
          required
          error={fe('frm_metodo_pago')}
        />
        <ZdsSelect
          label="Frecuencia de cobro"
          name="frm_frecuencia_cobro"
          control={form.control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.frecuenciaCobro}
          required
          error={fe('frm_frecuencia_cobro')}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function CotizadorFastFlow() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [sent, setSent] = useState(false);
  const [consultarLoading, setConsultarLoading] = useState(false);
  const [tiaFilledFields, setTiaFilledFields] = useState<Set<string>>(new Set());

  const form = useForm<CotizadorFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      frm_gen_producto: 'RC',
      frm_gen_pais: 'CO',
      frm_gen_fecha_cotizacion: new Date().toISOString().split('T')[0],
      frm_tomador_tipo_documento: 'NIT',
      frm_plan_pago: '102',
      frm_num_cuotas: '1',
      frm_metodo_pago: 'TRANSFERENCIA',
      frm_frecuencia_cobro: 'ANUAL',
      frm_cot_dias_inicio_fin_vigencia: 365,
      frm_valor_asegurado_opcion1: 0,
    },
  });

  // Carga variables del caso cuando la tarea está lista
  useEffect(() => {
    if (!task?.data) return;
    const d = task.data as Partial<CotizadorFormData>;
    Object.entries(d).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        form.setValue(key as keyof CotizadorFormData, val as never);
      }
    });
  }, [task, form]);

  const onSubmit = async (data: CotizadorFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
      setSent(true);
    } catch (e) {
      alert(`Error al enviar: ${(e as Error).message}`);
    }
  };

  const handleConsultarCliente = async () => {
    const numDoc = form.getValues('frm_tomador_numDoc');
    if (!numDoc) { alert('Ingrese el número de documento primero.'); return; }

    setConsultarLoading(true);
    try {
      const res = await pm4.post(`/scripts/${CONSULTAR_CLIENTE_SCRIPT_ID}/execute`, {
        data:   JSON.stringify({ frm_tomador_tipoDoc: 'NIT', frm_tomador_numDoc: numDoc }),
        config: JSON.stringify({}),
        sync:   true,
      });

      const output = res.data?.output ?? res.data ?? {};
      const tia = (output as Record<string, unknown>)['value'] ?? output;
      const mapped = parseClienteTia(tia);

      const keys = Object.keys(mapped);
      for (const [dest, val] of Object.entries(mapped) as Array<[keyof CotizadorFormData, string]>) {
        form.setValue(dest, val as never, { shouldDirty: true });
      }
      setTiaFilledFields(new Set(keys));

      if (!keys.length) alert('TIA respondió pero sin campos reconocibles.');
    } catch (err: unknown) {
      const e = err as { response?: { status: number; data: unknown }; message: string };
      alert(`Error consultando TIA (${e.response?.status ?? 'red'}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    } finally {
      setConsultarLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="screen-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="screen-error">⚠️ Error cargando la tarea: {error}</div>;
  }

  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Cotizador Fast Flow" />
        <div className="screen-content">
          <ResultCard variant="success" title="Solicitud enviada">
            <p>
              El formulario fue enviado correctamente a ProcessMaker.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  const caseNumber = form.watch('frm_caso') ?? task?.process_request_id ?? '—';
  const cotizacion = form.watch('frm_gen_num_cotizacion') ?? '—';

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Cotizador Fast Flow"
        subtitle={[`Cotización # ${cotizacion}`, `Caso # ${caseNumber}`]}
      />

      <div className="screen-content">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <InfoGeneral form={form} />
          <InfoTomador form={form} onConsultarCliente={handleConsultarCliente} consultarLoading={consultarLoading} tiaFilledFields={tiaFilledFields} />
          <DatosCotizacion form={form} />
          <PropuestaEconomica form={form} />
          <PlanPago form={form} />

          <ActionBar>
            <ZrButton config="primary:l" onClick={() => { form.handleSubmit(onSubmit)(); }} loading={submitting} disabled={submitting}>
              ENVIAR
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
