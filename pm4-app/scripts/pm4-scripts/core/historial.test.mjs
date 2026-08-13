import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ramaExiste,
  leerArchivoDeRama,
  leerIndice,
  commitearCaptura,
  listarCapturas,
  validarIdentidadGit,
} from './historial.mjs';

const STR_RAMA = 'pm4-scripts-historial';
const STR_RUTA_INDICE = 'pm4-scripts.index.json';

let strRepo;

/** Corre git en el repo de prueba, sin volcar su stderr a la salida de la suite. */
function git(...lstArgs) {
  return execFileSync('git', lstArgs, {
    cwd: strRepo,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

beforeEach(() => {
  // Repo real (no mock): el módulo entero es fontanería de git, así que mockear git haría que el
  // test verifique la mímica en vez del comportamiento. Un repo temporal cuesta milisegundos.
  strRepo = mkdtempSync(join(tmpdir(), 'pm4-hist-test-'));
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'commit.gpgsign', 'false');
  // El gitconfig de sistema de Git for Windows trae autocrlf=true: sin fijarlo acá, cada `git add`
  // del test emite un warning de conversión y el resultado dependería de la config del dev.
  git('config', 'core.autocrlf', 'false');

  // Un commit inicial en main, para que el repo tenga una rama activa realista.
  writeFileSync(join(strRepo, 'README.md'), '# repo de prueba\n');
  git('add', 'README.md');
  git('commit', '--quiet', '-m', 'inicial');
});

afterEach(() => {
  rmSync(strRepo, { recursive: true, force: true });
});

describe('ramaExiste', () => {
  it('es false antes de la primera captura', () => {
    expect(ramaExiste(strRepo, STR_RAMA)).toBe(false);
  });

  it('es true después de la primera captura', () => {
    commitearCaptura({
      strRepo,
      strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php\n' },
      strMensaje: 'primera',
    });
    expect(ramaExiste(strRepo, STR_RAMA)).toBe(true);
  });
});

describe('commitearCaptura', () => {
  it('crea la rama huérfana en el primer commit', () => {
    const objRes = commitearCaptura({
      strRepo,
      strRama: STR_RAMA,
      dicArchivos: { 'proceso-31/core.php': '<?php // v1\n' },
      strMensaje: 'captura inicial',
    });

    expect(objRes.esPrimerCommit).toBe(true);
    expect(objRes.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'proceso-31/core.php')).toBe('<?php // v1\n');
  });

  it('la rama es huérfana: no comparte historia con main', () => {
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php\n' }, strMensaje: 'primera',
    });
    // Sin ancestro común, main no es alcanzable desde la rama de historial.
    expect(() => git('merge-base', '--is-ancestor', 'main', STR_RAMA)).toThrow();
  });

  it('encadena el segundo commit sobre el primero', () => {
    const objUno = commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php // v1\n' }, strMensaje: 'primera',
    });
    const objDos = commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php // v2\n' }, strMensaje: 'segunda',
    });

    expect(objDos.esPrimerCommit).toBe(false);
    expect(git('rev-parse', `${objDos.sha}^`).trim()).toBe(objUno.sha);
    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'a.php')).toBe('<?php // v2\n');
  });

  it('conserva los archivos que no se pasan en el commit nuevo', () => {
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php // a\n', 'b.php': '<?php // b\n' },
      strMensaje: 'dos archivos',
    });
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php // a2\n' },
      strMensaje: 'solo a',
    });

    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'a.php')).toBe('<?php // a2\n');
    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'b.php')).toBe('<?php // b\n');
  });

  it('guarda el mensaje multilínea completo, sin problemas de escapado', () => {
    const strMensaje = 'chore(captura): qd-core-sfc\n\ninstancia: https://x.y/z\nsha256: aaa → bbb\ncomillas: "dobles" y \'simples\'\n';
    const objRes = commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php\n' }, strMensaje,
    });

    const strGuardado = git('log', '-1', '--format=%B', objRes.sha);
    expect(strGuardado).toContain('instancia: https://x.y/z');
    expect(strGuardado).toContain('sha256: aaa → bbb');
    expect(strGuardado).toContain('comillas: "dobles" y \'simples\'');
  });

  it('preserva UTF-8 multibyte en el contenido', () => {
    const strCodigo = '<?php // acentos: áéíóú ñ — y flecha →\n';
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': strCodigo }, strMensaje: 'utf8',
    });
    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'a.php')).toBe(strCodigo);
  });

  it('rechaza un commit sin archivos', () => {
    expect(() => commitearCaptura({
      strRepo, strRama: STR_RAMA, dicArchivos: {}, strMensaje: 'vacío',
    })).toThrow(/ningún archivo/);
  });
});

