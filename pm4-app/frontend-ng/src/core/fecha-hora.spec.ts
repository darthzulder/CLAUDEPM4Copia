import { afterEach, describe, expect, it, vi } from 'vitest';
import { selloFechaHora, selloFechaHoraDesdeIso } from './fecha-hora';

/**
 * Portado de `frontend/src/core/fechaHora.test.ts` con **paridad 1:1 de casos**, menos uno:
 * la `describe('guardia de zona horaria')` que ese archivo abría no se duplica acá porque ya
 * vive en [`zona-horaria.spec.ts`](./zona-horaria.spec.ts), y con más razón de existir — en
 * Angular la TZ se fija en el script npm (`cross-env`), no en `vitest.config.ts`, así que es
 * un requisito del workspace entero y no de este módulo.
 *
 * Todo lo de abajo **sigue dependiendo** de que la suite corra en America/Bogota (UTC-5): los
 * casos de conversión ISO aseveran offsets concretos. Si esa guarda se cae, estos tests fallan
 * con un off-by-hours confuso; por eso el orden importa y por eso la guarda está en su propio
 * archivo en vez de acá.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('selloFechaHora', () => {
  it('formatea como "YYYY-MM-DD HH:mm"', () => {
    expect(selloFechaHora(new Date(2026, 7, 10, 15, 8, 16))).toBe('2026-08-10 15:08');
  });

  it('rellena mes, día, hora y minuto con cero a la izquierda', () => {
    expect(selloFechaHora(new Date(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02 03:04');
  });

  it('usa medianoche como 00:00, no 24:00', () => {
    expect(selloFechaHora(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01 00:00');
  });

  it('sin argumento usa el instante actual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 10, 15, 8, 16));
    expect(selloFechaHora()).toBe('2026-08-10 15:08');
  });

  it('descarta segundos (no los redondea)', () => {
    expect(selloFechaHora(new Date(2026, 7, 10, 15, 8, 59))).toBe('2026-08-10 15:08');
  });
});

describe('selloFechaHoraDesdeIso', () => {
  it('convierte un ISO en UTC a hora local', () => {
    // Este es el comportamiento documentado del módulo: PM4 manda UTC y la pantalla muestra
    // hora local. 20:08 UTC = 15:08 en Bogotá (UTC-5).
    expect(selloFechaHoraDesdeIso('2026-08-10T20:08:16+00:00')).toBe('2026-08-10 15:08');
  });

  it('acepta el sufijo Z igual que +00:00', () => {
    expect(selloFechaHoraDesdeIso('2026-08-10T20:08:16Z')).toBe('2026-08-10 15:08');
  });

  it('la conversión puede cambiar el DÍA, no solo la hora', () => {
    // 02:30 UTC del 11 es 21:30 del 10 en Bogotá. Es la trampa real de mostrar fechas de
    // PM4: el sello local puede caer un día antes que el ISO recibido.
    expect(selloFechaHoraDesdeIso('2026-08-11T02:30:00Z')).toBe('2026-08-10 21:30');
  });

  it('respeta un offset explícito distinto de UTC', () => {
    // 20:08 en UTC-3 = 23:08 UTC = 18:08 en Bogotá.
    expect(selloFechaHoraDesdeIso('2026-08-10T20:08:16-03:00')).toBe('2026-08-10 18:08');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['cadena vacía', ''],
  ])('devuelve cadena vacía para %s', (_strCaso, in_genValor) => {
    expect(selloFechaHoraDesdeIso(in_genValor)).toBe('');
  });

  it('devuelve cadena vacía si la fecha no es válida', () => {
    expect(selloFechaHoraDesdeIso('no-es-una-fecha')).toBe('');
  });
});
