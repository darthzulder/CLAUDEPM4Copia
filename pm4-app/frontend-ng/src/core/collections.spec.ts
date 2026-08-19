import { describe, expect, it } from 'vitest';
import objRegistry from '../config/pm4-registry.json';
import { GLOBAL_COLLECTIONS } from './collections';

/**
 * Portado de `frontend/src/core/collections.test.ts` con **paridad 1:1 de casos**; solo cambian las
 * rutas de import. No hace falta `TestBed`: es la consecuencia práctica de haber sacado
 * `CollectionDef` a `collection.types.ts`, porque el módulo bajo prueba ya no arrastra el servicio
 * HTTP por la cadena de imports.
 *
 * Test-GUARDA, no de comportamiento: `GLOBAL_COLLECTIONS` es data, y lo que puede romperse en
 * silencio es su relación con pm4-registry.json. Cada entrada resuelve su id vía
 * resolveCollectionId(slug, fallback) al importar el módulo; si un slug desaparece del
 * registro (típico al migrar de instancia PM4), el resolver cae al fallback hardcodeado y
 * solo avisa por console.warn — que en producción nadie mira. Esto lo convierte en un test.
 */

const lstEntries = Object.entries(GLOBAL_COLLECTIONS);

describe('GLOBAL_COLLECTIONS', () => {
  it('tiene entradas (el módulo no quedó vacío por un refactor)', () => {
    expect(lstEntries.length).toBeGreaterThan(30);
  });

  it.each(lstEntries)('%s tiene un id numérico válido', (_strKey, in_objDef) => {
    expect(typeof in_objDef.id).toBe('number');
    expect(Number.isInteger(in_objDef.id)).toBe(true);
    expect(in_objDef.id).toBeGreaterThan(0);
  });

  it.each(lstEntries)('%s tiene labelField y valueField no vacíos', (_strKey, in_objDef) => {
    // Si alguno viniera vacío, resolvePath devolvería '' para todos los records y el select
    // quedaría lleno de opciones en blanco — un fallo visual difícil de rastrear.
    expect(in_objDef.labelField.trim()).not.toBe('');
    expect(in_objDef.valueField.trim()).not.toBe('');
  });

  it('un pmqlTemplate CON placeholders declara también dependsOn', () => {
    // Solo aplica a las cascadas: un template con {{campo}} y sin dependsOn no se recargaría
    // nunca al cambiar el campo padre y la cascada quedaría muda. Los pmqlTemplate ESTÁTICOS
    // (p. ej. 'data.frm_pais = "CO"') son filtros constantes y no necesitan dependsOn.
    const lstCascadas = lstEntries.filter(
      ([, objDef]) => 'pmqlTemplate' in objDef && /\{\{\w+\}\}/.test(objDef.pmqlTemplate ?? ''),
    );
    expect(lstCascadas.length).toBeGreaterThan(0); // que el filtro siga encontrando casos
    for (const [strKey, objDef] of lstCascadas) {
      expect(
        ('dependsOn' in objDef) && objDef.dependsOn,
        `${strKey} tiene un pmqlTemplate con placeholders pero no declara dependsOn`,
      ).toBeTruthy();
    }
  });

  it('no aparecen NUEVAS colecciones compartiendo el mismo id de PM4', () => {
    // Compartir id no es fatal (dos vistas pueden usar el mismo catálogo), pero un duplicado
    // nuevo casi siempre es un copy-paste o un id mal resuelto. Hoy no hay ninguno conocido
    // (los duplicados históricos eran todos de FAST-FLOW, ya eliminado); el set queda vacío
    // para que el test avise de cualquiera que aparezca de aquí en adelante.
    const setDuplicadosConocidos = new Set<number>([]);
    const dicPorId = new Map<number, string[]>();
    for (const [strKey, objDef] of lstEntries) {
      dicPorId.set(objDef.id, [...(dicPorId.get(objDef.id) ?? []), strKey]);
    }
    const lstNuevos = [...dicPorId.entries()]
      .filter(([intId, lstKeys]) => lstKeys.length > 1 && !setDuplicadosConocidos.has(intId))
      .map(([intId, lstKeys]) => `id ${intId}: ${lstKeys.join(', ')}`);
    expect(lstNuevos, `duplicados nuevos:\n${lstNuevos.join('\n')}`).toEqual([]);
  });
});

describe('sincronía con pm4-registry.json', () => {
  it('el registro tiene todas las colecciones que el código espera resolver', () => {
    // 52 llamadas a resolveCollectionId en collections.ts ↔ 52 claves en el registro.
    // Si el número baja, algún slug dejó de estar y su id vino del fallback.
    expect(Object.keys(objRegistry.collections).length).toBeGreaterThanOrEqual(lstEntries.length);
  });

  it.each(lstEntries)('el id de %s coincide con el del registro (no viene del fallback)', (strKey, in_objDef) => {
    // El slug del registro no siempre es idéntico a la clave del objeto, así que se valida
    // por VALOR: el id resuelto debe existir en el registro. Un id que no esté en ninguna
    // entrada significa que salió de un fallback hardcodeado.
    const setIdsRegistro = new Set(Object.values(objRegistry.collections).map((in_objEntry) => in_objEntry.id));
    expect(setIdsRegistro.has(in_objDef.id), `${strKey} → id ${in_objDef.id} no está en pm4-registry.json`).toBe(true);
  });
});
