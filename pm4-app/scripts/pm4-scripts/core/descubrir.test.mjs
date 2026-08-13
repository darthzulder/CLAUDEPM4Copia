import { describe, it, expect } from 'vitest';
import { extraerScriptRefs, extraerSubprocesos, descubrirArbol, resolverUuidsVigilados } from './descubrir.mjs';

/** Fragmento de BPMN con la forma real que devuelve PM4. */
const STR_BPMN_31 = `<?xml version="1.0"?>
<bpmn:definitions>
  <bpmn:scriptTask id="node_7" name="T01 Recibir queja" pm:scriptRef="69"><bpmn:incoming/></bpmn:scriptTask>
  <bpmn:scriptTask id="node_120" name="T03 Priorizar" pm:scriptRef="71"></bpmn:scriptTask>
  <bpmn:scriptTask id="node_144" name="T04 Calcular SLA" pm:scriptRef="71"></bpmn:scriptTask>
  <bpmn:scriptTask id="node_92" name="Sin script" pm:scriptRef=""></bpmn:scriptTask>
  <bpmn:callActivity id="node_359" name="SP1" calledElement="ProcessId-32" pm:config="{&#34;processId&#34;:32}"></bpmn:callActivity>
  <bpmn:callActivity id="node_364" name="SP2" calledElement="ProcessId-33"></bpmn:callActivity>
</bpmn:definitions>`;

describe('extraerScriptRefs', () => {
  it('saca los ids de los scriptTask', () => {
    expect(extraerScriptRefs(STR_BPMN_31)).toEqual([69, 71]);
  });

  it('descarta los scriptRef vacíos (tarea declarada sin script)', () => {
    expect(extraerScriptRefs('<x pm:scriptRef=""/>')).toEqual([]);
  });

  it('deduplica cuando dos nodos usan el mismo script', () => {
    // node_120 y node_144 comparten el 71: debe aparecer una sola vez.
    expect(extraerScriptRefs(STR_BPMN_31).filter((n) => n === 71)).toHaveLength(1);
  });

  it('devuelve vacío para un BPMN sin scriptTask', () => {
    expect(extraerScriptRefs('<bpmn:definitions/>')).toEqual([]);
  });
});

describe('extraerSubprocesos', () => {
  it('saca los ids de los callActivity', () => {
    expect(extraerSubprocesos(STR_BPMN_31)).toEqual([32, 33]);
  });

  it('devuelve vacío si el proceso no llama subprocesos', () => {
    expect(extraerSubprocesos('<bpmn:definitions/>')).toEqual([]);
  });
});

describe('descubrirArbol', () => {
  /** Árbol de prueba: 31 → 32, 33; 33 → 35. Refleja la forma real del proceso 31. */
  const DIC_BPMN = {
    31: STR_BPMN_31,
    32: '<x pm:scriptRef="83"/>',
    33: '<x pm:scriptRef="80"/><y calledElement="ProcessId-35"/>',
    35: '<x pm:scriptRef="78"/><y pm:scriptRef="71"/>',
  };
  const fnTraer = async (intId) => {
    if (!DIC_BPMN[intId]) throw new Error('404');
    return DIC_BPMN[intId];
  };

  it('recorre el árbol completo y junta los scripts de todos los niveles', async () => {
    const objRes = await descubrirArbol(31, fnTraer);
    expect(objRes.scriptIds).toEqual([69, 71, 78, 80, 83]);
    expect(objRes.procesos).toEqual([31, 32, 33, 35]);
  });

  it('no repite un script que aparece en dos procesos distintos', async () => {
    // El 71 está en el 31 y en el 35.
    const objRes = await descubrirArbol(31, fnTraer);
    expect(objRes.scriptIds.filter((n) => n === 71)).toHaveLength(1);
  });

  it('sigue adelante si un subproceso no se puede leer', async () => {
    const objRes = await descubrirArbol(31, async (intId) => {
      if (intId === 33) throw new Error('borrado');
      return DIC_BPMN[intId] ?? '<x/>';
    });
    // Se pierden los del 33 y su rama, pero los demás se descubren igual.
    expect(objRes.scriptIds).toContain(69);
    expect(objRes.scriptIds).toContain(83);
    expect(objRes.scriptIds).not.toContain(80);
  });

  it('no cuelga ante un ciclo entre subprocesos', async () => {
    const fnCiclico = async (intId) => (intId === 1
      ? '<y calledElement="ProcessId-2"/>'
      : '<y calledElement="ProcessId-1"/><x pm:scriptRef="9"/>');
    const objRes = await descubrirArbol(1, fnCiclico);
    expect(objRes.procesos).toEqual([1, 2]);
    expect(objRes.scriptIds).toEqual([9]);
  });
});

describe('resolverUuidsVigilados', () => {
  const LST_REMOTOS = [
    { id: 69, uuid: 'u-69' },
    { id: 71, uuid: 'u-71' },
    { id: 84, uuid: 'u-84' },
  ];

  it('traduce los ids del BPMN a uuid', () => {
    const objRes = resolverUuidsVigilados([69, 71], [], LST_REMOTOS);
    expect([...objRes.uuids].sort()).toEqual(['u-69', 'u-71']);
    expect(objRes.noResueltos).toEqual([]);
  });

  it('suma los scriptsExtra, que ningún BPMN referencia', () => {
    const objRes = resolverUuidsVigilados([69], [{ uuid: 'u-84', motivo: 'CORE' }], LST_REMOTOS);
    expect([...objRes.uuids].sort()).toEqual(['u-69', 'u-84']);
  });

  it('reporta los ids que ya no existen en la instancia en vez de callarlos', () => {
    const objRes = resolverUuidsVigilados([69, 999], [], LST_REMOTOS);
    expect(objRes.noResueltos).toEqual([999]);
    expect(objRes.uuids.has('u-69')).toBe(true);
  });

  it('no duplica si un extra ya venía del BPMN', () => {
    const objRes = resolverUuidsVigilados([69], [{ uuid: 'u-69' }], LST_REMOTOS);
    expect(objRes.uuids.size).toBe(1);
  });

  it('tolera scriptsExtra ausente', () => {
    expect(resolverUuidsVigilados([69], undefined, LST_REMOTOS).uuids.size).toBe(1);
  });
});
