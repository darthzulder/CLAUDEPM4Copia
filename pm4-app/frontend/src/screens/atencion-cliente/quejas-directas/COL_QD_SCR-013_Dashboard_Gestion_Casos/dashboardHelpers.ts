// P01-T09 (según prompt) — Dashboard — Gestión de Casos (SCR-013 / PAN-13)
// Lógica de mapeo request PM4 → CasoDashboard, helpers de presentación, KPIs, CSV y
// datos de ejemplo. Constantes/tipos/opciones de configuración viven en
// ../fields/fields.ts y ../fields/types.ts (fuente única del proceso P01).
//
// NOTA DE TRAZABILIDAD: PAN-13 NO existe en el Anexo02.xlsx (no hay hoja SCR-013) ni en la
// hoja "4. Pantallas" de Matrices (que termina en PAN-12). Es una pantalla presente solo en
// el mockup HTML v3_0. El código P01-T09 en Matrices corresponde a "Enviar encuesta de
// satisfacción" (tarea automática), no a este dashboard. Ver DOCUMENTACION para el detalle.

import { QD, SCR013_SLA_UMBRAL_PROXIMO } from '../fields/fields';
import type { CasoDashboard, EstadoCasoDashboard, KpisDashboard, RequestRaw } from '../fields/types';
import { addBusinessDays, countBusinessDaysBetween } from '../../../../core/businessDays';

