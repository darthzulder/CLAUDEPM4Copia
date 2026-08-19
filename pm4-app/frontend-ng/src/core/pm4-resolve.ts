// Resolver de IDs PM4 — traduce una clave estable (slug) al ID numérico de la instancia
// PM4 actual, usando pm4-registry.json como fuente de verdad. Si el slug no está en el
// registro, cae al id hardcodeado que ya tenía el código (fallback) y avisa por consola —
// esto permite migrar archivo por archivo sin romper nada a mitad de camino.
//
// Ver `config/pm4-registry.types.ts` para el shape del registro y
// `pm4-app/scripts/pm4-registry-sync.mjs` para cómo se genera/verifica contra PM4 real.
//
// ── Por qué esto NO es un servicio inyectable, a diferencia del resto de la Fase 3 ──────────
// Es una función pura sobre un JSON estático: no hay estado, no hay HTTP, no hay nada que
// mockear. Volverlo `@Injectable` obligaría a `inject()` a cada llamador —incluidos los
// `variables.ts` de cada pantalla, que son módulos de datos evaluados al importarse, fuera de
// todo contexto de inyección— y no compraría nada. La regla 6 de pm4-app/CLAUDE.md pide que
// **ningún ID esté hardcodeado suelto**, no que la resolución pase por DI.
//
// Portado sin cambios de lógica desde `frontend/src/core/pm4Resolve.ts`. El único ajuste es de
// acceso: `noPropertyAccessFromIndexSignature` está activo en el tsconfig de este workspace, así
// que un `Record<string, T>` se indexa con `['slug']` y no con `.slug` (verificado: el acceso
// por punto es error TS4111 de compilación, no una preferencia de estilo).

import objRegistryData from '../config/pm4-registry.json';
import type { Pm4Registry } from '../config/pm4-registry.types';

const objRegistry = objRegistryData as Pm4Registry;

export function resolveCollectionId(in_strSlug: string, in_intFallback: number): number {
  const objEntry = objRegistry.collections[in_strSlug];
  if (!objEntry) {
    console.warn(`[pm4Resolve] slug de colección "${in_strSlug}" no está en el registro — usando fallback hardcodeado ${in_intFallback}`);
    return in_intFallback;
  }
  return objEntry.id;
}

export function resolveScriptId(in_strSlug: string, in_intFallback: number): number {
  const objEntry = objRegistry.scripts[in_strSlug];
  if (!objEntry) {
    console.warn(`[pm4Resolve] slug de script "${in_strSlug}" no está en el registro — usando fallback hardcodeado ${in_intFallback}`);
    return in_intFallback;
  }
  return objEntry.id;
}

export function resolveProcessEvent(
  in_strSlug: string,
  in_objFallback: { processId: number; eventId: string },
): { processId: number; eventId: string } {
  const objEntry = objRegistry.processes[in_strSlug];
  if (!objEntry) {
    console.warn(`[pm4Resolve] slug de proceso "${in_strSlug}" no está en el registro — usando fallback`);
    return in_objFallback;
  }
  return { processId: objEntry.processId, eventId: objEntry.eventId };
}
