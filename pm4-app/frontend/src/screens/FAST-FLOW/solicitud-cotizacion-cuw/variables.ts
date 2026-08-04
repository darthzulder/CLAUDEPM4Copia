import type { CollectionDef } from '../../../core/useCollection';
import { resolveCollectionId, resolveScriptId } from '../../../core/pm4Resolve';

// ---------------------------------------------------------------------------
// Colecciones PM4
// ---------------------------------------------------------------------------
export const COLLECTION_DEFS = {
  intermediarios: {
    id: resolveCollectionId('intermediarios', 4),
    labelField: 'data.frm_nombre_entidad',
    valueField: 'id',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — mismo problema que en core/collections.ts:
  // id 5 es "Actividades CIIU DO", no tiene frm_mail_intermediario/frm_id_intermediario.
  // Ninguna de las 47 colecciones de la instancia los tiene. FAST-FLOW legado, diferido.
  correosIntermediario: {
    id: resolveCollectionId('correosIntermediario', 5),
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — mismo problema: id 5 no tiene
  // frm_nombre_comercial. FAST-FLOW legado, diferido.
  comerciales: {
    id: resolveCollectionId('comerciales', 5),
    labelField: 'data.frm_nombre_comercial',
    valueField: 'id',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 25 es en realidad cat-prod-digital
  // (usado por QD/digitalProduct), no tiene frm_suscriptores. FAST-FLOW legado, diferido.
  suscriptores: {
    id: resolveCollectionId('suscriptores', 25),
    labelField: 'data.frm_suscriptores',
    valueField: 'id',
    pmqlTemplate: 'data.frm_suscriptor_activo_flag = "SI"',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 6 es "Actividades CIIU Crime" (carga
  // sin error, pero semánticamente no es un NAIC genérico CO) — ambiguo, diferido.
  actividadNaic: {
    id: resolveCollectionId('actividadNaic', 6),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    pmqlTemplate: 'data.frm_pais = "CO"',
  } satisfies CollectionDef,

  // FIX verificado contra PM4 real (2026-08-04): id 19 real es cat-instancia (QD), no
  // geografía. Departamentos = id 14 (cat-dpto), Municipios = id 15 (cat-mpio) — mismo
  // fix aplicado en core/collections.ts (departamentosFF/municipiosTomador/municipiosAsegurado).
  departamentos: {
    id: resolveCollectionId('departamentosFF', 14),
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  // Municipios tomador — filtrados por departamento seleccionado
  municipiosTomador: {
    id: resolveCollectionId('municipiosTomador', 15),
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'frm_tom_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{frm_tom_departamento}}"',
  } satisfies CollectionDef,

  // Municipios asegurado — filtrados por departamento seleccionado
  municipiosAsegurado: {
    id: resolveCollectionId('municipiosAsegurado', 15),
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'frm_aseg_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{frm_aseg_departamento}}"',
  } satisfies CollectionDef,
} as const;

// ---------------------------------------------------------------------------
// Consulta de cliente en TIA — script PM4 configurable
// ---------------------------------------------------------------------------
// ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 50 en la instancia actual es
// "Generar URL de WebEntry", NO un script de "obtener cliente". Mismatch previo a este
// cambio (FAST-FLOW, código legado) — se deja igual y se reporta para revisión futura
// junto con el resto de colecciones huérfanas de FAST-FLOW (ver core/collections.ts).
export const SCRIPT_OBTENER_CLIENTE = resolveScriptId('consultarClienteTiaCuw', 50);

// ---------------------------------------------------------------------------
// Opciones estáticas
// ---------------------------------------------------------------------------
export const OPTIONS = {
  segmento: [
    { value: 'MIDDLE_MARKET', label: 'Middle Market' },
  ],
  lineaNegocio: [
    { value: 'Liability', label: 'Responsabilidad Civil General' },
  ],
  producto: [
    { value: 'OPERACIONES_PLO', label: 'Operaciones PLO' },
    { value: 'ADMIN_PREDIOS', label: 'Administración de Predios' },
    { value: 'RC_CONSTRUCCION', label: 'RC Construcción' },
    { value: 'RC_CONSTRUCCION_ABIERTA_CUBIERTA', label: 'RC Construcción (Abierta/Cubierta)' },
    { value: 'RC_HOTELERA', label: 'RC Hotelera' },
    { value: 'RECOGIDA_PRODUCTO', label: 'Recogida de Producto' },
    { value: 'RC_TRANSPORTE_HIDROCARBUROS', label: 'RC Transporte de Hidrocarburos' },
  ],
  alcance: [
    { value: 'DOMESTICO', label: 'Doméstico' },
  ],
  nuevaRenovacion: [
    { value: 'NUEVA', label: 'Nueva' },
    { value: 'RENOVACION', label: 'Renovación' },
  ],
  siNo: [
    { value: 'SI', label: 'Si' },
    { value: 'NO', label: 'No' },
  ],
  tipoCoaseguro: [
    { value: 'CEDIDO', label: 'Cedido' },
    { value: 'ACEPTADO', label: 'Aceptado' },
  ],
  tipoReaseguro: [
    { value: 'CEDIDO', label: 'Cedido' },
    { value: 'ACEPTADO', label: 'Aceptado' },
  ],
  liderSeguidor: [
    { value: 'LIDER', label: 'Líder' },
    { value: 'SEGUIDOR', label: 'Seguidor' },
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
  periodicidad: [
    { value: 'ANUAL', label: 'Anual' },
    { value: 'OTRA', label: 'Otra' },
  ],
  numMeses: [
    { value: '12', label: '12' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
    { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' },
    { value: '10', label: '10' }, { value: '11', label: '11' }, { value: '18', label: '18' },
  ],
  moneda: [
    { value: 'COP', label: 'COP: Peso colombiano' },
    { value: 'USD', label: 'USD: Dólar estadounidense' },
    { value: 'EUR', label: 'EUR: Euro' },
  ],
  modalidadCobertura: [
    { value: 'MADE', label: 'Por reclamación (claims made)' },
    { value: 'OCURRENCIA', label: 'Ocurrencia' },
  ],
  baseExposicion: [
    { value: 'TURNOVER', label: 'Turnover' },
  ],
  tipoDocumento: [
    { value: 'NIT', label: 'NIT' },
    { value: 'CED', label: 'CC' },
    { value: 'CE', label: 'CE' },
  ],
  tipoEmpresa: [
    { value: 'PUBLICA', label: 'Pública' },
    { value: 'PRIVADA', label: 'Privada' },
    { value: 'MIXTA', label: 'Mixta' },
  ],
  estadoTercero: [
    { value: 'ACTIVO', label: 'Activo' },
  ],
  tipoDocRepLegal: [
    { value: 'CED', label: 'CC' },
    { value: 'CE', label: 'CE' },
  ],
  planPago: [
    { value: '102', label: '102 Transferencia bancaria a 30 días' },
    { value: '105', label: '105 Transferencia bancaria a 60 días' },
    { value: '108', label: '108 Transferencia bancaria a 90 días' },
    { value: '123', label: '123 Transferencia bancaria Plan 3 meses' },
  ],
  numCuotas: [
    { value: '1', label: '1' },
    { value: '3', label: '3' },
  ],
  metodoPago: [
    { value: 'PAGO_EN_OFICINA', label: 'Pago en oficina del Banco de Bogotá' },
    { value: 'PAYU', label: 'PayU' },
    { value: 'FINANPRIMAS', label: 'Finanprimas' },
    { value: 'CREDISEGURO', label: 'Crediseguro' },
    { value: 'TRANSFERENCIA_PESOS', label: 'Transferencia en pesos' },
    { value: 'TRANSFERENCIA_DOLARES', label: 'Transferencia en dólares' },
  ],
  frecuenciaCobro: [
    { value: 'ANUAL', label: 'Anual' },
  ],
  clienteMora: [
    { value: 'SI', label: 'Si' },
    { value: 'NO', label: 'No' },
  ],
  decisionMora: [
    { value: 'DECLINAR_OPORTUNIDAD', label: 'Declinar la oportunidad' },
    { value: 'ESPERA_OPORTUNIDAD', label: 'Dejar en espera la oportunidad' },
  ],
  territorialidad: [
    { value: 'NACIONAL', label: 'Nacional' },
    { value: 'MULTINACIONAL', label: 'Multinacional' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Watchers documentados
// ---------------------------------------------------------------------------
export const WATCHERS = {
  intermediarioPrincipal: {
    name: 'Listado_intermediarios',
    watching: 'frm_gen_intermediario_principal',
    runOnLoad: false,
    dataSourceId: 4,
    mapping: {
      frm_gen_intermediario_principal_nombre: 'data.frm_nombre_entidad',
      frm_gen_intermediario_principal_num_documento: 'data.frm_num_documento',
      frm_gen_clave_intermediario: 'data.frm_clave',
    },
  },
  comercialId: {
    name: 'Listado de comerciales por Intermediario',
    watching: 'frm_gen_comercial_id',
    runOnLoad: true,
    dataSourceId: 5,
    mapping: {
      frm_gen_comercial_nombre: 'data.frm_nombre_comercial',
      frm_gen_correo_comercial: 'data.frm_mail_comercial',
    },
  },
  suscriptorId: {
    name: 'CIMMR - COL - Listado Suscriptores',
    watching: 'frm_gen_suscriptor_asignado_id',
    runOnLoad: false,
    dataSourceId: 27,
    mapping: {
      frm_gen_suscriptor_asignado_nombre: 'data.frm_suscriptores',
      frm_gen_suscriptor_asignado_correo: 'data.frm_correo_suscriptor',
    },
  },
  actividadNaic: {
    name: 'CIMMR - COL - CUW - Liability - Actividades CIIU',
    watching: 'frm_cot_actividad_naic',
    runOnLoad: true,
    dataSourceId: 7,
    mapping: {
      frm_cot_codigo_naic: 'data.0.data.frm_codigo',
      frm_cot_nombre_ciiu: 'data.0.data.frm_actividad',
    },
  },
  consultarTomador: {
    name: 'Obtener cliente Tia',
    watching: 'btn_consultar_informacion_tomador',
    runOnLoad: false,
    scriptId: 'script-50',
  },
  consultarAsegurado: {
    name: 'Obtener cliente Tia',
    watching: 'btn_consultar_informacion_asegurado',
    runOnLoad: false,
    scriptId: 'script-50',
  },
  departamentoTomador: {
    name: 'Departamentos_Municipios_COL',
    watching: 'frm_tom_departamento',
    runOnLoad: false,
    dataSourceId: 19,
    mapping: {
      frm_tom_departamento_nombre: 'data.nombre_departamento',
      frm_tom_departamento_num: 'data.codigo_departamento',
    },
  },
  departamentoAsegurado: {
    name: 'Departamentos_Municipios_COL',
    watching: 'frm_aseg_departamento',
    runOnLoad: false,
    dataSourceId: 19,
    mapping: {
      frm_aseg_departamento_nombre: 'data.nombre_departamento',
      frm_aseg_departamento_num: 'data.codigo_departamento',
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Tipos del formulario
// ---------------------------------------------------------------------------
export interface SolicitudCotizacionFormData {
  // Header
  frm_caso_cuw_col: string;
  frm_num_cotizacion_cuw_col: string;
  frm_titulo: string;
  // Información general
  frm_gen_fecha_solicitud: string;
  frm_gen_fecha_esperada_cotizacion: string;
  frm_gen_nueva_o_renovacion: string;
  frm_gen_numero_poliza: string;
  frm_gen_pais: string;
  frm_gen_sucursal: string;
  frm_gen_segmento: string;
  frm_gen_linea_negocio: string;
  frm_gen_producto: string;
  frm_gen_alcance: string;
  frm_gen_lider_seguidor: string;
  frm_gen_intermediario_principal: string;
  frm_gen_intermediario_principal_nombre: string;
  frm_gen_intermediario_principal_num_documento: string;
  frm_gen_intermediario_principal_correo_no_uso: string;
  frm_gen_correo_adicional_intermediario_principal: string;
  frm_gen_comercial_id: string;
  frm_gen_comercial_nombre: string;
  frm_gen_correo_comercial: string;
  frm_gen_correo_comercial_test: string;
  frm_gen_suscriptor_asignado_id: string;
  frm_gen_suscriptor_asignado_nombre: string;
  frm_gen_suscriptor_asignado_correo: string;
  frm_gen_suscriptor_asignado_correo_test: string;
  frm_gen_nom_informador: string;
  frm_gen_coaseguro_requerido: string;
  frm_gen_tipo_coaseguro: string;
  frm_gen_reaseguro_requerido: string;
  frm_gen_tipo_reaseguro: string;
  frm_gen_participacion_solicitado_pct: string;
  frm_gen_participacion_zurich_pct: string;
  frm_cot_comision_solicitada_pct: string;
  frm_gen_co_corretaje: string;
  // Información tomador
  frm_tom_tipo_documento: string;
  frm_tom_num_documento: string;
  frm_tom_nombres_completos: string;
  frm_tom_tipo_empresa: string;
  frm_tom_fecha_constitucion: string;
  frm_tom_direccion: string;
  frm_tom_departamento: string;
  frm_tom_departamento_nombre: string;
  frm_tom_departamento_num: string;
  frm_tom_municipio: string;
  frm_tom_municipio_nombre: string;
  frm_tom_telefono: string;
  frm_tom_correo_facturacion: string;
  frm_tom_actividad_asegurada: string;
  // Subinformación asegurado
  frm_tom_asegurado_es_tomador_flag: string;
  frm_aseg_territorialidad: string;
  frm_aseg_numero_ubicaciones: string;
  frm_aseg_realiza_exportaciones_flag: string;
  // Información asegurado (cuando tomador != asegurado)
  frm_aseg_tipo_documento: string;
  frm_aseg_num_documento: string;
  frm_aseg_nombres_completos: string;
  frm_aseg_tipo_empresa: string;
  frm_aseg_fecha_constitucion: string;
  frm_aseg_direccion: string;
  frm_aseg_departamento: string;
  frm_aseg_departamento_nombre: string;
  frm_aseg_departamento_num: string;
  frm_aseg_municipio: string;
  frm_aseg_municipio_nombre: string;
  frm_aseg_telefono: string;
  frm_aseg_correo_facturacion: string;
  frm_aseg_actividad_comercial: string;
  // Datos de cotización
  frm_cot_fecha_inicio_vigencia: string;
  frm_cot_fecha_fin_vigencia: string;
  frm_cot_dias_inicio_fin_vigencia: number;
  frm_cot_actividad_naic: string;
  frm_cot_codigo_naic: string;
  frm_cot_nombre_ciiu: string;
  frm_cot_ingresos_operaciones_anuales: number | string;
  frm_cot_ingresos_proyectados_anuales: number | string;
  frm_cot_moneda: string;
  frm_cot_modalidad_cobertura: string;
  frm_cot_periodicidad: string;
  frm_cot_siniestralidad_flag: string;
  frm_cot_siniestralidad_fecha_desde: string;
  frm_cot_siniestralidad_fecha_hasta: string;
  // Plan de pago
  frm_plan_pago: string;
  frm_plan_pago_num_cuotas: string;
  frm_plan_pago_metodo_pago: string;
  frm_plan_pago_frecuencia_cobro: string;
  // Revisión mora
  frm_revision_mora_cliente_mora: string;
  frm_revision_mora_decision: string;
  frm_revision_mora_comentario: string;
}