// ---------------------------------------------------------------------------
// Mapeo request PM4 → CasoDashboard
// ---------------------------------------------------------------------------
function formatFecha(in_strIso?: string): string {
  if (!in_strIso) return '—';
  const intT = Date.parse(in_strIso);
  if (Number.isNaN(intT)) return String(in_strIso);
  return new Date(intT).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Fecha límite (deadline) = fecha de inicio + qd_strSlaAssigned días HÁBILES.
// qd_strSlaAssigned se interpreta como el plazo en días hábiles desde la creación del caso.
// Devuelve el timestamp en ms de la fecha de vencimiento, o null si falta el SLA o la
// fecha de inicio (no hay campo qd_fechaVencimiento en los datos del caso: se calcula).
// Misma regla que el script PM4 COL_UTIL_Dias_Habiles (id 95, op 'add').
function calcularDeadline(
  in_dicData: Record<string, unknown>,
  in_strCreatedAt: string | undefined,
  in_setFeriados: ReadonlySet<string>,
): number | null {
  const genSlaRaw = in_dicData[QD.strSlaAssigned];
  const intStartT = in_strCreatedAt ? Date.parse(in_strCreatedAt) : Number.NaN;
  if (genSlaRaw === undefined || genSlaRaw === null || genSlaRaw === '' || Number.isNaN(intStartT)) return null;
  const intSla = Number(genSlaRaw);
  if (!Number.isFinite(intSla)) return null;
  return addBusinessDays(new Date(intStartT), intSla, in_setFeriados).getTime();
}

// Días HÁBILES restantes = deadline − hoy, contando solo días hábiles (con signo: negativo
// si el deadline ya pasó). Si no hay deadline, 0. Misma regla que el script PM4
// COL_UTIL_Dias_Habiles (id 95, op 'diff').
function calcularDiasRestantes(in_intDeadline: number | null, in_setFeriados: ReadonlySet<string>): number {
  if (in_intDeadline === null) return 0;
  return countBusinessDaysBetween(new Date(), new Date(in_intDeadline), in_setFeriados);
}

// Estado operativo del caso a partir del status del request y los días restantes.
function estadoDeRequest(in_strStatus: string | undefined, in_intDiasRestantes: number): EstadoCasoDashboard {
  const strStatus = String(in_strStatus ?? '').toUpperCase();
  if (strStatus === 'COMPLETED') return 'Cerrada';
  if (strStatus === 'CANCELED' || strStatus === 'CANCELLED') return 'Cancelada';
  return in_intDiasRestantes < 0 ? 'Vencida' : 'Abierta'; // ACTIVE / ERROR / otros
}

export function mapRequestToCaso(in_objRequest: RequestRaw, in_setFeriados: ReadonlySet<string>): CasoDashboard {
  const objData = in_objRequest.data ?? {};
  const str = (in_strKey: string) => (objData[in_strKey] === undefined || objData[in_strKey] === null ? '' : String(objData[in_strKey]));
  const intDeadline = calcularDeadline(objData, in_objRequest.created_at, in_setFeriados);
  const intDias = calcularDiasRestantes(intDeadline, in_setFeriados);
  // Responsable: nombre completo del usuario del caso (data._user.fullname).
  const objUser = objData._user as { fullname?: string } | undefined;
  const strResponsable = objUser?.fullname ?? '';
  return {
    id: in_objRequest.id,
    numeroCaso: str(QD.strSfcCode) || String(in_objRequest.case_number ?? in_objRequest.id ?? ''),
    tipoSolicitud: str(QD.strRequestType),
    fechaCreacion: formatFecha(in_objRequest.created_at),
    fechaVencimiento: intDeadline !== null ? formatFecha(new Date(intDeadline).toISOString()) : '—',
    diasRestantes: intDias,
    estado: estadoDeRequest(in_objRequest.status, intDias),
    // Área: rol responsable del caso (qd_strResponsableRole).
    areaResponsable: str('qd_strResponsableRole'),
    responsable: strResponsable,
    descripcion: str(QD.strComplaintText),
  };
}

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

// Estado del caso → variante de ZdsStatusBadge (píldoras del DS).
export function estadoVariante(in_strEstado: EstadoCasoDashboard): 'success' | 'danger' | 'info' | 'neutral' {
  switch (in_strEstado) {
    case 'Cerrada':   return 'success';
    case 'Vencida':   return 'danger';
    case 'Cancelada': return 'neutral';
    default:          return 'info'; // Abierta
  }
}

// Columna "Días restantes": solo texto. Para casos cerrados/cancelados no aplica ("—").
export function diasRestantesTexto(in_objCaso: CasoDashboard): string {
  if (in_objCaso.estado === 'Cerrada' || in_objCaso.estado === 'Cancelada') return '—';
  const intN = in_objCaso.diasRestantes;
  const plural = (in_intX: number) => `${in_intX} ${in_intX === 1 ? 'día' : 'días'}`;
  if (intN > 0) return plural(intN);
  if (intN === 0) return 'Vence hoy';
  return `${plural(Math.abs(intN))} de mora`;
}

// KPIs derivados de la lista completa de casos (siempre consistentes con los datos).
export function calcularKpis(in_lstCasos: CasoDashboard[]): KpisDashboard {
  return {
    abiertos:  in_lstCasos.filter((c) => c.estado === 'Abierta').length,
    porVencer: in_lstCasos.filter((c) => c.estado === 'Abierta' && c.diasRestantes >= 0 && c.diasRestantes <= SCR013_SLA_UMBRAL_PROXIMO).length,
    vencidos:  in_lstCasos.filter((c) => c.estado === 'Vencida' || (c.estado === 'Abierta' && c.diasRestantes < 0)).length,
    cerrados:  in_lstCasos.filter((c) => c.estado === 'Cerrada').length,
  };
}

// ---------------------------------------------------------------------------
// Exportación CSV del resultado filtrado (botón "Descargar reporte").
// Resuelve código → descripción para Tipo y Área usando los mapas de las colecciones.
// ---------------------------------------------------------------------------
export function casosToCSV(
  in_lstCasos: CasoDashboard[],
  in_dicTipoMap: Record<string, string>,
  in_dicAreaMap: Record<string, string>,
): string {
  const lstHeaders = ['# Caso', 'Tipo', 'Creación', 'Vencimiento', 'Días restantes', 'Estado', 'Área', 'Responsable', 'Descripción'];
  const lstFilas = in_lstCasos.map((c) => [
    c.numeroCaso,
    in_dicTipoMap[c.tipoSolicitud] ?? c.tipoSolicitud,
    c.fechaCreacion,
    c.fechaVencimiento,
    String(c.diasRestantes),
    c.estado,
    in_dicAreaMap[c.areaResponsable] ?? c.areaResponsable,
    c.responsable,
    c.descripcion,
  ]);
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
  { id: 1, numeroCaso: '001', tipoSolicitud: 'Queja', fechaCreacion: '10 abr. 2024', fechaVencimiento: '15 abr. 2024', diasRestantes: 1, estado: 'Abierta', areaResponsable: 'Siniestros Autos', responsable: 'Laura González', descripcion: 'Cliente reporta demora en la liquidación de siniestro de vehículo. Solicita respuesta urgente antes del vencimiento regulatorio.' },
  { id: 2, numeroCaso: '002', tipoSolicitud: 'Petición', fechaCreacion: '15 abr. 2024', fechaVencimiento: '18 abr. 2024', diasRestantes: 3, estado: 'Cerrada', areaResponsable: '—', responsable: 'María Pérez', descripcion: 'Solicitud de actualización de datos de póliza resuelta satisfactoriamente dentro del plazo SLA.' },
  { id: 3, numeroCaso: '003', tipoSolicitud: 'Derecho de petición', fechaCreacion: '20 mar. 2024', fechaVencimiento: '20 abr. 2024', diasRestantes: -3, estado: 'Vencida', areaResponsable: 'Siniestros Autos', responsable: 'Juan Martínez', descripcion: 'Derecho de petición por negación de cobertura. Caso excedió el plazo SFC. Requiere atención inmediata y posible escalamiento.' },
  { id: 4, numeroCaso: '004', tipoSolicitud: 'Petición', fechaCreacion: '5 abr. 2024', fechaVencimiento: '20 abr. 2024', diasRestantes: 5, estado: 'Cancelada', areaResponsable: 'Siniestros Autos', responsable: 'Ana Ruiz', descripcion: 'Solicitud cancelada a petición del cliente. El asegurado retiró la solicitud voluntariamente antes del cierre.' },
  { id: 5, numeroCaso: '005', tipoSolicitud: 'Queja', fechaCreacion: '28 mar. 2024', fechaVencimiento: '15 abr. 2024', diasRestantes: 2, estado: 'Abierta', areaResponsable: 'Siniestros Autos', responsable: 'Carla Torres', descripcion: 'Queja por atención deficiente en el proceso de inspección del vehículo. Cliente exige compensación y disculpa formal.' },
  { id: 6, numeroCaso: '006', tipoSolicitud: 'Queja', fechaCreacion: '2 may. 2024', fechaVencimiento: '17 may. 2024', diasRestantes: 8, estado: 'Abierta', areaResponsable: 'Siniestros Vida', responsable: 'Pedro Ramírez', descripcion: 'Queja por retraso en el pago de indemnización por fallecimiento. Beneficiarios solicitan respuesta urgente.' },
  { id: 7, numeroCaso: '007', tipoSolicitud: 'Reclamo', fechaCreacion: '18 abr. 2024', fechaVencimiento: '3 may. 2024', diasRestantes: -2, estado: 'Vencida', areaResponsable: 'Pagos y Cobros', responsable: 'Sandra Molina', descripcion: 'Reclamo por cobro indebido de prima adicional. SLA vencido. Área de Pagos debe emitir respuesta de manera inmediata.' },
  { id: 8, numeroCaso: '008', tipoSolicitud: 'Petición', fechaCreacion: '30 abr. 2024', fechaVencimiento: '15 may. 2024', diasRestantes: 4, estado: 'Abierta', areaResponsable: 'SAC', responsable: 'Diego Herrera', descripcion: 'Petición de información sobre cobertura de póliza de hogar. Cliente requiere aclaración de condiciones contractuales.' },
];
