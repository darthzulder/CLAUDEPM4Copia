import { useEffect, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useForm, FieldError } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import { useCollection } from '../../core/useCollection';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import { ZdsInput, ZdsSelect, ZdsDate, ZdsTextarea, ZrButton, ZrAlert } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import { OPTIONS, COLLECTION_DEFS, SolicitudCotizacionFormData } from './variables';
import pm4 from '../../api/pm4Client';
import AseguradosAdicionales, { AseguradoAdicional } from './AseguradosAdicionales';
import ValoresDeducibles, { ValorDeducible, INITIAL_VALORES } from './ValoresDeducibles';
import DetalleExportaciones, { ExportacionRow } from './DetalleExportaciones';

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

// ---------------------------------------------------------------------------
// Mappers al formato PM4
// ---------------------------------------------------------------------------
const ROW_IDS_VALORES = [
  'aseguradores_Deducibles_Opc_01',
  'aseguradores_Deducibles_Opc_02',
  'aseguradores_Deducibles_Opc_03',
  'aseguradores_Deducibles_Opc_04',
  'aseguradores_Deducibles_Opc_05',
];

function formatCOP(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('es-CO');
}

function mapValoresToPm4(valores: ValorDeducible[], moneda: string): Record<string, unknown>[] {
  return valores.map((v, i) => {
    const filled = v.frm_valores_limite_asegurado !== '' && v.frm_valores_limite_asegurado != null;
    if (!filled) {
      return {
        row_id: ROW_IDS_VALORES[i],
        frm_valores_opcion: v.frm_valores_opcion,
        frm_cot_moneda_dup_vad: null,
        frm_valores_limite_asegurado: null,
        frm_valores_deducible_porcentaje: null,
        frm_valor_asegurado_control_procede: false,
        frm_valores_deducible_minimo_factor: null,
        frm_valores_deducible_minimo: null,
        frm_valores_deducible_minimo_smmlv: null,
        frm_valores_limite_asegurado_formateado: null,
        frm_valores_deducible_porcentaje_formateado: null,
        frm_valores_deducible_minimo_formateado: null,
        frm_valores_deducible_minimo_smmlv_formateado: null,
      };
    }

    const limite = v.frm_valores_limite_asegurado as number;
    const pct = v.frm_valores_deducible_porcentaje as number;
    const factor = v.frm_valores_deducible_minimo_factor || null;
    const esValor = factor === 'VALOR';
    const esSmmlv = factor === 'SMMLV';
    const minValor = esValor && v.frm_valores_deducible_minimo !== '' ? v.frm_valores_deducible_minimo as number : null;
    const minSmmlv = esSmmlv && v.frm_valores_deducible_minimo_smmlv !== '' ? v.frm_valores_deducible_minimo_smmlv as number : null;

    return {
      row_id: ROW_IDS_VALORES[i],
      frm_valores_opcion: v.frm_valores_opcion,
      frm_cot_moneda_dup_vad: moneda,
      frm_valores_limite_asegurado: limite,
      frm_valores_deducible_porcentaje: pct,
      frm_valores_deducible_minimo_factor: factor,
      frm_valores_deducible_minimo: minValor,
      frm_valores_deducible_minimo_smmlv: esSmmlv ? String(minSmmlv ?? '0') : '0',
      frm_valor_asegurado_control_procede: false,
      frm_valores_limite_asegurado_formateado: formatCOP(limite),
      frm_valores_deducible_porcentaje_formateado: `${pct} %`,
      frm_valores_deducible_minimo_formateado: minValor != null ? formatCOP(minValor) : null,
      frm_valores_deducible_minimo_smmlv_formateado: minSmmlv != null ? formatCOP(minSmmlv) : null,
      ...(i === 0 && { control_opcion_1_frm_valores_asegurados_deducibles: 'NO' }),
      control_opcion_rellenar_valores_asegurados_deducibles: null,
      control_opciones_consecutivas_frm_valores_asegurados_deducibles: 'NO',
    };
  });
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
// Banner de estado TIA
// ---------------------------------------------------------------------------
function TiaBanner({ status, onCrearCliente }: { status: TiaStatus; onCrearCliente: () => void }) {
  if (status === 'idle') return null;
  if (status === 'loading') return <ZrAlert config="info" {...({ 'hide-close': true } as object)}>Consultando TIA…</ZrAlert>;
  if (status === 'found') return <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>Cliente encontrado en TIA. Campos bloqueados.</ZrAlert>;
  if (status === 'notFound') return (
    <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--zs-100)', flexWrap: 'wrap' }}>
        <span>Cliente no encontrado en TIA.</span>
        <ZrButton config="secondary:s" icon="plus:line" onClick={onCrearCliente}>Agregar nuevo cliente</ZrButton>
      </div>
    </ZrAlert>
  );
  if (status === 'createNew') return <ZrAlert config="info" {...({ 'hide-close': true } as object)}>Ingrese los datos del nuevo cliente.</ZrAlert>;
  return null;
}

