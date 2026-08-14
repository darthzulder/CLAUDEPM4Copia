import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addBusinessDays,
  countBusinessDaysBetween,
  diasHabilesRestantes,
  estadoSlaPorDiasRestantes,
  estadoSlaVariant,
  isBusinessDay,
  parsePm4Date,
} from './business-days';

/**
 * Portado de `frontend/src/core/businessDays.test.ts` con **paridad 1:1 de casos** y sin ningún
 * cambio de aserción: lo único que cambió es la ruta del import. Ese es el punto — este archivo
 * es la evidencia de que la separación de `useHolidaySet` no alteró la matemática.
 *
 * Réplica en cliente del script PM4 COL_UTIL_Dias_Habiles (id 95): son DOS implementaciones de
 * la misma regla de SLA y nada garantiza que coincidan, así que estos tests fijan el contrato
 * del lado cliente. Los feriados entran por argumento, así que todo esto es puro — no hace falta
 * tocar `HolidaysService` ni la colección 48.
 *
 * Depende de que la suite corra en America/Bogota: el caso del ISO que "cae al Date nativo"
 * asevera `getHours() === 19`, que es medianoche UTC vista desde UTC-5. Ver `zona-horaria.spec.ts`.
 */

/** Fecha local con mes 1-based, para que el test se lea como el calendario. */
const dt = (in_intY: number, in_intM: number, in_intD: number) => new Date(in_intY, in_intM - 1, in_intD);

const SET_VACIO: ReadonlySet<string> = new Set();
// 20-jul-2026 (independencia de Colombia) cae lunes — feriado útil para probar que el salto
// de feriado se acumula con el de fin de semana.
const SET_20_JUL: ReadonlySet<string> = new Set(['2026-07-20']);

afterEach(() => {
  vi.useRealTimers();
});

describe('parsePm4Date', () => {
  it('lee DD/MM/YYYY, no MM/DD/YYYY (la trampa que motiva la función)', () => {
    // '08/07/2026' debe ser 8 de JULIO. `new Date('08/07/2026')` daría 7 de AGOSTO: un mes
    // corrido que en pantalla se ve como una fecha perfectamente válida.
    const dtParsed = parsePm4Date('08/07/2026');
    expect(dtParsed).not.toBeNull();
    expect(dtParsed!.getFullYear()).toBe(2026);
    expect(dtParsed!.getMonth()).toBe(6); // 6 = julio
    expect(dtParsed!.getDate()).toBe(8);
  });

  it('acepta día y mes de un solo dígito', () => {
    const dtParsed = parsePm4Date('8/7/2026');
    expect(dtParsed!.getMonth()).toBe(6);
    expect(dtParsed!.getDate()).toBe(8);
  });

  it('tolera espacios alrededor', () => {
    expect(parsePm4Date('  08/07/2026  ')!.getDate()).toBe(8);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['cadena vacía', ''],
  ])('devuelve null para %s', (_strCaso, in_genValor) => {
    expect(parsePm4Date(in_genValor as string | null | undefined)).toBeNull();
  });

  it('devuelve null si no es una fecha reconocible', () => {
    expect(parsePm4Date('no-es-fecha')).toBeNull();
  });

  it('un ISO NO pasa por el regex: cae al Date nativo y se interpreta en UTC', () => {
    // Comportamiento REAL documentado como fallback silencioso: '2026-07-08' no matchea
    // DD/MM/YYYY, así que lo parsea `new Date()` como medianoche UTC. Con la suite fijada en
    // America/Bogota (UTC-5) eso es el 7 de julio 19:00 LOCAL → getDate() devuelve 7, no 8.
    // No es un bug de esta función; es la razón por la que las fechas de PM4 deben venir en
    // DD/MM/YYYY. Se fija para que el día que alguien "arregle" el regex, esto lo avise.
    const dtIso = parsePm4Date('2026-07-08');
    expect(dtIso).not.toBeNull();
    expect(dtIso!.getDate()).toBe(7);
    expect(dtIso!.getHours()).toBe(19);
  });

  it('no valida desbordes: 31/02 se normaliza en silencio a marzo', () => {
    // `new Date(2026, 1, 31)` → 3-mar-2026 (feb-2026 tiene 28 días). Laxitud conocida y
    // aceptada: la función no valida, solo parsea. Fijado para que sea una decisión visible.
    const dtOverflow = parsePm4Date('31/02/2026');
    expect(dtOverflow!.getMonth()).toBe(2); // 2 = marzo
    expect(dtOverflow!.getDate()).toBe(3);
  });
});

