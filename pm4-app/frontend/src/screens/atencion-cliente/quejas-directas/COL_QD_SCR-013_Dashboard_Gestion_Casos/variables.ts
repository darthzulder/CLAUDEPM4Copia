// P01-T09 (según prompt) — Dashboard — Gestión de Casos (SCR-013 / PAN-13)
// Proceso: P01 — Gestión de Quejas Directas | Rol: Supervisor / Jefe SAC
// Fuente de estructura: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.html → pantalla SCR-013.
//
// NOTA DE TRAZABILIDAD: PAN-13 NO existe en el Anexo02.xlsx (no hay hoja SCR-013) ni en la
// hoja "4. Pantallas" de Matrices (que termina en PAN-12). Es una pantalla presente solo en
// el mockup HTML v3_0. El código P01-T09 en Matrices corresponde a "Enviar encuesta de
// satisfacción" (tarea automática), no a este dashboard. Ver DOCUMENTACION para el detalle.
//
// Los casos se obtienen de la API PM4 `GET /api/1.0/requests?include=data` (proceso QD),
// se mapean a `CasoDashboard` y se filtran cliente-side. data_name PM4 con prefijo `qd_`.

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

// Umbral de días hábiles para clasificar un caso abierto como "Próximo a vencer" (KPI warn).
export const SLA_UMBRAL_PROXIMO = 3;

// Tamaño de página de la tabla de casos (mockup muestra 8 filas por página).
export const PAGE_SIZE = 8;

// Proceso PM4 de Gestión de Quejas Directas (mismo default que el Web Entry de SCR-000).
export const QD_PROCESS_ID = Number(import.meta.env.VITE_QD_PROCESS_ID || import.meta.env.WEB_ENTRY_PROCESS_ID || 31);

