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

// ---------------------------------------------------------------------------
// Mapeo request PM4 → CasoDashboard
// ---------------------------------------------------------------------------
function formatFecha(in_strIso?: string): string {
  if (!in_strIso) return '—';
  const intT = Date.parse(in_strIso);
  if (Number.isNaN(intT)) return String(in_strIso);
  return new Date(intT).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Días restantes = (fecha de inicio + qd_strSlaAssigned) − hoy.
// qd_strSlaAssigned se interpreta como el plazo en días desde la creación del caso; la
// fecha límite es created_at + qd_strSlaAssigned días y los restantes se cuentan contra hoy.
// Fallbacks: si falta el SLA o la fecha de inicio, usa qd_fechaVencimiento − hoy; si no, 0.
// NOTA: qd_fechaVencimiento no forma parte de los 143 campos migrados (ver
// fields/MAPEO_qd_old_new.md) — data_name pendiente de confirmar con TI, se deja literal.
function calcularDiasRestantes(in_dicData: Record<string, unknown>, in_strCreatedAt?: string): number {
  const genSlaRaw = in_dicData[QD.strSlaAssigned];
  const intStartT = in_strCreatedAt ? Date.parse(in_strCreatedAt) : Number.NaN;
  if (genSlaRaw !== undefined && genSlaRaw !== null && genSlaRaw !== '' && !Number.isNaN(intStartT)) {
    const intSla = Number(genSlaRaw);
    if (Number.isFinite(intSla)) {
      const intDeadline = intStartT + intSla * 86_400_000;
      return Math.ceil((intDeadline - Date.now()) / 86_400_000);
    }
  }
  const strVenc = in_dicData.qd_fechaVencimiento;
  if (strVenc) {
    const intT = Date.parse(String(strVenc));
    if (!Number.isNaN(intT)) return Math.ceil((intT - Date.now()) / 86_400_000);
  }
  return 0;
}

// Estado operativo del caso a partir del status del request y los días restantes.
function estadoDeRequest(in_strStatus: string | undefined, in_intDiasRestantes: number): EstadoCasoDashboard {
  const strStatus = String(in_strStatus ?? '').toUpperCase();
  if (strStatus === 'COMPLETED') return 'Cerrada';
  if (strStatus === 'CANCELED' || strStatus === 'CANCELLED') return 'Cancelada';
  return in_intDiasRestantes < 0 ? 'Vencida' : 'Abierta'; // ACTIVE / ERROR / otros
}

export function mapRequestToCaso(in_objRequest: RequestRaw): CasoDashboard {
  const objData = in_objRequest.data ?? {};
  const str = (in_strKey: string) => (objData[in_strKey] === undefined || objData[in_strKey] === null ? '' : String(objData[in_strKey]));
  const intDias = calcularDiasRestantes(objData, in_objRequest.created_at);
  const strVenc = str('qd_fechaVencimiento');
  return {
    qd_id: in_objRequest.id,
    qd_numeroCaso: str(QD.strSfcCode) || String(in_objRequest.case_number ?? in_objRequest.id ?? ''),
    qd_tipoSolicitud: str(QD.strRequestType),
    qd_fechaCreacion: formatFecha(in_objRequest.created_at),
    qd_fechaVencimiento: strVenc ? formatFecha(strVenc) : '—',
    qd_diasRestantes: intDias,
    qd_estado: estadoDeRequest(in_objRequest.status, intDias),
    qd_areaResponsable: str(QD.strAssigneeArea),
    qd_responsable: str(QD.strAssignee) || str(QD.strAssigneeRole),
    qd_descripcion: str(QD.strComplaintText),
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
  if (in_objCaso.qd_estado === 'Cerrada' || in_objCaso.qd_estado === 'Cancelada') return '—';
  const intN = in_objCaso.qd_diasRestantes;
  const plural = (in_intX: number) => `${in_intX} ${in_intX === 1 ? 'día' : 'días'}`;
  if (intN > 0) return plural(intN);
  if (intN === 0) return 'Vence hoy';
  return `${plural(Math.abs(intN))} de mora`;
}

// KPIs derivados de la lista completa de casos (siempre consistentes con los datos).
export function calcularKpis(in_lstCasos: CasoDashboard[]): KpisDashboard {
  return {
    abiertos:  in_lstCasos.filter((c) => c.qd_estado === 'Abierta').length,
    porVencer: in_lstCasos.filter((c) => c.qd_estado === 'Abierta' && c.qd_diasRestantes >= 0 && c.qd_diasRestantes <= SCR013_SLA_UMBRAL_PROXIMO).length,
    vencidos:  in_lstCasos.filter((c) => c.qd_estado === 'Vencida' || (c.qd_estado === 'Abierta' && c.qd_diasRestantes < 0)).length,
    cerrados:  in_lstCasos.filter((c) => c.qd_estado === 'Cerrada').length,
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
    c.qd_numeroCaso,
    in_dicTipoMap[c.qd_tipoSolicitud] ?? c.qd_tipoSolicitud,
    c.qd_fechaCreacion,
    c.qd_fechaVencimiento,
    String(c.qd_diasRestantes),
    c.qd_estado,
    in_dicAreaMap[c.qd_areaResponsable] ?? c.qd_areaResponsable,
    c.qd_responsable,
    c.qd_descripcion,
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
  { qd_id: 1, qd_numeroCaso: '001', qd_tipoSolicitud: 'Queja', qd_fechaCreacion: '10 abr. 2024', qd_fechaVencimiento: '15 abr. 2024', qd_diasRestantes: 1, qd_estado: 'Abierta', qd_areaResponsable: 'Siniestros Autos', qd_responsable: 'Laura González', qd_descripcion: 'Cliente reporta demora en la liquidación de siniestro de vehículo. Solicita respuesta urgente antes del vencimiento regulatorio.' },
  { qd_id: 2, qd_numeroCaso: '002', qd_tipoSolicitud: 'Petición', qd_fechaCreacion: '15 abr. 2024', qd_fechaVencimiento: '18 abr. 2024', qd_diasRestantes: 3, qd_estado: 'Cerrada', qd_areaResponsable: '—', qd_responsable: 'María Pérez', qd_descripcion: 'Solicitud de actualización de datos de póliza resuelta satisfactoriamente dentro del plazo SLA.' },
  { qd_id: 3, qd_numeroCaso: '003', qd_tipoSolicitud: 'Derecho de petición', qd_fechaCreacion: '20 mar. 2024', qd_fechaVencimiento: '20 abr. 2024', qd_diasRestantes: -3, qd_estado: 'Vencida', qd_areaResponsable: 'Siniestros Autos', qd_responsable: 'Juan Martínez', qd_descripcion: 'Derecho de petición por negación de cobertura. Caso excedió el plazo SFC. Requiere atención inmediata y posible escalamiento.' },
  { qd_id: 4, qd_numeroCaso: '004', qd_tipoSolicitud: 'Petición', qd_fechaCreacion: '5 abr. 2024', qd_fechaVencimiento: '20 abr. 2024', qd_diasRestantes: 5, qd_estado: 'Cancelada', qd_areaResponsable: 'Siniestros Autos', qd_responsable: 'Ana Ruiz', qd_descripcion: 'Solicitud cancelada a petición del cliente. El asegurado retiró la solicitud voluntariamente antes del cierre.' },
  { qd_id: 5, qd_numeroCaso: '005', qd_tipoSolicitud: 'Queja', qd_fechaCreacion: '28 mar. 2024', qd_fechaVencimiento: '15 abr. 2024', qd_diasRestantes: 2, qd_estado: 'Abierta', qd_areaResponsable: 'Siniestros Autos', qd_responsable: 'Carla Torres', qd_descripcion: 'Queja por atención deficiente en el proceso de inspección del vehículo. Cliente exige compensación y disculpa formal.' },
  { qd_id: 6, qd_numeroCaso: '006', qd_tipoSolicitud: 'Queja', qd_fechaCreacion: '2 may. 2024', qd_fechaVencimiento: '17 may. 2024', qd_diasRestantes: 8, qd_estado: 'Abierta', qd_areaResponsable: 'Siniestros Vida', qd_responsable: 'Pedro Ramírez', qd_descripcion: 'Queja por retraso en el pago de indemnización por fallecimiento. Beneficiarios solicitan respuesta urgente.' },
  { qd_id: 7, qd_numeroCaso: '007', qd_tipoSolicitud: 'Reclamo', qd_fechaCreacion: '18 abr. 2024', qd_fechaVencimiento: '3 may. 2024', qd_diasRestantes: -2, qd_estado: 'Vencida', qd_areaResponsable: 'Pagos y Cobros', qd_responsable: 'Sandra Molina', qd_descripcion: 'Reclamo por cobro indebido de prima adicional. SLA vencido. Área de Pagos debe emitir respuesta de manera inmediata.' },
  { qd_id: 8, qd_numeroCaso: '008', qd_tipoSolicitud: 'Petición', qd_fechaCreacion: '30 abr. 2024', qd_fechaVencimiento: '15 may. 2024', qd_diasRestantes: 4, qd_estado: 'Abierta', qd_areaResponsable: 'SAC', qd_responsable: 'Diego Herrera', qd_descripcion: 'Petición de información sobre cobertura de póliza de hogar. Cliente requiere aclaración de condiciones contractuales.' },
];
