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
  qd_tipoSolicitud: {
    id: 43,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_rol: {
    id: 39,
    labelField: 'data.nombre_rol_radicador',
    valueField: 'data.codigo_rol_radicador',
  } satisfies CollectionDef,

  qd_tipoIdentificacion: {
    id: 11,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_pais: {
    id: 13,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_departamento: {
    id: 14,
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  qd_ciudad: {
    id: 15,
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'qd_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{qd_departamento}}"',
  } satisfies CollectionDef,

  qd_condicionEspecial: {
    id: 24,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_seguro: {
    id: 16,
    labelField: 'data.nombre_producto_sfc',
    valueField: 'data.codigo_producto_sfc',
  } satisfies CollectionDef,

  qd_motivo: {
    id: 17,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_admision: {
    id: 21,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_estadoQueja: {
    id: 42,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_favorabilidad: {
    id: 26,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_aceptacion: {
    id: 27,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_marcacion: {
    id: 31,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_quejaExpres: {
    id: 32,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_tipoFraude: {
    id: 33,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_canal: {
    id: 10,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_tipoPersona: {
    id: 12,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_instancia: {
    id: 19,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_puntoRecepcion: {
    id: 20,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_ente: {
    id: 22,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_sexo: {
    id: 23,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_prodDigital: {
    id: 25,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_rectificacion: {
    id: 28,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_desistimiento: {
    id: 29,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_tutela: {
    id: 30,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_modFraude: {
    id: 34,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_area: {
    id: 35,
    labelField: 'data.nombre_area',
    valueField: 'data.codigo_area',
  } satisfies CollectionDef,

  qd_usuariosRole: {
    id: 36,
    labelField: 'data.nombre_usuario',
    valueField: 'data.usuario',
    dependsOn: 'qd_area',
    pmqlTemplate: 'data.codigo_area = "{{qd_area}}"',
  } satisfies CollectionDef,

  qd_motivoReasignacion: {
    id: 37,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_motivoProrroga: {
    id: 38,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  qd_detalleProducto: {
    id: 40,
    labelField: 'data.nombre_detalle_producto',
    valueField: 'data.codigo_detalle_producto',
    dependsOn: 'qd_seguro',
    pmqlTemplate: 'data.codigo_producto_sfc = "{{qd_seguro}}"',
  } satisfies CollectionDef,

  qd_lgbtiq: {
    id: 41,
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,
} as const;
