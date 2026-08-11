// Selección de la tarea "activa" de un caso PM4, extraída de routes/pm4.routes.ts para
// poder testearla: es la única lógica de decisión real en un archivo que por lo demás es
// proxy puro, y equivocarse acá se manifiesta como "se abrió la pantalla de otra tarea".

/** Estados que PM4 usa para una tarea que todavía está en la bandeja de alguien. */
export const CLL_ESTADOS_ACTIVOS = ['ACTIVE', 'OPEN', 'IN_PROGRESS'] as const;

/**
 * Elige la tarea activa de la lista que devolvió PM4 para un `process_request_id`.
 *
 * Prefiere la primera cuyo `status` esté en `CLL_ESTADOS_ACTIVOS` (comparación
 * case-insensitive, porque PM4 no es consistente en el casing entre endpoints).
 *
 * ⚠️ **Fallback deliberado:** si NINGUNA tarea matchea, devuelve la primera de la lista en
 * vez de `undefined`. Se conserva el comportamiento histórico — el llamador ya consulta con
 * `status: 'ACTIVE'`, así que en la práctica la lista viene pre-filtrada y este caso no se
 * da. Pero significa que, si PM4 devolviera solo tareas cerradas, se abriría una cerrada en
 * lugar de responder 404. Queda fijado por test para que sea una decisión visible y no una
 * sorpresa; cambiarlo a `undefined` es un cambio de comportamiento del endpoint.
 *
 * Devuelve `undefined` solo si la lista está vacía (ahí el endpoint responde 404).
 */
export function pickActiveTask<T extends Record<string, unknown>>(in_lstTasks: readonly T[]): T | undefined {
  return in_lstTasks.find((in_dicTask) =>
    (CLL_ESTADOS_ACTIVOS as readonly string[]).includes(String(in_dicTask['status'] ?? '').toUpperCase()),
  ) ?? in_lstTasks[0];
}