// ---------------------------------------------------------------------------
// Sección: Información General (pantalla 102)
// ---------------------------------------------------------------------------
function InfoGeneral({ form }: { form: Form }) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: intermediarios, loading: loadingInt } = useCollection(COLLECTION_DEFS.intermediarios);
  const { options: comerciales, loading: loadingCom } = useCollection(COLLECTION_DEFS.comerciales);
  const { options: suscriptores, loading: loadingSus } = useCollection(COLLECTION_DEFS.suscriptores, {});

  return (
    <FormSection title="Información General">
      <div className="form-row cols-3">
        <ZdsDate label="Fecha de solicitud" name="frm_gen_fecha_solicitud" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_gen_fecha_solicitud')} />
        <ZdsDate label="Fecha esperada de cotización" name="frm_gen_fecha_esperada_cotizacion" control={control} />
        <ZdsSelect label="Nueva/Renovación" name="frm_gen_nueva_o_renovacion" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.nuevaRenovacion} required error={fe('frm_gen_nueva_o_renovacion')} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="País" name="frm_gen_pais" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.pais} required error={fe('frm_gen_pais')} />
        <ZdsSelect label="Sucursal" name="frm_gen_sucursal" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.sucursal} required error={fe('frm_gen_sucursal')} />
        <ZdsSelect label="Segmento" name="frm_gen_segmento" control={control} options={OPTIONS.segmento} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Línea de negocio" name="frm_gen_linea_negocio" control={control} options={OPTIONS.lineaNegocio} />
        <ZdsSelect label="Producto" name="frm_gen_producto" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.producto} required error={fe('frm_gen_producto')} />
        <ZdsSelect label="Alcance" name="frm_gen_alcance" control={control} options={OPTIONS.alcance} />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect label="Intermediario principal" name="frm_gen_intermediario_principal" control={control} rules={{ required: 'Campo requerido' }} options={intermediarios} loading={loadingInt} required error={fe('frm_gen_intermediario_principal')} />
        <ZdsSelect label="Comercial" name="frm_gen_comercial_id" control={control} options={comerciales} loading={loadingCom} />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect label="Suscriptor asignado" name="frm_gen_suscriptor_asignado_id" control={control} rules={{ required: 'Campo requerido' }} options={suscriptores} loading={loadingSus} required error={fe('frm_gen_suscriptor_asignado_id')} />
        <ZdsInput label="Correo suscriptor (TEST)" name="frm_gen_suscriptor_asignado_correo_test" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" helpText="Ambiente de pruebas" error={fe('frm_gen_suscriptor_asignado_correo_test')} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Líder/Seguidor" name="frm_gen_lider_seguidor" control={control} options={OPTIONS.liderSeguidor} />
        <ZdsSelect label="Co-corretaje" name="frm_gen_co_corretaje" control={control} options={OPTIONS.siNo} />
        <ZdsInput label="Comisión solicitada (%)" name="frm_cot_comision_solicitada_pct" control={control} rules={{ min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } }} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Coaseguro requerido" name="frm_gen_coaseguro_requerido" control={control} options={OPTIONS.siNo} />
        {w.frm_gen_coaseguro_requerido === 'SI' && <ZdsSelect label="Tipo de coaseguro" name="frm_gen_tipo_coaseguro" control={control} options={OPTIONS.tipoCoaseguro} />}
        {w.frm_gen_coaseguro_requerido === 'SI' && <ZdsInput label="Participación solicitada (%)" name="frm_gen_participacion_solicitado_pct" control={control} rules={{ min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } }} />}
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Reaseguro requerido" name="frm_gen_reaseguro_requerido" control={control} options={OPTIONS.siNo} />
        {w.frm_gen_reaseguro_requerido === 'SI' && <ZdsSelect label="Tipo de reaseguro" name="frm_gen_tipo_reaseguro" control={control} options={OPTIONS.tipoReaseguro} />}
        <ZdsInput label="Nro. de póliza actual" name="frm_gen_numero_poliza" control={control} helpText="Solo para renovaciones" />
      </div>

      <div className="form-row cols-2">
        <ZdsInput label="Informador" name="frm_gen_nom_informador" control={control} />
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
  const { control, formState: { errors, isSubmitted }, watch } = form;
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
        <ZdsSelect label="Tipo de documento" name="frm_tom_tipo_documento" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_tom_tipo_documento')} />
        <ZdsInput label="Nro. de documento" name="frm_tom_num_documento" control={control} rules={{ required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } }} required error={fe('frm_tom_num_documento')} />
        <div className="form-group lookup-wrapper">
          <ZrButton config="secondary" icon="search:line" onClick={onConsultar} loading={tiaStatus === 'loading'} disabled={tiaStatus === 'loading'}>
            Consultar Cliente
          </ZrButton>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {showFields && (
        <>
          <div className="form-row cols-2">
            <ZdsInput label="Nombre / Razón social" name="frm_tom_nombres_completos" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_tom_nombres_completos')} readOnly={locked} />
            <ZdsSelect label="Tipo de empresa" name="frm_tom_tipo_empresa" control={control} options={OPTIONS.tipoEmpresa} disabled={locked} />
          </div>

          <div className="form-row cols-3">
            <ZdsDate label="Fecha de constitución" name="frm_tom_fecha_constitucion" control={control} readOnly={locked} />
            <ZdsInput label="Teléfono" name="frm_tom_telefono" control={control} rules={{ pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } }} error={fe('frm_tom_telefono')} readOnly={locked} />
            <ZdsInput label="Correo para facturación" name="frm_tom_correo_facturacion" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" error={fe('frm_tom_correo_facturacion')} readOnly={locked} />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect label="Departamento" name="frm_tom_departamento" control={control} options={departamentos} loading={loadingDep} disabled={locked} />
            <ZdsSelect label="Municipio" name="frm_tom_municipio" control={control} options={municipios} loading={loadingMun} placeholder={w.frm_tom_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={locked} />
            <ZdsInput label="Dirección" name="frm_tom_direccion" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_tom_direccion')} readOnly={locked} />
          </div>

          <div className="form-row cols-1">
            <ZdsInput label="Actividad comercial" name="frm_tom_actividad_asegurada" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_tom_actividad_asegurada')} />
          </div>
        </>
      )}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Sub-información del Asegurado (pantalla 213)
