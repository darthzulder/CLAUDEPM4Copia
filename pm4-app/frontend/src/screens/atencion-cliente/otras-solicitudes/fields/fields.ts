// Registro central de variables PM4 y configuración de las pantallas del proceso
// P02 — Otras Solicitudes. Mismo rol que `quejas-directas/fields/fields.ts` para
// Quejas Directas: ÚNICA fuente de verdad de los nombres físicos `os_*`, tipos de
// formulario, opciones estáticas y valores por defecto. No hay `variables.ts` por
// pantalla.
//
// Nomenclatura Zurich RPA: `os_` (marca de proyecto — Otras Solicitudes) + prefijo
// de tipo (str/int/bln/lst) + NombreEnInglés. Uso: `name={OS.strTechAnalysis}` en
// JSX, `objWatch[OS.strTechAnalysis]` en lógica. NUNCA escribir el string
// 'os_str...' a mano fuera de este archivo. Detalle de la convención en
// docs/guides/nomenclatura-variables.md.
//
// Trazabilidad: cada campo lleva el `FLD-xxx` y el "Nombre Técnico" de la hoja
// maestra `03_Campos` del Anexo02 (insumos/Otras Solicitudes/Anexo02_Index/).
//
// ⚠️ Estos nombres son CONTRATO con PM4 (variables de proceso, gateways, scripts).
// No desplegar este frontend hasta que el proceso PM4 emita/espere estos mismos
// nombres.

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRO — nombres físicos os_*
// ═══════════════════════════════════════════════════════════════════════════

export const OS = {
  // ── SCR-003 · S1 Encabezado Estado del Caso (SEC-009) ─────────────────────
  strBpmCaseId: 'os_strBpmCaseId',            // FLD-040 · Anexo02: idCaso
  strCaseType: 'os_strCaseType',              // FLD-041 · Anexo02: tipologia
  intSlaRemaining: 'os_intSlaRemaining',      // FLD-042 · Anexo02: slaRestante (días hábiles)
  strDueDate: 'os_strDueDate',                // FLD-043 · Anexo02: fechaLimite (fecha como str, ver nomenclatura)

  // ── SCR-003 · S2 Detalle del Caso Asignado (SEC-010) ──────────────────────
  strConsumerName: 'os_strConsumerName',      // FLD-044 · Anexo02: nombreConsumidor
  strIdentification: 'os_strIdentification',  // FLD-045 · Anexo02: identificacion
  strProductLine: 'os_strProductLine',        // FLD-046 · Anexo02: productoRamo
  strCaseDescription: 'os_strCaseDescription',// FLD-047 · Anexo02: descripcion
  // FLD-048 · Anexo02: adjuntos — los documentos que cargó el cliente al radicar.
  // Es una LISTA de adjuntos del caso, no un campo de texto: viven como archivos del
  // request y se listan filtrando por su `data_name` (ver OS_CLIENT_DOC_KEYS abajo).
  strAttach01: 'os_strAttach01',
  strAttach02: 'os_strAttach02',
  strAttach03: 'os_strAttach03',
  strAttach04: 'os_strAttach04',
  strAttach05: 'os_strAttach05',

  // ── SCR-003 · S3 Análisis y Respuesta Técnica (SEC-011) ───────────────────
  strTechAnalysis: 'os_strTechAnalysis',      // FLD-049 · Anexo02: analisisTecnico
  strSystemActions: 'os_strSystemActions',    // FLD-050 · Anexo02: accionesEjecutadas

  // ── SCR-003 · S4 Soportes Internos (SEC-012) ──────────────────────────────
  // FLD-052 · Anexo02: adjuntosSoporte — "Archivo (multi), máx 10 archivos".
  // Un data_name por slot, igual que los adjuntos de Quejas Directas.
  strSupportDoc01: 'os_strSupportDoc01',
  strSupportDoc02: 'os_strSupportDoc02',
  strSupportDoc03: 'os_strSupportDoc03',
  strSupportDoc04: 'os_strSupportDoc04',
  strSupportDoc05: 'os_strSupportDoc05',
  strSupportDoc06: 'os_strSupportDoc06',
  strSupportDoc07: 'os_strSupportDoc07',
  strSupportDoc08: 'os_strSupportDoc08',
  strSupportDoc09: 'os_strSupportDoc09',
  strSupportDoc10: 'os_strSupportDoc10',

  // ── Soporte de ACT-003-02 "Reasignar Caso" ────────────────────────────────
  // El Anexo02 describe la acción ("abre modal de reasignación a otro usuario de
  // Línea 2") pero NO le asigna campos en 03_Campos: el destino de la reasignación
  // no es un dato del expediente. Estos dos guardan a quién se reasignó, para que
  // quede en el caso; se documentan como "sin FLD" en la ficha de la pantalla.
  strAssigneeArea: 'os_strAssigneeArea',
  strAssigneeUser: 'os_strAssigneeUser',

  // Acción del flujo con la que se cerró la pantalla (la lee el gateway BPMN).
  strAction: 'os_strAction',
} as const;

/** Tipo del valor físico de un campo (para tipar parámetros contra el registro). */
export type OsFieldName = (typeof OS)[keyof typeof OS];

// ═══════════════════════════════════════════════════════════════════════════
// INTERFAZ MAESTRA — fuente de verdad de TIPOS
// ═══════════════════════════════════════════════════════════════════════════
// Cada pantalla deriva su tipo de formulario con `Pick<OsFields, ...>`. Los campos
// de acción/decisión BPMN (`os_strAction`) se tipan aquí como `string` (superset
// seguro) y cada pantalla los estrecha con `Omit<Pick<...>, …> & { … }`.

