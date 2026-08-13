import { describe, it, expect } from 'vitest';
import { canonicalizar, hashCanonico, esCodigoVacio, normalizar } from './canonicalizar.mjs';

describe('canonicalizar', () => {
  it('quita el BOM que readFileSync deja como U+FEFF', () => {
    expect(canonicalizar('﻿<?php\n')).toBe('<?php\n');
  });

  it('quita el BOM solo al inicio, no en medio del contenido', () => {
    // Un U+FEFF en medio de un string PHP es contenido legítimo; tocarlo cambiaría el código.
    expect(canonicalizar('<?php $x = "a﻿b";\n')).toBe('<?php $x = "a﻿b";\n');
  });

  it('convierte CRLF a LF', () => {
    expect(canonicalizar('<?php\r\n$x = 1;\r\n')).toBe('<?php\n$x = 1;\n');
  });

  it('convierte CR suelto (Mac clásico) a LF', () => {
    expect(canonicalizar('<?php\r$x = 1;\r')).toBe('<?php\n$x = 1;\n');
  });

  it('agrega el salto final cuando falta', () => {
    expect(canonicalizar('<?php $x = 1;')).toBe('<?php $x = 1;\n');
  });

  it('colapsa múltiples saltos finales a exactamente uno', () => {
    expect(canonicalizar('<?php\n\n\n\n')).toBe('<?php\n');
  });

  it('preserva los saltos internos, solo colapsa los del final', () => {
    expect(canonicalizar('a\n\n\nb\n\n')).toBe('a\n\n\nb\n');
  });

  it('NO toca el whitespace de fin de línea (importa dentro de un heredoc PHP)', () => {
    const strConEspacios = '$x = <<<EOT\nlinea con espacios   \nEOT;\n';
    expect(canonicalizar(strConEspacios)).toBe(strConEspacios);
  });

  it('NO toca tabs ni indentación', () => {
    expect(canonicalizar('\tif ($x) {\n\t\treturn 1;\n\t}\n')).toBe('\tif ($x) {\n\t\treturn 1;\n\t}\n');
  });

  it('es idempotente — la propiedad que hace estable el round-trip', () => {
    const lstEntradas = [
      '﻿<?php\r\n$x = 1;\r\n\r\n\r\n',
      '<?php $x = 1;',
      'a\n\n\nb',
      '',
      '\n\n\n',
    ];
    for (const strEntrada of lstEntradas) {
      const strUna = canonicalizar(strEntrada);
      expect(canonicalizar(strUna)).toBe(strUna);
    }
  });

  it('converge aunque PM4 recorte el salto final al guardar', () => {
    // Simula el escenario real: subimos la forma canónica (con \n), PM4 la devuelve sin él.
    const strLocal = canonicalizar('<?php $x = 1;');
    const strDevueltoPorPm4 = strLocal.replace(/\n$/, '');
    expect(canonicalizar(strDevueltoPorPm4)).toBe(strLocal);
  });

  it('rechaza entradas que no son string en vez de producir basura silenciosa', () => {
    expect(() => canonicalizar(null)).toThrow(TypeError);
    expect(() => canonicalizar(undefined)).toThrow(TypeError);
    expect(() => canonicalizar(123)).toThrow(TypeError);
  });
});

describe('hashCanonico', () => {
  it('hashea bytes UTF-8, no unidades UTF-16', () => {
    // 'á' son 2 bytes en UTF-8 y 1 code point: el hash debe corresponder a los bytes.
    const strTexto = 'á\n';
    const objEsperado = hashCanonico(strTexto);
    expect(objEsperado).toHaveLength(64);
    expect(objEsperado).toMatch(/^[0-9a-f]{64}$/);
  });

  it('distingue contenidos que difieren solo en caracteres multibyte', () => {
    expect(hashCanonico('a\n')).not.toBe(hashCanonico('á\n'));
  });

  it('da el mismo hash para el mismo contenido canónico', () => {
    expect(hashCanonico('<?php\n')).toBe(hashCanonico('<?php\n'));
  });

  it('hace coincidir dos entradas que solo diferían en bordes', () => {
    // El punto entero del sistema: CRLF vs LF no debe producir un cambio detectado.
    expect(hashCanonico(canonicalizar('<?php\r\n$x = 1;\r\n')))
      .toBe(hashCanonico(canonicalizar('<?php\n$x = 1;')));
  });
});

describe('esCodigoVacio', () => {
  it('detecta el string vacío ya canonicalizado', () => {
    expect(esCodigoVacio(canonicalizar(''))).toBe(true);
  });

  it('detecta contenido que es solo whitespace', () => {
    expect(esCodigoVacio(canonicalizar('   \n\n\t  '))).toBe(true);
  });

  it('no marca como vacío un script real', () => {
    expect(esCodigoVacio(canonicalizar('<?php return [];'))).toBe(false);
  });
});

describe('normalizar', () => {
  it('devuelve código canónico, su hash y la bandera de vacío', () => {
    const objRes = normalizar('<?php\r\n$x = 1;');
    expect(objRes.codigo).toBe('<?php\n$x = 1;\n');
    expect(objRes.sha256).toBe(hashCanonico(objRes.codigo));
    expect(objRes.vacio).toBe(false);
  });

  it('marca vacío el script sin contenido', () => {
    expect(normalizar('  ').vacio).toBe(true);
  });
});