describe('isBusinessDay', () => {
  it('los días de semana son hábiles', () => {
    expect(isBusinessDay(dt(2026, 7, 8), SET_VACIO)).toBe(true); // miércoles
  });

  it('sábado y domingo no lo son', () => {
    expect(isBusinessDay(dt(2026, 7, 4), SET_VACIO)).toBe(false); // sábado
    expect(isBusinessDay(dt(2026, 7, 5), SET_VACIO)).toBe(false); // domingo
  });

  it('un feriado del set no es hábil aunque sea día de semana', () => {
    expect(isBusinessDay(dt(2026, 7, 20), SET_VACIO)).toBe(true);   // lunes normal
    expect(isBusinessDay(dt(2026, 7, 20), SET_20_JUL)).toBe(false); // lunes feriado
  });
});

describe('addBusinessDays', () => {
  it('suma un día hábil dentro de la semana', () => {
    expect(addBusinessDays(dt(2026, 7, 8), 1, SET_VACIO)).toEqual(dt(2026, 7, 9));
  });

  it('salta el fin de semana', () => {
    // viernes 3 + 1 hábil = lunes 6
    expect(addBusinessDays(dt(2026, 7, 3), 1, SET_VACIO)).toEqual(dt(2026, 7, 6));
  });

  it('salta fin de semana Y feriado acumulados', () => {
    // viernes 17 + 1 hábil, con lunes 20 feriado → martes 21
    expect(addBusinessDays(dt(2026, 7, 17), 1, SET_20_JUL)).toEqual(dt(2026, 7, 21));
  });

  it('la fecha de inicio no cuenta como día sumado', () => {
    // 5 hábiles desde el miércoles 8: 9, 10, 13, 14, 15
    expect(addBusinessDays(dt(2026, 7, 8), 5, SET_VACIO)).toEqual(dt(2026, 7, 15));
  });

  it('con 0 días devuelve la medianoche del inicio, incluso si no es hábil', () => {
    // Early-return: NO normaliza al siguiente día hábil. Contrato actual, fijado a propósito.
    const dtDomingo = new Date(2026, 6, 5, 15, 30, 45, 123);
    expect(addBusinessDays(dtDomingo, 0, SET_VACIO)).toEqual(dt(2026, 7, 5));
  });

  it('resta días hábiles cuando el valor es negativo', () => {
    // lunes 6 − 1 hábil = viernes 3
    expect(addBusinessDays(dt(2026, 7, 6), -1, SET_VACIO)).toEqual(dt(2026, 7, 3));
  });

  it('trunca fracciones', () => {
    expect(addBusinessDays(dt(2026, 7, 8), 1.9, SET_VACIO)).toEqual(dt(2026, 7, 9));
  });

  it('normaliza la hora del inicio a medianoche', () => {
    const dtConHora = new Date(2026, 6, 8, 23, 59, 59);
    expect(addBusinessDays(dtConHora, 1, SET_VACIO)).toEqual(dt(2026, 7, 9));
  });
});

