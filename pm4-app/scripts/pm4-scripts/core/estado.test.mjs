import { describe, it, expect } from 'vitest';
import {
  ESTADO,
  clasificarScript,
  compararInstancia,
  detectarCambiosDeId,
  detectarNuevosSinVigilar,
  slugDesdeTitulo,
} from './estado.mjs';

/** Script remoto de mentira, con lo mínimo que consume el módulo. */
function remoto(strUuid, strSha, objExtra = {}) {
  return { uuid: strUuid, id: 1, title: 'T', sha256: strSha, codigo: '<?php\n', ...objExtra };
}

describe('clasificarScript', () => {
  it('marca NUEVO cuando el uuid no está en el índice', () => {
    expect(clasificarScript(remoto('u1', 'aaa'), undefined)).toBe(ESTADO.NUEVO);
  });

  it('marca SIN CAMBIOS cuando el hash coincide', () => {
    expect(clasificarScript(remoto('u1', 'aaa'), { sha256: 'aaa' })).toBe(ESTADO.SIN_CAMBIOS);
  });

  it('marca MODIFICADO cuando el hash difiere', () => {
    expect(clasificarScript(remoto('u1', 'bbb'), { sha256: 'aaa' })).toBe(ESTADO.MODIFICADO);
  });
});

describe('compararInstancia', () => {
  it('separa nuevos, modificados y sin cambios', () => {
    const lstRemotos = [
      remoto('u-nuevo', 'n1'),
      remoto('u-mod', 'm2'),
      remoto('u-igual', 'i3'),
    ];
    const dicIndice = {
      'u-mod': { sha256: 'm1', file: 'a.php', title: 'A', lastKnownId: 1 },
      'u-igual': { sha256: 'i3', file: 'b.php', title: 'B', lastKnownId: 2 },
    };

    const objRes = compararInstancia(lstRemotos, dicIndice);

    expect(objRes.nuevos.map((o) => o.uuid)).toEqual(['u-nuevo']);
    expect(objRes.modificados.map((o) => o.uuid)).toEqual(['u-mod']);
    expect(objRes.sinCambios.map((o) => o.uuid)).toEqual(['u-igual']);
    expect(objRes.hayCambios).toBe(true);
  });

  it('adjunta la entrada previa a los modificados (para reportar el hash anterior)', () => {
    const dicIndice = { 'u-mod': { sha256: 'viejo', file: 'a.php', title: 'A', lastKnownId: 1 } };
    const objRes = compararInstancia([remoto('u-mod', 'nuevo')], dicIndice);
    expect(objRes.modificados[0].previo.sha256).toBe('viejo');
  });

  it('detecta los borrados en PM4 sin sacarlos del historial', () => {
    const dicIndice = {
      'u-vivo': { sha256: 'a', file: 'a.php', title: 'A', lastKnownId: 1 },
      'u-muerto': { sha256: 'b', file: 'b.php', title: 'B', lastKnownId: 2 },
    };
    const objRes = compararInstancia([remoto('u-vivo', 'a')], dicIndice);

    expect(objRes.borrados).toHaveLength(1);
    expect(objRes.borrados[0].uuid).toBe('u-muerto');
    expect(objRes.borrados[0].file).toBe('b.php');
    // Un borrado no es un cambio que capturar: no debe disparar un commit por sí solo.
    expect(objRes.hayCambios).toBe(false);
  });

  it('hayCambios es false cuando todo coincide — es lo que da la idempotencia', () => {
    const dicIndice = { u1: { sha256: 'a', file: 'a.php', title: 'A', lastKnownId: 1 } };
    expect(compararInstancia([remoto('u1', 'a')], dicIndice).hayCambios).toBe(false);
  });

  it('con el índice vacío, todo es nuevo (primera captura)', () => {
    const objRes = compararInstancia([remoto('u1', 'a'), remoto('u2', 'b')], {});
    expect(objRes.nuevos).toHaveLength(2);
    expect(objRes.hayCambios).toBe(true);
  });
});