export interface OsFields {
  // SCR-003
  os_strBpmCaseId: string;
  os_strCaseType: string;
  // Llega de PM4 como número, pero un caso sin SLA calculado lo manda vacío: se lee
  // siempre con Number.parseInt sobre String(...) antes de semaforizar.
  os_intSlaRemaining: number | string;
  os_strDueDate: string;
  os_strConsumerName: string;
  os_strIdentification: string;
  os_strProductLine: string;
  os_strCaseDescription: string;
  os_strAttach01: string;
  os_strAttach02: string;
  os_strAttach03: string;
  os_strAttach04: string;
  os_strAttach05: string;
  os_strTechAnalysis: string;
  os_strSystemActions: string;
  os_strSupportDoc01: string;
  os_strSupportDoc02: string;
  os_strSupportDoc03: string;
  os_strSupportDoc04: string;
  os_strSupportDoc05: string;
  os_strSupportDoc06: string;
  os_strSupportDoc07: string;
  os_strSupportDoc08: string;
  os_strSupportDoc09: string;
  os_strSupportDoc10: string;
  os_strAssigneeArea: string;
  os_strAssigneeUser: string;
  os_strAction: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPCIONES ESTÁTICAS — catálogos del Anexo02 (masters/07_Catalogs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CAT-AREA · Área Responsable. Las etiquetas son además el nombre del grupo PM4 al
 * que se le piden los usuarios reales para reasignar (ver core/pm4Groups.ts).
 */
export const OPTIONS_AREA = [
  { value: 'SAC', label: 'SAC — Servicio al Cliente' },
  { value: 'siniestros', label: 'Siniestros' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'producto', label: 'Producto' },
  { value: 'juridica', label: 'Jurídica' },
  { value: 'proteccion_datos', label: 'Área de Protección de Datos' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SCR-003 — Bandeja de Tareas / Gestión Línea 2 (P02-T12)
// ═══════════════════════════════════════════════════════════════════════════

/** Acciones de flujo de SCR-003 (04_Acciones: ACT-003-01/02/03/04). */
export type AccionGestionLinea2 = 'CONFIRMAR_ATENCION' | 'REASIGNAR' | 'GUARDAR_BORRADOR';

export type GestionLinea2FormData = Omit<Pick<OsFields,
  | typeof OS.strBpmCaseId | typeof OS.strCaseType | typeof OS.intSlaRemaining | typeof OS.strDueDate
  | typeof OS.strConsumerName | typeof OS.strIdentification | typeof OS.strProductLine
  | typeof OS.strCaseDescription
  | typeof OS.strTechAnalysis | typeof OS.strSystemActions
  | typeof OS.strSupportDoc01 | typeof OS.strSupportDoc02 | typeof OS.strSupportDoc03
  | typeof OS.strSupportDoc04 | typeof OS.strSupportDoc05 | typeof OS.strSupportDoc06
  | typeof OS.strSupportDoc07 | typeof OS.strSupportDoc08 | typeof OS.strSupportDoc09
  | typeof OS.strSupportDoc10
  | typeof OS.strAssigneeArea | typeof OS.strAssigneeUser
  | typeof OS.strAction
>, typeof OS.strAction> & { [OS.strAction]: AccionGestionLinea2 };

/** FLD-048 — data_names de los documentos que adjuntó el cliente al radicar el caso. */
export const OS_CLIENT_DOC_KEYS = [
  OS.strAttach01, OS.strAttach02, OS.strAttach03, OS.strAttach04, OS.strAttach05,
] as const;

/** FLD-052 — slots de soporte interno (el Anexo02 topa en 10 archivos). */
export const SCR003_SUPPORT_DOC_KEYS = [
  OS.strSupportDoc01, OS.strSupportDoc02, OS.strSupportDoc03, OS.strSupportDoc04, OS.strSupportDoc05,
  OS.strSupportDoc06, OS.strSupportDoc07, OS.strSupportDoc08, OS.strSupportDoc09, OS.strSupportDoc10,
] as const;

/** FLD-052 — "Máx 10 archivos" (validación del Anexo02). */
export const SCR003_MAX_SOPORTES = 10;

/** FLD-049 — "Mín 100 car." (validación del Anexo02). */
export const SCR003_MIN_ANALISIS = 100;

/**
 * Umbral de "Por Vencer" para semaforizar el SLA (FLD-042, "Semaforizado").
 * Mismo valor que en Quejas Directas (SCR-0051/SCR-013) para que el color
 * signifique lo mismo en los dos procesos.
 */
export const SCR003_SLA_UMBRAL_PROXIMO = 2;

export const SCR003_DEFAULTS: Partial<GestionLinea2FormData> = {
  [OS.strBpmCaseId]: '',
  [OS.strCaseType]: '',
  [OS.intSlaRemaining]: '',
  [OS.strDueDate]: '',
  [OS.strConsumerName]: '',
  [OS.strIdentification]: '',
  [OS.strProductLine]: '',
  [OS.strCaseDescription]: '',
  [OS.strTechAnalysis]: '',
  [OS.strSystemActions]: '',
  [OS.strSupportDoc01]: '',
  [OS.strSupportDoc02]: '',
  [OS.strSupportDoc03]: '',
  [OS.strSupportDoc04]: '',
  [OS.strSupportDoc05]: '',
  [OS.strSupportDoc06]: '',
  [OS.strSupportDoc07]: '',
  [OS.strSupportDoc08]: '',
  [OS.strSupportDoc09]: '',
  [OS.strSupportDoc10]: '',
  [OS.strAssigneeArea]: '',
  [OS.strAssigneeUser]: '',
  [OS.strAction]: 'CONFIRMAR_ATENCION',
};
