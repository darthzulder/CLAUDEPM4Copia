import { useEffect, useState } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import './styles.css';
import { useTask } from '../../core/useTask';
import { useCollection } from '../../core/useCollection';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import DateField from '../../components/fields/DateField';
import { OPTIONS, COLLECTION_DEFS, SolicitudCotizacionFormData } from './variables';
import pm4 from '../../api/pm4Client';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Form = ReturnType<typeof useForm<SolicitudCotizacionFormData>>;
type TiaStatus = 'idle' | 'loading' | 'found' | 'notFound' | 'createNew';

interface TiaValue {
  name?: string;
  addresses?: Array<{ street?: string; city?: string; country?: string }>;
  birthDate?: string;
  contactInfo?: Array<{ contactInfoType: string; contactInfoDetail: string }>;
  partyType?: string;
}

const SCRIPT_OBTENER_CLIENTE = 50;

// ---------------------------------------------------------------------------
// Helpers
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

async function consultarCliente(
  tipoDoc: string,
  numDoc: string,
  tokenTia: string,
  scriptId: number = SCRIPT_OBTENER_CLIENTE
): Promise<{ value: TiaValue | null }> {
  const url = `/scripts/${scriptId}/execute`;
  const dataObj = {
    frm_tomador_tipoDoc: tipoDoc,
    frm_tomador_numDoc: numDoc,
    respuesta_token_tia: tokenTia,
  };
  const body = { data: JSON.stringify(dataObj), config: JSON.stringify({}), sync: true };
  console.log(`[watcher] POST /api${url} → data:`, dataObj);
  const res = await pm4.post(url, body);
  console.log(`[watcher] Respuesta (${res.status}):`, res.data);
  // PM4 puede devolver { output: {...} } o el objeto directamente
  const raw = res.data as Record<string, unknown>;
  const tiaRaw = (raw?.output as Record<string, unknown> | undefined) ?? raw;
  return tiaRaw as { value: TiaValue | null };
}

