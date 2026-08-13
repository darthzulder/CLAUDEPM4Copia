import { describe, expect, it } from 'vitest';
import { resolveFileId } from './useRequestFiles';

// Solo se testea resolveFileId: es la parte pura del módulo (el hook useRequestFiles pega a
// PM4 y se cubre, si hace falta, cuando se toque). PM4 devuelve el file_id de un campo de
// salida en formatos inconsistentes según el nodo del proceso, y esta función es la que
// normaliza todos — de ahí las ramas raras.

describe('resolveFileId', () => {
  it('devuelve el número tal cual', () => {
    expect(resolveFileId(42)).toBe(42);
  });

  it('convierte strings numéricos', () => {
    expect(resolveFileId('42')).toBe(42);
  });

  it('parsea un string con basura al final (parseInt permisivo)', () => {
    expect(resolveFileId('42abc')).toBe(42);
  });

  it('extrae el id de un objeto', () => {
    expect(resolveFileId({ id: 42 })).toBe(42);
  });

  it('extrae el id de un objeto cuyo id viene como string', () => {
    expect(resolveFileId({ id: '42' })).toBe(42);
  });

  it('toma el primer elemento de un array', () => {
    expect(resolveFileId([{ id: 42 }, { id: 99 }])).toBe(42);
  });

  it('resuelve un array de números', () => {
    expect(resolveFileId([42])).toBe(42);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['cadena vacía', ''],
    ['string no numérico', 'abc'],
    ['objeto sin id', { nombre: 'x' }],
    ['array vacío', []],
    ['objeto con id nulo', { id: null }],
  ])('devuelve null para %s', (_strCaso, in_genValor) => {
    expect(resolveFileId(in_genValor)).toBeNull();
  });

  it('el id 0 es INCONSISTENTE según cómo llegue (comportamiento real, fijado)', () => {
    // El guard `if (!in_genValue) return null` y el `if (dicValue.id)` tratan el 0 como
    // ausencia de valor, pero el string '0' sí pasa (es truthy) y parseInt lo convierte.
    // Resultado: la misma "id 0" da null o 0 según el formato en que PM4 la mande.
    expect(resolveFileId(0)).toBeNull();          // number 0  → falsy → null
    expect(resolveFileId('0')).toBe(0);           // string '0' → truthy → parseInt → 0
    expect(resolveFileId({ id: 0 })).toBeNull();  // { id: 0 }  → id falsy → null
    // Hoy es inocuo porque PM4 no usa 0 como file_id. Se fija para que, si eso cambia, la
    // inconsistencia se vea acá en vez de manifestarse como un adjunto que no se descarga.
  });
});
