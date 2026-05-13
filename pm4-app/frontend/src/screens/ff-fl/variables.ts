import type { CollectionDef } from '../../core/useCollection';

// ---------------------------------------------------------------------------
// Colecciones PM4
// ---------------------------------------------------------------------------
export const COLLECTION_DEFS = {
  intermediarios: {
    id: 4,
    labelField: 'data.frm_nombre_entidad',
    valueField: 'id',
  } satisfies CollectionDef,

  actividadesCIIU: {
    id: 2,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,
} as const;

// ---------------------------------------------------------------------------
// Opciones estáticas
// ---------------------------------------------------------------------------
const cop = (v: number) => `$${new Intl.NumberFormat('es-CO').format(v)}`;

export const OPTIONS = {
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

  sector: [
    { value: 'OTROS', label: 'Otros' },
    { value: 'COPROPIEDADES', label: 'Copropiedades' },
    { value: 'CONSTRUCCION', label: 'Construcción' },
    { value: 'EDUCACION', label: 'Educación, escolarización y atención a la infancia' },
    { value: 'CENTROS_COMERCIALES', label: 'Centros Comerciales' },
  ],

  numEmpleados: [
    { value: '1-100', label: '1 - 100' },
    { value: '101-300', label: '101 - 300' },
    { value: '301-500', label: '301 - 500' },
  ],

  numPredios: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    value: String(n),
    label: String(n),
  })),

  // Facturación total anual por producto (COP)
  facturacionDyO: [
    7_000_000_000, 13_000_000_000, 20_000_000_000, 45_000_000_000,
    60_000_000_000, 85_000_000_000, 120_000_000_000, 150_000_000_000, 200_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  facturacionCC: [
    15_000_000_000, 30_000_000_000, 45_000_000_000,
    60_000_000_000, 80_000_000_000, 100_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  facturacionPDySI: [
    15_000_000_000, 30_000_000_000, 45_000_000_000,
    60_000_000_000, 80_000_000_000, 100_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  facturacionPI: [
    3_000_000_000, 5_000_000_000, 7_500_000_000,
    10_000_000_000, 15_000_000_000, 20_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  planPago: [
    { value: '102', label: '102 Transferencia bancaria a 30 días' },
  ],

  medioPago: [
    { value: 'TRANSFERENCIA_PESOS', label: 'Transferencia en pesos' },
  ],

  // Creación de tomador
  tipoDocCre: [
    { value: 'NIT', label: 'NIT' },
  ],

  tipoEmpresa: [
    { value: 'SA', label: 'Sociedad Anónima' },
    { value: 'LTDA', label: 'Sociedad Limitada' },
    { value: 'SAS', label: 'Sociedad Anónima Simplificada' },
    { value: 'ESTATAL', label: 'Empresa Estatal' },
    { value: 'ENTIDAD_PUBLICA', label: 'Entidad Pública' },
    { value: 'EXTRANJERA', label: 'Empresa Extranjera' },
  ],

  tipoDocRepLegal: [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PAS', label: 'Pasaporte' },
  ],

  // D&O — Límite asegurado (Propuesta Económica)
  limiteDyo: [
    3_000_000_000, 5_000_000_000, 7_500_000_000, 10_000_000_000,
    15_000_000_000, 20_000_000_000, 30_000_000_000, 50_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  // PDySI — Límite asegurado (Propuesta Económica)
  limitePdySI: [
    3_000_000_000, 5_000_000_000, 7_500_000_000, 10_000_000_000,
    15_000_000_000, 20_000_000_000, 30_000_000_000, 50_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  // Responsabilidad Civil Profesional — Límite asegurado (Propuesta Económica)
  limitePI: [
    1_000_000_000, 2_000_000_000, 3_000_000_000, 5_000_000_000,
    7_500_000_000, 10_000_000_000, 15_000_000_000, 20_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),

  // Crimen Comercial — Límite asegurado (Propuesta Económica)
  limiteCC: [
    1_000_000_000, 2_000_000_000, 3_000_000_000, 5_000_000_000,
    7_500_000_000, 10_000_000_000, 15_000_000_000, 20_000_000_000,
  ].map((v) => ({ value: String(v), label: cop(v) })),
} as const;

// ---------------------------------------------------------------------------
// Departamentos y ciudades de Colombia (listas estáticas)
// ---------------------------------------------------------------------------
export const DEPARTAMENTOS = [
  { value: 'ANT', label: 'Antioquia' },
  { value: 'ATL', label: 'Atlántico' },
  { value: 'BOG', label: 'Bogotá D.C.' },
  { value: 'BOL', label: 'Bolívar' },
  { value: 'BOY', label: 'Boyacá' },
  { value: 'CAL', label: 'Caldas' },
  { value: 'CAU', label: 'Cauca' },
  { value: 'CES', label: 'Cesar' },
  { value: 'COR', label: 'Córdoba' },
  { value: 'CUN', label: 'Cundinamarca' },
  { value: 'HUI', label: 'Huila' },
  { value: 'MAG', label: 'Magdalena' },
  { value: 'MET', label: 'Meta' },
  { value: 'NAR', label: 'Nariño' },
  { value: 'NSA', label: 'Norte de Santander' },
  { value: 'QUI', label: 'Quindío' },
  { value: 'RIS', label: 'Risaralda' },
  { value: 'SAN', label: 'Santander' },
  { value: 'SUC', label: 'Sucre' },
  { value: 'TOL', label: 'Tolima' },
  { value: 'VAL', label: 'Valle del Cauca' },
] as const;

export const CIUDADES_POR_DEPTO: Record<string, { value: string; label: string }[]> = {
  ANT: [{ value: 'MEDELLIN', label: 'Medellín' }, { value: 'BELLO', label: 'Bello' }, { value: 'ENVIGADO', label: 'Envigado' }, { value: 'ITAGUI', label: 'Itagüí' }],
  ATL: [{ value: 'BARRANQUILLA', label: 'Barranquilla' }, { value: 'SOLEDAD', label: 'Soledad' }],
  BOG: [{ value: 'BOGOTA', label: 'Bogotá' }],
  BOL: [{ value: 'CARTAGENA', label: 'Cartagena' }, { value: 'MAGANGUE', label: 'Magangué' }],
  BOY: [{ value: 'TUNJA', label: 'Tunja' }, { value: 'DUITAMA', label: 'Duitama' }, { value: 'SOGAMOSO', label: 'Sogamoso' }],
  CAL: [{ value: 'MANIZALES', label: 'Manizales' }, { value: 'LA_DORADA', label: 'La Dorada' }],
  CAU: [{ value: 'POPAYAN', label: 'Popayán' }],
  CES: [{ value: 'VALLEDUPAR', label: 'Valledupar' }],
  COR: [{ value: 'MONTERIA', label: 'Montería' }],
  CUN: [{ value: 'SOACHA', label: 'Soacha' }, { value: 'FACATATIVA', label: 'Facatativá' }, { value: 'ZIPAQUIRA', label: 'Zipaquirá' }, { value: 'CHIA', label: 'Chía' }],
  HUI: [{ value: 'NEIVA', label: 'Neiva' }],
  MAG: [{ value: 'SANTA_MARTA', label: 'Santa Marta' }],
  MET: [{ value: 'VILLAVICENCIO', label: 'Villavicencio' }],
  NAR: [{ value: 'PASTO', label: 'Pasto' }],
  NSA: [{ value: 'CUCUTA', label: 'Cúcuta' }, { value: 'PAMPLONA', label: 'Pamplona' }],
  QUI: [{ value: 'ARMENIA', label: 'Armenia' }],
  RIS: [{ value: 'PEREIRA', label: 'Pereira' }, { value: 'DOSQUEBRADAS', label: 'Dosquebradas' }],
  SAN: [{ value: 'BUCARAMANGA', label: 'Bucaramanga' }, { value: 'FLORIDABLANCA', label: 'Floridablanca' }, { value: 'GIRON', label: 'Girón' }, { value: 'PIEDECUESTA', label: 'Piedecuesta' }],
  SUC: [{ value: 'SINCELEJO', label: 'Sincelejo' }],
  TOL: [{ value: 'IBAGUE', label: 'Ibagué' }],
  VAL: [{ value: 'CALI', label: 'Cali' }, { value: 'PALMIRA', label: 'Palmira' }, { value: 'BUENAVENTURA', label: 'Buenaventura' }, { value: 'TULUA', label: 'Tuluá' }],
};

// ---------------------------------------------------------------------------
// Watchers
// ---------------------------------------------------------------------------
export const WATCHERS = {
  tokenTia: {
    name: 'Obtener token TIA',
    runOnLoad: true,
    scriptId: 'script-tia-token', // TODO: ID real del script en PM4
  },
  consultarNIT: {
    name: 'Consultar NIT en TIA',
    watching: 'frm_tom_nit',
    runOnLoad: false,
    scriptId: 'script-tia-nit', // TODO: ID real del script en PM4
  },
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario
// ---------------------------------------------------------------------------
// Todos los campos son opcionales: react-hook-form usa DeepPartial internamente
// y los campos con required son validados vía las reglas de cada field, no por el tipo TS.
export interface FfFlSolicitudFormData {
  // Encabezado
  frm_gen_num_cotizacion?: string;

  // Información general
  frm_gen_sucursal?: string;
  frm_gen_fecha_solicitud?: string;
  frm_gen_usuario?: string;
  frm_gen_segmento?: string;
  frm_gen_linea_negocio?: string;
  frm_gen_tipo_produccion?: string;
  frm_gen_canal_comercial?: string;
  frm_gen_comercial?: string;

  // Productos a cotizar (checkboxes)
  frm_gen_prod_dyo?: boolean;
  frm_gen_prod_cc?: boolean;
  frm_gen_prod_pdysi?: boolean;
  frm_gen_prod_pi?: boolean;

  frm_gen_tipo_negocio?: string;
  frm_gen_nueva_renovacion?: string;
  frm_gen_nro_poliza?: string;
  frm_gen_intermediario?: string;
  frm_gen_correo_intermediario?: string;
  frm_gen_correo_adicional_1?: string;
  frm_gen_correo_adicional_2?: string;
  frm_gen_correo_adicional_3?: string;

  // Información del tomador (de TIA)
  frm_tom_nit?: string;
  frm_tom_tomador?: string;
  frm_tom_direccion?: string;
  frm_tom_departamento?: string;
  frm_tom_ciudad?: string;
  frm_tom_correo_facturacion?: string;
  frm_tom_sector?: string;
  frm_tom_detalle_actividad?: string;

  // Actividades aseguradas por producto
  frm_act_dyo_actividad?: string;
  frm_act_dyo_cod_ciiu?: string;
  frm_act_dyo_cod_naic?: string;
  frm_act_cc_actividad?: string;
  frm_act_cc_cod_ciiu?: string;
  frm_act_cc_cod_naic?: string;
  frm_act_pdysi_actividad?: string;
  frm_act_pdysi_cod_ciiu?: string;
  frm_act_pdysi_cod_naic?: string;
  frm_act_pi_actividad?: string;
  frm_act_pi_cod_ciiu?: string;
  frm_act_pi_cod_naic?: string;

  // Datos de la cotización
  frm_cot_inicio_vigencia?: string;
  frm_cot_fin_vigencia?: string;
  frm_cot_dias?: number;
  frm_cot_moneda?: string;
  frm_cot_comision?: number;
  frm_cot_soporte_ofrecido?: number;
  frm_cot_num_empleados?: string;
  frm_cot_num_predios?: string;
  frm_cot_fact_anual_dyo?: string;
  frm_cot_fact_anual_cc?: string;
  frm_cot_fact_anual_pdysi?: string;
  frm_cot_fact_anual_pi?: string;
  // Modalidades de cobertura (campos ocultos, seteados automáticamente)
  frm_cot_modalidad_dyo?: string;
  frm_cot_modalidad_cc?: string;
  frm_cot_modalidad_pdysi?: string;
  frm_cot_modalidad_pi?: string;

  // Plan de pago
  frm_plan_plan_pago?: string;
  frm_plan_num_cuotas?: string;
  frm_plan_medio_pago?: string;
  frm_plan_frecuencia_cobro?: string;

  // D&O — Perfil de cliente (17 sectores — 'SI' | 'NO')
  frm_dyo_perf_01?: string; frm_dyo_perf_02?: string; frm_dyo_perf_03?: string;
  frm_dyo_perf_04?: string; frm_dyo_perf_05?: string; frm_dyo_perf_06?: string;
  frm_dyo_perf_07?: string; frm_dyo_perf_08?: string; frm_dyo_perf_09?: string;
  frm_dyo_perf_10?: string; frm_dyo_perf_11?: string; frm_dyo_perf_12?: string;
  frm_dyo_perf_13?: string; frm_dyo_perf_14?: string; frm_dyo_perf_15?: string;
  frm_dyo_perf_16?: string; frm_dyo_perf_17?: string;

  // D&O — Requisitos (8 preguntas — 'SI' | 'NO')
  frm_dyo_req_01?: string; frm_dyo_req_02?: string; frm_dyo_req_03?: string;
  frm_dyo_req_04?: string; frm_dyo_req_05?: string; frm_dyo_req_06?: string;
  frm_dyo_req_07?: string; frm_dyo_req_08?: string;

  // D&O — Documentos de soporte (nombre de archivo)
  frm_dyo_doc_01_nombre?: string;
  frm_dyo_doc_02_nombre?: string;
  frm_dyo_doc_03_nombre?: string;

  // D&O — Propuesta económica (límite asegurado por opción)
  frm_dyo_prop_01_limite?: string;
  frm_dyo_prop_02_limite?: string;
  frm_dyo_prop_03_limite?: string;

  // Responsabilidad Civil Profesional — Requisitos (13 preguntas — 'SI' | 'NO')
  frm_pi_req_01?: string; frm_pi_req_02?: string; frm_pi_req_03?: string;
  frm_pi_req_04?: string; frm_pi_req_05?: string; frm_pi_req_06?: string;
  frm_pi_req_07?: string; frm_pi_req_08?: string; frm_pi_req_09?: string;
  frm_pi_req_10?: string; frm_pi_req_11?: string; frm_pi_req_12?: string;
  frm_pi_req_13?: string;

  // Responsabilidad Civil Profesional — Documentos de soporte (nombre de archivo)
  frm_pi_doc_01_nombre?: string;
  frm_pi_doc_02_nombre?: string;
  frm_pi_doc_03_nombre?: string;

  // Responsabilidad Civil Profesional — Propuesta económica (límite asegurado por opción)
  frm_pi_prop_01_limite?: string;
  frm_pi_prop_02_limite?: string;
  frm_pi_prop_03_limite?: string;

  // Crimen Comercial — Perfil de cliente (8 sectores — 'SI' | 'NO')
  frm_cc_perf_01?: string; frm_cc_perf_02?: string; frm_cc_perf_03?: string;
  frm_cc_perf_04?: string; frm_cc_perf_05?: string; frm_cc_perf_06?: string;
  frm_cc_perf_07?: string; frm_cc_perf_08?: string;

  // Crimen Comercial — Requisitos (8 preguntas — 'SI' | 'NO')
  frm_cc_req_01?: string; frm_cc_req_02?: string; frm_cc_req_03?: string;
  frm_cc_req_04?: string; frm_cc_req_05?: string; frm_cc_req_06?: string;
  frm_cc_req_07?: string; frm_cc_req_08?: string;

  // Crimen Comercial — Documentos de soporte (nombre de archivo)
  frm_cc_doc_01_nombre?: string;
  frm_cc_doc_02_nombre?: string;
  frm_cc_doc_03_nombre?: string;

  // Crimen Comercial — Propuesta económica (límite asegurado por opción)
  frm_cc_prop_01_limite?: string;
  frm_cc_prop_02_limite?: string;
  frm_cc_prop_03_limite?: string;

  // PDySI — Perfil de cliente (28 sectores — 'SI' | 'NO')
  frm_pdysi_perf_01?: string; frm_pdysi_perf_02?: string; frm_pdysi_perf_03?: string;
  frm_pdysi_perf_04?: string; frm_pdysi_perf_05?: string; frm_pdysi_perf_06?: string;
  frm_pdysi_perf_07?: string; frm_pdysi_perf_08?: string; frm_pdysi_perf_09?: string;
  frm_pdysi_perf_10?: string; frm_pdysi_perf_11?: string; frm_pdysi_perf_12?: string;
  frm_pdysi_perf_13?: string; frm_pdysi_perf_14?: string; frm_pdysi_perf_15?: string;
  frm_pdysi_perf_16?: string; frm_pdysi_perf_17?: string; frm_pdysi_perf_18?: string;
  frm_pdysi_perf_19?: string; frm_pdysi_perf_20?: string; frm_pdysi_perf_21?: string;
  frm_pdysi_perf_22?: string; frm_pdysi_perf_23?: string; frm_pdysi_perf_24?: string;
  frm_pdysi_perf_25?: string; frm_pdysi_perf_26?: string; frm_pdysi_perf_27?: string;
  frm_pdysi_perf_28?: string;

  // PDySI — Requisitos (7 preguntas — 'SI' | 'NO')
  frm_pdysi_req_01?: string; frm_pdysi_req_02?: string; frm_pdysi_req_03?: string;
  frm_pdysi_req_04?: string; frm_pdysi_req_05?: string; frm_pdysi_req_06?: string;
  frm_pdysi_req_07?: string;

  // PDySI — Controles en la Gestión del Riesgo - Parte 1 (7 preguntas — 'SI' | 'NO')
  frm_pdysi_ctrl1_01?: string; frm_pdysi_ctrl1_02?: string; frm_pdysi_ctrl1_03?: string;
  frm_pdysi_ctrl1_04?: string; frm_pdysi_ctrl1_05?: string; frm_pdysi_ctrl1_06?: string;
  frm_pdysi_ctrl1_07?: string;

  // PDySI — Controles en la Gestión del Riesgo - Parte 2 (2 preguntas — 'SI' | 'NO')
  frm_pdysi_ctrl2_01?: string; frm_pdysi_ctrl2_02?: string;

  // PDySI — Controles Adicionales (3 preguntas — 'SI' | 'NO', determina coberturas SLIP)
  frm_pdysi_ctrlad_01?: string; frm_pdysi_ctrlad_02?: string; frm_pdysi_ctrlad_03?: string;

  // PDySI — Documentos de soporte (nombre de archivo)
  frm_pdysi_doc_01_nombre?: string;
  frm_pdysi_doc_02_nombre?: string;
  frm_pdysi_doc_03_nombre?: string;

  // PDySI — Propuesta económica (límite asegurado por opción)
  frm_pdysi_prop_01_limite?: string;
  frm_pdysi_prop_02_limite?: string;
  frm_pdysi_prop_03_limite?: string;

  // Creación de tomador - Persona Jurídica (si TIA no retorna datos)
  frm_cre_nombre_compania?: string;
  frm_cre_tipo_doc?: string;
  frm_cre_nro_doc?: string;
  frm_cre_fecha_expedicion?: string;
  frm_cre_tipo_empresa?: string;
  frm_cre_fecha_constitucion?: string;
  frm_cre_actividad_comercial?: string;
  frm_cre_num_duns?: string;
  frm_cre_estado_tercero?: string;
  frm_cre_nombre_rep_legal?: string;
  frm_cre_tipo_doc_rep_legal?: string;
  frm_cre_nro_doc_rep_legal?: string;
  frm_cre_direccion?: string;
  frm_cre_departamento?: string;
  frm_cre_ciudad?: string;
  frm_cre_correo_facturacion?: string;
}
