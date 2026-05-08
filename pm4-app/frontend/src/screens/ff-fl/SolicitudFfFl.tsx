import { useEffect, useState, useMemo } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import { useCollection } from '../../core/useCollection';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import DateField from '../../components/fields/DateField';
import CreacionTomador from './CreacionTomador';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
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
  const { register, control, formState: { errors, isSubmitted }, watch } = form;
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
        <SelectField
          label="Sucursal"
          name="frm_gen_sucursal"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.sucursal}
          required
          error={fe('frm_gen_sucursal')}
        />
        <DateField label="Fecha de solicitud" registration={register('frm_gen_fecha_solicitud')} readOnly />
        <InputField label="Usuario" registration={register('frm_gen_usuario')} readOnly />
      </div>

      <div className="form-row cols-3">
        <InputField label="Segmento" registration={register('frm_gen_segmento')} readOnly />
        <InputField label="Línea de negocio" registration={register('frm_gen_linea_negocio')} readOnly />
        <InputField label="Tipo de producción" registration={register('frm_gen_tipo_produccion')} readOnly />
      </div>

      <div className="form-row cols-2">
        <InputField
          label="Canal comercial"
          registration={register('frm_gen_canal_comercial')}
          readOnly
          helper="Se asigna automáticamente según el intermediario"
        />
        <InputField
          label="Comercial"
          registration={register('frm_gen_comercial', { required: 'Campo requerido' })}
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
            <label key={name} className={`checkbox-item${w[name] ? ' checked' : ''}`}>
              <input type="checkbox" {...register(name)} />
              <span className="checkbox-item-label">{label}</span>
            </label>
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
        <InputField label="Tipo de negocio" registration={register('frm_gen_tipo_negocio')} readOnly />
        <SelectField
          label="Nueva / Renovación"
          name="frm_gen_nueva_renovacion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.nuevaRenovacion}
          required
          error={fe('frm_gen_nueva_renovacion')}
        />
        <InputField
          label="Nro. de póliza actual"
          registration={register('frm_gen_nro_poliza', {
            required: esRenovacion ? 'Campo requerido para renovaciones' : false,
            minLength: { value: 4, message: 'Mínimo 4 caracteres' },
            maxLength: { value: 16, message: 'Máximo 16 caracteres' },
            pattern: { value: /^[a-zA-Z0-9\-]+$/, message: 'Solo letras, números y guiones' },
          })}
          required={esRenovacion}
          error={fe('frm_gen_nro_poliza')}
        />
      </div>

      <div className="form-row cols-2">
        <SelectField
          label="Intermediario"
          name="frm_gen_intermediario"
          control={control}
          options={intermediarios}
          loading={loadingInt}
          required
          error={fe('frm_gen_intermediario')}
        />
        <InputField
          label="Correo del intermediario"
          registration={register('frm_gen_correo_intermediario', {
            required: 'Campo requerido',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
            maxLength: { value: 254, message: 'Máximo 254 caracteres' },
          })}
          type="email"
          required
          error={fe('frm_gen_correo_intermediario')}
        />
      </div>

      <div className="correos-adicionales">
        <div className="correos-adicionales-header">Correos adicionales (máximo 3)</div>
        <div className="form-row cols-3">
          {(['frm_gen_correo_adicional_1', 'frm_gen_correo_adicional_2', 'frm_gen_correo_adicional_3'] as const).map((name, i) => (
            <InputField
              key={name}
              label={`Correo adicional ${i + 1}`}
              registration={register(name, {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                maxLength: { value: 254, message: 'Máximo 254 caracteres' },
              })}
              type="email"
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
}: {
  form: ReturnType<typeof useForm<FfFlSolicitudFormData>>;
  onConsultarNIT: () => void;
}) {
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();
  const fe = (name: keyof FfFlSolicitudFormData) =>
    fieldError(errors[name] as FieldError | undefined, w[name], isSubmitted);

  const ciudades = useMemo(() => CIUDADES_POR_DEPTO[w.frm_tom_departamento] ?? [], [w.frm_tom_departamento]);
  useEffect(() => { setValue('frm_tom_ciudad', ''); }, [w.frm_tom_departamento, setValue]);

  // Cargar actividades solo cuando el producto está seleccionado
  const { options: actDyO, loading: loadActDyO } = useCollection(w.frm_gen_prod_dyo ? COLLECTION_DEFS.actividadesDyO : null);
  const { options: actCC, loading: loadActCC } = useCollection(w.frm_gen_prod_cc ? COLLECTION_DEFS.actividadesCC : null);
  const { options: actPDySI, loading: loadActPDySI } = useCollection(w.frm_gen_prod_pdysi ? COLLECTION_DEFS.actividadesPDySI : null);
  const { options: actPI, loading: loadActPI } = useCollection(w.frm_gen_prod_pi ? COLLECTION_DEFS.actividadesPI : null);

  const actRows = [
    w.frm_gen_prod_dyo ? { prod: 'D&O', actField: 'frm_act_dyo_actividad' as const, ciuField: 'frm_act_dyo_cod_ciiu' as const, naicField: 'frm_act_dyo_cod_naic' as const, options: actDyO, loading: loadActDyO } : null,
    w.frm_gen_prod_cc ? { prod: 'Crimen Comercial', actField: 'frm_act_cc_actividad' as const, ciuField: 'frm_act_cc_cod_ciiu' as const, naicField: 'frm_act_cc_cod_naic' as const, options: actCC, loading: loadActCC } : null,
    w.frm_gen_prod_pdysi ? { prod: 'PDySI', actField: 'frm_act_pdysi_actividad' as const, ciuField: 'frm_act_pdysi_cod_ciiu' as const, naicField: 'frm_act_pdysi_cod_naic' as const, options: actPDySI, loading: loadActPDySI } : null,
    w.frm_gen_prod_pi ? { prod: 'Seg. Profesional', actField: 'frm_act_pi_actividad' as const, ciuField: 'frm_act_pi_cod_ciiu' as const, naicField: 'frm_act_pi_cod_naic' as const, options: actPI, loading: loadActPI } : null,
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <FormSection title="Información del Tomador" color="#2167AE">
      <div className="form-row cols-3 row-align-bottom">
        <InputField
          label="NIT"
          registration={register('frm_tom_nit', {
            required: 'Campo requerido',
            minLength: { value: 7, message: 'Mínimo 7 dígitos' },
            maxLength: { value: 10, message: 'Máximo 10 dígitos' },
            pattern: { value: /^\d+$/, message: 'Solo dígitos, sin separador' },
          })}
          required
          error={fe('frm_tom_nit')}
          helper="9 dígitos + dígito verificador"
        />
        <InputField label="Tomador" registration={register('frm_tom_tomador')} readOnly helper="Dato de TIA" />
        <div className="form-group consultar-wrapper">
          <button type="button" className="btn-consultar" onClick={onConsultarNIT}>
            🔍 Consultar TIA
          </button>
        </div>
      </div>

      <div className="form-row cols-3">
        <InputField label="Dirección" registration={register('frm_tom_direccion')} readOnly helper="Dato de TIA" />
        <SelectField
          label="Departamento"
          name="frm_tom_departamento"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={[...DEPARTAMENTOS]}
          required
          error={fe('frm_tom_departamento')}
        />
        <SelectField
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
        <InputField
          label="Correo para facturación"
          registration={register('frm_tom_correo_facturacion', {
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
          })}
          type="email"
          helper="Dato de TIA (editable)"
          error={fe('frm_tom_correo_facturacion')}
        />
        {w.frm_gen_prod_dyo && (
          <SelectField
            label="Sector"
            name="frm_tom_sector"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.sector}
            required
            error={fe('frm_tom_sector')}
          />
        )}
        <InputField
          label="Detalle actividad empresarial"
          registration={register('frm_tom_detalle_actividad', {
            required: 'Campo requerido',
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
          required
          error={fe('frm_tom_detalle_actividad')}
        />
      </div>

      {/* Actividades aseguradas (por producto seleccionado) */}
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
                  <SelectField
                    label=""
                    name={actField}
                    control={control}
                    options={options}
                    loading={loading}
                    error={fe(actField)}
                  />
                </div>
                <div className="actividades-cell">
                  <InputField label="" registration={register(ciuField)} readOnly />
                </div>
                <div className="actividades-cell">
                  <InputField label="" registration={register(naicField)} readOnly />
                </div>
              </div>
            ))}
          </div>
          {/* TODO: verificar IDs de colecciones de actividades en PM4 FL (IDs 20-23 son placeholders) */}
          {/* TODO: conectar rawMap para auto-poblar CIIU y NAIC al seleccionar actividad */}
        </div>
      )}

      <div className="section-spacer" />
      <CreacionTomador form={form} />
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

  // Calcular fin de vigencia (365 días a partir de inicio)
  useEffect(() => {
    if (!w.frm_cot_inicio_vigencia) return;
    const d = new Date(w.frm_cot_inicio_vigencia);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    setValue('frm_cot_fin_vigencia', d.toISOString().split('T')[0]);
    setValue('frm_cot_dias', 365);
  }, [w.frm_cot_inicio_vigencia, setValue]);

  // Poblar modalidades de cobertura ocultas según producto
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
        <DateField
          label="Inicio de vigencia"
          registration={register('frm_cot_inicio_vigencia', { required: 'Campo requerido' })}
          required
          helper="a las 00:00 horas"
          error={fe('frm_cot_inicio_vigencia')}
        />
        <DateField label="Fin de vigencia" registration={register('frm_cot_fin_vigencia')} readOnly helper="a las 24:00 horas" />
        <InputField label="Días" registration={register('frm_cot_dias')} type="number" readOnly />
        <InputField label="Moneda" registration={register('frm_cot_moneda')} readOnly />
      </div>

      <div className="form-row cols-2">
        <InputField label="Comisión" registration={register('frm_cot_comision')} readOnly suffix="%" helper="20% por defecto" />
        <InputField label="Soporte ofrecido" registration={register('frm_cot_soporte_ofrecido')} readOnly suffix="%" helper="100% por defecto" />
      </div>

      {w.frm_gen_prod_cc && (
        <div className="form-row cols-2">
          <SelectField
            label="Número de empleados"
            name="frm_cot_num_empleados"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.numEmpleados}
            required
            error={fe('frm_cot_num_empleados')}
          />
          <SelectField
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
                <SelectField label="" name="frm_cot_fact_anual_dyo" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionDyO} error={fe('frm_cot_fact_anual_dyo')} />
              </div>
            )}
            {w.frm_gen_prod_cc && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Crimen Comercial</div>
                <SelectField label="" name="frm_cot_fact_anual_cc" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionCC} error={fe('frm_cot_fact_anual_cc')} />
              </div>
            )}
            {w.frm_gen_prod_pdysi && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Protección de Datos y SI</div>
                <SelectField label="" name="frm_cot_fact_anual_pdysi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPDySI} error={fe('frm_cot_fact_anual_pdysi')} />
              </div>
            )}
            {w.frm_gen_prod_pi && (
              <div className="facturacion-block">
                <div className="facturacion-block-label">Seguro Profesional</div>
                <SelectField label="" name="frm_cot_fact_anual_pi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPI} error={fe('frm_cot_fact_anual_pi')} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modalidades de cobertura (campos ocultos, seteados automáticamente) */}
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
  const { register, control } = form;
  return (
    <FormSection title="Plan de Pago" color="#2167AE">
      <div className="form-row cols-2">
        <SelectField label="Plan de pago" name="frm_plan_plan_pago" control={control} options={OPTIONS.planPago} />
        <InputField label="Número de cuotas" registration={register('frm_plan_num_cuotas')} readOnly helper="1 cuota por defecto" />
      </div>
      <div className="form-row cols-2">
        <SelectField label="Medio de pago" name="frm_plan_medio_pago" control={control} options={OPTIONS.medioPago} />
        <InputField label="Frecuencia de cobro" registration={register('frm_plan_frecuencia_cobro')} readOnly helper="Anual por defecto" />
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

  const form = useForm<FfFlSolicitudFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
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

  // Pre-poblar el formulario con los datos del task (variables del proceso)
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
      // Combinar variables originales del proceso con los datos del formulario.
      // Los datos del formulario tienen precedencia; las variables de PM4 no mostradas
      // en este form se preservan para que el proceso no las pierda.
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

  const handleConsultarNIT = () => {
    const nit = form.getValues('frm_tom_nit');
    if (!nit) { setSubmitError('Ingrese el NIT primero.'); return; }
    // TODO: invocar watcher "Consultar NIT en TIA" via /api/scripts/{scriptId}/execute
    console.log('[watcher] Consultando NIT en TIA:', nit);
  };

  if (loading) return <div className="screen-loading"><div className="spinner" /></div>;
  if (error) return <div className="screen-error">⚠ Error cargando la tarea: {error}</div>;

  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>Cotizador Fast Flow — Líneas Financieras</h1>
          </div>
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
            <span>Cotización # {form.watch('frm_gen_nro_cotizacion') || '—'}</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <div className="screen-content">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <InfoGeneral form={form} productError={productError} />
          <InfoTomador form={form} onConsultarNIT={handleConsultarNIT} />
          <DatosCotizacion form={form} />
          <PlanPago form={form} />

          {submitError && (
            <div className="submit-error">{submitError}</div>
          )}

          <div className="submit-bar">
            <button type="submit" className="btn-continuar" disabled={submitting}>
              {submitting ? 'Enviando...' : 'CONTINUAR →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
