// Días HÁBILES de Colombia: excluye sábados/domingos y los feriados de la colección
// cat-feriados-colombia (id 48). Réplica en cliente de la misma regla de negocio del
// script PM4 COL_UTIL_Dias_Habiles (id 95) — mismas dos operaciones ('add' y 'diff'),
// sin necesidad de invocar el script.
//
// ── Qué se portó y qué NO, respecto de `frontend/src/core/businessDays.ts` ───────────────────
// Todo lo de este archivo es lógica pura de Date y se copió sin cambios. Lo que quedó afuera es
// el hook `useHolidaySet()`, que en React vivía al final del mismo archivo y hacía dos cosas
// ajenas a esta matemática: llamar `useCollection` (HTTP) y memoizar el `Set`. Su equivalente es
// `HolidaysService`, en su propio archivo.
//
// **La separación no es cosmética.** Al dejar el hook acá, cualquier módulo que quisiera sumar
// días hábiles arrastraba el cliente HTTP entero por la cadena de imports — que es justo lo que
// hace que hoy `businessDays.test.ts` de React tenga que convivir con ese acoplamiento. Los
// helpers reciben el `ReadonlySet<string>` de feriados **por parámetro**, así que se testean con
// un set literal y sin mockear nada; quién lo cargó es problema de otro archivo.
//
// El contrato de ese set: fechas en formato `YYYY-MM-DD`, que es lo que la colección devuelve en
// `data.holyday_date`.

function toIsoDate(in_dtDate: Date): string {
  const intY = in_dtDate.getFullYear();
  const intM = String(in_dtDate.getMonth() + 1).padStart(2, '0');
  const intD = String(in_dtDate.getDate()).padStart(2, '0');
  return `${intY}-${intM}-${intD}`;
}

function atMidnight(in_dtDate: Date): Date {
  const dtCopy = new Date(in_dtDate);
  dtCopy.setHours(0, 0, 0, 0);
  return dtCopy;
}

// Parsea fechas de PM4 en formato 'DD/MM/YYYY' (el formato real de qd_strFilingDate,
// igual al 'd/m/Y' por defecto del script 95). `new Date(string)` NO sirve para este
// formato: interpreta "08/07/2026" como MM/DD/YYYY (7 de agosto) en vez de DD/MM/YYYY
// (8 de julio). Si el valor no matchea ese patrón, cae a Date nativo (soporta ISO, etc.).
export function parsePm4Date(in_strValue: string | undefined | null): Date | null {
  if (!in_strValue) return null;
  const objMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(in_strValue.trim());
  if (objMatch) {
    const [, strDay, strMonth, strYear] = objMatch;
    const dtParsed = new Date(Number(strYear), Number(strMonth) - 1, Number(strDay));
    return Number.isNaN(dtParsed.getTime()) ? null : dtParsed;
  }
  const dtNative = new Date(in_strValue);
  return Number.isNaN(dtNative.getTime()) ? null : dtNative;
}

export function isBusinessDay(in_dtDate: Date, in_setFeriados: ReadonlySet<string>): boolean {
  const intWeekday = in_dtDate.getDay(); // 0=domingo … 6=sábado
  if (intWeekday === 0 || intWeekday === 6) return false;
  return !in_setFeriados.has(toIsoDate(in_dtDate));
}

// Suma (in_intDias > 0) o resta (in_intDias < 0) días HÁBILES a in_dtInicio.
// in_dtInicio en sí no cuenta como día sumado (mismo criterio que el script 95).
export function addBusinessDays(in_dtInicio: Date, in_intDias: number, in_setFeriados: ReadonlySet<string>): Date {
  const dtResult = atMidnight(in_dtInicio);
  const intDias = Math.trunc(in_intDias);
  if (intDias === 0) return dtResult;
  const intStep = intDias > 0 ? 1 : -1;
  const intTarget = Math.abs(intDias);
  let intAdded = 0;
  while (intAdded < intTarget) {
    dtResult.setDate(dtResult.getDate() + intStep);
    if (isBusinessDay(dtResult, in_setFeriados)) intAdded++;
  }
  return dtResult;
}

// Cuenta días HÁBILES entre in_dtDesde (EXCLUSIVO) e in_dtHasta (INCLUSIVO), CON SIGNO
// (negativo si in_dtHasta ya pasó respecto a in_dtDesde). Mismo criterio que el script 95.
export function countBusinessDaysBetween(in_dtDesde: Date, in_dtHasta: Date, in_setFeriados: ReadonlySet<string>): number {
  let intSign = 1;
  let dtStart = atMidnight(in_dtDesde);
  let dtEnd = atMidnight(in_dtHasta);
  if (dtEnd < dtStart) {
    intSign = -1;
    [dtStart, dtEnd] = [dtEnd, dtStart];
  }
  let intCount = 0;
  const dtCursor = new Date(dtStart);
  while (dtCursor < dtEnd) {
    dtCursor.setDate(dtCursor.getDate() + 1);
    if (isBusinessDay(dtCursor, in_setFeriados)) intCount++;
  }
  return intSign * intCount;
}

// Días HÁBILES restantes hasta el vencimiento (in_dtInicio + in_intSlaDias días hábiles),
// comparado contra hoy. Negativo = días hábiles de mora.
export function diasHabilesRestantes(in_dtInicio: Date, in_intSlaDias: number, in_setFeriados: ReadonlySet<string>): number {
  const dtVencimiento = addBusinessDays(in_dtInicio, in_intSlaDias, in_setFeriados);
  return countBusinessDaysBetween(new Date(), dtVencimiento, in_setFeriados);
}

// ── Estado del caso por proximidad al vencimiento (SCR-013 dashboard, SCR-0051 detalle) ──
// Estado derivado SOLO de los días hábiles restantes (sin mirar el status del request/tarea:
// Cerrada/Cancelada se resuelven en cada pantalla, que sí conoce ese status). "Por Vencer" =
// caso activo con in_intUmbralProximo días hábiles o menos hasta el vencimiento.
export type EstadoSlaCaso = 'Abierta' | 'Por Vencer' | 'Vencida';

export function estadoSlaPorDiasRestantes(
  in_intDiasRestantes: number,
  in_blnTieneDeadline: boolean,
  in_intUmbralProximo: number,
): EstadoSlaCaso {
  if (!in_blnTieneDeadline) return 'Abierta'; // aún no tiene SLA/fecha de radicación
  if (in_intDiasRestantes < 0) return 'Vencida';
  if (in_intDiasRestantes <= in_intUmbralProximo) return 'Por Vencer';
  return 'Abierta';
}

// Variante de ZdsStatusBadge para EstadoSlaCaso. EstadoCasoDashboard (SCR-013) añade encima
// Cerrada/Cancelada — ver estadoVariante() en dashboardHelpers.ts.
export function estadoSlaVariant(in_strEstado: EstadoSlaCaso): 'success' | 'danger' | 'info' | 'warning' {
  switch (in_strEstado) {
    case 'Vencida':    return 'danger';
    case 'Por Vencer': return 'warning';
    default:           return 'info'; // Abierta
  }
}