describe('countBusinessDaysBetween', () => {
  it('inicio EXCLUSIVO, fin INCLUSIVO', () => {
    // miércoles 8 → viernes 10: cuenta 9 y 10, no el 8
    expect(countBusinessDaysBetween(dt(2026, 7, 8), dt(2026, 7, 10), SET_VACIO)).toBe(2);
  });

  it('el mismo día da 0', () => {
    expect(countBusinessDaysBetween(dt(2026, 7, 8), dt(2026, 7, 8), SET_VACIO)).toBe(0);
  });

  it('no cuenta fines de semana', () => {
    // miércoles 8 → lunes 13: 9, 10, 13 (11 y 12 son fin de semana)
    expect(countBusinessDaysBetween(dt(2026, 7, 8), dt(2026, 7, 13), SET_VACIO)).toBe(3);
  });

  it('no cuenta feriados', () => {
    // viernes 17 → martes 21 sin feriados: 20, 21 = 2; con el 20 feriado = 1
    expect(countBusinessDaysBetween(dt(2026, 7, 17), dt(2026, 7, 21), SET_VACIO)).toBe(2);
    expect(countBusinessDaysBetween(dt(2026, 7, 17), dt(2026, 7, 21), SET_20_JUL)).toBe(1);
  });

  it('es antisimétrico: invertir los argumentos solo cambia el signo', () => {
    // Esta es la propiedad que protege los conteos de mora del dashboard: el swap interno
    // hace que el "inicio exclusivo" se aplique siempre a la fecha MENOR, así que la
    // magnitud no depende del orden y no hay off-by-one entre "faltan N" y "hace N".
    const intAdelante = countBusinessDaysBetween(dt(2026, 7, 8), dt(2026, 7, 13), SET_VACIO);
    const intAtras    = countBusinessDaysBetween(dt(2026, 7, 13), dt(2026, 7, 8), SET_VACIO);
    expect(intAdelante).toBe(3);
    expect(intAtras).toBe(-3);
    expect(intAtras).toBe(-intAdelante);
  });

  it('ignora la hora del día en ambos extremos', () => {
    const dtDesde = new Date(2026, 6, 8, 23, 0, 0);
    const dtHasta = new Date(2026, 6, 10, 1, 0, 0);
    expect(countBusinessDaysBetween(dtDesde, dtHasta, SET_VACIO)).toBe(2);
  });
});

describe('diasHabilesRestantes', () => {
  it('cuenta los hábiles que faltan hasta el vencimiento', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 8, 10, 0, 0)); // miércoles 8, 10:00 local
    // Vencimiento = 8 + 5 hábiles = 15. Desde hoy (8) hasta el 15 hay 5 hábiles.
    expect(diasHabilesRestantes(dt(2026, 7, 8), 5, SET_VACIO)).toBe(5);
  });

  it('da negativo (mora) cuando el vencimiento ya pasó', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 22, 10, 0, 0)); // miércoles 22
    // Vencimiento = 8 + 5 hábiles = 15 → 5 hábiles de atraso al 22.
    expect(diasHabilesRestantes(dt(2026, 7, 8), 5, SET_VACIO)).toBe(-5);
  });

  it('da 0 el mismo día del vencimiento', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 8, 0, 0));
    expect(diasHabilesRestantes(dt(2026, 7, 8), 5, SET_VACIO)).toBe(0);
  });
});

describe('estadoSlaPorDiasRestantes', () => {
  it('sin deadline siempre es Abierta, incluso con días negativos', () => {
    expect(estadoSlaPorDiasRestantes(-9, false, 2)).toBe('Abierta');
  });

  it('días negativos con deadline es Vencida', () => {
    expect(estadoSlaPorDiasRestantes(-1, true, 2)).toBe('Vencida');
  });

  it('dentro del umbral (incluido el borde y el 0) es Por Vencer', () => {
    expect(estadoSlaPorDiasRestantes(0, true, 2)).toBe('Por Vencer');
    expect(estadoSlaPorDiasRestantes(2, true, 2)).toBe('Por Vencer');
  });

  it('por encima del umbral es Abierta', () => {
    expect(estadoSlaPorDiasRestantes(3, true, 2)).toBe('Abierta');
  });
});

describe('estadoSlaVariant', () => {
  it.each([
    ['Vencida', 'danger'],
    ['Por Vencer', 'warning'],
    ['Abierta', 'info'],
  ] as const)('%s → %s', (in_strEstado, in_strVariant) => {
    expect(estadoSlaVariant(in_strEstado)).toBe(in_strVariant);
  });
});
