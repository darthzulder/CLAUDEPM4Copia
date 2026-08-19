// P01-T09 (según prompt) — Dashboard — Gestión de Casos (SCR-013 / PAN-13)
// Lógica de mapeo request PM4 → CasoDashboard, helpers de presentación, KPIs, CSV y
// datos de ejemplo. Constantes/tipos/opciones de configuración viven en
// ../fields/fields.ts y ../fields/types.ts (fuente única del proceso P01).
//
// NOTA DE TRAZABILIDAD: PAN-13 NO existe en el Anexo02.xlsx (no hay hoja SCR-013) ni en la
// hoja "4. Pantallas" de Matrices (que termina en PAN-12). Es una pantalla presente solo en
// el mockup HTML v3_0. El código P01-T09 en Matrices corresponde a "Enviar encuesta de
// satisfacción" (tarea automática), no a este dashboard. Ver DOCUMENTACION para el detalle.
//
// ── Qué cambió al portar desde React (`dashboardHelpers.ts`) ──────────────────────────────────
// Nada de la lógica: son funciones puras de Date/array/string y se copiaron sin cambios de
// nombre ni de semántica. Lo único distinto es de dónde salen los días hábiles —
// `core/business-days.ts` en vez de `core/businessDays.ts`— y que el `Set` de feriados sigue
// llegando **por parámetro**, así que este archivo se testea con un set literal y sin mockear
// HTTP (ver la cabecera de `core/business-days.ts`, que explica por qué esa frontera importa).

import { QD, SCR013_SLA_UMBRAL_PROXIMO } from '../fields/fields';
import type { CasoDashboard, EstadoCasoDashboard, KpisDashboard, RequestRaw } from '../fields/types';
import {
  addBusinessDays,
  countBusinessDaysBetween,
  estadoSlaPorDiasRestantes,
  estadoSlaVariant,
  parsePm4Date,
} from '../../../../core/business-days';

