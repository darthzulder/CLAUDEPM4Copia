import { describe, it, expect } from 'vitest';
import {
  extraerScriptRefs, extraerSubprocesos, descubrirArbol, resolverUuidsVigilados,
  extraerDependenciasDeCodigo, extraerSlugsInvocadosPorFrontend, uuidsDesdeRegistro, cerrarDependencias,
} from './descubrir.mjs';

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

describe('extraerDependenciasDeCodigo', () => {
  const dicPorUuid = new Map([
    ['a26a713d-ea78-48b3-b829-5ddce63cfbd2', { id: 95, uuid: 'a26a713d-ea78-48b3-b829-5ddce63cfbd2', title: 'Dias habiles' }],
  ]);
  const dicPorId = new Map([[84, { id: 84, uuid: 'u-core', title: 'CORE SFC' }]]);
  const dicIndices = { dicPorUuid, dicPorId };

  it('detecta un uuid literal que corresponde a un script', () => {
    const strCodigo = "const UTIL_UUID = 'a26a713d-ea78-48b3-b829-5ddce63cfbd2';";
    expect([...extraerDependenciasDeCodigo(strCodigo, dicIndices)]).toEqual(['a26a713d-ea78-48b3-b829-5ddce63cfbd2']);
  });

  it('detecta una constante *SCRIPT_ID* y la traduce a uuid', () => {
    expect([...extraerDependenciasDeCodigo('$SFC_CORE_SCRIPT_ID = 84;', dicIndices)]).toEqual(['u-core']);
  });

  it('IGNORA un uuid que no es de un script — asi se descartan los de coleccion', () => {
    // FERIADOS_COLLECTION_UUID es un caso real: apunta a una coleccion, no a un script.
    const strCodigo = "const FERIADOS_COLLECTION_UUID = 'a2421287-eefe-4ff6-88a8-7f7040a2d10e';";
    expect([...extraerDependenciasDeCodigo(strCodigo, dicIndices)]).toEqual([]);
  });

  it('ignora una constante SCRIPT_ID que apunta a un id inexistente', () => {
    expect([...extraerDependenciasDeCodigo('$OTRO_SCRIPT_ID = 9999;', dicIndices)]).toEqual([]);
  });

  it('tolera codigo vacio o nulo', () => {
    expect([...extraerDependenciasDeCodigo('', dicIndices)]).toEqual([]);
    expect([...extraerDependenciasDeCodigo(null, dicIndices)]).toEqual([]);
  });
});

describe('extraerSlugsInvocadosPorFrontend', () => {
  it('saca el slug de resolveScriptId', () => {
    const strFuente = "export const X = resolveScriptId('similarCasesQuejas', 70);";
    expect([...extraerSlugsInvocadosPorFrontend(strFuente)]).toEqual(['similarCasesQuejas']);
  });

  it('acepta comillas dobles y espacios', () => {
    expect([...extraerSlugsInvocadosPorFrontend('resolveScriptId(  "otroSlug" , 1)')]).toEqual(['otroSlug']);
  });

  it('deduplica y saca varios de un mismo archivo', () => {
    const strFuente = "resolveScriptId('a',1); resolveScriptId('b',2); resolveScriptId('a',1);";
    expect([...extraerSlugsInvocadosPorFrontend(strFuente)].sort()).toEqual(['a', 'b']);
  });

  it('no confunde resolveCollectionId con resolveScriptId', () => {
    expect([...extraerSlugsInvocadosPorFrontend("resolveCollectionId('depto', 14)")]).toEqual([]);
  });
});

describe('uuidsDesdeRegistro', () => {
  const objRegistro = { scripts: { similarCasesQuejas: { id: 70, uuid: 'u-70' } } };

  it('traduce el slug a uuid', () => {
    const objRes = uuidsDesdeRegistro(['similarCasesQuejas'], objRegistro);
    expect([...objRes.uuids]).toEqual(['u-70']);
    expect(objRes.sinRegistrar).toEqual([]);
  });

  it('reporta el slug que el frontend usa pero el registro no tiene', () => {
    const objRes = uuidsDesdeRegistro(['noExiste'], objRegistro);
    expect(objRes.uuids.size).toBe(0);
    expect(objRes.sinRegistrar).toEqual(['noExiste']);
  });

  it('tolera un registro vacio', () => {
    expect(uuidsDesdeRegistro(['x'], {}).sinRegistrar).toEqual(['x']);
  });
});

describe('cerrarDependencias', () => {
  // Los uuid tienen que ser uuid DE VERDAD: el detector busca el formato completo, asi que un
  // identificador de fantasia tipo 'u-b' no se reconoce (y este test fallaria por el motivo
  // equivocado, escondiendo si el cierre transitivo funciona o no).
  const UUID_A = 'aaaaaaaa-1111-2222-3333-444444444444';
  const UUID_B = 'bbbbbbbb-1111-2222-3333-444444444444';
  const UUID_C = 'cccccccc-1111-2222-3333-444444444444';

  /** A -> B -> C, para probar que el cierre es transitivo y no de un solo nivel. */
  const dicPorUuid = new Map([
    [UUID_A, { uuid: UUID_A, title: 'A', codigo: `const X = '${UUID_B}';` }],
    [UUID_B, { uuid: UUID_B, title: 'B', codigo: `const Y = '${UUID_C}';` }],
    [UUID_C, { uuid: UUID_C, title: 'C', codigo: 'sin dependencias' }],
  ]);
  const dicPorId = new Map();

  it('sigue la cadena completa, no solo el primer nivel', () => {
    const objRes = cerrarDependencias(new Set([UUID_A]), dicPorUuid, dicPorId);
    expect([...objRes.uuids].sort()).toEqual([UUID_A, UUID_B, UUID_C]);
  });

  it('reporta quien invoca a cada agregado', () => {
    const objRes = cerrarDependencias(new Set([UUID_A]), dicPorUuid, dicPorId);
    expect(objRes.agregados).toEqual([
      { uuid: UUID_B, desde: 'A' },
      { uuid: UUID_C, desde: 'B' },
    ]);
  });

  it('lee `code` ademas de `codigo` — la forma cruda de la API', () => {
    // Este test existe por un bug real: la CLI normaliza a `codigo` y el descubrimiento leia
    // `code`, asi que no detectaba NINGUNA dependencia y no daba error.
    const dicCrudo = new Map([
      [UUID_A, { uuid: UUID_A, title: 'X', code: `const D = '${UUID_B}';` }],
      [UUID_B, { uuid: UUID_B, title: 'Y', code: '' }],
    ]);
    expect([...cerrarDependencias(new Set([UUID_A]), dicCrudo, dicPorId).uuids].sort()).toEqual([UUID_A, UUID_B]);
  });

  it('no cuelga ante una dependencia circular', () => {
    const dicCiclo = new Map([
      [UUID_A, { uuid: UUID_A, title: '1', codigo: `'${UUID_B}'` }],
      [UUID_B, { uuid: UUID_B, title: '2', codigo: `'${UUID_A}'` }],
    ]);
    expect([...cerrarDependencias(new Set([UUID_A]), dicCiclo, dicPorId).uuids].sort()).toEqual([UUID_A, UUID_B]);
  });

  it('ignora un uuid del que no tenemos el script', () => {
    expect([...cerrarDependencias(new Set(['u-fantasma']), dicPorUuid, dicPorId).uuids]).toEqual(['u-fantasma']);
  });
});
