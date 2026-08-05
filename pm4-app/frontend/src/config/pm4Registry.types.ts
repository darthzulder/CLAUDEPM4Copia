// Tipos del registro de IDs PM4 — ver pm4-registry.json y core/pm4Resolve.ts.
//
// El registro traduce una CLAVE ESTABLE (uuid nativo de PM4 cuando existe — screens/
// scripts —, o un slug simbólico del proyecto cuando PM4 no lo tiene — collections/
// processes) al ID NUMÉRICO de la instancia PM4 actual (PM4_BASE_URL). Cambiar de
// instancia = editar este archivo, no perseguir IDs por +15 archivos de código.
//
// Ver MIGRACION_PANTALLAS.md (raíz del repo) para el mecanismo paralelo de id-mapping.json
// usado al migrar screens completas entre instancias.

export interface Pm4RegistryCollectionEntry {
  /** ID numérico de la colección en la instancia PM4 actual. */
  id: number;
  /** Título/nombre exacto de la colección en PM4 — usado por pm4-registry-sync.mjs
   *  para detectar drift cuando el id ya no corresponde al título esperado. */
  title: string;
  /** Nota libre — motivo del mapeo, colecciones compartidas legítimas, etc. */
  note?: string;
}

export interface Pm4RegistryScriptEntry {
  /** ID numérico del script en la instancia PM4 actual. */
  id: number;
  /** uuid nativo del script en PM4 — solo se conoce si se vio embebido en
   *  watchers[].script de alguna screen exportada (GET /screens/{id}/export).
   *  Si está ausente, este script no puede resolverse automáticamente por uuid
   *  y su id debe verificarse manualmente al migrar de instancia. */
  uuid?: string;
  /** Título del script en PM4. */
  title: string;
  note?: string;
}

export interface Pm4RegistryProcessEntry {
  /** ID numérico del proceso (Web Entry) en la instancia PM4 actual. */
  processId: number;
  /** ID del nodo/evento BPMN (ej. 'node_661') — NO es numérico, no convertir a number. */
  eventId: string;
  /** Título del proceso en PM4. */
  title: string;
  /**
   * Nombre del start event BPMN (ej. "Comenzar caso por WE") — permite que
   * pm4-registry-sync.mjs resuelva `eventId` automáticamente por nombre al migrar de
   * instancia (mismo supuesto que collections/processes: el nombre se preserva, el id
   * numérico interno del nodo no está garantizado). Sin este campo, el eventId solo se
   * verifica (no se auto-resuelve) si cambia.
   */
  eventName?: string;
  note?: string;
}

export interface Pm4Registry {
  /** PM4_BASE_URL contra el que se generó este registro — solo documentación,
   *  no se usa para resolver en runtime (la fuente de verdad de la instancia
   *  activa sigue siendo PM4_BASE_URL en .env). */
  instance: string;
  /** Fecha ISO de la última vez que pm4-registry-sync.mjs escribió este archivo. */
  generatedAt: string;
  collections: Record<string, Pm4RegistryCollectionEntry>;
  scripts: Record<string, Pm4RegistryScriptEntry>;
  processes: Record<string, Pm4RegistryProcessEntry>;
}
