import type { CollectionDef } from './useCollection';
import { resolveCollectionId } from './pm4Resolve';

export const GLOBAL_COLLECTIONS = {
  // ==========================================
  // FAST FLOW COLLECTIONS
  // ==========================================
  intermediarios: {
    id: resolveCollectionId('intermediarios', 4),
    labelField: 'data.frm_nombre_entidad',
    valueField: 'id',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 2 es "Configuraciones COL"
  // (frm_codigo/frm_valor: tabla chica de config tipo NUMERO_COTIZACION/VALOR_SMMLV),
  // NO tiene los campos frm_actividad/frm_codigo que este CollectionDef espera. El id
  // correcto no está confirmado — candidato plausible: id 3 "Actividades CIU" (tiene
  // frm_actividad/frm_codigo/frm_pais/frm_productos, shape multi-país/multi-producto),
  // pero requiere confirmación de negocio antes de cambiarlo. NO TOCAR sin confirmar.
  naic: {
    id: resolveCollectionId('naic', 2),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    dependsOn: 'frm_gen_pais',
    pmqlTemplate: 'data.frm_pais = "{{frm_gen_pais}}"',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 5 es "Actividades CIIU DO" (ver
  // actividadesCIIU_dyo abajo), NO tiene los campos frm_mail_intermediario/
  // frm_id_intermediario que este CollectionDef espera. Se buscó en las 47 colecciones
  // de la instancia y NINGUNA tiene esos campos — no hay un id correcto conocido hoy;
  // puede que la colección de correos de intermediarios nunca se haya migrado/creado
  // en esta instancia. Reportado al usuario — requiere decisión de negocio, no un
  // simple cambio de id.
  correosIntermediari: {
    id: resolveCollectionId('correosIntermediari', 5),
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,

  actividadesCIIU_dyo: {
    id: resolveCollectionId('actividadesCIIU_dyo', 5),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  // Verificado (2026-08-04): id 6 = "Actividades CIIU Crime" en PM4 — shape correcta
  // (frm_actividad/frm_codigo/frm_pais), asumiendo que "cc" = línea Crime.
  actividadesCIIU_cc: {
    id: resolveCollectionId('actividadesCIIU_cc', 6),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  // Verificado (2026-08-04): id 7 = "Actividades CIIU Cyber" en PM4 — shape correcta,
  // asumiendo que "pdysi" = línea Cyber (nombre de negocio, no evidente desde el código).
  actividadesCIIU_pdysi: {
    id: resolveCollectionId('actividadesCIIU_pdysi', 7),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  actividadesCIIU_pi: {
    id: resolveCollectionId('actividadesCIIU_pi', 8),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_actividad',
  } satisfies CollectionDef,

  // ⚠️ Duplicado de correosIntermediari (mismo id 5, mismo problema — ver comentario arriba).
  correosIntermediario: {
    id: resolveCollectionId('correosIntermediario', 5),
    labelField: 'data.frm_mail_intermediario',
    valueField: 'data.frm_mail_intermediario',
    dependsOn: 'frm_gen_intermediario_principal',
    pmqlTemplate: 'data.frm_id_intermediario = "{{frm_gen_intermediario_principal}}"',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 5 (Actividades CIIU DO) no tiene
  // frm_nombre_comercial. Ninguna de las 47 colecciones de la instancia lo tiene —
  // mismo caso que correosIntermediari/correosIntermediario, requiere decisión de negocio.
  comerciales: {
    id: resolveCollectionId('comerciales', 5),
    labelField: 'data.frm_nombre_comercial',
    valueField: 'id',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 25 es "cat-prod-digital"
  // (codigo/descripcion, el mismo que usa correctamente QD/digitalProduct), NO tiene
  // frm_suscriptores/frm_suscriptor_activo_flag. Ninguna de las 47 colecciones tiene
  // esos campos — requiere decisión de negocio antes de asignar un id.
  suscriptores: {
    id: resolveCollectionId('suscriptores', 25),
    labelField: 'data.frm_suscriptores',
    valueField: 'id',
    pmqlTemplate: 'data.frm_suscriptor_activo_flag = "SI"',
  } satisfies CollectionDef,

  // ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 6 es "Actividades CIIU Crime" (mismo
  // shape frm_actividad/frm_codigo que este CollectionDef espera, así que TÉCNICAMENTE
  // carga sin error), pero semánticamente es el catálogo de la línea "Crime", no un NAIC
  // genérico Colombia. Puede ser intencional (coincide con actividadesCIIU_cc) o un
  // copy-paste — requiere confirmar con negocio qué línea de producto debe usar este campo.
  actividadNaic: {
    id: resolveCollectionId('actividadNaic', 6),
    labelField: 'data.frm_actividad',
    valueField: 'data.frm_codigo',
    pmqlTemplate: 'data.frm_pais = "CO"',
  } satisfies CollectionDef,

  // FIX verificado contra PM4 real (2026-08-04): tenían id 19 (= cat-instancia, catálogo
  // de "instancia de recepción" que SÍ usa correctamente QD/receptionInstance) por
  // copy-paste. El catálogo geográfico real es id 14 (cat-dpto: codigo_departamento/
  // nombre_departamento) e id 15 (cat-mpio: codigo_municipio/nombre_municipio/
  // codigo_departamento) — confirmado por shape de campos y porque QD/department(14)
  // y QD/city(15) ya los usan correctamente.
  departamentosFF: {
    id: resolveCollectionId('departamentosFF', 14),
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  municipiosTomador: {
    id: resolveCollectionId('municipiosTomador', 15),
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    dependsOn: 'frm_tom_departamento',
    pmqlTemplate: 'data.codigo_departamento = "{{frm_tom_departamento}}"',
  } satisfies CollectionDef,

  municipiosAsegurado: {
    id: resolveCollectionId('municipiosAsegurado', 15),
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
    id: resolveCollectionId('requestType', 18),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  filerRole: {
    id: resolveCollectionId('filerRole', 39),
    labelField: 'data.nombre_rol_radicador',
    valueField: 'data.codigo_rol_radicador',
  } satisfies CollectionDef,

  idType: {
    id: resolveCollectionId('idType', 11),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  countryCode: {
    id: resolveCollectionId('countryCode', 13),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  department: {
    id: resolveCollectionId('department', 14),
    labelField: 'data.nombre_departamento',
    valueField: 'data.codigo_departamento',
  } satisfies CollectionDef,

  city: {
    id: resolveCollectionId('city', 15),
    labelField: 'data.nombre_municipio',
    valueField: 'data.codigo_municipio',
    // dependsOn/pmqlTemplate referencian el campo real qd_strDepartment (ver
    // fields/MAPEO_qd_old_new.md #1) — se llama con el objWatch real, no un shim.
    dependsOn: 'qd_strDepartment',
    pmqlTemplate: 'data.codigo_departamento = "{{qd_strDepartment}}"',
  } satisfies CollectionDef,

  specialCondition: {
    id: resolveCollectionId('specialCondition', 24),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  sfcProduct: {
    id: resolveCollectionId('sfcProduct', 16),
    labelField: 'data.nombre_producto_sfc',
    valueField: 'data.codigo_producto_sfc',
  } satisfies CollectionDef,

  sfcReason: {
    id: resolveCollectionId('sfcReason', 17),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  admission: {
    id: resolveCollectionId('admission', 21),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  complaintStatus: {
    id: resolveCollectionId('complaintStatus', 42),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  favorability: {
    id: resolveCollectionId('favorability', 26),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  acceptance: {
    id: resolveCollectionId('acceptance', 27),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  marking: {
    id: resolveCollectionId('marking', 31),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  expressComplaint: {
    id: resolveCollectionId('expressComplaint', 32),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  fraudType: {
    id: resolveCollectionId('fraudType', 33),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  channel: {
    id: resolveCollectionId('channel', 10),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  personType: {
    id: resolveCollectionId('personType', 12),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  receptionInstance: {
    id: resolveCollectionId('receptionInstance', 19),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  receptionPoint: {
    id: resolveCollectionId('receptionPoint', 20),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  controlEntity: {
    id: resolveCollectionId('controlEntity', 22),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  sex: {
    id: resolveCollectionId('sex', 23),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  digitalProduct: {
    id: resolveCollectionId('digitalProduct', 25),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  rectification: {
    id: resolveCollectionId('rectification', 28),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  withdrawal: {
    id: resolveCollectionId('withdrawal', 29),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  tutela: {
    id: resolveCollectionId('tutela', 30),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  fraudModality: {
    id: resolveCollectionId('fraudModality', 34),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  area: {
    id: resolveCollectionId('area', 35),
    labelField: 'data.nombre_area',
    valueField: 'data.codigo_area',
  } satisfies CollectionDef,

  areaUsers: {
    id: resolveCollectionId('areaUsers', 36),
    labelField: 'data.nombre_usuario',
    valueField: 'data.usuario',
    // Shim interno: 'qd_strAreaCode' aquí es una convención de dependsOn/pmqlTemplate
    // acordada con los call sites (SeccionAsignacion.tsx pasa { qd_strAreaCode: ... }),
    // no el nombre de esta propiedad ni un campo PM4 real. Ver MAPEO_qd_old_new.md #2.
    dependsOn: 'qd_strAreaCode',
    pmqlTemplate: 'data.codigo_area = "{{qd_strAreaCode}}"',
  } satisfies CollectionDef,

  reassignReason: {
    id: resolveCollectionId('reassignReason', 37),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  extensionReason: {
    id: resolveCollectionId('extensionReason', 38),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  productDetail: {
    id: resolveCollectionId('productDetail', 40),
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
    id: resolveCollectionId('lgbtiq', 41),
    labelField: 'data.descripcion',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  // Catálogo de alianzas comerciales (CATALOGOS v2). Creado pero aún sin uso en pantalla.
  alliance: {
    id: resolveCollectionId('alliance', 44),
    labelField: 'data.alianza',
    valueField: 'data.codigo',
  } satisfies CollectionDef,

  // Plantillas HTML de correos BPM (id 46). Cada registro guarda el nombre del correo en
  // `nombre_HTML` (ej. "09 Mails BPM_Respuesta queja procede") y su HTML en `HTML_completo`.
  // Usado por SCR-0051 para la Vista Previa de la respuesta final: se elige la fila 09
  // (queja procede / a favor del cliente) o la 10 (no procede / a favor de la compañía).
  // options → { value: HTML_completo, label: nombre_HTML }.
  emailTemplates: {
    id: resolveCollectionId('emailTemplates', 46),
    labelField: 'data.nombre_HTML',
    valueField: 'data.HTML_completo',
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
    id: resolveCollectionId('matrixMotivos', 45),
    labelField: 'data.motivoSFC',
    valueField: 'data.codigoMotivoSFC',
  } satisfies CollectionDef,

  // ==========================================
  // UTILIDADES GENERALES
  // ==========================================
  // cat-feriados-colombia (id 48) — mismos feriados que usa el script PM4
  // COL_UTIL_Dias_Habiles (id 95) para excluirlos del cálculo de días hábiles.
  // Ver core/businessDays.ts.
  holidaysColombia: {
    id: resolveCollectionId('holidaysColombia', 48),
    labelField: 'data.holyday_name',
    valueField: 'data.holyday_date', // 'YYYY-MM-DD'
  } satisfies CollectionDef,
} as const;