// Colecciones PM4 que alimentan los filtros catalogados (código ↔ descripción).
export const COLLECTION_DEFS = {
  tipoSolicitud: GLOBAL_COLLECTIONS.qd_tipoSolicitud, // id 18
  area: GLOBAL_COLLECTIONS.qd_area,                   // id 35
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export type EstadoCaso = 'Abierta' | 'Cerrada' | 'Vencida' | 'Cancelada';

// Un caso de la tabla consolidada del dashboard (ya mapeado desde el request PM4).
export interface CasoDashboard {
  qd_id:               number;      // request id (clave estable)
  qd_numeroCaso:       string;      // # Caso (código SFC o case_number)
  qd_tipoSolicitud:    string;      // Tipo (CÓDIGO de la colección qd_tipoSolicitud)
  qd_fechaCreacion:    string;      // Creación (formateada)
  qd_fechaVencimiento: string;      // Vencimiento (formateada o '—')
  qd_diasRestantes:    number;      // Días hábiles restantes; < 0 = días de mora
  qd_estado:           EstadoCaso;  // Estado operativo (derivado de request.status + SLA)
  qd_areaResponsable:  string;      // Área responsable (CÓDIGO de la colección qd_area)
  qd_responsable:      string;      // Responsable asignado
  qd_descripcion:      string;      // Descripción / Motivo (detalle en modal)
}

// Forma cruda de un caso devuelto por GET /api/1.0/requests?include=data.
export interface RequestRaw {
  id: number;
  case_number?: number | string;
  process_id?: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, unknown>;
}

// Filtros de la barra superior (draft en el form; se aplican con "Aplicar filtros").
export interface FiltrosDashboard {
  filtroTipo:   string;
  filtroEstado: string;
  filtroArea:   string;
  filtroBuscar: string;
}

export const FILTROS_DEFAULT: FiltrosDashboard = {
  filtroTipo: '',
  filtroEstado: '',
  filtroArea: '',
  filtroBuscar: '',
};

// ---------------------------------------------------------------------------
// Opciones estáticas del filtro Estado.
// Estado es un valor OPERATIVO derivado de request.status + SLA (no un catálogo);
// por eso no viene de una colección. Tipo y Área sí usan colecciones (COLLECTION_DEFS).
// ---------------------------------------------------------------------------
export const OPTIONS = {
  estado: [
    { value: '', label: 'Todos' },
    { value: 'Abierta', label: 'Abierta' },
    { value: 'Cerrada', label: 'Cerrada' },
    { value: 'Vencida', label: 'Vencida' },
    { value: 'Cancelada', label: 'Cancelada' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Mapeo request PM4 → CasoDashboard
// ---------------------------------------------------------------------------
function formatFecha(iso?: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return String(iso);
  return new Date(t).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Días restantes = (fecha de inicio + qd_slaRestante) − hoy.
// qd_slaRestante se interpreta como el plazo en días desde la creación del caso; la fecha
// límite es created_at + qd_slaRestante días y los restantes se cuentan contra hoy.
// Fallbacks: si falta el SLA o la fecha de inicio, usa qd_fechaVencimiento − hoy; si no, 0.
function calcularDiasRestantes(d: Record<string, unknown>, createdAt?: string): number {
  const slaRaw = d.qd_slaRestante;
  const startT = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (slaRaw !== undefined && slaRaw !== null && slaRaw !== '' && !Number.isNaN(startT)) {
    const sla = Number(slaRaw);
    if (Number.isFinite(sla)) {
      const deadline = startT + sla * 86_400_000;
      return Math.ceil((deadline - Date.now()) / 86_400_000);
    }
  }
  const venc = d.qd_fechaVencimiento;
  if (venc) {
    const t = Date.parse(String(venc));
    if (!Number.isNaN(t)) return Math.ceil((t - Date.now()) / 86_400_000);
  }
  return 0;
}

// Estado operativo del caso a partir del status del request y los días restantes.
function estadoDeRequest(status: string | undefined, diasRestantes: number): EstadoCaso {
  const s = String(status ?? '').toUpperCase();
  if (s === 'COMPLETED') return 'Cerrada';
  if (s === 'CANCELED' || s === 'CANCELLED') return 'Cancelada';
  return diasRestantes < 0 ? 'Vencida' : 'Abierta'; // ACTIVE / ERROR / otros
}

export function mapRequestToCaso(r: RequestRaw): CasoDashboard {
  const d = r.data ?? {};
  const str = (k: string) => (d[k] === undefined || d[k] === null ? '' : String(d[k]));
  const dias = calcularDiasRestantes(d, r.created_at);
  const venc = str('qd_fechaVencimiento');
  return {
    qd_id: r.id,
    qd_numeroCaso: str('qd_codigoSFC') || String(r.case_number ?? r.id ?? ''),
    qd_tipoSolicitud: str('qd_tipoSolicitud'),
    qd_fechaCreacion: formatFecha(r.created_at),
    qd_fechaVencimiento: venc ? formatFecha(venc) : '—',
    qd_diasRestantes: dias,
    qd_estado: estadoDeRequest(r.status, dias),
    qd_areaResponsable: str('qd_areaResponsable'),
    qd_responsable: str('qd_responsable') || str('qd_rolResponsable'),
    qd_descripcion: str('qd_textoQueja') || str('qd_descripcion'),
  };
}

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

// Estado del caso → variante de ZdsStatusBadge (píldoras del DS).
export function estadoVariante(estado: EstadoCaso): 'success' | 'danger' | 'info' | 'neutral' {
  switch (estado) {
    case 'Cerrada':   return 'success';
    case 'Vencida':   return 'danger';
    case 'Cancelada': return 'neutral';
    default:          return 'info'; // Abierta
  }
}

// Columna "Días restantes": solo texto. Para casos cerrados/cancelados no aplica ("—").
export function diasRestantesTexto(c: CasoDashboard): string {
  if (c.qd_estado === 'Cerrada' || c.qd_estado === 'Cancelada') return '—';
  const n = c.qd_diasRestantes;
  const plural = (x: number) => `${x} ${x === 1 ? 'día' : 'días'}`;
  if (n > 0) return plural(n);
  if (n === 0) return 'Vence hoy';
  return `${plural(Math.abs(n))} de mora`;
}

export interface KpisDashboard {
  abiertos:  number;
  porVencer: number;
  vencidos:  number;
  cerrados:  number;
}

// KPIs derivados de la lista completa de casos (siempre consistentes con los datos).
export function calcularKpis(casos: CasoDashboard[]): KpisDashboard {
  return {
    abiertos:  casos.filter((c) => c.qd_estado === 'Abierta').length,
    porVencer: casos.filter((c) => c.qd_estado === 'Abierta' && c.qd_diasRestantes >= 0 && c.qd_diasRestantes <= SLA_UMBRAL_PROXIMO).length,
    vencidos:  casos.filter((c) => c.qd_estado === 'Vencida' || (c.qd_estado === 'Abierta' && c.qd_diasRestantes < 0)).length,
    cerrados:  casos.filter((c) => c.qd_estado === 'Cerrada').length,
  };
}

// ---------------------------------------------------------------------------
// Exportación CSV del resultado filtrado (botón "Descargar reporte").
// Resuelve código → descripción para Tipo y Área usando los mapas de las colecciones.
// ---------------------------------------------------------------------------
export function casosToCSV(
  casos: CasoDashboard[],
  tipoMap: Record<string, string>,
  areaMap: Record<string, string>,
): string {
  const headers = ['# Caso', 'Tipo', 'Creación', 'Vencimiento', 'Días restantes', 'Estado', 'Área', 'Responsable', 'Descripción'];
  const filas = casos.map((c) => [
    c.qd_numeroCaso,
    tipoMap[c.qd_tipoSolicitud] ?? c.qd_tipoSolicitud,
    c.qd_fechaCreacion,
    c.qd_fechaVencimiento,
    String(c.qd_diasRestantes),
    c.qd_estado,
    areaMap[c.qd_areaResponsable] ?? c.qd_areaResponsable,
    c.qd_responsable,
    c.qd_descripcion,
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...filas].map((f) => f.map(esc).join(',')).join('\r\n');
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
