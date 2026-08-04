// Resolver de IDs PM4 — traduce una clave estable (slug) al ID numérico de la instancia
// PM4 actual, usando pm4-registry.json como fuente de verdad. Si el slug no está en el
// registro, cae al id hardcodeado que ya tenía el código (fallback) y avisa por consola —
// esto permite migrar archivo por archivo sin romper nada a mitad de camino.
//
// Ver pm4-app/frontend/src/config/pm4Registry.types.ts para el shape del registro y
// pm4-app/scripts/pm4-registry-sync.mjs para cómo se genera/verifica contra PM4 real.

import pm4RegistryData from '../config/pm4-registry.json';
import type { Pm4Registry } from '../config/pm4Registry.types';

const registry = pm4RegistryData as Pm4Registry;

export function resolveCollectionId(in_strSlug: string, in_intFallback: number): number {
  const objEntry = registry.collections[in_strSlug];
  if (!objEntry) {
    console.warn(`[pm4Resolve] slug de colección "${in_strSlug}" no está en el registro — usando fallback hardcodeado ${in_intFallback}`);
    return in_intFallback;
  }
  return objEntry.id;
}

export function resolveScriptId(in_strSlug: string, in_intFallback: number): number {
  const objEntry = registry.scripts[in_strSlug];
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
  const objEntry = registry.processes[in_strSlug];
  if (!objEntry) {
    console.warn(`[pm4Resolve] slug de proceso "${in_strSlug}" no está en el registro — usando fallback`);
    return in_objFallback;
  }
  return { processId: objEntry.processId, eventId: objEntry.eventId };
}
