/**
 * Sello de fecha/hora **en zona Colombia** con el formato que espera la SFC
 * (`YYYY-MM-DDThh:mm:ss`), independiente de la zona horaria del navegador o del contenedor.
 *
 * Port literal de `hoyBogotaISO()` de `FormularioSuperintendencia.tsx`. Vive en su propio archivo, al
 * lado de la pantalla, y **no** en `core/fecha-hora.ts`, por dos razones:
 *
 * 1. **Es otro formato y otra zona.** Los sellos de `core/fecha-hora.ts` son `'YYYY-MM-DD HH:mm'` en
 *    hora **local** y son para *mostrar* (`qd_strDraftDate` se lee en pantalla). Este es `…Thh:mm:ss`
 *    fijo en `America/Bogota` y es lo que **viaja a la SFC** en `fecha_actualizacion`/`fecha_cierre`.
 *    Meterlos en el mismo módulo invitaría a que alguien "unifique" dos contratos que no son el mismo.
 * 2. **Hoy tiene un solo consumidor**, y el umbral de reúso del proyecto es ≥3. Cuando aparezca el
 *    segundo, se mueve a `core/` con su spec.
 *
 * ── Por qué `Intl.DateTimeFormat` y no aritmética de UTC-5 ─────────────────────────────────────
 * Colombia no aplica horario de verano, así que un `-5` a mano daría el mismo resultado **hoy**. Pero
 * el `Intl` no es defensa contra un DST que no existe: es lo que hace que el sello sea correcto
 * **corriendo en cualquier zona**, que es el caso real (el contenedor de Render corre en UTC y el
 * navegador del gestor en `America/Bogota`). Con aritmética sobre `getHours()` el resultado dependería
 * de dónde corre el código.
 *
 * ⚠ `hourCycle: 'h23'` es obligatorio y no cosmético: sin él, la medianoche sale como `24:00:00` en
 * varias implementaciones (`h24`), y `2026-08-17T24:00:00` no es una hora válida para la SFC. Va con
 * caso de test.
 *
 * @param in_dtValue El instante a sellar. Por defecto, ahora. Es parámetro **para poder testearlo**:
 *   la función original leía `new Date()` directo y no había forma de aseverar un valor conocido.
 */
export function selloBogotaSfc(in_dtValue: Date = new Date()): string {
  const cllPartes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(in_dtValue);

  const dicPartes: Record<string, string> = {};
  for (const objParte of cllPartes) dicPartes[objParte.type] = objParte.value;

  // Acceso por índice y no por punto: `dicPartes` es un `Record`, y `noPropertyAccessFromIndexSignature`
  // (activo en el tsconfig del proyecto) exige la forma explícita para lo que viene de un index signature.
  return (
    `${dicPartes['year']}-${dicPartes['month']}-${dicPartes['day']}` +
    `T${dicPartes['hour']}:${dicPartes['minute']}:${dicPartes['second']}`
  );
}
