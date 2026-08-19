import { describe, expect, it } from 'vitest';
import type { CollectionOption } from './collection.types';
import {
  codeFromUiValue,
  descOf,
  labelFromUiValue,
  resolvePath,
  resolvePmql,
  toUiOptions,
  toUiValue,
  uiValueFromCode,
} from './collection-helpers';

/**
 * Portado de `frontend/src/core/useCollection.test.ts` con **paridad 1:1 de casos** (26, medidos
 * corriendo ambos lados, no contando bloques a ojo) y sin cambios de aserción. Solo cambian los
 * imports: los helpers salen de `./collection-helpers` y el tipo de `./collection.types` en vez de
 * los dos del hook.
 *
 * Que este archivo no necesite `TestBed` ni mocks de HttpClient es la prueba de que la separación
 * funcionó: son 26 casos de lógica pura que en React convivían con un hook que hacía red.
 */

// Catálogo con código repetido (caso real: colección 16 "Producto SFC" — "104" es
// tanto "Garantía extendida" como "Copropiedades"). Ver comentario en collection-helpers.ts.
const DUPLICATE_CODE_OPTIONS: CollectionOption[] = [
  { value: '104', label: 'Garantía extendida' },
  { value: '104', label: 'Copropiedades' },
  { value: '200', label: 'Otro producto' },
];

describe('descOf', () => {
  it('resuelve la descripción del primer registro que matchea el código', () => {
    expect(descOf(DUPLICATE_CODE_OPTIONS, '104')).toBe('Garantía extendida');
  });

  it('cae al propio código si no hay match', () => {
    expect(descOf(DUPLICATE_CODE_OPTIONS, '999')).toBe('999');
  });

  it('devuelve el placeholder cuando no hay código', () => {
    expect(descOf(DUPLICATE_CODE_OPTIONS, undefined)).toBe('—');
  });
});

describe('toUiValue / codeFromUiValue / labelFromUiValue', () => {
  it('compone y descompone el value de UI', () => {
    const strUiValue = toUiValue('104', 'Copropiedades');
    expect(strUiValue).toBe('104::Copropiedades');
    expect(codeFromUiValue(strUiValue)).toBe('104');
    expect(labelFromUiValue(strUiValue)).toBe('Copropiedades');
  });

  it('codeFromUiValue soporta undefined sin lanzar', () => {
    expect(codeFromUiValue(undefined)).toBe('');
  });

  it('labelFromUiValue reconstruye una etiqueta que contenía el separador', () => {
    const strUiValue = toUiValue('1', 'Antes::Después');
    expect(labelFromUiValue(strUiValue)).toBe('Antes::Después');
  });
});

describe('uiValueFromCode', () => {
  it('desambigua por código + _desc guardados cuando el código se repite', () => {
    expect(uiValueFromCode(DUPLICATE_CODE_OPTIONS, '104', 'Copropiedades')).toBe('104::Copropiedades');
  });

  it('sin _desc cae al primer registro con ese código (dato legado)', () => {
    expect(uiValueFromCode(DUPLICATE_CODE_OPTIONS, '104', undefined)).toBe('104::Garantía extendida');
  });

  it('sin código devuelve vacío', () => {
    expect(uiValueFromCode(DUPLICATE_CODE_OPTIONS, '', 'x')).toBe('');
  });

  it('código que no existe en las opciones devuelve vacío', () => {
    expect(uiValueFromCode(DUPLICATE_CODE_OPTIONS, '999', undefined)).toBe('');
  });
});

describe('toUiOptions', () => {
  it('convierte cada opción a su value compuesto conservando el label', () => {
    expect(toUiOptions(DUPLICATE_CODE_OPTIONS)).toEqual([
      { value: '104::Garantía extendida', label: 'Garantía extendida' },
      { value: '104::Copropiedades',      label: 'Copropiedades' },
      { value: '200::Otro producto',      label: 'Otro producto' },
    ]);
  });

  it('desambigua los códigos duplicados (el porqué de todo el mecanismo)', () => {
    const lstUi = toUiOptions(DUPLICATE_CODE_OPTIONS);
    expect(new Set(lstUi.map((in_objOpt) => in_objOpt.value)).size).toBe(3);
  });

  it('con lista vacía devuelve lista vacía', () => {
    expect(toUiOptions([])).toEqual([]);
  });
});

describe('resolvePath', () => {
  const OBJ_RECORD = {
    id: 7,
    data: { frm_nombre_entidad: 'Zurich', frm_codigo: '104', anidado: { hoja: 'valor' } },
  };

  it('resuelve una clave de primer nivel', () => {
    expect(resolvePath(OBJ_RECORD, 'id')).toBe('7');
  });

  it('resuelve una ruta con puntos', () => {
    expect(resolvePath(OBJ_RECORD, 'data.frm_nombre_entidad')).toBe('Zurich');
  });

  it('resuelve rutas de más de dos niveles', () => {
    expect(resolvePath(OBJ_RECORD, 'data.anidado.hoja')).toBe('valor');
  });

  it('devuelve cadena vacía si la ruta no existe', () => {
    expect(resolvePath(OBJ_RECORD, 'data.no_existe')).toBe('');
    expect(resolvePath(OBJ_RECORD, 'no.existe.nada')).toBe('');
  });

  it('siempre devuelve string, incluso para valores no-string', () => {
    // El contrato es "string": los value/label de las opciones se comparan como texto.
    expect(typeof resolvePath(OBJ_RECORD, 'id')).toBe('string');
  });

  it('un valor null se vuelve cadena vacía, no "null"', () => {
    expect(resolvePath({ campo: null }, 'campo')).toBe('');
  });
});

describe('resolvePmql', () => {
  it('reemplaza un placeholder con el valor del form', () => {
    expect(resolvePmql('data.depto = "{{qd_strDepartment}}"', { qd_strDepartment: '05' }))
      .toBe('data.depto = "05"');
  });

  it('reemplaza varios placeholders distintos', () => {
    const strPmql = resolvePmql(
      'data.a = "{{uno}}" AND data.b = "{{dos}}"',
      { uno: 'X', dos: 'Y' },
    );
    expect(strPmql).toBe('data.a = "X" AND data.b = "Y"');
  });

  it('reemplaza todas las ocurrencias del mismo placeholder', () => {
    expect(resolvePmql('{{x}}-{{x}}', { x: 'a' })).toBe('a-a');
  });

  it('un placeholder sin valor queda como cadena vacía, no como "undefined"', () => {
    // Importante: si dejara la palabra "undefined" el PMQL filtraría por ese literal y
    // devolvería 0 registros silenciosamente en vez de fallar de forma visible.
    expect(resolvePmql('data.x = "{{ausente}}"', {})).toBe('data.x = ""');
    expect(resolvePmql('data.x = "{{nulo}}"', { nulo: null })).toBe('data.x = ""');
  });

  it('convierte valores no-string a texto', () => {
    expect(resolvePmql('data.n = {{n}}', { n: 42 })).toBe('data.n = 42');
    expect(resolvePmql('data.b = {{b}}', { b: false })).toBe('data.b = false');
  });

  it('deja intacto un template sin placeholders', () => {
    expect(resolvePmql('data.activo = 1', { x: 'y' })).toBe('data.activo = 1');
  });

  it('no toca placeholders con caracteres fuera de \\w (no matchean el regex)', () => {
    expect(resolvePmql('{{con-guion}}', { 'con-guion': 'v' })).toBe('{{con-guion}}');
  });
});
