import { describe, it, expect } from 'vitest';
import {
  ESTADO,
  clasificarScript,
  compararInstancia,
  detectarCambiosDeId,
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