// ---------------------------------------------------------------------------
function SubInfoAsegurado({
  form,
  exportaciones,
  onExportacionesChange,
}: {
  form: Form;
  exportaciones: ExportacionRow[];
  onExportacionesChange: (list: ExportacionRow[]) => void;
}) {
  const { formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  return (
    <FormSection title="Información del Asegurado">
      <div className="form-row cols-2">
        <ZdsSelect label="El tomador es el asegurado?" name="frm_tom_asegurado_es_tomador_flag" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.siNo} required error={fe('frm_tom_asegurado_es_tomador_flag')} />
        <ZdsSelect label="Territorialidad" name="frm_aseg_territorialidad" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.territorialidad} required error={fe('frm_aseg_territorialidad')} />
      </div>
      <div className="form-row cols-2">
        <ZdsInput label="N° de ubicaciones" name="frm_aseg_numero_ubicaciones" control={form.control} rules={{ required: 'Campo requerido', min: { value: 1, message: 'Debe ser >= 1' } }} required error={fe('frm_aseg_numero_ubicaciones')} />
        <ZdsSelect label="Realiza exportaciones" name="frm_aseg_realiza_exportaciones_flag" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.siNo} required error={fe('frm_aseg_realiza_exportaciones_flag')} />
      </div>

      {w.frm_aseg_realiza_exportaciones_flag === 'SI' && (
        <div className="form-subsection">
          <div className="form-subsection-title">Detalle de exportaciones</div>
          <DetalleExportaciones value={exportaciones} onChange={onExportacionesChange} />
        </div>
      )}
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
  const { control, formState: { errors, isSubmitted }, watch } = form;
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
        <ZdsSelect label="Tipo de documento" name="frm_aseg_tipo_documento" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_aseg_tipo_documento')} />
        <ZdsInput label="Nro. de documento" name="frm_aseg_num_documento" control={control} rules={{ required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } }} required error={fe('frm_aseg_num_documento')} />
        <div className="form-group lookup-wrapper">
          <ZrButton config="secondary" icon="search:line" onClick={onConsultar} loading={tiaStatus === 'loading'} disabled={tiaStatus === 'loading'}>
            Consultar Cliente
          </ZrButton>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {showFields && (
        <>
          <div className="form-row cols-2">
            <ZdsInput label="Nombre / Razón social" name="frm_aseg_nombres_completos" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_aseg_nombres_completos')} readOnly={locked} />
            <ZdsSelect label="Tipo de empresa" name="frm_aseg_tipo_empresa" control={control} options={OPTIONS.tipoEmpresa} disabled={locked} />
          </div>

          <div className="form-row cols-3">
            <ZdsDate label="Fecha de constitución" name="frm_aseg_fecha_constitucion" control={control} readOnly={locked} />
            <ZdsInput label="Teléfono" name="frm_aseg_telefono" control={control} rules={{ pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } }} error={fe('frm_aseg_telefono')} readOnly={locked} />
            <ZdsInput label="Correo para facturación" name="frm_aseg_correo_facturacion" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" error={fe('frm_aseg_correo_facturacion')} readOnly={locked} />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect label="Departamento" name="frm_aseg_departamento" control={control} options={departamentos} loading={loadingDep} disabled={locked} />
            <ZdsSelect label="Municipio" name="frm_aseg_municipio" control={control} options={municipios} loading={loadingMun} placeholder={w.frm_aseg_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={locked} />
            <ZdsInput label="Dirección" name="frm_aseg_direccion" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_aseg_direccion')} readOnly={locked} />
          </div>

          <div className="form-row cols-1">
            <ZdsInput label="Actividad comercial" name="frm_aseg_actividad_comercial" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_aseg_actividad_comercial')} />
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
  const { control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  const { options: naicOptions, loading: loadingNaic } = useCollection(
    COLLECTION_DEFS.actividadNaic,
    {}  // PMQL estático "CO", watchValues vacío para activarlo
  );

  // Auto-fill código y nombre al seleccionar la actividad NAIC
  useEffect(() => {
    if (!w.frm_cot_actividad_naic) return;
    setValue('frm_cot_codigo_naic', w.frm_cot_actividad_naic);
    const opt = naicOptions.find(o => o.value === w.frm_cot_actividad_naic);
    if (opt) setValue('frm_cot_nombre_ciiu', opt.label);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.frm_cot_actividad_naic]);

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
        <ZdsDate label="Inicio de vigencia" name="frm_cot_fecha_inicio_vigencia" control={control} rules={{ required: 'Campo requerido' }} required helpText="a las 00:00 horas" error={fe('frm_cot_fecha_inicio_vigencia')} />
        <ZdsDate label="Fin de vigencia" name="frm_cot_fecha_fin_vigencia" control={control} readOnly helpText="a las 24:00 horas" />
        <ZdsInput label="Días" name="frm_cot_dias_inicio_fin_vigencia" control={control} readOnly />
      </div>

      <div className="form-row cols-1">
        <ZdsSelect label="Actividad del asegurado principal (NAIC)" name="frm_cot_actividad_naic" control={control} rules={{ required: 'Campo requerido' }} options={naicOptions} loading={loadingNaic} required error={fe('frm_cot_actividad_naic')} />
      </div>

      <div className="form-row cols-3">
        <ZdsInput label="Código NAIC" name="frm_cot_codigo_naic" control={control} readOnly helpText="Auto" />
        <ZdsInput label="Nombre actividad" name="frm_cot_nombre_ciiu" control={control} readOnly helpText="Auto" />
        <ZdsSelect label="Moneda" name="frm_cot_moneda" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.moneda} required error={fe('frm_cot_moneda')} />
      </div>

      <div className="form-row cols-2">
        <ZdsInput label="Ingresos operacionales anuales" name="frm_cot_ingresos_operaciones_anuales" control={control} rules={{ required: 'Campo requerido', min: { value: 1, message: 'Debe ser mayor a 0' } }} required error={fe('frm_cot_ingresos_operaciones_anuales')} />
        <ZdsInput label="Ingresos proyectados anuales" name="frm_cot_ingresos_proyectados_anuales" control={control} rules={{ required: 'Campo requerido', min: { value: 1, message: 'Debe ser mayor a 0' } }} required error={fe('frm_cot_ingresos_proyectados_anuales')} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Modalidad de cobertura" name="frm_cot_modalidad_cobertura" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.modalidadCobertura} required error={fe('frm_cot_modalidad_cobertura')} />
        <ZdsSelect label="Periodicidad" name="frm_cot_periodicidad" control={control} options={OPTIONS.periodicidad} />
        <ZdsSelect label="Siniestralidad" name="frm_cot_siniestralidad_flag" control={control} options={OPTIONS.siNo} />
      </div>

      {w.frm_cot_siniestralidad_flag === 'SI' && (
        <div className="form-row cols-2">
          <ZdsDate label="Siniestralidad reportada desde" name="frm_cot_siniestralidad_fecha_desde" control={control} />
          <ZdsDate label="Siniestralidad reportada hasta" name="frm_cot_siniestralidad_fecha_hasta" control={control} />
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
        <ZdsSelect label="Plan de pago" name="frm_plan_pago" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.planPago} required error={fe('frm_plan_pago')} />
        <ZdsSelect label="Número de cuotas" name="frm_plan_pago_num_cuotas" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.numCuotas} required error={fe('frm_plan_pago_num_cuotas')} />
      </div>
      <div className="form-row cols-2">
        <ZdsSelect label="Método de pago" name="frm_plan_pago_metodo_pago" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.metodoPago} required error={fe('frm_plan_pago_metodo_pago')} />
        <ZdsSelect label="Frecuencia de cobro" name="frm_plan_pago_frecuencia_cobro" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.frecuenciaCobro} required error={fe('frm_plan_pago_frecuencia_cobro')} />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Revisión Mora (pantalla 139)
