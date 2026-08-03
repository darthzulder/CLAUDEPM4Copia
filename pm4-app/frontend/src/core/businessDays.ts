import { useMemo } from 'react';
import { useCollection } from './useCollection';
import { GLOBAL_COLLECTIONS } from './collections';

// Días HÁBILES de Colombia: excluye sábados/domingos y los feriados de la colección
// cat-feriados-colombia (id 48). Réplica en cliente de la misma regla de negocio del
// script PM4 COL_UTIL_Dias_Habiles (id 95) — mismas dos operaciones ('add' y 'diff'),
// sin necesidad de invocar el script.

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

// Carga la colección cat-feriados-colombia (id 48) y expone el set de fechas (YYYY-MM-DD)
// que consumen los helpers de arriba.
export function useHolidaySet(): { holidays: ReadonlySet<string>; loading: boolean } {
  const { options, loading } = useCollection(GLOBAL_COLLECTIONS.holidaysColombia);
  const holidays = useMemo(() => new Set(options.map((o) => o.value)), [options]);
  return { holidays, loading };
}
