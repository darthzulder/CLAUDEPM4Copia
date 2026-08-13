import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { escribirEspejo } from './espejo.mjs';

let strDir;

beforeEach(() => {
  strDir = mkdtempSync(join(tmpdir(), 'pm4-espejo-test-'));
});

afterEach(() => {
  rmSync(strDir, { recursive: true, force: true });
});

describe('escribirEspejo', () => {
  it('escribe los archivos creando los subdirectorios', () => {
    escribirEspejo(strDir, { 'proceso-31/core.php': '<?php // core\n' });
    expect(readFileSync(join(strDir, 'proceso-31', 'core.php'), 'utf8')).toBe('<?php // core\n');
  });

  it('devuelve las rutas escritas', () => {
    const lst = escribirEspejo(strDir, { 'a/x.php': '1\n', 'b/y.php': '2\n' });
    expect(lst.sort()).toEqual(['a/x.php', 'b/y.php']);
  });

  it('deja un README que avisa que es generado', () => {
    escribirEspejo(strDir, { 'a.php': '<?php\n' });
    const strReadme = readFileSync(join(strDir, 'README.md'), 'utf8');
    expect(strReadme).toContain('GENERADO, NO EDITAR');
    expect(strReadme).toContain('pm4-scripts-historial');
  });

  it('no crea nada si no hay archivos que escribir', () => {
    expect(escribirEspejo(strDir, {})).toEqual([]);
    expect(existsSync(join(strDir, 'README.md'))).toBe(false);
  });

  it('sobrescribe el contenido previo — el espejo refleja la última captura, no acumula', () => {
    escribirEspejo(strDir, { 'a.php': 'viejo\n' });
    escribirEspejo(strDir, { 'a.php': 'nuevo\n' });
    expect(readFileSync(join(strDir, 'a.php'), 'utf8')).toBe('nuevo\n');
  });

  it('preserva UTF-8 multibyte', () => {
    escribirEspejo(strDir, { 'a.php': '<?php // á é í ó ú ñ →\n' });
    expect(readFileSync(join(strDir, 'a.php'), 'utf8')).toBe('<?php // á é í ó ú ñ →\n');
  });
});
