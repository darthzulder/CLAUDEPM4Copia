import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registry from '../config/pm4-registry.json';
import { resolveCollectionId, resolveProcessEvent, resolveScriptId } from './pm4Resolve';

// Estos tests cubren la rama de FALLBACK, que hoy está muerta en producción (los 37+1+1
// slugs del registro resuelven) pero se activa garantizado en la próxima migración de
// instancia PM4 — justo cuando nadie la está mirando. No hace falta mockear el JSON: basta
// pedir un slug que no existe.

const STR_SLUG_INEXISTENTE = '__slug-que-no-existe-jamas__';

let objWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  objWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveCollectionId', () => {
  it('devuelve el id del registro cuando el slug existe', () => {
    // 'requestType' es una entrada real; se lee del propio JSON para que el test no se
    // rompa cuando el id cambie de instancia (que es justamente lo normal).
    expect(resolveCollectionId('requestType', 999)).toBe(registry.collections.requestType.id);
    expect(objWarn).not.toHaveBeenCalled();
  });

  it('cae al fallback y avisa por consola cuando el slug no está', () => {
    expect(resolveCollectionId(STR_SLUG_INEXISTENTE, 777)).toBe(777);
    expect(objWarn).toHaveBeenCalledTimes(1);
    expect(String(objWarn.mock.calls[0][0])).toContain(STR_SLUG_INEXISTENTE);
  });
});

describe('resolveScriptId', () => {
  it('devuelve el id del registro cuando el slug existe', () => {
    expect(resolveScriptId('similarCasesQuejas', 999))
      .toBe(registry.scripts.similarCasesQuejas.id);
    expect(objWarn).not.toHaveBeenCalled();
  });

  it('cae al fallback y avisa cuando el slug no está', () => {
    expect(resolveScriptId(STR_SLUG_INEXISTENTE, 555)).toBe(555);
    expect(objWarn).toHaveBeenCalledTimes(1);
  });
});

describe('resolveProcessEvent', () => {
  const OBJ_FALLBACK = { processId: 111, eventId: 'node_fallback' };

  it('devuelve processId y eventId del registro cuando el slug existe', () => {
    const objEntry = registry.processes.quejasDirectasWebEntry;
    expect(resolveProcessEvent('quejasDirectasWebEntry', OBJ_FALLBACK)).toEqual({
      processId: objEntry.processId,
      eventId: objEntry.eventId,
    });
    expect(objWarn).not.toHaveBeenCalled();
  });

  it('cae al fallback completo y avisa cuando el slug no está', () => {
    expect(resolveProcessEvent(STR_SLUG_INEXISTENTE, OBJ_FALLBACK)).toEqual(OBJ_FALLBACK);
    expect(objWarn).toHaveBeenCalledTimes(1);
  });

  it('devuelve solo processId/eventId, sin arrastrar eventName ni title del registro', () => {
    // El registro guarda eventName/title para detectar drift, pero eso NO debe viajar al
    // llamador: se usa para armar la URL del proceso.
    const objResult = resolveProcessEvent('quejasDirectasWebEntry', OBJ_FALLBACK);
    expect(Object.keys(objResult).sort()).toEqual(['eventId', 'processId']);
  });
});