// ---------------------------------------------------------------------------
function RevisionMora({ form }: { form: Form }) {
  const { formState: { errors, isSubmitted }, watch } = form;
  const w = watch();
  const fe = (n: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[n] as FieldError | undefined, w[n], isSubmitted);

  return (
    <FormSection title="Revisión Mora">
      <div className="form-row cols-2">
        <ZdsSelect label="¿El cliente se encuentra en mora?" name="frm_revision_mora_cliente_mora" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.clienteMora} required error={fe('frm_revision_mora_cliente_mora')} />
        {w.frm_revision_mora_cliente_mora === 'SI' && (
          <ZdsSelect label="Decisión" name="frm_revision_mora_decision" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.decisionMora} required error={fe('frm_revision_mora_decision')} />
        )}
      </div>
      <div className="form-row cols-1">
        <ZdsTextarea control={form.control} name="frm_revision_mora_comentario" label="Comentario" />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SolicitudCotizacionCuw() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const [sent, setSent] = useState(false);
  const [tomadorTia, setTomadorTia] = useState<TiaStatus>('idle');
  const [aseguradoTia, setAseguradoTia] = useState<TiaStatus>('idle');
  const [aseguradosAdicionales, setAseguradosAdicionales] = useState<AseguradoAdicional[]>([]);
  const [valoresDeducibles, setValoresDeducibles] = useState<ValorDeducible[]>(INITIAL_VALORES);
  const [exportaciones, setExportaciones] = useState<ExportacionRow[]>([]);

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
    const d = task.data as Partial<SolicitudCotizacionFormData> & {
      frm_lista_asegurados_adicionales?: AseguradoAdicional[];
      frm_valores_asegurados_deducibles?: ValorDeducible[];
      frm_lista_detalle_exportaciones?: ExportacionRow[];
    };
    Object.entries(d).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        form.setValue(key as keyof SolicitudCotizacionFormData, val as never);
      }
    });
    if (Array.isArray(d.frm_lista_asegurados_adicionales)) {
      setAseguradosAdicionales(d.frm_lista_asegurados_adicionales);
    }
    if (Array.isArray(d.frm_valores_asegurados_deducibles) && d.frm_valores_asegurados_deducibles.length === 5) {
      setValoresDeducibles(d.frm_valores_asegurados_deducibles);
    }
    if (Array.isArray(d.frm_lista_detalle_exportaciones)) {
      setExportaciones(d.frm_lista_detalle_exportaciones);
    }
  }, [task, form]);

  // Al cambiar el número de documento, limpiar el estado TIA para poder consultar otro
  const tomDoc = form.watch('frm_tom_num_documento');
  const asegDoc = form.watch('frm_aseg_num_documento');
  useEffect(() => {
    setTomadorTia('idle');
  }, [tomDoc]);
  useEffect(() => {
    setAseguradoTia('idle');
  }, [asegDoc]);

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
      const raw = data as unknown as Record<string, unknown>;
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!k.startsWith('_')) payload[k] = v;
      }
      payload.frm_lista_asegurados_adicionales = aseguradosAdicionales;
      payload.frm_valores_asegurados_deducibles = mapValoresToPm4(valoresDeducibles, data.frm_cot_moneda ?? 'COP');
      payload.frm_lista_detalle_exportaciones = exportaciones;
      console.log('[submit] Enviando a PM4:', payload);
      await completeTask(payload);
      setSent(true);
    } catch (e) {
      console.error('[submit] Error PM4:', e);
      alert(`Error al enviar: ${(e as Error).message}`);
    }
  };

  if (loading) return <div className="screen-loading"><div className="spinner" /></div>;
  if (error) return <div className="screen-error">⚠️ Error cargando la tarea: {error}</div>;

  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Solicitud de Cotización CUW" />
        <div className="screen-content">
          <ResultCard variant="success" title="Solicitud enviada">
            <p>
              La solicitud fue enviada correctamente a ProcessMaker.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  const cotizacion = form.watch('frm_num_cotizacion_cuw_col') ?? task?.process_request_id ?? '—';
  const caso = form.watch('frm_caso_cuw_col') ?? '—';
  const tomadorEsAsegurado = form.watch('frm_tom_asegurado_es_tomador_flag');

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Solicitud de Cotización CUW"
        subtitle={[
          cotizacion ? `Cotización # ${cotizacion}` : null,
          caso ? `Caso # ${caso}` : null,
        ]}
      />

      <div className="screen-content">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <InfoGeneral form={form} />

          <InfoTomador
            form={form}
            tiaStatus={tomadorTia}
            onConsultar={() => handleConsultar('frm_tom', setTomadorTia)}
            onCrearCliente={() => setTomadorTia('createNew')}
          />

          <SubInfoAsegurado form={form} exportaciones={exportaciones} onExportacionesChange={setExportaciones} />

          {tomadorEsAsegurado !== 'SI' && (
            <InfoAsegurado
              form={form}
              tiaStatus={aseguradoTia}
              onConsultar={() => handleConsultar('frm_aseg', setAseguradoTia)}
              onCrearCliente={() => setAseguradoTia('createNew')}
            />
          )}

          <FormSection title="Asegurados Adicionales">
            <AseguradosAdicionales value={aseguradosAdicionales} onChange={setAseguradosAdicionales} />
          </FormSection>

          <DatosCotizacion form={form} />

          <FormSection title="Valores Asegurados y Deducibles">
            <ValoresDeducibles value={valoresDeducibles} onChange={setValoresDeducibles} />
          </FormSection>

          <PlanPago form={form} />
          <RevisionMora form={form} />

          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            <strong>Documentos de solicitud</strong> — Pendiente de implementar (requiere carga de archivos).
          </ZrAlert>

          <ActionBar>
            <ZrButton config="positive:l" onClick={() => { form.handleSubmit(onSubmit)(); }} loading={submitting} disabled={submitting}>
              ENVIAR
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
