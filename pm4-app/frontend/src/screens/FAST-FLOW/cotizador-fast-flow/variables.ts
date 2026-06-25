import type { CollectionDef } from '../../../core/useCollection';

// ---------------------------------------------------------------------------
// Definiciones de colecciones PM4
// Cada entrada describe de dónde vienen las opciones y cómo mapearlas.
// ---------------------------------------------------------------------------
export const COLLECTION_DEFS = {
  /**
   * Intermediarios — Colección 2
   * Todos los intermediarios registrados.
   */
  intermediarios: {
    id: 4,
    labelField: 'data.frm_nombre_entidad',
    valueField: 'id',
  } satisfies CollectionDef,

  /**
   * Actividad NAIC — Colección 2
   * Actividades económicas. Depende del campo frm_gen_pais del formulario:
   * solo se carga cuando el país ya tiene valor y filtra por data.frm_pais.
   */
  naic: {
    id: 2,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    dependsOn: 'frm_gen_pais',
    pmqlTemplate: 'data.frm_pais = "{{frm_gen_pais}}"',
  } satisfies CollectionDef,

  /**
   * Correos del intermediario — Colección 5
   * Filtrado por el intermediario principal seleccionado.
   * Depende de frm_gen_intermediario_principal (ID del intermediario).
   */
  correosIntermediari: {
    id: 5,
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,
} as const;

// ---------------------------------------------------------------------------
// Opciones estáticas (provideData en PM4)
// ---------------------------------------------------------------------------
export const OPTIONS = {
  producto: [
    { value: 'RC', label: 'Responsabilidad Civil General' },
  ],
  pais: [
    { value: 'CO', label: 'Colombia' },
    { value: 'CL', label: 'Chile' },
    { value: 'MX', label: 'México' },
  ],
  sucursal: [
    { value: 'BARRANQUILLA', label: 'Barranquilla' },
    { value: 'BOGOTA', label: 'Bogotá' },
    { value: 'BUCARAMANGA', label: 'Bucaramanga' },
    { value: 'CALI', label: 'Cali' },
    { value: 'EJECAFETERO', label: 'Eje Cafetero' },
    { value: 'MEDELLIN', label: 'Medellín' },
  ],
  nuevaRenovacion: [
    { value: 'NUEVA', label: 'Nueva' },
    { value: 'RENOVACION', label: 'Renovación' },
  ],
  siNo: [
    { value: 'SI', label: 'Si' },
    { value: 'NO', label: 'No' },
  ],
  modalidadCobertura: [
    { value: 'MADE', label: 'Por reclamación (claims made)' },
    { value: 'OCURRENCIA', label: 'Ocurrencia' },
  ],
  planPago: [
    { value: '102', label: '102 Transferencia bancaria a 30 días' },
  ],
  numCuotas: [
    { value: '1', label: '1' },
  ],
  metodoPago: [
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
  ],
  frecuenciaCobro: [
    { value: 'ANUAL', label: 'Anual' },
  ],
  tipoDocumento: [
    { value: 'NIT', label: 'NIT' },
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'CE', label: 'Cédula extranjería' },
  ],
  deducible: [
    {
      value: 'DED_10_1SMLMV',
      label: '10% del valor de la pérdida indemnizable, mínimo 1 smlmv.',
    },
    {
      value: 'DED_10_2SMLMV',
      label: '10% del valor de la pérdida indemnizable, mínimo 2 smlmv.',
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Watchers (documentación de qué scripts se ejecutan y cuándo)
// ---------------------------------------------------------------------------
export const WATCHERS = {
  tokenTia: {
    name: 'Obtener token Tia',
    watching: 'campo_tokens',
    runOnLoad: true,
    scriptId: 'script-43',
  },
  tokenZDiligence: {
    name: 'Obtener Token ZDiligence',
    watching: 'campo_tokens',
    runOnLoad: true,
  },
  tomadorNIT: {
    name: 'Tomador NIT',
    watching: 'frm_tomador_numDoc',
    runOnLoad: false,
    scriptId: 56,
  },
} as const;

// ---------------------------------------------------------------------------
// Consulta de cliente en TIA — script PM4 configurable
// ---------------------------------------------------------------------------
export const CONSULTAR_CLIENTE_SCRIPT_ID = 56;

export function parseClienteTia(rawOutput: unknown): Partial<CotizadorFormData> {
  const tia = ((rawOutput as Record<string, unknown> | null | undefined) ?? {}) as Record<string, unknown>;

  const flex: Record<string, unknown> = {};
  const flexAttrs = tia['flexAttributes'] as Array<{ attributeName: string; attributeValue: unknown }> | undefined;
  if (Array.isArray(flexAttrs)) {
    for (const attr of flexAttrs) flex[attr.attributeName] = attr.attributeValue;
  }

  const tomadorNombre = (() => {
    if (tia['partyType'] === 'INSTITUTION') return tia['name'] as string | null;
    const parts = [flex['FIRST_NAME'], flex['SECOND_NAME'], flex['FIRST_SURNAME'], flex['SECOND_SURNAME']].filter(Boolean);
    return parts.length ? parts.join(' ') : (tia['name'] as string | null);
  })();

  const addresses = tia['addresses'] as Array<Record<string, unknown>> | undefined;
  const mainAddr = addresses?.find(a => a['addressType'] === 'address') ?? {};

  const direccion = (() => {
    const street = mainAddr['street'] as string | null;
    if (street) return street;
    const parts = [
      flex['TYPE_VIA'], flex['NO_VIA'], '#',
      flex['TYPE_VIA2'], flex['NO_VIA2'], flex['PLACA'], flex['DETAILS_ADDRESS'],
    ].filter(v => v !== null && v !== undefined && v !== '');
    return parts.length > 2 ? parts.join(' ') : null;
  })();

  const result: Partial<CotizadorFormData> = {};
  if (tomadorNombre)     result.frm_tomador_tomador            = tomadorNombre;
  if (direccion)         result.frm_tomador_direccion           = direccion;
  if (flex['WEB_EMAIL']) result.frm_tomador_correo_facturacion  = String(flex['WEB_EMAIL']);
  return result;
}

// ---------------------------------------------------------------------------
// Tipos del formulario
// ---------------------------------------------------------------------------
export interface CotizadorFormData {
  // Información general
  frm_gen_num_cotizacion: string;
  frm_gen_fecha_cotizacion: string;
  frm_gen_producto: string;
  frm_gen_pais: string;
  frm_gen_sucursal: string;
  frm_gen_nueva_o_renovacion: string;
  frm_gen_num_poliza: string;
  frm_gen_intermediario_principal: string;
  frm_gen_intermediario_principal_num_documento: string;
  frm_gen_intermediario_principal_correo_test: string;
  frm_gen_intermediario_principal_correo: string;
  frm_gen_incluye_cocorretaje_flag: string;
  // Información tomador
  frm_tomador_tipo_documento: string;
  frm_tomador_numDoc: string;
  frm_tomador_tomador?: string;
  frm_tomador_direccion?: string;
  frm_tomador_correo_facturacion?: string;
  // Territorialidad
  frm_tom_territorialidad: string;
  frm_tom_num_ubicaciones: string;
  frm_tom_realiza_exportaciones: string;
  frm_tom_es_asegurado: string;
  // Datos cotización
  frm_cot_fecha_inicio_vigencia: string;
  frm_cot_fecha_fin_vigencia: string;
  frm_cot_dias_inicio_fin_vigencia: number;
  frm_cot_ingresos_operaciones_anuales: number | string;
  frm_cot_ingresos_proyectados_anuales: number | string;
  frm_cot_actividad_naic: string;
  frm_cot_modalidad_cobertura: string;
  frm_cot_siniestralidad_flag: string;
  // Propuesta económica
  frm_valor_asegurado_opcion1: number | string;
  frm_modal_propuesta_deducible: string;
  // Plan de pago
  frm_plan_pago: string;
  frm_num_cuotas: string;
  frm_metodo_pago: string;
  frm_frecuencia_cobro: string;
  // Computed (read-only)
  frm_caso: string;
  frm_titulo: string;
  campo_tokens: string;
}
