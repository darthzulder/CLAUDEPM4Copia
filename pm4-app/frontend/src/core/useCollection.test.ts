import { describe, expect, it } from 'vitest';
import {
  codeFromUiValue,
  descOf,
  labelFromUiValue,
  toUiValue,
  uiValueFromCode,
  type CollectionOption,
} from './useCollection';

// Catálogo con código repetido (caso real: colección 16 "Producto SFC" — "104" es
// tanto "Garantía extendida" como "Copropiedades"). Ver comentario en useCollection.ts.
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
    const uiValue = toUiValue('104', 'Copropiedades');
    expect(uiValue).toBe('104::Copropiedades');
    expect(codeFromUiValue(uiValue)).toBe('104');
    expect(labelFromUiValue(uiValue)).toBe('Copropiedades');
  });

  it('codeFromUiValue soporta undefined sin lanzar', () => {
    expect(codeFromUiValue(undefined)).toBe('');
  });

  it('labelFromUiValue reconstruye una etiqueta que contenía el separador', () => {
    const uiValue = toUiValue('1', 'Antes::Después');
    expect(labelFromUiValue(uiValue)).toBe('Antes::Después');
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
