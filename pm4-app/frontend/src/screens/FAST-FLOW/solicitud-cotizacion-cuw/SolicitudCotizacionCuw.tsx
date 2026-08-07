import { useEffect, useState } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useForm, FieldError } from 'react-hook-form';
import { useTask } from '../../../core/useTask';
import { scrollToFirstError } from '../../../core/scrollToFirstError';
import { useCollection } from '../../../core/useCollection';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import { ZdsInput, ZdsSelect, ZdsDate, ZdsTextarea, ZrButton, ZrAlert, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import { OPTIONS, COLLECTION_DEFS, SolicitudCotizacionFormData, SCRIPT_OBTENER_CLIENTE } from './variables';
import pm4 from '../../../api/pm4Client';
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

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function fieldError(
  in_objErr: FieldError | undefined,
  in_objValue: unknown,
  in_blnSubmitted: boolean
): string | undefined {
  if (!in_objErr) return undefined;
  const blnIsEmpty = in_objValue === '' || in_objValue === null || in_objValue === undefined;
  if (in_objErr.type === 'required' && blnIsEmpty) return in_blnSubmitted ? String(in_objErr.message) : undefined;
  return String(in_objErr.message);
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

function formatCOP(in_dblValue: number | null | undefined): string {
  if (in_dblValue == null) return '';
  return in_dblValue.toLocaleString('es-CO');
}

function mapValoresToPm4(in_lstValues: ValorDeducible[], in_strCurrency: string): Record<string, unknown>[] {
  return in_lstValues.map((objValue, intI) => {
    // Las opciones sin límite asegurado se envían en blanco
    const blnFilled = objValue.frm_valores_limite_asegurado !== '' && objValue.frm_valores_limite_asegurado != null;
    if (!blnFilled) {
      return {
        row_id: ROW_IDS_VALORES[intI],
        frm_valores_opcion: objValue.frm_valores_opcion,
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

    const dblLimit = objValue.frm_valores_limite_asegurado as number;
    const dblPct = objValue.frm_valores_deducible_porcentaje as number;
    const strFactor = objValue.frm_valores_deducible_minimo_factor || null;
    const blnIsValor = strFactor === 'VALOR';
    const blnIsSmmlv = strFactor === 'SMMLV';
    const dblMinValor = blnIsValor && objValue.frm_valores_deducible_minimo !== '' ? objValue.frm_valores_deducible_minimo as number : null;
    const dblMinSmmlv = blnIsSmmlv && objValue.frm_valores_deducible_minimo_smmlv !== '' ? objValue.frm_valores_deducible_minimo_smmlv as number : null;

    return {
      row_id: ROW_IDS_VALORES[intI],
      frm_valores_opcion: objValue.frm_valores_opcion,
      frm_cot_moneda_dup_vad: in_strCurrency,
      frm_valores_limite_asegurado: dblLimit,
      frm_valores_deducible_porcentaje: dblPct,
      frm_valores_deducible_minimo_factor: strFactor,
      frm_valores_deducible_minimo: dblMinValor,
      frm_valores_deducible_minimo_smmlv: blnIsSmmlv ? String(dblMinSmmlv ?? '0') : '0',
      frm_valor_asegurado_control_procede: false,
      frm_valores_limite_asegurado_formateado: formatCOP(dblLimit),
      frm_valores_deducible_porcentaje_formateado: `${dblPct} %`,
      frm_valores_deducible_minimo_formateado: dblMinValor != null ? formatCOP(dblMinValor) : null,
      frm_valores_deducible_minimo_smmlv_formateado: dblMinSmmlv != null ? formatCOP(dblMinSmmlv) : null,
      ...(intI === 0 && { control_opcion_1_frm_valores_asegurados_deducibles: 'NO' }),
      control_opcion_rellenar_valores_asegurados_deducibles: null,
      control_opciones_consecutivas_frm_valores_asegurados_deducibles: 'NO',
    };
  });
}

async function consultarCliente(
  in_strTipoDoc: string,
  in_strNumDoc: string,
  in_strTokenTia: string,
  in_intScriptId: number = SCRIPT_OBTENER_CLIENTE
): Promise<{ value: TiaValue | null }> {
  const strUrl = `/scripts/${in_intScriptId}/execute`;
  const objDataObj = {
    frm_tomador_tipoDoc: in_strTipoDoc,
    frm_tomador_numDoc: in_strNumDoc,
    respuesta_token_tia: in_strTokenTia,
  };
  const objBody = { data: JSON.stringify(objDataObj), config: JSON.stringify({}), sync: true };
  console.log(`[watcher] POST /api${strUrl} → data:`, objDataObj);
  const objRes = await pm4.post(strUrl, objBody);
  console.log(`[watcher] Respuesta (${objRes.status}):`, objRes.data);
  // PM4 puede devolver { output: {...} } o el objeto directamente
  const objRaw = objRes.data as Record<string, unknown>;
  const objTiaRaw = (objRaw?.output as Record<string, unknown> | undefined) ?? objRaw;
  return objTiaRaw as { value: TiaValue | null };
}

function mapTiaFields(
  in_objValue: TiaValue,
  in_strPrefix: 'frm_tom' | 'frm_aseg',
  in_objForm: Form
) {
  // Capitaliza cada palabra del nombre
  const cap = (in_strText: string) =>
    in_strText.split(' ').map(strPart => strPart.charAt(0).toUpperCase() + strPart.slice(1).toLowerCase()).join(' ');

  if (in_objValue.name) in_objForm.setValue(`${in_strPrefix}_nombres_completos` as keyof SolicitudCotizacionFormData, cap(in_objValue.name) as never);

  const objAddr = in_objValue.addresses?.[0];
  if (objAddr) {
    const lstParts = [objAddr.street, objAddr.city, objAddr.country].filter(Boolean);
    in_objForm.setValue(`${in_strPrefix}_direccion` as keyof SolicitudCotizacionFormData, (lstParts.join(', ') || 'Sin datos') as never);
  }

  if (in_objValue.birthDate) in_objForm.setValue(`${in_strPrefix}_fecha_constitucion` as keyof SolicitudCotizacionFormData, in_objValue.birthDate as never);

  const strEmail = in_objValue.contactInfo?.find(objInfo => objInfo.contactInfoType === 'E-MAIL')?.contactInfoDetail;
  if (strEmail) in_objForm.setValue(`${in_strPrefix}_correo_facturacion` as keyof SolicitudCotizacionFormData, strEmail as never);

  const strPt = (in_objValue.partyType ?? '').toUpperCase().trim();
  const strTipoEmpresa = ['GOVERNMENT', 'PUBLIC'].includes(strPt) ? 'PUBLICA'
    : ['MIXED', 'MIXTA'].includes(strPt) ? 'MIXTA' : 'PRIVADA';
  in_objForm.setValue(`${in_strPrefix}_tipo_empresa` as keyof SolicitudCotizacionFormData, strTipoEmpresa as never);
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  // Catálogos de intermediarios, comerciales y suscriptores
  const { options: cllIntermediaries, loading: loadingInt } = useCollection(COLLECTION_DEFS.intermediarios);
  const { options: cllComerciales, loading: loadingCom } = useCollection(COLLECTION_DEFS.comerciales);
  const { options: cllSuscriptores, loading: loadingSus } = useCollection(COLLECTION_DEFS.suscriptores, {});

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
        <ZdsSelect label="Intermediario principal" name="frm_gen_intermediario_principal" control={control} rules={{ required: 'Campo requerido' }} options={cllIntermediaries} loading={loadingInt} required error={fe('frm_gen_intermediario_principal')} />
        <ZdsSelect label="Comercial" name="frm_gen_comercial_id" control={control} options={cllComerciales} loading={loadingCom} />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect label="Suscriptor asignado" name="frm_gen_suscriptor_asignado_id" control={control} rules={{ required: 'Campo requerido' }} options={cllSuscriptores} loading={loadingSus} required error={fe('frm_gen_suscriptor_asignado_id')} />
        <ZdsInput label="Correo suscriptor (TEST)" name="frm_gen_suscriptor_asignado_correo_test" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" helpText="Ambiente de pruebas" error={fe('frm_gen_suscriptor_asignado_correo_test')} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Líder/Seguidor" name="frm_gen_lider_seguidor" control={control} options={OPTIONS.liderSeguidor} />
        <ZdsSelect label="Co-corretaje" name="frm_gen_co_corretaje" control={control} options={OPTIONS.siNo} />
        <ZdsInput label="Comisión solicitada (%)" name="frm_cot_comision_solicitada_pct" control={control} rules={{ min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } }} />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Coaseguro requerido" name="frm_gen_coaseguro_requerido" control={control} options={OPTIONS.siNo} />
        {objWatch.frm_gen_coaseguro_requerido === 'SI' && <ZdsSelect label="Tipo de coaseguro" name="frm_gen_tipo_coaseguro" control={control} options={OPTIONS.tipoCoaseguro} />}
        {objWatch.frm_gen_coaseguro_requerido === 'SI' && <ZdsInput label="Participación solicitada (%)" name="frm_gen_participacion_solicitado_pct" control={control} rules={{ min: { value: 0, message: '>= 0' }, max: { value: 100, message: '<= 100' } }} />}
      </div>

      <div className="form-row cols-3">
        <ZdsSelect label="Reaseguro requerido" name="frm_gen_reaseguro_requerido" control={control} options={OPTIONS.siNo} />
        {objWatch.frm_gen_reaseguro_requerido === 'SI' && <ZdsSelect label="Tipo de reaseguro" name="frm_gen_tipo_reaseguro" control={control} options={OPTIONS.tipoReaseguro} />}
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  const { options: cllDepartments, loading: loadingDep } = useCollection(COLLECTION_DEFS.departamentos);
  const { options: cllMunicipios, loading: loadingMun } = useCollection(
    COLLECTION_DEFS.municipiosTomador,
    { frm_tom_departamento: objWatch.frm_tom_departamento }
  );

  const blnLocked = tiaStatus === 'found';
  const blnShowFields = tiaStatus === 'found' || tiaStatus === 'createNew';

  return (
    <FormSection title="Información del Tomador">
      <div className="form-row cols-3 row-align-bottom">
        <ZdsSelect label="Tipo de documento" name="frm_tom_tipo_documento" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_tom_tipo_documento')} />
        <ZdsInput label="Nro. de documento" name="frm_tom_num_documento" control={control} rules={{ required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } }} required error={fe('frm_tom_num_documento')} />
        <div className="form-group" z-flex z-align="left:bottom">
          <ZrButton config="secondary" icon="search:line" onClick={onConsultar} loading={tiaStatus === 'loading'} disabled={tiaStatus === 'loading'}>
            Consultar Cliente
          </ZrButton>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {blnShowFields && (
        <>
          <div className="form-row cols-2">
            <ZdsInput label="Nombre / Razón social" name="frm_tom_nombres_completos" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_tom_nombres_completos')} readOnly={blnLocked} />
            <ZdsSelect label="Tipo de empresa" name="frm_tom_tipo_empresa" control={control} options={OPTIONS.tipoEmpresa} disabled={blnLocked} />
          </div>

          <div className="form-row cols-3">
            <ZdsDate label="Fecha de constitución" name="frm_tom_fecha_constitucion" control={control} readOnly={blnLocked} />
            <ZdsInput label="Teléfono" name="frm_tom_telefono" control={control} rules={{ pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } }} error={fe('frm_tom_telefono')} readOnly={blnLocked} />
            <ZdsInput label="Correo para facturación" name="frm_tom_correo_facturacion" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" error={fe('frm_tom_correo_facturacion')} readOnly={blnLocked} />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect label="Departamento" name="frm_tom_departamento" control={control} options={cllDepartments} loading={loadingDep} disabled={blnLocked} />
            <ZdsSelect label="Municipio" name="frm_tom_municipio" control={control} options={cllMunicipios} loading={loadingMun} placeholder={objWatch.frm_tom_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={blnLocked} />
            <ZdsInput label="Dirección" name="frm_tom_direccion" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_tom_direccion')} readOnly={blnLocked} />
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

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

      {objWatch.frm_aseg_realiza_exportaciones_flag === 'SI' && (
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  const { options: cllDepartments, loading: loadingDep } = useCollection(COLLECTION_DEFS.departamentos);
  const { options: cllMunicipios, loading: loadingMun } = useCollection(
    COLLECTION_DEFS.municipiosAsegurado,
    { frm_aseg_departamento: objWatch.frm_aseg_departamento }
  );

  const blnLocked = tiaStatus === 'found';
  const blnShowFields = tiaStatus === 'found' || tiaStatus === 'createNew';

  return (
    <FormSection title="Datos del Asegurado">
      <div className="form-row cols-3 row-align-bottom">
        <ZdsSelect label="Tipo de documento" name="frm_aseg_tipo_documento" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.tipoDocumento} required error={fe('frm_aseg_tipo_documento')} />
        <ZdsInput label="Nro. de documento" name="frm_aseg_num_documento" control={control} rules={{ required: 'Campo requerido', minLength: { value: 5, message: 'Mínimo 5 caracteres' } }} required error={fe('frm_aseg_num_documento')} />
        <div className="form-group" z-flex z-align="left:bottom">
          <ZrButton config="secondary" icon="search:line" onClick={onConsultar} loading={tiaStatus === 'loading'} disabled={tiaStatus === 'loading'}>
            Consultar Cliente
          </ZrButton>
        </div>
      </div>

      <TiaBanner status={tiaStatus} onCrearCliente={onCrearCliente} />

      {blnShowFields && (
        <>
          <div className="form-row cols-2">
            <ZdsInput label="Nombre / Razón social" name="frm_aseg_nombres_completos" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_aseg_nombres_completos')} readOnly={blnLocked} />
            <ZdsSelect label="Tipo de empresa" name="frm_aseg_tipo_empresa" control={control} options={OPTIONS.tipoEmpresa} disabled={blnLocked} />
          </div>

          <div className="form-row cols-3">
            <ZdsDate label="Fecha de constitución" name="frm_aseg_fecha_constitucion" control={control} readOnly={blnLocked} />
            <ZdsInput label="Teléfono" name="frm_aseg_telefono" control={control} rules={{ pattern: { value: /^\d{7,12}$/, message: 'Teléfono inválido' } }} error={fe('frm_aseg_telefono')} readOnly={blnLocked} />
            <ZdsInput label="Correo para facturación" name="frm_aseg_correo_facturacion" control={control} rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }} inputType="email" error={fe('frm_aseg_correo_facturacion')} readOnly={blnLocked} />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect label="Departamento" name="frm_aseg_departamento" control={control} options={cllDepartments} loading={loadingDep} disabled={blnLocked} />
            <ZdsSelect label="Municipio" name="frm_aseg_municipio" control={control} options={cllMunicipios} loading={loadingMun} placeholder={objWatch.frm_aseg_departamento ? 'Seleccione...' : 'Seleccione un departamento primero'} disabled={blnLocked} />
            <ZdsInput label="Dirección" name="frm_aseg_direccion" control={control} rules={{ required: 'Campo requerido' }} required error={fe('frm_aseg_direccion')} readOnly={blnLocked} />
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  const { options: cllNaic, loading: loadingNaic } = useCollection(
    COLLECTION_DEFS.actividadNaic,
    {}  // PMQL estático "CO", watchValues vacío para activarlo
  );

  // Autocompletamos código y nombre al seleccionar la actividad NAIC
  useEffect(() => {
    if (!objWatch.frm_cot_actividad_naic) return;
    setValue('frm_cot_codigo_naic', objWatch.frm_cot_actividad_naic);
    const objOpt = cllNaic.find(objItem => objItem.value === objWatch.frm_cot_actividad_naic);
    if (objOpt) setValue('frm_cot_nombre_ciiu', objOpt.label);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objWatch.frm_cot_actividad_naic]);

  // Calculamos el fin de vigencia automáticamente (365 días)
  useEffect(() => {
    if (!objWatch.frm_cot_fecha_inicio_vigencia) return;
    const datEnd = new Date(objWatch.frm_cot_fecha_inicio_vigencia);
    datEnd.setFullYear(datEnd.getFullYear() + 1);
    datEnd.setDate(datEnd.getDate() - 1);
    setValue('frm_cot_fecha_fin_vigencia', datEnd.toISOString().split('T')[0]);
    setValue('frm_cot_dias_inicio_fin_vigencia', 365);
  }, [objWatch.frm_cot_fecha_inicio_vigencia, setValue]);

  return (
    <FormSection title="Datos de la Cotización">
      <div className="form-row cols-3">
        <ZdsDate label="Inicio de vigencia" name="frm_cot_fecha_inicio_vigencia" control={control} rules={{ required: 'Campo requerido' }} required helpText="a las 00:00 horas" error={fe('frm_cot_fecha_inicio_vigencia')} />
        <ZdsDate label="Fin de vigencia" name="frm_cot_fecha_fin_vigencia" control={control} readOnly helpText="a las 24:00 horas" />
        <ZdsInput label="Días" name="frm_cot_dias_inicio_fin_vigencia" control={control} readOnly />
      </div>

      <div className="form-row cols-1">
        <ZdsSelect label="Actividad del asegurado principal (NAIC)" name="frm_cot_actividad_naic" control={control} rules={{ required: 'Campo requerido' }} options={cllNaic} loading={loadingNaic} required error={fe('frm_cot_actividad_naic')} />
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

      {objWatch.frm_cot_siniestralidad_flag === 'SI' && (
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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

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
  const objWatch = watch();
  const fe = (in_strName: keyof SolicitudCotizacionFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  return (
    <FormSection title="Revisión Mora">
      <div className="form-row cols-2">
        <ZdsSelect label="¿El cliente se encuentra en mora?" name="frm_revision_mora_cliente_mora" control={form.control} rules={{ required: 'Campo requerido' }} options={OPTIONS.clienteMora} required error={fe('frm_revision_mora_cliente_mora')} />
        {objWatch.frm_revision_mora_cliente_mora === 'SI' && (
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

  const [blnSent, setBlnSent] = useState(false);
  const [strTomadorTia, setStrTomadorTia] = useState<TiaStatus>('idle');
  const [strAseguradoTia, setStrAseguradoTia] = useState<TiaStatus>('idle');
  const [lstAseguradosAdicionales, setLstAseguradosAdicionales] = useState<AseguradoAdicional[]>([]);
  const [lstValoresDeducibles, setLstValoresDeducibles] = useState<ValorDeducible[]>(INITIAL_VALORES);
  const [lstExportaciones, setLstExportaciones] = useState<ExportacionRow[]>([]);

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

  // Pre-poblamos el formulario y las tablas con los datos del caso
  useEffect(() => {
    if (!task?.data) return;
    const objData = task.data as Partial<SolicitudCotizacionFormData> & {
      frm_lista_asegurados_adicionales?: AseguradoAdicional[];
      frm_valores_asegurados_deducibles?: ValorDeducible[];
      frm_lista_detalle_exportaciones?: ExportacionRow[];
    };
    Object.entries(objData).forEach(([strKey, objVal]) => {
      if (objVal !== null && objVal !== undefined) {
        form.setValue(strKey as keyof SolicitudCotizacionFormData, objVal as never);
      }
    });
    if (Array.isArray(objData.frm_lista_asegurados_adicionales)) {
      setLstAseguradosAdicionales(objData.frm_lista_asegurados_adicionales);
    }
    if (Array.isArray(objData.frm_valores_asegurados_deducibles) && objData.frm_valores_asegurados_deducibles.length === 5) {
      setLstValoresDeducibles(objData.frm_valores_asegurados_deducibles);
    }
    if (Array.isArray(objData.frm_lista_detalle_exportaciones)) {
      setLstExportaciones(objData.frm_lista_detalle_exportaciones);
    }
  }, [task, form]);

  // Al cambiar el número de documento, limpiamos el estado TIA para poder consultar otro
  const strTomDoc = form.watch('frm_tom_num_documento');
  const strAsegDoc = form.watch('frm_aseg_num_documento');
  useEffect(() => {
    setStrTomadorTia('idle');
  }, [strTomDoc]);
  useEffect(() => {
    setStrAseguradoTia('idle');
  }, [strAsegDoc]);

  const handleConsultar = async (in_strPrefix: 'frm_tom' | 'frm_aseg', in_setStatus: (s: TiaStatus) => void) => {
    const strTipoDoc = form.getValues(`${in_strPrefix}_tipo_documento` as keyof SolicitudCotizacionFormData) as string ?? '';
    const strNumDoc = form.getValues(`${in_strPrefix}_num_documento` as keyof SolicitudCotizacionFormData) as string ?? '';
    const strTokenTia = (form.getValues as (k: string) => string)('respuesta_token_tia') ?? '';

    if (!strNumDoc) { alert('Ingrese el número de documento primero.'); return; }
    if (!strTokenTia) console.warn('[watcher] respuesta_token_tia está vacío');

    in_setStatus('loading');
    try {
      const objResult = await consultarCliente(strTipoDoc, strNumDoc, strTokenTia);
      if (objResult?.value === null || objResult?.value === undefined) {
        in_setStatus('notFound');
      } else {
        mapTiaFields(objResult.value, in_strPrefix, form);
        in_setStatus('found');
      }
    } catch (excError) {
      console.error('[watcher] Error consultando cliente:', excError);
      in_setStatus('idle');
      alert(`Error al consultar cliente: ${(excError as Error).message}`);
    }
  };

  const onSubmit = async (in_objData: SolicitudCotizacionFormData) => {
    try {
      // Copiamos los datos omitiendo los campos internos (_) y adjuntamos las tablas
      const objRaw = in_objData as unknown as Record<string, unknown>;
      const dicPayload: Record<string, unknown> = {};
      for (const [strKey, objVal] of Object.entries(objRaw)) {
        if (!strKey.startsWith('_')) dicPayload[strKey] = objVal;
      }
      dicPayload.frm_lista_asegurados_adicionales = lstAseguradosAdicionales;
      dicPayload.frm_valores_asegurados_deducibles = mapValoresToPm4(lstValoresDeducibles, in_objData.frm_cot_moneda ?? 'COP');
      dicPayload.frm_lista_detalle_exportaciones = lstExportaciones;
      console.log('[submit] Enviando a PM4:', dicPayload);
      await completeTask(dicPayload);
      setBlnSent(true);
    } catch (excError) {
      console.error('[submit] Error PM4:', excError);
      alert(`Error al enviar: ${(excError as Error).message}`);
    }
  };

  if (loading) return <div className="screen-loading"><ZrLoader /></div>;
  if (error) return <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error cargando la tarea: {error}</ZrAlert>;

  if (blnSent) {
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

  // Datos de cabecera para el encabezado
  const strQuote = form.watch('frm_num_cotizacion_cuw_col') ?? task?.process_request_id ?? '—';
  const strCaso = form.watch('frm_caso_cuw_col') ?? '—';
  const strTomadorEsAsegurado = form.watch('frm_tom_asegurado_es_tomador_flag');

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Solicitud de Cotización CUW"
        subtitle={[
          strQuote ? `Cotización # ${strQuote}` : null,
          strCaso ? `Caso # ${strCaso}` : null,
        ]}
      />

      <div className="screen-content">
        <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)} noValidate>
          <InfoGeneral form={form} />

          <InfoTomador
            form={form}
            tiaStatus={strTomadorTia}
            onConsultar={() => handleConsultar('frm_tom', setStrTomadorTia)}
            onCrearCliente={() => setStrTomadorTia('createNew')}
          />

          <SubInfoAsegurado form={form} exportaciones={lstExportaciones} onExportacionesChange={setLstExportaciones} />

          {strTomadorEsAsegurado !== 'SI' && (
            <InfoAsegurado
              form={form}
              tiaStatus={strAseguradoTia}
              onConsultar={() => handleConsultar('frm_aseg', setStrAseguradoTia)}
              onCrearCliente={() => setStrAseguradoTia('createNew')}
            />
          )}

          <FormSection title="Asegurados Adicionales">
            <AseguradosAdicionales value={lstAseguradosAdicionales} onChange={setLstAseguradosAdicionales} />
          </FormSection>

          <DatosCotizacion form={form} />

          <FormSection title="Valores Asegurados y Deducibles">
            <ValoresDeducibles value={lstValoresDeducibles} onChange={setLstValoresDeducibles} />
          </FormSection>

          <PlanPago form={form} />
          <RevisionMora form={form} />

          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            <strong>Documentos de solicitud</strong> — Pendiente de implementar (requiere carga de archivos).
          </ZrAlert>

          <ActionBar>
            <ZrButton config="positive:l" onClick={() => { form.handleSubmit(onSubmit, scrollToFirstError)(); }} loading={submitting} disabled={submitting}>
              ENVIAR
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
