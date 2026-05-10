import { useEffect, useState, useMemo } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import pm4 from '../../api/pm4Client';
import { useCollection } from '../../core/useCollection';
import FormSection from '../../components/FormSection';
import CreacionTomador from './CreacionTomador';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import { ZdsInput, ZdsDate, ZdsCheckboxField, ZdsSelect, ZdsSuggest } from './ZdsField';
import { ReactButton } from '@zurich/css-components/react';
import {
  OPTIONS, COLLECTION_DEFS, DEPARTAMENTOS, CIUDADES_POR_DEPTO,
  FfFlSolicitudFormData,
} from './variables';

function fieldError(
  err: FieldError | undefined,
  value: unknown,
  isSubmitted: boolean
): string | undefined {
  if (!err) return undefined;
  const empty = value === '' || value === null || value === undefined;
  if (err.type === 'required' && empty) return isSubmitted ? String(err.message) : undefined;
  return String(err.message);
}

// ---------------------------------------------------------------------------
// Sección: Información general
// ---------------------------------------------------------------------------
function InfoGeneral({
  form,
  productError,
}: {
  form: ReturnType<typeof useForm<FfFlSolicitudFormData>>;
  productError: string;
}) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const { options: intermediarios, loading: loadingInt } = useCollection(COLLECTION_DEFS.intermediarios);
  const fe = (name: keyof FfFlSolicitudFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);
  const esRenovacion = w.frm_gen_nueva_renovacion === 'RENOVACION';
  const soloCC = w.frm_gen_prod_cc && !w.frm_gen_prod_dyo && !w.frm_gen_prod_pdysi && !w.frm_gen_prod_pi;

  const PRODUCTOS = [
    ['frm_gen_prod_dyo', 'Directores y Administradores (D&O)'],
    ['frm_gen_prod_cc', 'Crimen Comercial'],
    ['frm_gen_prod_pdysi', 'Protección de Datos y Seguridad Informática'],
    ['frm_gen_prod_pi', 'Seguro de Responsabilidad Civil Profesional'],
  ] as const;

  return (
    <FormSection title="Información General" color="#2167AE">
      <div className="form-row cols-3">
        <ZdsSelect
          label="Sucursal"
          name="frm_gen_sucursal"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.sucursal}
          required
          error={fe('frm_gen_sucursal')}
        />
        <ZdsDate control={control} name="frm_gen_fecha_solicitud" label="Fecha de solicitud" readOnly />
        <ZdsInput control={control} name="frm_gen_usuario" label="Usuario" readOnly />
      </div>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_gen_segmento" label="Segmento" readOnly />
        <ZdsInput control={control} name="frm_gen_linea_negocio" label="Línea de negocio" readOnly />
        <ZdsInput control={control} name="frm_gen_tipo_produccion" label="Tipo de producción" readOnly />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          control={control}
          name="frm_gen_canal_comercial"
          label="Canal comercial"
          readOnly
          helpText="Se asigna automáticamente según el intermediario"
        />
        <ZdsInput
          control={control}
          name="frm_gen_comercial"
          label="Comercial"
          rules={{ required: 'Campo requerido' }}
          required
          error={fe('frm_gen_comercial')}
        />
      </div>

      {/* Productos a cotizar */}
      <div className="form-group">
        <div className="checkbox-group-label">
          <span className="required-star">* </span>Producto(s) a cotizar
        </div>
        <div className="checkbox-grid">
          {PRODUCTOS.map(([name, label]) => (
            <ZdsCheckboxField key={name} control={control} name={name} label={label} />
          ))}
        </div>
        {productError && <div className="product-error">{productError}</div>}
        {soloCC && !productError && (
          <div className="product-warning">
            ⚠ Crimen Comercial no puede cotizarse como monolinea. Seleccione al menos otro producto.
          </div>
        )}
      </div>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_gen_tipo_negocio" label="Tipo de negocio" readOnly />
        <ZdsSelect
          label="Nueva / Renovación"
          name="frm_gen_nueva_renovacion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.nuevaRenovacion}
          required
          error={fe('frm_gen_nueva_renovacion')}
        />
        <ZdsInput
          control={control}
          name="frm_gen_nro_poliza"
          label="Nro. de póliza actual"
          rules={{
            required: esRenovacion ? 'Campo requerido para renovaciones' : false,
            minLength: { value: 4, message: 'Mínimo 4 caracteres' },
            maxLength: { value: 16, message: 'Máximo 16 caracteres' },
            pattern: { value: /^[a-zA-Z0-9\-]+$/, message: 'Solo letras, números y guiones' },
          }}
          required={esRenovacion}
          error={fe('frm_gen_nro_poliza')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSuggest
          label="Intermediario"
          name="frm_gen_intermediario"
          control={control}
          options={intermediarios}
          loading={loadingInt}
          rules={{ required: 'Campo requerido' }}
          required
          error={fe('frm_gen_intermediario')}
        />
        <ZdsInput
          control={control}
          name="frm_gen_correo_intermediario"
          label="Correo del intermediario"
          rules={{
            required: 'Campo requerido',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
            maxLength: { value: 254, message: 'Máximo 254 caracteres' },
          }}
          inputType="email"
          required
          error={fe('frm_gen_correo_intermediario')}
        />
      </div>

      <div className="correos-adicionales">
        <div className="correos-adicionales-header">Correos adicionales (máximo 3)</div>
        <div className="form-row cols-3">
          {(['frm_gen_correo_adicional_1', 'frm_gen_correo_adicional_2', 'frm_gen_correo_adicional_3'] as const).map((name, i) => (
            <ZdsInput
              key={name}
              control={control}
              name={name}
              label={`Correo adicional ${i + 1}`}
              rules={{
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                maxLength: { value: 254, message: 'Máximo 254 caracteres' },
              }}
              inputType="email"
              error={fe(name)}
            />
          ))}
        </div>
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Información del tomador + Actividades aseguradas
// ---------------------------------------------------------------------------
function InfoTomador({
  form,
  onConsultarNIT,
  nitLoading,
  nitNotFound,
}: {
  form: ReturnType<typeof useForm<FfFlSolicitudFormData>>;
  onConsultarNIT: () => void;
  nitLoading: boolean;
  nitNotFound: boolean;
}) {
  const { control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();
  const fe = (name: keyof FfFlSolicitudFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  const ciudades = useMemo(() => CIUDADES_POR_DEPTO[w.frm_tom_departamento ?? ''] ?? [], [w.frm_tom_departamento]);
  useEffect(() => { setValue('frm_tom_ciudad', ''); }, [w.frm_tom_departamento, setValue]);

  const anyProductSelected = w.frm_gen_prod_dyo || w.frm_gen_prod_cc || w.frm_gen_prod_pdysi || w.frm_gen_prod_pi;
  const { options: actOpts, loading: loadAct, rawMap: actRawMap } = useCollection(anyProductSelected ? COLLECTION_DEFS.actividadesCIIU : null);

  // Auto-rellena CIIU y NAIC cuando el usuario elige una actividad
  useEffect(() => {
    const pairs = [
      { act: w.frm_act_dyo_actividad,   ciu: 'frm_act_dyo_cod_ciiu'   as const, naic: 'frm_act_dyo_cod_naic'   as const },
      { act: w.frm_act_cc_actividad,    ciu: 'frm_act_cc_cod_ciiu'    as const, naic: 'frm_act_cc_cod_naic'    as const },
      { act: w.frm_act_pdysi_actividad, ciu: 'frm_act_pdysi_cod_ciiu' as const, naic: 'frm_act_pdysi_cod_naic' as const },
      { act: w.frm_act_pi_actividad,    ciu: 'frm_act_pi_cod_ciiu'    as const, naic: 'frm_act_pi_cod_naic'    as const },
    ];
    for (const { act, ciu, naic } of pairs) {
      if (!act) continue;
      const rec = actRawMap[act] as { data?: Record<string, unknown> } | undefined;
      if (!rec) continue;
      const d = rec.data ?? {};
      console.log('[actividades] record para', act, d);
      setValue(ciu,  String(d.frm_ciiu  ?? d.frm_codigo_ciiu  ?? d.frm_codigo ?? ''));
      setValue(naic, String(d.frm_naic  ?? d.frm_codigo_naic  ?? ''));
    }
  }, [
    w.frm_act_dyo_actividad, w.frm_act_cc_actividad,
    w.frm_act_pdysi_actividad, w.frm_act_pi_actividad,
    actRawMap, setValue,
  ]);

  const actRows = [
    w.frm_gen_prod_dyo ? { prod: 'D&O', actField: 'frm_act_dyo_actividad' as const, ciuField: 'frm_act_dyo_cod_ciiu' as const, naicField: 'frm_act_dyo_cod_naic' as const, options: actOpts, loading: loadAct } : null,
    w.frm_gen_prod_cc ? { prod: 'Crimen Comercial', actField: 'frm_act_cc_actividad' as const, ciuField: 'frm_act_cc_cod_ciiu' as const, naicField: 'frm_act_cc_cod_naic' as const, options: actOpts, loading: loadAct } : null,
    w.frm_gen_prod_pdysi ? { prod: 'PDySI', actField: 'frm_act_pdysi_actividad' as const, ciuField: 'frm_act_pdysi_cod_ciiu' as const, naicField: 'frm_act_pdysi_cod_naic' as const, options: actOpts, loading: loadAct } : null,
    w.frm_gen_prod_pi ? { prod: 'Seg. Profesional', actField: 'frm_act_pi_actividad' as const, ciuField: 'frm_act_pi_cod_ciiu' as const, naicField: 'frm_act_pi_cod_naic' as const, options: actOpts, loading: loadAct } : null,
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <FormSection title="Información del Tomador" color="#2167AE">
      <div className="form-row cols-3 row-align-bottom">
        <ZdsInput
          control={control}
          name="frm_tom_nit"
          label="NIT"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 7, message: 'Mínimo 7 dígitos' },
            maxLength: { value: 10, message: 'Máximo 10 dígitos' },
            pattern: { value: /^\d+$/, message: 'Solo dígitos, sin separador' },
          }}
          required
          error={fe('frm_tom_nit')}
          helpText="9 dígitos + dígito verificador"
        />
        <ZdsInput control={control} name="frm_tom_tomador" label="Tomador" readOnly helpText="Dato de TIA" />
        <div className="form-group consultar-wrapper">
          <button type="button" className="btn-consultar" onClick={onConsultarNIT} disabled={nitLoading}>
            {nitLoading ? '⏳ Consultando…' : '🔍 Consultar TIA'}
          </button>
        </div>
      </div>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_tom_direccion" label="Dirección" readOnly helpText="Dato de TIA" />
        <ZdsSelect
          label="Departamento"
          name="frm_tom_departamento"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={[...DEPARTAMENTOS]}
          required
          error={fe('frm_tom_departamento')}
        />
        <ZdsSelect
          label="Ciudad"
          name="frm_tom_ciudad"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={ciudades}
          placeholder={w.frm_tom_departamento ? 'Seleccione...' : 'Seleccione departamento primero'}
          required
          error={fe('frm_tom_ciudad')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsInput
          control={control}
          name="frm_tom_correo_facturacion"
          label="Correo para facturación"
          rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }}
          inputType="email"
          helpText="Dato de TIA (editable)"
          error={fe('frm_tom_correo_facturacion')}
        />
        {w.frm_gen_prod_dyo && (
          <ZdsSelect
            label="Sector"
            name="frm_tom_sector"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.sector}
            required
            error={fe('frm_tom_sector')}
          />
        )}
        <ZdsInput
          control={control}
          name="frm_tom_detalle_actividad"
          label="Detalle actividad empresarial"
          rules={{
            required: 'Campo requerido',
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          }}
          required
          error={fe('frm_tom_detalle_actividad')}
        />
      </div>

      {actRows.length > 0 && (
        <div className="form-subsection" style={{ marginTop: 8 }}>
          <div className="form-subsection-title">Actividades aseguradas</div>
          <div className="actividades-table">
            <div className="actividades-table-header">
              <span>Producto</span>
              <span>Actividad asegurada</span>
              <span>Cód. CIIU</span>
              <span>Cód. NAIC</span>
            </div>
            {actRows.map(({ prod, actField, ciuField, naicField, options, loading }) => (
              <div key={prod} className="actividades-table-row">
                <span className="actividades-prod-label">{prod}</span>
                <div className="actividades-cell">
                  <ZdsSuggest
                    label=""
                    name={actField}
                    control={control}
                    rules={{ required: 'Requerido' }}
                    options={options}
                    loading={loading}
                    error={fe(actField)}
                  />
                </div>
                <div className="actividades-cell">
                  <ZdsInput control={control} name={ciuField} label="" readOnly />
                </div>
                <div className="actividades-cell">
                  <ZdsInput control={control} name={naicField} label="" readOnly />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nitNotFound && (
        <>
          <div className="section-spacer" />
          <CreacionTomador form={form} />
        </>
      )}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Datos de la cotización
// ---------------------------------------------------------------------------
function DatosCotizacion({ form }: { form: ReturnType<typeof useForm<FfFlSolicitudFormData>> }) {
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();
  const fe = (name: keyof FfFlSolicitudFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  useEffect(() => {
    if (!w.frm_cot_inicio_vigencia) return;
    const d = new Date(w.frm_cot_inicio_vigencia);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    setValue('frm_cot_fin_vigencia', d.toISOString().split('T')[0]);
    setValue('frm_cot_dias', 365);
  }, [w.frm_cot_inicio_vigencia, setValue]);

  useEffect(() => {
    if (w.frm_gen_prod_dyo) setValue('frm_cot_modalidad_dyo', 'Por reclamación (claims made)');
    if (w.frm_gen_prod_cc) setValue('frm_cot_modalidad_cc', 'Descubrimiento');
    if (w.frm_gen_prod_pdysi) setValue('frm_cot_modalidad_pdysi', 'Por reclamación (claims made)');
    if (w.frm_gen_prod_pi) setValue('frm_cot_modalidad_pi', 'Por reclamación (claims made)');
  }, [w.frm_gen_prod_dyo, w.frm_gen_prod_cc, w.frm_gen_prod_pdysi, w.frm_gen_prod_pi, setValue]);

  const hayProductos = w.frm_gen_prod_dyo || w.frm_gen_prod_cc || w.frm_gen_prod_pdysi || w.frm_gen_prod_pi;

  return (
    <FormSection title="Datos de la Cotización" color="#2167AE">
      <div className="form-row cols-4">
        <ZdsDate
          control={control}
          name="frm_cot_inicio_vigencia"
          label="Inicio de vigencia"
          rules={{ required: 'Campo requerido' }}
          required
          helpText="a las 00:00 horas"
          error={fe('frm_cot_inicio_vigencia')}
        />
        <ZdsDate control={control} name="frm_cot_fin_vigencia" label="Fin de vigencia" readOnly helpText="a las 24:00 horas" />
        <ZdsInput control={control} name="frm_cot_dias" label="Días" readOnly />
        <ZdsInput control={control} name="frm_cot_moneda" label="Moneda" readOnly />
      </div>

      <div className="form-row cols-2">
        <ZdsInput control={control} name="frm_cot_comision" label="Comisión (%)" readOnly helpText="20% por defecto" />
        <ZdsInput control={control} name="frm_cot_soporte_ofrecido" label="Soporte ofrecido (%)" readOnly helpText="100% por defecto" />
      </div>

      {w.frm_gen_prod_cc && (
        <div className="form-row cols-2">
          <ZdsSelect
            label="Número de empleados"
            name="frm_cot_num_empleados"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.numEmpleados}
            required
            error={fe('frm_cot_num_empleados')}
          />
          <ZdsSelect
            label="Número de predios"
            name="frm_cot_num_predios"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.numPredios}
            required
            error={fe('frm_cot_num_predios')}
          />
        </div>
      )}

      {hayProductos && (
        <div className="form-group" style={{ marginTop: 4 }}>
          <div className="form-label"><span className="required-star">* </span>Facturación total anual (COP)</div>
          <div className="facturacion-grid">
            {w.frm_gen_prod_dyo && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Directores y Administradores</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_dyo" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionDyO} error={fe('frm_cot_fact_anual_dyo')} />
              </div>
            )}
            {w.frm_gen_prod_cc && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Crimen Comercial</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_cc" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionCC} error={fe('frm_cot_fact_anual_cc')} />
              </div>
            )}
            {w.frm_gen_prod_pdysi && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Protección de Datos y SI</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_pdysi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPDySI} error={fe('frm_cot_fact_anual_pdysi')} />
              </div>
            )}
            {w.frm_gen_prod_pi && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Seguro Profesional</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_pi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPI} error={fe('frm_cot_fact_anual_pi')} />
              </div>
            )}
          </div>
        </div>
      )}

      <input type="hidden" {...register('frm_cot_modalidad_dyo')} />
      <input type="hidden" {...register('frm_cot_modalidad_cc')} />
      <input type="hidden" {...register('frm_cot_modalidad_pdysi')} />
      <input type="hidden" {...register('frm_cot_modalidad_pi')} />
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Plan de pago
// ---------------------------------------------------------------------------
function PlanPago({ form }: { form: ReturnType<typeof useForm<FfFlSolicitudFormData>> }) {
  const { control } = form;
  return (
    <FormSection title="Plan de Pago" color="#2167AE">
      <div className="form-row cols-2">
        <ZdsSelect label="Plan de pago" name="frm_plan_plan_pago" control={control} options={OPTIONS.planPago} />
        <ZdsInput control={control} name="frm_plan_num_cuotas" label="Número de cuotas" readOnly helpText="1 cuota por defecto" />
      </div>
      <div className="form-row cols-2">
        <ZdsSelect label="Medio de pago" name="frm_plan_medio_pago" control={control} options={OPTIONS.medioPago} />
        <ZdsInput control={control} name="frm_plan_frecuencia_cobro" label="Frecuencia de cobro" readOnly helpText="Anual por defecto" />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SolicitudFfFl() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [productError, setProductError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [sent, setSent] = useState(false);
  const [nitLoading, setNitLoading] = useState(false);
  const [nitNotFound, setNitNotFound] = useState(false);

  const form = useForm<FfFlSolicitudFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: true,
    defaultValues: {
      frm_gen_fecha_solicitud: new Date().toISOString().split('T')[0],
      frm_gen_segmento: 'Middle Market',
      frm_gen_linea_negocio: 'Líneas Financieras',
      frm_gen_tipo_produccion: 'Fast Flow',
      frm_gen_tipo_negocio: 'Directo',
      frm_gen_prod_dyo: false,
      frm_gen_prod_cc: false,
      frm_gen_prod_pdysi: false,
      frm_gen_prod_pi: false,
      frm_cot_dias: 365,
      frm_cot_moneda: 'COP',
      frm_cot_comision: 20,
      frm_cot_soporte_ofrecido: 100,
      frm_plan_plan_pago: '102',
      frm_plan_num_cuotas: '1 cuota',
      frm_plan_medio_pago: 'TRANSFERENCIA_PESOS',
      frm_plan_frecuencia_cobro: 'Anual',
      frm_cre_tipo_doc: 'NIT',
      frm_cre_estado_tercero: 'Activo',
    },
  });

  useEffect(() => {
    if (!task?.data) return;
    const d = task.data as Partial<FfFlSolicitudFormData>;
    Object.entries(d).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        form.setValue(key as keyof FfFlSolicitudFormData, val as never);
      }
    });
  }, [task, form]);

  const onSubmit = async (data: FfFlSolicitudFormData) => {
    const prods = [data.frm_gen_prod_dyo, data.frm_gen_prod_cc, data.frm_gen_prod_pdysi, data.frm_gen_prod_pi];
    const count = prods.filter(Boolean).length;
    if (count === 0) { setProductError('Seleccione al menos un producto'); return; }
    if (data.frm_gen_prod_cc && count === 1) { setProductError('Crimen Comercial no puede cotizarse como monolinea'); return; }
    setProductError('');
    setSubmitError('');
    try {
      const payload: Record<string, unknown> = {
        ...(task?.data ?? {}),
        ...(data as unknown as Record<string, unknown>),
      };
      await completeTask(payload);
      setSent(true);
    } catch (e) {
      setSubmitError((e as Error).message ?? 'Error desconocido al enviar');
    }
  };

  const handleConsultarNIT = async () => {
    const nit = form.getValues('frm_tom_nit');
    if (!nit) { setSubmitError('Ingrese el NIT primero.'); return; }

    setNitLoading(true);
    setSubmitError('');
    console.log(`[TIA] NIT: ${nit}`);

    try {
      // PM4 espera data y config como strings JSON, más sync:true
      const requestBody = {
        data:   JSON.stringify({ frm_tomador_tipoDoc: 'NIT', frm_tomador_numDoc: nit }),
        config: JSON.stringify({}),
        sync:   true,
      };
      console.log(`[TIA] POST /scripts/50/execute`, JSON.stringify(requestBody, null, 2));

      const res = await pm4.post('/scripts/50/execute', requestBody);
      console.log(`[TIA] HTTP ${res.status} — body completo:`, JSON.stringify(res.data, null, 2));

      const output = res.data?.response ?? res.data?.output ?? res.data ?? {};
      console.log(`[TIA] Output extraído:`, JSON.stringify(output, null, 2));

      // Si output es string con "No party found" → cliente no existe en TIA
      if (typeof output === 'string' && (output.includes('No party found') || output.includes('HTTP 400'))) {
        console.warn('[TIA] No party found — abriendo sección de creación de tomador');
        setNitNotFound(true);
        setSubmitError('El NIT no existe en TIA. Complete los datos de Creación de Tomador.');
        return;
      }

      // 3. Mapear campos TIA → form
      const mappings: Array<[string, keyof FfFlSolicitudFormData]> = [
        ['frm_tomador',              'frm_tom_tomador'],
        ['nombre',                   'frm_tom_tomador'],
        ['frm_tom_tomador',          'frm_tom_tomador'],
        ['direccion',                'frm_tom_direccion'],
        ['frm_tom_direccion',        'frm_tom_direccion'],
        ['departamento',             'frm_tom_departamento'],
        ['frm_tom_departamento',     'frm_tom_departamento'],
        ['ciudad',                   'frm_tom_ciudad'],
        ['frm_tom_ciudad',           'frm_tom_ciudad'],
        ['correo',                   'frm_tom_correo_facturacion'],
        ['email',                    'frm_tom_correo_facturacion'],
        ['frm_tom_correo_facturacion', 'frm_tom_correo_facturacion'],
        ['sector',                   'frm_tom_sector'],
        ['frm_tom_sector',           'frm_tom_sector'],
        ['detalle_actividad',        'frm_tom_detalle_actividad'],
        ['frm_tom_detalle_actividad', 'frm_tom_detalle_actividad'],
      ];

      let mapped = 0;
      for (const [src, dest] of mappings) {
        const val = (output as Record<string, unknown>)[src];
        if (val !== undefined && val !== null && val !== '') {
          console.log(`[TIA] Mapeando ${src} → ${dest} =`, val);
          form.setValue(dest, String(val), { shouldDirty: true });
          mapped++;
        }
      }
      console.log(`[TIA] FIN — ${mapped} campos mapeados. Keys recibidos:`, Object.keys(output as object));
      if (mapped > 0) {
        setNitNotFound(false);  // TIA encontró el cliente → ocultar sección de creación
      } else {
        setSubmitError('TIA respondió pero sin campos reconocibles. Ver consola.');
      }

    } catch (err: unknown) {
      const e = err as { response?: { status: number; data: unknown }; message: string };
      console.error(`[TIA] ERROR — status:`, e.response?.status ?? 'sin respuesta');
      console.error(`[TIA] Body:`, JSON.stringify(e.response?.data ?? e.message, null, 2));
      setSubmitError(`Error consultando TIA (${e.response?.status ?? 'red'}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    } finally {
      setNitLoading(false);
    }
  };

  if (loading) return <div className="screen-loading"><div className="spinner" /></div>;
  if (error) return <div className="screen-error">⚠ Error cargando la tarea: {error}</div>;

  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block"><h1>Cotizador Fast Flow — Líneas Financieras</h1></div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-content">
          <div className="screen-sent">
            <div className="screen-sent-icon">✓</div>
            <div className="screen-sent-title">Solicitud enviada</div>
            <div className="screen-sent-sub">
              La cotización fue enviada correctamente a ProcessMaker.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <div className="screen-header">
        <div className="title-block">
          <h1>Cotizador Fast Flow — Líneas Financieras</h1>
          <div className="subtitle">
            <span>Cotización # {form.watch('frm_gen_num_cotizacion') || '—'}</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <div className="screen-content">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <InfoGeneral form={form} productError={productError} />
          <InfoTomador form={form} onConsultarNIT={handleConsultarNIT} nitLoading={nitLoading} nitNotFound={nitNotFound} />
          <DatosCotizacion form={form} />
          <PlanPago form={form} />

          {submitError && <div className="submit-error">{submitError}</div>}

          <div className="submit-bar">
            <ReactButton
              config="primary:l"
              disabled={submitting}
              loading={submitting}
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              {submitting ? 'Enviando...' : 'CONTINUAR →'}
            </ReactButton>
          </div>
        </form>
      </div>
    </div>
  );
}
