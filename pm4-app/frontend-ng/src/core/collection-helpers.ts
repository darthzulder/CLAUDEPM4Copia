import type { CollectionOption } from './collection.types';

/**
 * Los 8 helpers **puros** que en React vivían dentro de `core/useCollection.ts`, junto al hook que
 * hace el HTTP. Se sacan al mismo archivo aparte y por el mismo motivo que los tipos (ver
 * `collection.types.ts`): en Angular el hook pasa a ser `CollectionService`, un `@Injectable` que
 * `inject(HttpClient)`, y estas funciones no tienen nada que ver con eso — se llaman desde las
 * pantallas para armar y leer opciones de select, sin tocar la red.
 *
 * Dejarlas en el servicio obligaría a `TestBed` para testear un `split('::')`, y a que cualquier
 * pantalla que solo quiere resolver una descripción arrastre el cliente HTTP.
 *
 * El código de cada función está **copiado sin cambios**: `resolvePath` sigue devolviendo `''` para
 * lo que no existe, `resolvePmql` sigue usando el mismo regex `\{\{(\w+)\}\}`, y `descOf` sigue
 * devolviendo `'—'` cuando no hay código. Su spec es el de React con paridad 1:1.
 */

// Camina rutas con puntos sobre el record crudo que devuelve PM4.
// Contrato: SIEMPRE devuelve string — los value/label de las opciones se comparan como texto, así
// que un `id: 7` numérico tiene que salir como `'7'`. Lo que no existe (o es null) sale como `''`,
// nunca como `'undefined'`/`'null'`.
export function resolvePath(in_dicObj: Record<string, unknown>, in_strPath: string): string {
  // Recorremos el path separado por puntos para bajar por el objeto
  return String(
    in_strPath.split('.').reduce<unknown>((in_objAcc, in_strKey) => {
      if (in_objAcc !== null && typeof in_objAcc === 'object') {
        return (in_objAcc as Record<string, unknown>)[in_strKey];
      }
      return undefined;
    }, in_dicObj) ?? '',
  );
}

// Arma la consulta PMQL reemplazando los placeholders `{{campo}}` con los valores del form.
// Un placeholder sin valor queda como cadena VACÍA, no como la palabra "undefined": si dejara el
// literal, PM4 filtraría por él y devolvería 0 registros en silencio en vez de fallar visiblemente.
export function resolvePmql(in_strTemplate: string, in_dicValues: Record<string, unknown>): string {
  // Reemplazamos cada placeholder por el valor correspondiente del form
  return in_strTemplate.replace(/\{\{(\w+)\}\}/g, (_, in_strKey) => String(in_dicValues[in_strKey] ?? ''));
}

// ─── Desambiguación de catálogos con código repetido ─────────────────────────
// Algunos catálogos PM4 repiten el mismo `value` (código) en más de un registro —
// p.ej. colección 16 "Producto SFC": "Garantía extendida" y "Copropiedades" comparten
// codigo_producto_sfc = "104". El picker del DS indexa sus opciones por `value`, así
// que si dos opciones comparten value, no puede distinguir cuál de las dos se clickeó
// (ambas terminan resolviendo al mismo registro interno). Se compone un value de UI único
// (código + etiqueta) para el picker, y se decodifica de vuelta al código real (lo que se
// guarda en el form / se envía a PM4) y a la etiqueta elegida (para el `_desc` compañero).
const UI_VALUE_SEP = '::';

export function toUiValue(in_strCode: string, in_strLabel: string): string {
  return `${in_strCode}${UI_VALUE_SEP}${in_strLabel}`;
}

// Código real a partir de un value de UI compuesto.
export function codeFromUiValue(in_strUiValue: string | undefined): string {
  return String(in_strUiValue ?? '').split(UI_VALUE_SEP)[0] ?? '';
}

// Etiqueta elegida (para el `_desc` compañero) a partir de un value de UI compuesto.
// El `slice(1).join(SEP)` no es adorno: reconstruye etiquetas que contienen el propio separador.
export function labelFromUiValue(in_strUiValue: string | undefined): string {
  return String(in_strUiValue ?? '').split(UI_VALUE_SEP).slice(1).join(UI_VALUE_SEP);
}

// Opciones con value de UI desambiguado — usar como `options` del picker cuando el
// catálogo puede repetir el mismo código en más de un registro.
export function toUiOptions(in_lstOptions: readonly CollectionOption[]): CollectionOption[] {
  return in_lstOptions.map((in_objOpt) => ({
    value: toUiValue(in_objOpt.value, in_objOpt.label),
    label: in_objOpt.label,
  }));
}

// Reconstruye el value de UI a partir del código + descripción ya guardados en el form
// (p.ej. al precargar `task.data`), para preseleccionar el registro correcto entre
// duplicados. Sin `_desc` (dato guardado antes de este fix) cae al primer registro que
// tenga ese código — mismo comportamiento que había antes de desambiguar.
export function uiValueFromCode(
  in_lstOptions: readonly CollectionOption[],
  in_strCode: string | undefined,
  in_strDesc: string | undefined,
): string {
  if (!in_strCode) return '';
  const objMatch =
    (in_strDesc
      ? in_lstOptions.find((in_objOpt) => in_objOpt.value === in_strCode && in_objOpt.label === in_strDesc)
      : undefined) ?? in_lstOptions.find((in_objOpt) => in_objOpt.value === in_strCode);
  return objMatch ? toUiValue(objMatch.value, objMatch.label) : '';
}

// Resuelve la DESCRIPCIÓN (label) de un código contra las opciones de una colección.
// Fuente única que reemplaza las copias locales de desc()/descOpt() en las pantallas.
// Fallback al propio código si no hay match; '—' cuando no hay código (para render de
// solo lectura). Ojo con la asimetría, que es deliberada: acá el vacío es '—' porque esto
// PINTA en pantalla, mientras que `sincronizarDesc` escribe '' porque eso VIAJA a PM4.
export function descOf(in_lstOptions: readonly CollectionOption[], in_strCode: string | undefined): string {
  if (!in_strCode) return '—';
  return in_lstOptions.find((in_objOpt) => in_objOpt.value === in_strCode)?.label ?? in_strCode;
}
