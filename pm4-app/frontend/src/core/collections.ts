import type { CollectionDef } from './useCollection';

export const GLOBAL_COLLECTIONS = {
  // ==========================================
  // FAST FLOW COLLECTIONS
  // ==========================================
  intermediarios: {
    id: 4,
    labelField: 'data.frm_nombre_entidad',
    valueField: 'id',
  } satisfies CollectionDef,

  naic: {
    id: 2,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    dependsOn: 'frm_gen_pais',
    pmqlTemplate: 'data.frm_pais = "{{frm_gen_pais}}"',
  } satisfies CollectionDef,

  correosIntermediari: {
    id: 5,
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,

  actividadesCIIU_dyo: {
    id: 5,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  actividadesCIIU_cc: {
    id: 6,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  actividadesCIIU_pdysi: {
    id: 7,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  actividadesCIIU_pi: {
    id: 8,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  correosIntermediario: {
    id: 5,
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,

  comerciales: {
    id: 5,
    labelField: 'data.frm_nombre_comercial',
    valueField: 'id',
  } satisfies CollectionDef,

  suscriptores: {
    id: 25,
    labelField: 'data.frm_suscriptores',
    valueField: 'id',
    pmqlTemplate: 'data.frm_suscriptor_activo_flag = "SI"',
  } satisfies CollectionDef,

  actividadNaic: {
    id: 6,
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    pmqlTemplate: 'data.frm_pais = "CO"',
  } satisfies CollectionDef,

  departamentosFF: {
    id: 19,
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  municipiosTomador: {
    id: 19,
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'frm_tom_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{frm_tom_departamento}}"',
  } satisfies CollectionDef,

  municipiosAsegurado: {
    id: 19,
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'frm_aseg_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{frm_aseg_departamento}}"',
  } satisfies CollectionDef,

  // ==========================================
  // QUEJAS DIRECTAS COLLECTIONS
  // ==========================================
  // Nombres alineados a QD_COLLECTIONS (campos/fields.ts) — sin prefijo qd_: estas
  // claves son propiedades internas de configuración (como OPTIONS/COLLECTION_DEFS),
  // no viajan a PM4. Ver campos/MAPEO_qd_old_new.md para el detalle.
  requestType: {
    id: 18,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  filerRole: {
    id: 39,
    labelField: 'data.nombre_rol_radicador',
    valueField: 'data.codigo_rol_radicador',
  } satisfies CollectionDef,

  idType: {
    id: 11,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  countryCode: {
    id: 13,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  department: {
    id: 14,
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  city: {
    id: 15,
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    // dependsOn/pmqlTemplate referencian el campo real qd_strDepartment (ver
    // fields/MAPEO_qd_old_new.md #1) — se llama con el objWatch real, no un shim.
    dependsOn: 'qd_strDepartment',
    pmqlTemplate: 'data.codigo_departamento = "{{qd_strDepartment}}"',
  } satisfies CollectionDef,

  specialCondition: {
    id: 24,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  sfcProduct: {
    id: 16,
    labelField: 'data.nombre_producto_sfc',
    valueField: 'data.codigo_producto_sfc',
  } satisfies CollectionDef,

  sfcReason: {
    id: 17,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  admission: {
    id: 21,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  complaintStatus: {
    id: 42,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  favorability: {
    id: 26,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  acceptance: {
    id: 27,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  marking: {
    id: 31,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  expressComplaint: {
    id: 32,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  fraudType: {
    id: 33,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  channel: {
    id: 10,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  personType: {
    id: 12,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  receptionInstance: {
    id: 19,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  receptionPoint: {
    id: 20,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  controlEntity: {
    id: 22,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  sex: {
    id: 23,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  digitalProduct: {
    id: 25,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  rectification: {
    id: 28,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  withdrawal: {
    id: 29,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  tutela: {
    id: 30,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  fraudModality: {
    id: 34,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  area: {
    id: 35,
    labelField: 'data.nombre_area',
    valueField: 'data.codigo_area',
  } satisfies CollectionDef,

  areaUsers: {
    id: 36,
    labelField: 'data.nombre_usuario',
    valueField: 'data.usuario',
    // Shim interno: 'qd_strAreaCode' aquí es una convención de dependsOn/pmqlTemplate
    // acordada con los call sites (SeccionAsignacion.tsx pasa { qd_strAreaCode: ... }),
    // no el nombre de esta propiedad ni un campo PM4 real. Ver MAPEO_qd_old_new.md #2.
    dependsOn: 'qd_strAreaCode',
    pmqlTemplate: 'data.codigo_area = "{{qd_strAreaCode}}"',
  } satisfies CollectionDef,

  reassignReason: {
    id: 37,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  extensionReason: {
    id: 38,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  productDetail: {
    id: 40,
    labelField: 'data.nombre_detalle_producto',
    valueField: 'data.codigo_detalle_producto',
    // dependsOn/pmqlTemplate apuntan a 'qd_strLegacyInsurance', que ya NO es el nombre
    // de ninguna propiedad de este objeto ni un campo PM4 real — es un token huérfano
    // de un bug preexistente (esta colección nunca se recarga dinámicamente hoy: el
    // call site en SeccionDetalleQueja.tsx pasa una clave shim distinta,
    // 'qd_strProductFilter', que nunca coincide con este dependsOn). Se preserva tal
    // cual por "cero cambios de lógica" — ambos tokens se tradujeron a inglés de forma
    // independiente, sin hacerlos coincidir. Ver MAPEO_qd_old_new.md #3.
    dependsOn: 'qd_strLegacyInsurance',
    pmqlTemplate: 'data.codigo_producto_sfc = "{{qd_strLegacyInsurance}}"',
  } satisfies CollectionDef,

  lgbtiq: {
    id: 41,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  // Catálogo de alianzas comerciales (CATALOGOS v2). Creado pero aún sin uso en pantalla.
  alliance: {
    id: 44,
    labelField: 'data.alianza',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  // ── cat_matriz_motivos (id 45) — matriz de cascada de SCR-000 ────────────────
  // Cadena de dependencia: tipoSolicitud → productoZurich → interaccion (momento) →
  // servicioPrestado (servicio) → motivo (codigoMotivoSFC / motivoSFC).
  //
  // Se carga COMPLETA (≈385 filas) sin PMQL y la cascada se filtra en CLIENTE
  // (SeccionDetalleQueja). Motivo del filtrado en cliente y no por PMQL:
  //   1. `tipoSolicitud`/`productoZurich` guardan el TEXTO ("Queja", "Hogar"), no el
  //      código; el form guarda códigos → habría que comparar por label.
  //   2. Los datos traen espacios sobrantes ("Hogar ", "No aplica ") que romperían la
  //      igualdad exacta de PMQL; en cliente normalizamos con trim + case-insensitive.
  // labelField/valueField apuntan al motivo (única columna con código propio); las
  // demás columnas se leen directo del registro crudo (`records`).
  matrixMotivos: {
    id: 45,
    labelField: 'data.motivoSFC',
    valueField: 'data.codigoMotivoSFC',
  } satisfies CollectionDef,
} as const;