function mapTiaFields(
  value: TiaValue,
  prefix: 'frm_tom' | 'frm_aseg',
  form: Form
) {
  const cap = (s: string) =>
    s.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

  if (value.name) form.setValue(`${prefix}_nombres_completos` as keyof SolicitudCotizacionFormData, cap(value.name) as never);

  const addr = value.addresses?.[0];
  if (addr) {
    const parts = [addr.street, addr.city, addr.country].filter(Boolean);
    form.setValue(`${prefix}_direccion` as keyof SolicitudCotizacionFormData, (parts.join(', ') || 'Sin datos') as never);
  }

  if (value.birthDate) form.setValue(`${prefix}_fecha_constitucion` as keyof SolicitudCotizacionFormData, value.birthDate as never);

  const email = value.contactInfo?.find(i => i.contactInfoType === 'E-MAIL')?.contactInfoDetail;
  if (email) form.setValue(`${prefix}_correo_facturacion` as keyof SolicitudCotizacionFormData, email as never);

  const pt = (value.partyType ?? '').toUpperCase().trim();
  const tipoEmpresa = ['GOVERNMENT', 'PUBLIC'].includes(pt) ? 'PUBLICA'
    : ['MIXED', 'MIXTA'].includes(pt) ? 'MIXTA' : 'PRIVADA';
  form.setValue(`${prefix}_tipo_empresa` as keyof SolicitudCotizacionFormData, tipoEmpresa as never);
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
function ZurichLogo() {
  return (
    <svg width="80" height="40" viewBox="0 0 120 60" fill="none">
      <text x="4" y="42" fontFamily="Arial" fontSize="32" fontWeight="900" fill="#fff" letterSpacing="-1">Z</text>
      <text x="28" y="38" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#fff">ZURICH</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Banner de estado TIA
// ---------------------------------------------------------------------------
function TiaBanner({ status, onCrearCliente }: { status: TiaStatus; onCrearCliente: () => void }) {
  if (status === 'idle') return null;
  if (status === 'loading') return <div className="tia-banner tia-loading">⏳ Consultando TIA…</div>;
  if (status === 'found') return <div className="tia-banner tia-found">✅ Cliente encontrado en TIA. Campos bloqueados.</div>;
  if (status === 'notFound') return (
    <div className="tia-banner tia-notfound">
      <span>⚠️ Cliente no encontrado en TIA.</span>
      <button type="button" className="btn-crear-cliente" onClick={onCrearCliente}>
        + Agregar nuevo cliente
      </button>
    </div>
  );
  if (status === 'createNew') return <div className="tia-banner tia-create">✏️ Ingrese los datos del nuevo cliente.</div>;
  return null;
}

// ---------------------------------------------------------------------------
// Sección: Información General (pantalla 102)
// ---------------------------------------------------------------------------
function InfoGeneral({ form }: { form: Form }) {
  const { register, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: intermediarios, loading: loadingInt } = useCollection(COLLECTION_DEFS.intermediarios);
  const { options: comerciales, loading: loadingCom } = useCollection(COLLECTION_DEFS.comerciales);
  const { options: suscriptores, loading: loadingSus } = useCollection(COLLECTION_DEFS.suscriptores, {});

  return (
    <FormSection title="Información General">
      <div className="form-row cols-3">
        <DateField label="Fecha de solicitud" registration={register('frm_gen_fecha_solicitud', { required: 'Campo requerido' })} required error={fe('frm_gen_fecha_solicitud')} />
        <DateField label="Fecha esperada de cotización" registration={register('frm_gen_fecha_esperada_cotizacion')} />
        <SelectField label="Nueva/Renovación" name="frm_gen_nueva_o_renovacion" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.nuevaRenovacion} required error={fe('frm_gen_nueva_o_renovacion')} />
      </div>

      <div className="form-row cols-3">
        <SelectField label="País" name="frm_gen_pais" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.pais} required error={fe('frm_gen_pais')} />
        <SelectField label="Sucursal" name="frm_gen_sucursal" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.sucursal} required error={fe('frm_gen_sucursal')} />
        <SelectField label="Segmento" name="frm_gen_segmento" control={form.control} options={OPTIONS.segmento} />
      </div>

      <div className="form-row cols-3">
        <SelectField label="Línea de negocio" name="frm_gen_linea_negocio" control={form.control} options={OPTIONS.lineaNegocio} />
        <SelectField label="Producto" name="frm_gen_producto" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.producto} required error={fe('frm_gen_producto')} />
        <SelectField label="Alcance" name="frm_gen_alcance" control={form.control} options={OPTIONS.alcance} />
      </div>

      <div className="form-row cols-2">
        <SelectField label="Intermediario principal" name="frm_gen_intermediario_principal" control={form.control} rules={{ required: 'Campo requerido' }} options={intermediarios} loading={loadingInt} required error={fe('frm_gen_intermediario_principal')} />
        <SelectField label="Comercial" name="frm_gen_comercial_id" control={form.control} options={comerciales} loading={loadingCom} />
      </div>

      <div className="form-row cols-2">
        <SelectField label="Suscriptor asignado" name="frm_gen_suscriptor_asignado_id" control={form.control} rules={{ required: 'Campo requerido' }} options={suscriptores} loading={loadingSus} required error={fe('frm_gen_suscriptor_asignado_id')} />
        <InputField label="Correo suscriptor (TEST)" registration={register('frm_gen_suscriptor_asignado_correo_test', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} type="email" helper="Ambiente de pruebas" error={fe('frm_gen_suscriptor_asignado_correo_test')} />
      </div>

      <div className="form-row cols-3">
        <SelectField label="Líder/Seguidor" name="frm_gen_lider_seguidor" control={form.control} options={OPTIONS.liderSeguidor} />
        <SelectField label="Co-corretaje" name="frm_gen_co_corretaje" control={form.control} options={OPTIONS.siNo} />
        <InputField label="Comisión solicitada (%)" registration={register('frm_cot_comision_solicitada_pct', { min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } })} type="number" />
      </div>

      <div className="form-row cols-3">
        <SelectField label="Coaseguro requerido" name="frm_gen_coaseguro_requerido" control={form.control} options={OPTIONS.siNo} />
        {w.frm_gen_coaseguro_requerido === 'SI' && <SelectField label="Tipo de coaseguro" name="frm_gen_tipo_coaseguro" control={form.control} options={OPTIONS.tipoCoaseguro} />}
        {w.frm_gen_coaseguro_requerido === 'SI' && <InputField label="Participación solicitada (%)" registration={register('frm_gen_participacion_solicitado_pct', { min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } })} type="number" />}
      </div>

      <div className="form-row cols-3">
        <SelectField label="Reaseguro requerido" name="frm_gen_reaseguro_requerido" control={form.control} options={OPTIONS.siNo} />
        {w.frm_gen_reaseguro_requerido === 'SI' && <SelectField label="Tipo de reaseguro" name="frm_gen_tipo_reaseguro" control={form.control} options={OPTIONS.tipoReaseguro} />}
        <InputField label="Nro. de póliza actual" registration={register('frm_gen_numero_poliza')} type="text" helper="Solo para renovaciones" />
      </div>

      <div className="form-row cols-2">
        <InputField label="Informador" registration={register('frm_gen_nom_informador')} type="text" />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Información del Tomador (pantalla 106)
