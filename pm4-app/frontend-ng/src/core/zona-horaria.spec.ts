/**
 * Guarda de zona horaria de toda la suite.
 *
 * Portado de `frontend/src/core/fechaHora.test.ts`, donde el mismo test existe desde que la
 * suite de React fijó `TZ` en `vitest.config.ts`. Acá la TZ se fija distinto —en el script
 * npm, con `cross-env`, porque `@angular/build:unit-test` no expone un `env` propio como
 * opción del builder— así que la guarda importa **más** que en React: es lo único que detecta
 * si alguien edita el script `test` de package.json y saca la variable.
 *
 * Vive en su propio archivo, y no colgado del spec de fechas, precisamente porque en Angular
 * la TZ ya no es una línea de la config de test sino del package.json: el archivo dedicado la
 * hace visible como requisito del workspace, no como detalle de un módulo de fechas que
 * todavía no está portado (llega en la Fase 3).
 *
 * Sin esto, cualquier aserción de fecha depende de la zona de la máquina: pasa en local
 * (Colombia, UTC-5) y falla en CI (UTC). Se elige America/Bogota y no UTC porque es la zona
 * de negocio y porque no tiene DST, así que es determinista todo el año — de ahí que el test
 * compruebe enero y julio: si alguien pusiera una zona con horario de verano, los dos valores
 * dejarían de coincidir y este test lo nombra.
 *
 * ── El comando correcto es `npm run test`, y `npx ng test` NO lo es ─────────────────────────────
 * Consecuencia práctica de que la TZ viva en el script npm: invocar el builder directo
 * (`npx ng test`) **saltea el `cross-env`** y este test se pone rojo con `240` (UTC-4, la zona real
 * de esta máquina). No es un fallo de la suite, es la guarda haciendo exactamente su trabajo.
 *
 * Y el atajo que parece equivalente tampoco lo es: prefijar `TZ=America/Bogota npx ng test` en el
 * shell **no alcanza**, porque la variable no llega a los workers de Vitest —solo al proceso padre—
 * mientras que `cross-env` sí se propaga. Verificado: mismo árbol, `npm run test` da 143/143 y
 * `TZ=... npx ng test` deja este único test en rojo, 4 corridas de 4. Vale saberlo antes de
 * diagnosticar un fallo de zona horaria que en realidad es un fallo de invocación.
 */
describe('guardia de zona horaria', () => {
  it('la suite corre en UTC-5 (America/Bogota, sin DST)', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(300); // 300 min = UTC-5
    expect(new Date(2026, 6, 15).getTimezoneOffset()).toBe(300); // igual en julio: no hay DST
  });
});
