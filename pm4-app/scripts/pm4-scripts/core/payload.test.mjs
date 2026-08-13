import { describe, it, expect } from 'vitest';
import {
  LST_CAMPOS_EDITABLES,
  construirPayloadRestore,
  detectarCamposProhibidos,
} from './payload.mjs';

/** Respuesta típica de GET /scripts/{id}, con los campos que devuelve PM4 de verdad. */
const OBJ_REMOTO = {
  id: 84,
  uuid: 'a2560610-9409-4931-bcc7-172aa91f56a9',
  title: 'COL - QD - Core SFC',
  description: 'Firma HMAC-SHA256',
  language: 'php',
  code: '<?php // version vieja\n',
  timeout: 60,
  run_as_user_id: 1,
  key: null,
  script_category_id: '1',
  script_executor_id: 1,
  status: 'ACTIVE',
  created_at: '2026-07-24T14:32:06+00:00',
  updated_at: '2026-08-04T14:30:55+00:00',
};

describe('construirPayloadRestore', () => {
  it('reenvía todos los metadatos que el GET trajo', () => {
    const dicPayload = construirPayloadRestore(OBJ_REMOTO, '<?php // nuevo\n');

    expect(dicPayload.title).toBe('COL - QD - Core SFC');
    expect(dicPayload.description).toBe('Firma HMAC-SHA256');
    expect(dicPayload.language).toBe('php');
    expect(dicPayload.timeout).toBe(60);
    expect(dicPayload.run_as_user_id).toBe(1);
    expect(dicPayload.script_category_id).toBe('1');
  });

  it('reenvía script_executor_id — perderlo deja el script sin poder ejecutarse', () => {
    // No está en el schema documentado de PM4, por eso tiene test propio: es el campo cuyo
    // olvido produce un fallo de producción silencioso.
    const dicPayload = construirPayloadRestore(OBJ_REMOTO, '<?php\n');
    expect(dicPayload.script_executor_id).toBe(1);
  });

  it('pone el código nuevo, no el que venía del GET', () => {
    const dicPayload = construirPayloadRestore(OBJ_REMOTO, '<?php // nuevo\n');
    expect(dicPayload.code).toBe('<?php // nuevo\n');
    expect(dicPayload.code).not.toBe(OBJ_REMOTO.code);
  });

  it('nunca envía id, uuid, status ni timestamps', () => {
    const dicPayload = construirPayloadRestore(OBJ_REMOTO, '<?php\n');
    expect(detectarCamposProhibidos(dicPayload)).toEqual([]);
    expect(dicPayload).not.toHaveProperty('id');
    expect(dicPayload).not.toHaveProperty('uuid');
    expect(dicPayload).not.toHaveProperty('status');
    expect(dicPayload).not.toHaveProperty('created_at');
  });

  it('omite los campos null en vez de mandarlos (key llega null a menudo)', () => {
    const dicPayload = construirPayloadRestore(OBJ_REMOTO, '<?php\n');
    expect(dicPayload).not.toHaveProperty('key');
  });

  it('convierte description null a string vacío — PM4 rechaza el null', () => {
    const dicPayload = construirPayloadRestore({ ...OBJ_REMOTO, description: null }, '<?php\n');
    expect(dicPayload.description).toBe('');
  });

  it('convierte description ausente a string vacío', () => {
    const objSinDesc = { ...OBJ_REMOTO };
    delete objSinDesc.description;
    expect(construirPayloadRestore(objSinDesc, '<?php\n').description).toBe('');
  });

  it('omite los campos que el GET no trajo, para que PM4 conserve lo suyo', () => {
    const objMinimo = { title: 'X', language: 'php' };
    const dicPayload = construirPayloadRestore(objMinimo, '<?php\n');
    expect(dicPayload).not.toHaveProperty('timeout');
    expect(dicPayload).not.toHaveProperty('script_executor_id');
    expect(dicPayload.title).toBe('X');
  });

  it('aborta con código vacío en vez de borrar el script en PM4', () => {
    expect(() => construirPayloadRestore(OBJ_REMOTO, '')).toThrow(/vacío/);
    expect(() => construirPayloadRestore(OBJ_REMOTO, '   \n  ')).toThrow(/vacío/);
  });

  it('aborta si el código no es un string', () => {
    expect(() => construirPayloadRestore(OBJ_REMOTO, null)).toThrow(/vacío/);
  });

  it('no explota si el objeto remoto es nulo (solo pone el código y description)', () => {
    const dicPayload = construirPayloadRestore(null, '<?php\n');
    expect(dicPayload.code).toBe('<?php\n');
    expect(dicPayload.description).toBe('');
  });
});

describe('detectarCamposProhibidos', () => {
  it('detecta un campo prohibido que se coló', () => {
    expect(detectarCamposProhibidos({ title: 'X', id: 84 })).toContain('id');
  });

  it('devuelve vacío para un payload limpio', () => {
    expect(detectarCamposProhibidos({ title: 'X', code: '<?php\n' })).toEqual([]);
  });
});

describe('LST_CAMPOS_EDITABLES', () => {
  it('está congelada para que nadie la mute en runtime', () => {
    expect(Object.isFrozen(LST_CAMPOS_EDITABLES)).toBe(true);
  });
});