// ---------------------------------------------------------------------------
// Mapeo request PM4 → CasoDashboard
// ---------------------------------------------------------------------------
function formatFecha(in_dtFecha: Date | null): string {
  if (!in_dtFecha) return '—';
  return in_dtFecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Fecha límite (deadline) = fecha de radicación (qd_strFilingDate) + qd_strSlaAssigned días
// HÁBILES. qd_strSlaAssigned se interpreta como el plazo en días hábiles desde la radicación
// del caso. Devuelve el timestamp en ms de la fecha de vencimiento, o null si falta el SLA o
// la fecha de radicación (no hay campo qd_fechaVencimiento en los datos del caso: se calcula).
// Misma regla que el script PM4 COL_UTIL_Dias_Habiles (id 95, op 'add').
function calcularDeadline(
  in_dicData: Record<string, unknown>,
  in_dtFilingDate: Date | null,
  in_setFeriados: ReadonlySet<string>,
): number | null {
  const genSlaRaw = in_dicData[QD.strSlaAssigned];
  if (genSlaRaw === undefined || genSlaRaw === null || genSlaRaw === '' || !in_dtFilingDate) return null;
  const intSla = Number(genSlaRaw);
  if (!Number.isFinite(intSla)) return null;
  return addBusinessDays(in_dtFilingDate, intSla, in_setFeriados).getTime();
}

// Días HÁBILES restantes = deadline − hoy, contando solo días hábiles (con signo: negativo
// si el deadline ya pasó). Si no hay deadline, 0. Misma regla que el script PM4
// COL_UTIL_Dias_Habiles (id 95, op 'diff').
function calcularDiasRestantes(in_intDeadline: number | null, in_setFeriados: ReadonlySet<string>): number {
  if (in_intDeadline === null) return 0;
  return countBusinessDaysBetween(new Date(), new Date(in_intDeadline), in_setFeriados);
}

// Estado operativo del caso a partir del status del request y, si el request sigue activo,
// de la proximidad al vencimiento (estadoSlaPorDiasRestantes(), compartida con SCR-0051 —
// ver core/business-days.ts). Cerrada/Cancelada solo dependen del status del request de PM4,
// que SCR-0051 no tiene disponible de la misma forma (por eso viven aquí y no en el helper
// compartido).
function estadoDeRequest(
  in_strStatus: string | undefined,
  in_intDiasRestantes: number,
  in_blnTieneDeadline: boolean,
): EstadoCasoDashboard {
  const strStatus = String(in_strStatus ?? '').toUpperCase();
  if (strStatus === 'COMPLETED') return 'Cerrada';
  if (strStatus === 'CANCELED' || strStatus === 'CANCELLED') return 'Cancelada';
  return estadoSlaPorDiasRestantes(in_intDiasRestantes, in_blnTieneDeadline, SCR013_SLA_UMBRAL_PROXIMO);
}

export function mapRequestToCaso(in_objRequest: RequestRaw, in_setFeriados: ReadonlySet<string>): CasoDashboard {
  const objData = in_objRequest.data ?? {};
  const str = (in_strKey: string) =>
    objData[in_strKey] === undefined || objData[in_strKey] === null ? '' : String(objData[in_strKey]);
  // Fecha de creación real del caso = radicación SFC (qd_strFilingDate, 'DD/MM/YYYY'),
  // NO el created_at del request de PM4 (que refleja cuándo se abrió la tarea en el BPM).
  const dtFilingDate = parsePm4Date(objData[QD.strFilingDate] as string | undefined);
  const intDeadline = calcularDeadline(objData, dtFilingDate, in_setFeriados);
  const intDias = calcularDiasRestantes(intDeadline, in_setFeriados);
  // Responsable: nombre completo del usuario del caso (data._user.fullname).
  const objUser = objData['_user'] as { fullname?: string } | undefined;
  const strResponsable = objUser?.fullname ?? '';
  return {
    id: in_objRequest.id,
    numeroCaso: str(QD.strSfcCode) || String(in_objRequest.case_number ?? in_objRequest.id ?? ''),
    tipoSolicitud: str(QD.strRequestType),
    fechaCreacion: formatFecha(dtFilingDate),
    fechaVencimiento: intDeadline !== null ? formatFecha(new Date(intDeadline)) : '—',
    sla: str(QD.strSlaAssigned),
    diasRestantes: intDias,
    estado: estadoDeRequest(in_objRequest.status, intDias, intDeadline !== null),
    // ⚠ BUG HEREDADO DE REACT — se porta tal cual, a propósito. Ver `⚠ bug heredado` en
    // `dashboard-gestion-casos.spec.ts`.
    //
    // `types.ts` documenta `areaResponsable` como «CÓDIGO de la colección QD_COLLECTIONS.area»
    // y el filtro Área de la barra superior compara justamente contra un código de esa
    // colección. Pero acá se lee `qd_strResponsableRole`, que es un **rol** (texto), no un
    // código de área: el filtro no matchea nunca y devuelve vacío para cualquier área elegida.
    // El campo que cerraría el círculo es `qd_strAssigneeArea` (el que la ficha §4.2 dice que
    // se usa).
    //
    // No se arregla acá: esto es una migración de framework, y elegir qué campo gobierna el
    // filtro —área o rol— es una decisión de negocio. Queda reportado y aseverado en rojo-por-
    // diseño para que el día que se decida, el test señale exactamente qué cambiar.
    areaResponsable: str('qd_strResponsableRole'),
    responsable: strResponsable,
    descripcion: str(QD.strComplaintText),
  };
}

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

// Estado del caso → variante de zds-status-badge (píldoras del DS). Cerrada/Cancelada son
// propias de este dashboard (dependen del status del request); Abierta/Por Vencer/Vencida
// delegan en estadoSlaVariant(), compartida con SCR-0051.
export function estadoVariante(
  in_strEstado: EstadoCasoDashboard,
): 'success' | 'danger' | 'info' | 'neutral' | 'warning' {
  switch (in_strEstado) {
    case 'Cerrada':
      return 'success';
    case 'Cancelada':
      return 'neutral';
    default:
      return estadoSlaVariant(in_strEstado as 'Abierta' | 'Por Vencer' | 'Vencida');
  }
}

// Columna "Días restantes": solo texto. No aplica ("—") para casos cerrados/cancelados,
// ni para casos que todavía no tienen deadline calculable (sin SLA/fecha de radicación).
export function diasRestantesTexto(in_objCaso: CasoDashboard): string {
  if (in_objCaso.estado === 'Cerrada' || in_objCaso.estado === 'Cancelada') return '—';
  if (in_objCaso.fechaVencimiento === '—') return '—';
  const intN = in_objCaso.diasRestantes;
  const plural = (in_intX: number) => `${in_intX} ${in_intX === 1 ? 'día' : 'días'}`;
  if (intN > 0) return plural(intN);
  if (intN === 0) return 'Vence hoy';
  return `${plural(Math.abs(intN))} de mora`;
}

// KPIs derivados de la lista completa de casos (siempre consistentes con los datos).
// Cada KPI es un conteo directo por estado: estadoDeRequest() ya resuelve el umbral
// de "Por Vencer" y el signo de mora de "Vencida" al mapear el caso.
// OJO: "Cancelada" no suma en NINGÚN KPI — es deliberado (un caso cancelado no está
// abierto ni cerrado por SLA), y hay un caso de test que lo fija.
export function calcularKpis(in_lstCasos: readonly CasoDashboard[]): KpisDashboard {
  return {
    abiertos: in_lstCasos.filter((c) => c.estado === 'Abierta').length,
    porVencer: in_lstCasos.filter((c) => c.estado === 'Por Vencer').length,
    vencidos: in_lstCasos.filter((c) => c.estado === 'Vencida').length,
    cerrados: in_lstCasos.filter((c) => c.estado === 'Cerrada').length,
  };
}

// ---------------------------------------------------------------------------
// Exportación CSV del resultado filtrado (botón "Descargar reporte").
// Resuelve código → descripción para Tipo y Área usando los mapas de las colecciones.
// ---------------------------------------------------------------------------
export function casosToCSV(
  in_lstCasos: readonly CasoDashboard[],
  in_dicTipoMap: Record<string, string>,
  in_dicAreaMap: Record<string, string>,
): string {
  const lstHeaders = [
    '# Caso',
    'Tipo',
    'Creación',
    'SLA',
    'Vencimiento',
    'Días restantes',
    'Estado',
    'Área',
    'Responsable',
    'Descripción',
  ];
  const lstFilas = in_lstCasos.map((c) => [
    c.numeroCaso,
    in_dicTipoMap[c.tipoSolicitud] ?? c.tipoSolicitud,
    c.fechaCreacion,
    c.sla,
    c.fechaVencimiento,
    String(c.diasRestantes),
    c.estado,
    in_dicAreaMap[c.areaResponsable] ?? c.areaResponsable,
    c.responsable,
    c.descripcion,
  ]);
  // Toda celda va entrecomillada y las comillas internas se duplican (RFC 4180): así una
  // descripción con comas o comillas no corre las columnas al abrir el archivo en Excel.
  const esc = (in_strV: string) => `"${String(in_strV).replace(/"/g, '""')}"`;
  return [lstHeaders, ...lstFilas].map((lstFila) => lstFila.map(esc).join(',')).join('\r\n');
}

// ---------------------------------------------------------------------------
// Datos de ejemplo (solo dev): fallback cuando la API no devuelve casos (p.ej. sin token
// real de PM4 en preview). En producción la tabla se puebla desde GET /requests.
// Nota: aquí Tipo/Área usan etiquetas legibles (no códigos), por lo que los filtros por
// colección no coincidirán con estos datos de ejemplo — es esperado en dev.
// ---------------------------------------------------------------------------
export const SAMPLE_CASES: CasoDashboard[] = [
  { id: 1, numeroCaso: '001', tipoSolicitud: 'Queja', fechaCreacion: '10 abr. 2024', fechaVencimiento: '15 abr. 2024', sla: '15', diasRestantes: 1, estado: 'Por Vencer', areaResponsable: 'Siniestros Autos', responsable: 'Laura González', descripcion: 'Cliente reporta demora en la liquidación de siniestro de vehículo. Solicita respuesta urgente antes del vencimiento regulatorio.' },
  { id: 2, numeroCaso: '002', tipoSolicitud: 'Petición', fechaCreacion: '15 abr. 2024', fechaVencimiento: '18 abr. 2024', sla: '15', diasRestantes: 3, estado: 'Cerrada', areaResponsable: '—', responsable: 'María Pérez', descripcion: 'Solicitud de actualización de datos de póliza resuelta satisfactoriamente dentro del plazo SLA.' },
  { id: 3, numeroCaso: '003', tipoSolicitud: 'Derecho de petición', fechaCreacion: '20 mar. 2024', fechaVencimiento: '20 abr. 2024', sla: '15', diasRestantes: -3, estado: 'Vencida', areaResponsable: 'Siniestros Autos', responsable: 'Juan Martínez', descripcion: 'Derecho de petición por negación de cobertura. Caso excedió el plazo SFC. Requiere atención inmediata y posible escalamiento.' },
  { id: 4, numeroCaso: '004', tipoSolicitud: 'Petición', fechaCreacion: '5 abr. 2024', fechaVencimiento: '20 abr. 2024', sla: '15', diasRestantes: 5, estado: 'Cancelada', areaResponsable: 'Siniestros Autos', responsable: 'Ana Ruiz', descripcion: 'Solicitud cancelada a petición del cliente. El asegurado retiró la solicitud voluntariamente antes del cierre.' },
  { id: 5, numeroCaso: '005', tipoSolicitud: 'Queja', fechaCreacion: '28 mar. 2024', fechaVencimiento: '15 abr. 2024', sla: '15', diasRestantes: 2, estado: 'Por Vencer', areaResponsable: 'Siniestros Autos', responsable: 'Carla Torres', descripcion: 'Queja por atención deficiente en el proceso de inspección del vehículo. Cliente exige compensación y disculpa formal.' },
  { id: 6, numeroCaso: '006', tipoSolicitud: 'Queja', fechaCreacion: '2 may. 2024', fechaVencimiento: '17 may. 2024', sla: '15', diasRestantes: 8, estado: 'Abierta', areaResponsable: 'Siniestros Vida', responsable: 'Pedro Ramírez', descripcion: 'Queja por retraso en el pago de indemnización por fallecimiento. Beneficiarios solicitan respuesta urgente.' },
  { id: 7, numeroCaso: '007', tipoSolicitud: 'Reclamo', fechaCreacion: '18 abr. 2024', fechaVencimiento: '3 may. 2024', sla: '15', diasRestantes: -2, estado: 'Vencida', areaResponsable: 'Pagos y Cobros', responsable: 'Sandra Molina', descripcion: 'Reclamo por cobro indebido de prima adicional. SLA vencido. Área de Pagos debe emitir respuesta de manera inmediata.' },
  { id: 8, numeroCaso: '008', tipoSolicitud: 'Petición', fechaCreacion: '30 abr. 2024', fechaVencimiento: '15 may. 2024', sla: '15', diasRestantes: 4, estado: 'Abierta', areaResponsable: 'SAC', responsable: 'Diego Herrera', descripcion: 'Petición de información sobre cobertura de póliza de hogar. Cliente requiere aclaración de condiciones contractuales.' },
];
