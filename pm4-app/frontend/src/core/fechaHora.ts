// Sellos de fecha/hora que las pantallas escriben en las variables del caso PM4
// (p. ej. qd_strDraftDate). Formato único "YYYY-MM-DD HH:mm" en hora local del
// navegador, legible tal cual en pantalla y ordenable como texto.

const pad = (in_intValue: number) => String(in_intValue).padStart(2, '0');

/** Sello "YYYY-MM-DD HH:mm" de un instante (por defecto, ahora). */
export function selloFechaHora(in_dtValue: Date = new Date()): string {
  return `${in_dtValue.getFullYear()}-${pad(in_dtValue.getMonth() + 1)}-${pad(in_dtValue.getDate())} `
    + `${pad(in_dtValue.getHours())}:${pad(in_dtValue.getMinutes())}`;
}

/**
 * Mismo sello a partir de una fecha ISO de PM4 ("2026-08-10T20:08:16+00:00", en UTC):
 * la convierte a hora local. Devuelve '' si el valor falta o no es una fecha válida.
 */
export function selloFechaHoraDesdeIso(in_strIso: string | null | undefined): string {
  if (!in_strIso) return '';
  const dtValue = new Date(in_strIso);
  return Number.isNaN(dtValue.getTime()) ? '' : selloFechaHora(dtValue);
}
