import { describe, expect, it } from 'vitest';
import { selloBogotaSfc } from './hoy-bogota';

/**
 * Spec de `selloBogotaSfc()`. Existe por la promesa explícita de su docstring —"⚠ `hourCycle: 'h23'`
 * es obligatorio y no cosmético… **Va con caso de test**"— y porque el sello viaja a la SFC en
 * `fecha_actualizacion`/`fecha_cierre`: un formato mal armado no lo atrapa nada en la pantalla, lo
 * rechaza SmartSupervision en producción.
 *
 * ── ⚠ Los `Date` se construyen desde UTC, a propósito ───────────────────────────────────────────
 * Todos los instantes se escriben como `new Date('…Z')`, nunca como `new Date(2026, 7, 17, 0, 0)`.
 * El segundo constructor interpreta sus argumentos en la zona **del proceso**, así que el mismo
 * literal significaría otro instante en el runner (UTC) que en la máquina del gestor
 * (`America/Bogota`) y el caso se volvería dependiente del entorno — que es justo el defecto contra
 * el que existe la función. Con el sufijo `Z` el instante es absoluto y el único desplazamiento es
 * el que hace la función.
 *
 * Colombia es UTC-5 fijo (sin DST), así que la cuenta de cada caso es "restar 5 horas".
 */
describe('selloBogotaSfc', () => {
  it('sella en hora Colombia con el formato YYYY-MM-DDThh:mm:ss que espera la SFC', () => {
    // 2026-08-17 20:33:07Z → 15:33:07 en Bogotá.
    expect(selloBogotaSfc(new Date('2026-08-17T20:33:07Z'))).toBe('2026-08-17T15:33:07');
  });

  it('⚠ la medianoche de Bogotá sale 00:00:00 y no 24:00:00 (el caso de `hourCycle: h23`)', () => {
    // **Este es el caso que la docstring promete.** 2026-08-17 05:00:00Z es exactamente la
    // medianoche del 17 en Bogotá. Sin `hourCycle: 'h23'`, varias implementaciones de `Intl`
    // formatean esa hora como `24:00:00` (ciclo `h24`) y el sello sale `2026-08-17T24:00:00`, que
    // **no es una hora válida** para la SFC. Quitar esa opción de la implementación pone este caso
    // rojo nombrando el valor; los otros cuatro siguen verdes, porque ninguno cae en la medianoche.
    expect(selloBogotaSfc(new Date('2026-08-17T05:00:00Z'))).toBe('2026-08-17T00:00:00');
  });

  it('⚠ retrocede el día cuando el instante UTC es de madrugada: es el mismo bug con otra cara', () => {
    // 2026-08-17 02:15:30Z todavía es el **16** en Bogotá (21:15:30). Es el caso que atrapa una
    // "simplificación" a `toISOString().slice(0, 19)`, que devolvería `2026-08-17T02:15:30` —
    // formato válido, día equivocado, y una fecha de cierre adelantada un día ante el regulador.
    expect(selloBogotaSfc(new Date('2026-08-17T02:15:30Z'))).toBe('2026-08-16T21:15:30');
  });

  it('rellena mes, día, hora, minuto y segundo a dos dígitos', () => {
    // El `2-digit` de las cinco partes, en un instante donde **todas** son de un solo dígito.
    // 2026-01-02 08:03:04Z → 03:03:04 del 2 de enero en Bogotá.
    expect(selloBogotaSfc(new Date('2026-01-02T08:03:04Z'))).toBe('2026-01-02T03:03:04');
  });

  it('no interpola la parte literal: no queda ni coma, ni "a. m.", ni barras', () => {
    // Guarda de formato, no de valor. `formatToParts` emite además partes `literal` (la coma y los
    // espacios que el locale mete entre fecha y hora), y la implementación las descarta al indexar
    // por `type`. Si alguien reemplazara el armado por un `format()` plano, el string traería `', '`
    // o un `a. m.` según el locale y este caso lo nombraría.
    const strSello = selloBogotaSfc(new Date('2026-08-17T20:33:07Z'));

    expect(strSello).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    expect(strSello).toHaveLength(19);
  });

  it('el default es "ahora", y el parámetro existe solo para poder aseverar un valor conocido', () => {
    // No se asevera el valor —sería aseverar el reloj— sino la **forma**, que es lo único que la
    // firma promete cuando no se le pasa nada. El caso está para que borrar el default (`in_dtValue:
    // Date`) no pase inadvertido: la pantalla la llama sin argumentos en `precargar()`.
    expect(selloBogotaSfc()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