// ---------------------------------------------------------------------------
function InfoTomador({
  form,
  tiaStatus,
  onConsultar,
  onCrearCliente,
}: {
  form: Form;
  tiaStatus: TiaStatus;
  onConsultar: () => void;
  onCrearCliente: () => void;
}) {
  const { register, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: departamentos, loading: loadingDep } = useCollection(COLLECTION_DEFS.departamentos);
  const { options: municipios, loading: loadingMun } = useCollection(
    COLLECTION_DEFS.municipiosTomador,
    { frm_tom_departamento: w.frm_tom_departamento }
  );

  const locked = tiaStatus === 'found';
  const showFields = tiaStatus === 'found' || tiaStatus === 'createNew';

  return (
    <FormSection title="Información del Tomador">
      <div className="form-row cols-3 row-align-bottom">
        <SelectField label="Tipo de documento" name="frm_tom_tipo_documento" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_tom_tipo_documento')} disabled={locked} />
        <InputField label="Nro. de documento" registration={register('frm_tom_num_documento', { required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } })} type="text" required error={fe('frm_tom_num_documento')} readOnly={locked} />
        <div className="form-group consultar-wrapper">
          <button type="button" className="btn-consultar" onClick={onConsultar} disabled={tiaStatus === 'loading' || locked}>
            {tiaStatus === 'loading' ? '⏳ Consultando…' : '🔍 Consultar Cliente'}
          </button>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {showFields && (
        <>
          <div className="form-row cols-2">
            <InputField label="Nombre / Razón social" registration={register('frm_tom_nombres_completos', { required: 'Campo requerido' })} type="text" required error={fe('frm_tom_nombres_completos')} readOnly={locked} />
            <SelectField label="Tipo de empresa" name="frm_tom_tipo_empresa" control={form.control} options={OPTIONS.tipoEmpresa} disabled={locked} />
          </div>

          <div className="form-row cols-3">
            <DateField label="Fecha de constitución" registration={register('frm_tom_fecha_constitucion')} readOnly={locked} />
            <InputField label="Teléfono" registration={register('frm_tom_telefono', { pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } })} type="text" error={fe('frm_tom_telefono')} readOnly={locked} />
            <InputField label="Correo para facturación" registration={register('frm_tom_correo_facturacion', { required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} type="email" required error={fe('frm_tom_correo_facturacion')} readOnly={locked} />
          </div>

          <div className="form-row cols-3">
            <SelectField label="Departamento" name="frm_tom_departamento" control={form.control} options={departamentos} loading={loadingDep} disabled={locked} />
            <SelectField label="Municipio" name="frm_tom_municipio" control={form.control} options={municipios} loading={loadingMun} placeholder={w.frm_tom_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={locked} />
            <InputField label="Dirección" registration={register('frm_tom_direccion', { required: 'Campo requerido' })} type="text" required error={fe('frm_tom_direccion')} readOnly={locked} />
          </div>

          <div className="form-row cols-1">
            <InputField label="Actividad comercial" registration={register('frm_tom_actividad_asegurada', { required: 'Campo requerido' })} type="text" required error={fe('frm_tom_actividad_asegurada')} />
          </div>
        </>
      )}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Sub-información del Asegurado (pantalla 213)
// ---------------------------------------------------------------------------
function SubInfoAsegurado({ form }: { form: Form }) {
  const { formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  return (
    <FormSection title="Información del Asegurado">
      <div className="form-row cols-2">
        <SelectField label="El tomador es el asegurado?" name="frm_tom_asegurado_es_tomador_flag" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.siNo} required error={fe('frm_tom_asegurado_es_tomador_flag')} />
        <SelectField label="Territorialidad" name="frm_aseg_territorialidad" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.territorialidad} required error={fe('frm_aseg_territorialidad')} />
      </div>
      <div className="form-row cols-2">
        <InputField label="N° de ubicaciones" registration={form.register('frm_aseg_numero_ubicaciones', { required: 'Campo requerido', min: { value: 1, message: 'Debe ser >= 1' } })} type="number" required error={fe('frm_aseg_numero_ubicaciones')} />
        <SelectField label="Realiza exportaciones" name="frm_aseg_realiza_exportaciones_flag" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.siNo} required error={fe('frm_aseg_realiza_exportaciones_flag')} />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Información del Asegurado (pantalla 107) — solo si tomador ≠ asegurado
// ---------------------------------------------------------------------------
function InfoAsegurado({
  form,
  tiaStatus,
  onConsultar,
  onCrearCliente,
}: {
  form: Form;
  tiaStatus: TiaStatus;
  onConsultar: () => void;
  onCrearCliente: () => void;
}) {
  const { register, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: departamentos, loading: loadingDep } = useCollection(COLLECTION_DEFS.departamentos);
  const { options: municipios, loading: loadingMun } = useCollection(
    COLLECTION_DEFS.municipiosAsegurado,
    { frm_aseg_departamento: w.frm_aseg_departamento }
  );

  const locked = tiaStatus === 'found';
  const showFields = tiaStatus === 'found' || tiaStatus === 'createNew';

  return (
    <FormSection title="Datos del Asegurado">
      <div className="form-row cols-3 row-align-bottom">
        <SelectField label="Tipo de documento" name="frm_aseg_tipo_documento" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_aseg_tipo_documento')} disabled={locked} />
        <InputField label="Nro. de documento" registration={register('frm_aseg_num_documento', { required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } })} type="text" required error={fe('frm_aseg_num_documento')} readOnly={locked} />
        <div className="form-group consultar-wrapper">
          <button type="button" className="btn-consultar" onClick={onConsultar} disabled={tiaStatus === 'loading' || locked}>
            {tiaStatus === 'loading' ? '⏳ Consultando…' : '🔍 Consultar Cliente'}
          </button>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {showFields && (
        <>
          <div className="form-row cols-2">
            <InputField label="Nombre / Razón social" registration={register('frm_aseg_nombres_completos', { required: 'Campo requerido' })} type="text" required error={fe('frm_aseg_nombres_completos')} readOnly={locked} />
            <SelectField label="Tipo de empresa" name="frm_aseg_tipo_empresa" control={form.control} options={OPTIONS.tipoEmpresa} disabled={locked} />
          </div>

          <div className="form-row cols-3">
            <DateField label="Fecha de constitución" registration={register('frm_aseg_fecha_constitucion')} readOnly={locked} />
            <InputField label="Teléfono" registration={register('frm_aseg_telefono', { pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } })} type="text" error={fe('frm_aseg_telefono')} readOnly={locked} />
            <InputField label="Correo para facturación" registration={register('frm_aseg_correo_facturacion', { required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} type="email" required error={fe('frm_aseg_correo_facturacion')} readOnly={locked} />
          </div>

          <div className="form-row cols-3">
            <SelectField label="Departamento" name="frm_aseg_departamento" control={form.control} options={departamentos} loading={loadingDep} disabled={locked} />
            <SelectField label="Municipio" name="frm_aseg_municipio" control={form.control} options={municipios} loading={loadingMun} placeholder={w.frm_aseg_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={locked} />
            <InputField label="Dirección" registration={register('frm_aseg_direccion', { required: 'Campo requerido' })} type="text" required error={fe('frm_aseg_direccion')} readOnly={locked} />
          </div>

          <div className="form-row cols-1">
            <InputField label="Actividad comercial" registration={register('frm_aseg_actividad_comercial', { required: 'Campo requerido' })} type="text" required error={fe('frm_aseg_actividad_comercial')} />
          </div>
        </>
      )}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Datos de la Cotización (pantalla 103)
// ---------------------------------------------------------------------------
function DatosCotizacion({ form }: { form: Form }) {
  const { register, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: naicOptions, loading: loadingNaic } = useCollection(
    COLLECTION_DEFS.actividadNaic,
    { frm_gen_pais: w.frm_gen_pais }
  );

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
      <div className="form-row cols-3">
        <DateField label="Inicio de vigencia" registration={register('frm_cot_fecha_inicio_vigencia', { required: 'Campo requerido' })} required helper="a las 00:00 horas" error={fe('frm_cot_fecha_inicio_vigencia')} />
        <DateField label="Fin de vigencia" registration={register('frm_cot_fecha_fin_vigencia')} readOnly helper="a las 24:00 horas" />
        <InputField label="Días" registration={register('frm_cot_dias_inicio_fin_vigencia')} type="number" readOnly />
      </div>

      <div className="form-row cols-1">
        <SelectField label="Actividad del asegurado principal (NAIC)" name="frm_cot_actividad_naic" control={form.control} rules={{ required: 'Campo requerido' }} options={naicOptions} loading={loadingNaic} required error={fe('frm_cot_actividad_naic')} />
      </div>

      <div className="form-row cols-3">
        <InputField label="Código NAIC" registration={register('frm_cot_codigo_naic')} type="text" readOnly helper="Auto" />
        <InputField label="Nombre actividad" registration={register('frm_cot_nombre_ciiu')} type="text" readOnly helper="Auto" />
        <SelectField label="Moneda" name="frm_cot_moneda" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.moneda} required error={fe('frm_cot_moneda')} />
      </div>

      <div className="form-row cols-2">
        <InputField label="Ingresos operacionales anuales" registration={register('frm_cot_ingresos_operaciones_anuales', { required: 'Campo requerido', min: { value: 1, message: 'Debe ser mayor a 0' } })} type="number" required error={fe('frm_cot_ingresos_operaciones_anuales')} />
        <InputField label="Ingresos proyectados anuales" registration={register('frm_cot_ingresos_proyectados_anuales', { required: 'Campo requerido', min: { value: 1, message: 'Debe ser mayor a 0' } })} type="number" required error={fe('frm_cot_ingresos_proyectados_anuales')} />
      </div>

      <div className="form-row cols-3">
        <SelectField label="Modalidad de cobertura" name="frm_cot_modalidad_cobertura" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.modalidadCobertura} required error={fe('frm_cot_modalidad_cobertura')} />
        <SelectField label="Periodicidad" name="frm_cot_periodicidad" control={form.control} options={OPTIONS.periodicidad} />
        <SelectField label="Siniestralidad" name="frm_cot_siniestralidad_flag" control={form.control} options={OPTIONS.siNo} />
      </div>

      {w.frm_cot_siniestralidad_flag === 'SI' && (
        <div className="form-row cols-2">
          <DateField label="Siniestralidad reportada desde" registration={register('frm_cot_siniestralidad_fecha_desde')} />
          <DateField label="Siniestralidad reportada hasta" registration={register('frm_cot_siniestralidad_fecha_hasta')} />
        </div>
      )}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Plan de Pago (pantalla 113)
// ---------------------------------------------------------------------------
function PlanPago({ form }: { form: Form }) {
  const { formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  return (
    <FormSection title="Plan de Pago">
      <div className="form-row cols-2">
        <SelectField label="Plan de pago" name="frm_plan_pago" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.planPago} required error={fe('frm_plan_pago')} />
        <SelectField label="Número de cuotas" name="frm_plan_pago_num_cuotas" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.numCuotas} required error={fe('frm_plan_pago_num_cuotas')} />
      </div>
      <div className="form-row cols-2">
        <SelectField label="Método de pago" name="frm_plan_pago_metodo_pago" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.metodoPago} required error={fe('frm_plan_pago_metodo_pago')} />
        <SelectField label="Frecuencia de cobro" name="frm_plan_pago_frecuencia_cobro" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.frecuenciaCobro} required error={fe('frm_plan_pago_frecuencia_cobro')} />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Revisión Mora (pantalla 139)
// ---------------------------------------------------------------------------
function RevisionMora({ form }: { form: Form }) {
  const { register, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  return (
    <FormSection title="Revisión Mora">
      <div className="form-row cols-2">
        <SelectField label="¿El cliente se encuentra en mora?" name="frm_revision_mora_cliente_mora" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.clienteMora} required error={fe('frm_revision_mora_cliente_mora')} />
        {w.frm_revision_mora_cliente_mora === 'SI' && (
          <SelectField label="Decisión" name="frm_revision_mora_decision" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.decisionMora} required error={fe('frm_revision_mora_decision')} />
        )}
      </div>
      <div className="form-row cols-1">
        <div className="form-group">
          <label className="form-label">Comentario</label>
          <textarea {...register('frm_revision_mora_comentario')} className="form-control form-textarea" rows={3} />
        </div>
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SolicitudCotizacionCuw() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const [tomadorTia, setTomadorTia] = useState<TiaStatus>('idle');
  const [aseguradoTia, setAseguradoTia] = useState<TiaStatus>('idle');

  const form = useForm<SolicitudCotizacionFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      frm_gen_pais: 'CO',
      frm_gen_segmento: 'MIDDLE_MARKET',
      frm_gen_linea_negocio: 'Liability',
      frm_gen_alcance: 'DOMESTICO',
      frm_gen_nueva_o_renovacion: 'NUEVA',
      frm_gen_coaseguro_requerido: 'NO',
      frm_gen_reaseguro_requerido: 'NO',
      frm_cot_moneda: 'COP',
      frm_cot_periodicidad: 'ANUAL',
      frm_cot_dias_inicio_fin_vigencia: 365,
      frm_plan_pago: '102',
      frm_plan_pago_num_cuotas: '1',
      frm_plan_pago_frecuencia_cobro: 'ANUAL',
      frm_tom_asegurado_es_tomador_flag: 'SI',
      frm_revision_mora_cliente_mora: 'NO',
      frm_cot_siniestralidad_flag: 'NO',
    },
  });

  useEffect(() => {
    if (!task?.data) return;
    const d = task.data as Partial<SolicitudCotizacionFormData>;
    Object.entries(d).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        form.setValue(key as keyof SolicitudCotizacionFormData, val as never);
      }
    });
  }, [task, form]);

  const handleConsultar = async (prefix: 'frm_tom' | 'frm_aseg', setStatus: (s: TiaStatus) => void) => {
    const tipoDoc = form.getValues(`${prefix}_tipo_documento` as keyof SolicitudCotizacionFormData) as string ?? '';
    const numDoc = form.getValues(`${prefix}_num_documento` as keyof SolicitudCotizacionFormData) as string ?? '';
    const tokenTia = (form.getValues as (k: string) => string)('respuesta_token_tia') ?? '';

    if (!numDoc) { alert('Ingrese el número de documento primero.'); return; }
    if (!tokenTia) console.warn('[watcher] respuesta_token_tia está vacío');

    setStatus('loading');
    try {
      const result = await consultarCliente(tipoDoc, numDoc, tokenTia);
      if (result?.value === null || result?.value === undefined) {
        setStatus('notFound');
      } else {
        mapTiaFields(result.value, prefix, form);
        setStatus('found');
      }
    } catch (e) {
      console.error('[watcher] Error consultando cliente:', e);
      setStatus('idle');
      alert(`Error al consultar cliente: ${(e as Error).message}`);
    }
  };

  const onSubmit = async (data: SolicitudCotizacionFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
      alert('Formulario enviado correctamente. La tarea fue completada.');
    } catch (e) {
      alert(`Error al enviar: ${(e as Error).message}`);
    }
  };

  if (loading) return <div className="screen-loading"><div className="spinner" /></div>;
  if (error) return <div className="screen-error">⚠️ Error cargando la tarea: {error}</div>;

  const cotizacion = form.watch('frm_num_cotizacion_cuw_col') ?? task?.process_request_id ?? '—';
  const caso = form.watch('frm_caso_cuw_col') ?? '—';
  const tomadorEsAsegurado = form.watch('frm_tom_asegurado_es_tomador_flag');

  return (
    <div className="screen-wrapper">
      <div className="screen-header">
        <div className="title-block">
          <h1>Solicitud de Cotización CUW</h1>
          <div className="subtitle">
            <span>Cotización # {cotizacion}</span>
            <span>Caso # {caso}</span>
          </div>
        </div>
        <ZurichLogo />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <InfoGeneral form={form} />

        <InfoTomador
          form={form}
          tiaStatus={tomadorTia}
          onConsultar={() => handleConsultar('frm_tom', setTomadorTia)}
          onCrearCliente={() => setTomadorTia('createNew')}
        />

        <SubInfoAsegurado form={form} />

        {tomadorEsAsegurado !== 'SI' && (
          <InfoAsegurado
            form={form}
            tiaStatus={aseguradoTia}
            onConsultar={() => handleConsultar('frm_aseg', setAseguradoTia)}
            onCrearCliente={() => setAseguradoTia('createNew')}
          />
        )}

        <DatosCotizacion form={form} />

        <div className="todo-note">
          ⚙️ <strong>Valores Asegurados y Deducibles</strong> — Pendiente de implementar (requiere componente de tabla editable / record list).
        </div>

        <PlanPago form={form} />
        <RevisionMora form={form} />

        <div className="todo-note">
          ⚙️ <strong>Documentos de solicitud</strong> — Pendiente de implementar (requiere carga de archivos).
        </div>

        <div className="submit-bar">
          <button type="submit" className="btn-enviar" disabled={submitting}>
            {submitting ? 'Enviando...' : '✈ ENVIAR'}
          </button>
        </div>
      </form>
    </div>
  );
}