describe('detectarCambiosDeId', () => {
  it('reporta el cambio de id cuando el uuid es el mismo (migración de instancia)', () => {
    const dicIndice = { u1: { sha256: 'a', file: 'a.php', title: 'A', lastKnownId: 70 } };
    const lstCambios = detectarCambiosDeId([remoto('u1', 'a', { id: 112 })], dicIndice);

    expect(lstCambios).toHaveLength(1);
    expect(lstCambios[0]).toMatchObject({ uuid: 'u1', idPrevio: 70, idNuevo: 112 });
  });

  it('no reporta nada cuando el id no cambió', () => {
    const dicIndice = { u1: { sha256: 'a', file: 'a.php', title: 'A', lastKnownId: 70 } };
    expect(detectarCambiosDeId([remoto('u1', 'a', { id: 70 })], dicIndice)).toEqual([]);
  });

  it('ignora los uuid que todavía no están en el índice', () => {
    expect(detectarCambiosDeId([remoto('u-nuevo', 'a', { id: 9 })], {})).toEqual([]);
  });
});

describe('slugDesdeTitulo', () => {
  it('convierte un título con espacios y guiones a kebab', () => {
    expect(slugDesdeTitulo('COL - QD - Core SFC')).toBe('col-qd-core-sfc');
  });

  it('convierte guiones bajos', () => {
    expect(slugDesdeTitulo('COL_QD_Asignar_SLA')).toBe('col-qd-asignar-sla');
  });

  it('quita acentos en vez de dejarlos en el nombre de archivo', () => {
    expect(slugDesdeTitulo('Gestión de Prórroga')).toBe('gestion-de-prorroga');
  });

  it('no deja guiones al principio ni al final', () => {
    expect(slugDesdeTitulo('  - Hola -  ')).toBe('hola');
  });

  it('no incluye el id numérico (cambia entre instancias)', () => {
    expect(slugDesdeTitulo('COL_UTIL_Dias_Habiles')).not.toMatch(/\d{2,}/);
  });

  it('degrada a un nombre usable si el título es solo símbolos', () => {
    expect(slugDesdeTitulo('***')).toBe('script-sin-titulo');
  });
});

describe('detectarNuevosSinVigilar', () => {
  const LST_TODOS = [
    { uuid: 'u-vig', id: 1, title: 'Vigilado', createdAt: '2026-08-14T10:00:00Z' },
    { uuid: 'u-nuevo', id: 2, title: 'Nuevo suelto', createdAt: '2026-08-14T10:00:00Z' },
    { uuid: 'u-viejo', id: 3, title: 'Viejo ajeno', createdAt: '2026-01-01T10:00:00Z' },
  ];
  const SET_VIGILADOS = new Set(['u-vig']);

  it('reporta solo lo NO vigilado y creado despues de la referencia', () => {
    const lst = detectarNuevosSinVigilar(LST_TODOS, SET_VIGILADOS, '2026-08-01T00:00:00Z');
    expect(lst.map((o) => o.uuid)).toEqual(['u-nuevo']);
  });

  it('calla sin fecha de referencia — evita listar los ~50 scripts ajenos en la primera corrida', () => {
    expect(detectarNuevosSinVigilar(LST_TODOS, SET_VIGILADOS, undefined)).toEqual([]);
    expect(detectarNuevosSinVigilar(LST_TODOS, SET_VIGILADOS, '')).toEqual([]);
  });

  it('calla con una fecha de referencia invalida en vez de reportar todo', () => {
    expect(detectarNuevosSinVigilar(LST_TODOS, SET_VIGILADOS, 'no-es-fecha')).toEqual([]);
  });

  it('nunca reporta un script vigilado, por nuevo que sea', () => {
    const lst = detectarNuevosSinVigilar(LST_TODOS, new Set(['u-vig', 'u-nuevo']), '2026-08-01T00:00:00Z');
    expect(lst).toEqual([]);
  });

  it('ignora los creados ANTES de la referencia', () => {
    const lst = detectarNuevosSinVigilar(LST_TODOS, SET_VIGILADOS, '2026-08-01T00:00:00Z');
    expect(lst.map((o) => o.uuid)).not.toContain('u-viejo');
  });

  it('ordena del mas nuevo al mas viejo', () => {
    const lstDesordenada = [
      { uuid: 'a', id: 1, title: 'A', createdAt: '2026-08-05T00:00:00Z' },
      { uuid: 'b', id: 2, title: 'B', createdAt: '2026-08-14T00:00:00Z' },
    ];
    const lst = detectarNuevosSinVigilar(lstDesordenada, new Set(), '2026-08-01T00:00:00Z');
    expect(lst.map((o) => o.uuid)).toEqual(['b', 'a']);
  });

  it('tolera un script sin fecha de creacion sin romperse', () => {
    const lst = detectarNuevosSinVigilar(
      [{ uuid: 'x', id: 9, title: 'Sin fecha' }], new Set(), '2026-08-01T00:00:00Z',
    );
    expect(lst).toEqual([]);
  });
});