describe('commitearCaptura · la garantía central (no interferencia)', () => {
  it('no toca el working tree ni el índice, ni con cambios sin commitear', () => {
    // Estado sucio realista: un archivo modificado sin stagear y otro staged.
    writeFileSync(join(strRepo, 'README.md'), '# modificado sin stagear\n');
    writeFileSync(join(strRepo, 'nuevo.txt'), 'staged\n');
    git('add', 'nuevo.txt');

    const strStatusAntes = git('status', '--porcelain');
    const strHeadAntes = git('rev-parse', 'HEAD').trim();
    const strRamaAntes = git('rev-parse', '--abbrev-ref', 'HEAD').trim();

    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php\n' }, strMensaje: 'captura durante trabajo sucio',
    });

    expect(git('status', '--porcelain')).toBe(strStatusAntes);
    expect(git('rev-parse', 'HEAD').trim()).toBe(strHeadAntes);
    expect(git('rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe(strRamaAntes);
    // El contenido del working tree sigue siendo el del usuario, no el capturado.
    expect(readFileSync(join(strRepo, 'README.md'), 'utf8')).toBe('# modificado sin stagear\n');
  });

  it('no deja los .php capturados en el working tree', () => {
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'proceso-31/core.php': '<?php\n' }, strMensaje: 'captura',
    });
    // El archivo vive en la rama de historial, no en el árbol de trabajo de la rama activa.
    expect(git('status', '--porcelain')).toBe('');
  });

  it('NO dispara el hook pre-commit — la razón de usar plumbing', () => {
    // El pre-commit real de este repo corre `npm run verify` completo. Si la captura pasara por
    // porcelain, cada escritura dispararía ese gate y fallaría con el árbol rojo. Acá se instala
    // un hook que siempre falla: si commitearCaptura lo invocara, este test se caería.
    const strHook = join(strRepo, '.git', 'hooks', 'pre-commit');
    writeFileSync(strHook, '#!/bin/sh\necho "el hook corrio" >&2\nexit 1\n');
    chmodSync(strHook, 0o755);

    // Confirma que el hook SÍ bloquea por la vía porcelain: sin esto, el test podría pasar
    // simplemente porque el hook no es ejecutable en esta plataforma.
    writeFileSync(join(strRepo, 'otro.txt'), 'x\n');
    git('add', 'otro.txt');
    let blnPorcelainBloqueado = false;
    try {
      git('commit', '-m', 'deberia fallar');
    } catch {
      blnPorcelainBloqueado = true;
    }

    const objRes = commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { 'a.php': '<?php\n' }, strMensaje: 'captura con hook hostil',
    });

    expect(objRes.sha).toMatch(/^[0-9a-f]{40}$/);
    expect(leerArchivoDeRama(strRepo, STR_RAMA, 'a.php')).toBe('<?php\n');
    if (!blnPorcelainBloqueado) {
      // No invalida el resultado, pero deja constancia de que la mitad estricta no se ejerció.
      console.warn('[historial.test] el hook no bloqueó por porcelain en esta plataforma');
    }
  });
});

describe('leerIndice', () => {
  it('devuelve scripts vacío si la rama no existe todavía', () => {
    expect(leerIndice(strRepo, STR_RAMA, STR_RUTA_INDICE)).toEqual({ scripts: {} });
  });

  it('lee y parsea el índice guardado', () => {
    const objIndice = { version: 1, instance: 'https://x', scripts: { u1: { sha256: 'aaa' } } };
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { [STR_RUTA_INDICE]: JSON.stringify(objIndice, null, 2) },
      strMensaje: 'índice',
    });

    const objLeido = leerIndice(strRepo, STR_RAMA, STR_RUTA_INDICE);
    expect(objLeido.instance).toBe('https://x');
    expect(objLeido.scripts.u1.sha256).toBe('aaa');
  });

  it('degrada a vacío con un índice corrupto en vez de reventar', () => {
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { [STR_RUTA_INDICE]: '{ esto no es json' },
      strMensaje: 'corrupto',
    });
    // Falla segura: todo se ve como NUEVO y se recaptura. Se registra de más, nunca de menos.
    expect(leerIndice(strRepo, STR_RAMA, STR_RUTA_INDICE).scripts).toEqual({});
  });

  it('tolera un índice sin la clave scripts', () => {
    commitearCaptura({
      strRepo, strRama: STR_RAMA,
      dicArchivos: { [STR_RUTA_INDICE]: '{"version":1}' },
      strMensaje: 'sin scripts',
    });
    expect(leerIndice(strRepo, STR_RAMA, STR_RUTA_INDICE).scripts).toEqual({});
  });
});

describe('listarCapturas', () => {
  it('devuelve vacío si la rama no existe', () => {
    expect(listarCapturas(strRepo, STR_RAMA)).toEqual([]);
  });

  it('lista los commits del más nuevo al más viejo', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA, dicArchivos: { 'a.php': '1\n' }, strMensaje: 'uno' });
    commitearCaptura({ strRepo, strRama: STR_RAMA, dicArchivos: { 'a.php': '2\n' }, strMensaje: 'dos' });

    const lstCapturas = listarCapturas(strRepo, STR_RAMA);
    expect(lstCapturas.map((o) => o.titulo)).toEqual(['dos', 'uno']);
    expect(lstCapturas[0].sha).toMatch(/^[0-9a-f]{40}$/);
    expect(lstCapturas[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('filtra por archivo', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA, dicArchivos: { 'a.php': '1\n' }, strMensaje: 'toca a' });
    commitearCaptura({ strRepo, strRama: STR_RAMA, dicArchivos: { 'b.php': '1\n' }, strMensaje: 'toca b' });

    expect(listarCapturas(strRepo, STR_RAMA, { strRuta: 'a.php' }).map((o) => o.titulo)).toEqual(['toca a']);
  });

  it('respeta el máximo pedido', () => {
    for (let i = 0; i < 5; i++) {
      commitearCaptura({ strRepo, strRama: STR_RAMA, dicArchivos: { 'a.php': `${i}\n` }, strMensaje: `c${i}` });
    }
    expect(listarCapturas(strRepo, STR_RAMA, { intMax: 2 })).toHaveLength(2);
  });
});

describe('validarIdentidadGit', () => {
  it('devuelve null cuando hay identidad configurada', () => {
    expect(validarIdentidadGit(strRepo)).toBeNull();
  });
});
