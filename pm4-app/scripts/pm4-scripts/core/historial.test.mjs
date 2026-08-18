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
  STR_RAMA_HISTORIAL,
  hayRemoto,
  traerRemoto,
  puntaLocal,
  puntaRemota,
  estadoSincronizacion,
  moverRamaA,
  pushearHistorial,
  STR_REMOTO_POR_DEFECTO,
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

describe('pushearHistorial · la guarda', () => {
  it('RECHAZA pushear cualquier rama que no sea la de historial', () => {
    // El push automático está autorizado solo para el canal de registro. Que sea un throw y no una
    // convención es lo que hace imposible que este módulo publique el trabajo de alguien por error.
    expect(() => pushearHistorial(strRepo, 'main')).toThrow(/solo puede pushear/);
    expect(() => pushearHistorial(strRepo, 'dev')).toThrow(/solo puede pushear/);
    expect(() => pushearHistorial(strRepo, 'feat/lo-que-sea')).toThrow(/solo puede pushear/);
  });

  it('la rama permitida es exactamente la de historial', () => {
    expect(STR_RAMA_HISTORIAL).toBe('pm4-scripts-historial');
  });

  it('sin remoto configurado informa en vez de fallar', () => {
    const objRes = pushearHistorial(strRepo, STR_RAMA_HISTORIAL);
    expect(objRes.ok).toBe(false);
    expect(objRes.rechazado).toBe(false);
    expect(objRes.mensaje).toMatch(/remoto/);
  });
});

describe('sincronización con el remoto', () => {
  /** Segundo repo que hace de origin, para ejercitar fetch y push de verdad. */
  let strRemoto;

  beforeEach(() => {
    strRemoto = mkdtempSync(join(tmpdir(), 'pm4-hist-remote-'));
    execFileSync('git', ['init', '--bare', '--quiet'], { cwd: strRemoto, stdio: ['pipe', 'pipe', 'pipe'] });
    git('remote', 'add', 'origin', strRemoto);
  });

  afterEach(() => {
    rmSync(strRemoto, { recursive: true, force: true });
  });

  it('publica la rama y el remoto la recibe', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '<?php\n' }, strMensaje: 'una' });
    expect(hayRemoto(strRepo)).toBe(true);
    expect(pushearHistorial(strRepo, STR_RAMA_HISTORIAL).ok).toBe(true);

    const strEnRemoto = execFileSync('git', ['rev-parse', STR_RAMA_HISTORIAL], {
      cwd: strRemoto, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    expect(strEnRemoto).toBe(puntaLocal(strRepo, STR_RAMA_HISTORIAL));
  });

  it('reconoce al-dia y adelante', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '1\n' }, strMensaje: 'una' });
    pushearHistorial(strRepo, STR_RAMA_HISTORIAL);
    traerRemoto(strRepo, STR_RAMA_HISTORIAL);
    expect(estadoSincronizacion(strRepo, STR_RAMA_HISTORIAL)).toBe('al-dia');

    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '2\n' }, strMensaje: 'dos' });
    expect(estadoSincronizacion(strRepo, STR_RAMA_HISTORIAL)).toBe('adelante');
  });

  it('un clone nuevo adopta la rama del remoto en vez de crear una paralela', () => {
    // El fallo más silencioso del modo compartido: sin esto, la máquina que clona ve la rama como
    // inexistente, crea una huérfana NUEVA, y quedan dos historiales sin ancestro común.
    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '1\n' }, strMensaje: 'del equipo' });
    pushearHistorial(strRepo, STR_RAMA_HISTORIAL);

    const strClone = mkdtempSync(join(tmpdir(), 'pm4-hist-clone-'));
    try {
      execFileSync('git', ['clone', '--quiet', strRemoto, '.'], { cwd: strClone, stdio: ['pipe', 'pipe', 'pipe'] });

      expect(puntaLocal(strClone, STR_RAMA_HISTORIAL)).toBeNull();
      expect(traerRemoto(strClone, STR_RAMA_HISTORIAL)).toBe(true);

      const strPuntaRemota = puntaRemota(strClone, STR_RAMA_HISTORIAL);
      expect(strPuntaRemota).not.toBeNull();

      moverRamaA(strClone, STR_RAMA_HISTORIAL, strPuntaRemota);
      expect(puntaLocal(strClone, STR_RAMA_HISTORIAL)).toBe(strPuntaRemota);
      expect(leerArchivoDeRama(strClone, STR_RAMA_HISTORIAL, 'a.php')).toBe('1\n');
    } finally {
      rmSync(strClone, { recursive: true, force: true });
    }
  });

  it('reconcilia una divergencia conservando AMBAS historias', () => {
    const objBase = commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': 'base\n' }, strMensaje: 'base' });
    pushearHistorial(strRepo, STR_RAMA_HISTORIAL);

    // Un compañero publica algo que nosotros todavía no tenemos.
    const strOtro = mkdtempSync(join(tmpdir(), 'pm4-hist-otro-'));
    let strShaCompanero;
    try {
      execFileSync('git', ['clone', '--quiet', strRemoto, '.'], { cwd: strOtro, stdio: ['pipe', 'pipe', 'pipe'] });
      execFileSync('git', ['config', 'user.name', 'Otro'], { cwd: strOtro, stdio: ['pipe', 'pipe', 'pipe'] });
      execFileSync('git', ['config', 'user.email', 'otro@example.com'], { cwd: strOtro, stdio: ['pipe', 'pipe', 'pipe'] });
      traerRemoto(strOtro, STR_RAMA_HISTORIAL);
      moverRamaA(strOtro, STR_RAMA_HISTORIAL, puntaRemota(strOtro, STR_RAMA_HISTORIAL));
      strShaCompanero = commitearCaptura({
        strRepo: strOtro, strRama: STR_RAMA_HISTORIAL,
        dicArchivos: { 'b.php': 'del companero\n' }, strMensaje: 'del companero',
      }).sha;
      expect(pushearHistorial(strOtro, STR_RAMA_HISTORIAL).ok).toBe(true);
    } finally {
      rmSync(strOtro, { recursive: true, force: true });
    }

    // Nosotros capturamos desde la base vieja: divergimos.
    const objNuestro = commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': 'nuestro\n' }, strMensaje: 'nuestro' });
    expect(pushearHistorial(strRepo, STR_RAMA_HISTORIAL).rechazado).toBe(true);

    traerRemoto(strRepo, STR_RAMA_HISTORIAL);
    expect(estadoSincronizacion(strRepo, STR_RAMA_HISTORIAL)).toBe('divergido');

    // Reconciliar: dos padres y el árbol del remoto como base.
    const strRemotoSha = puntaRemota(strRepo, STR_RAMA_HISTORIAL);
    commitearCaptura({
      strRepo, strRama: STR_RAMA_HISTORIAL,
      dicArchivos: { 'a.php': 'nuestro\n' },
      strMensaje: 'reconciliado',
      lstPadres: [objNuestro.sha, strRemotoSha],
      strTreeBase: strRemotoSha,
    });

    expect(pushearHistorial(strRepo, STR_RAMA_HISTORIAL).ok).toBe(true);

    // Sobrevive lo del compañero Y lo nuestro, y ambas historias quedan alcanzables.
    expect(leerArchivoDeRama(strRepo, STR_RAMA_HISTORIAL, 'b.php')).toBe('del companero\n');
    expect(leerArchivoDeRama(strRepo, STR_RAMA_HISTORIAL, 'a.php')).toBe('nuestro\n');
    expect(git('merge-base', '--is-ancestor', strShaCompanero, STR_RAMA_HISTORIAL)).toBe('');
    expect(git('merge-base', '--is-ancestor', objBase.sha, STR_RAMA_HISTORIAL)).toBe('');
  });
});

describe('remoto configurable', () => {
  // Deliberadamente NO se llama "origin": si alguna funcion volviera a cablear ese nombre, estos
  // tests se caen. Con un remoto llamado origin pasarian igual y la regresion seria invisible.
  const STR_OTRO_REMOTO = 'zurich';
  let strRemotoDir;

  beforeEach(() => {
    strRemotoDir = mkdtempSync(join(tmpdir(), 'pm4-hist-alt-'));
    execFileSync('git', ['init', '--bare', '--quiet'], { cwd: strRemotoDir, stdio: ['pipe', 'pipe', 'pipe'] });
    git('remote', 'add', STR_OTRO_REMOTO, strRemotoDir);
  });

  afterEach(() => {
    rmSync(strRemotoDir, { recursive: true, force: true });
  });

  it('el default sigue siendo origin', () => {
    expect(STR_REMOTO_POR_DEFECTO).toBe('origin');
  });

  it('hayRemoto consulta el remoto que se le pasa', () => {
    expect(hayRemoto(strRepo, STR_OTRO_REMOTO)).toBe(true);
    expect(hayRemoto(strRepo, 'no-existe')).toBe(false);
  });

  it('publica en el remoto indicado, no en origin', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '<?php\n' }, strMensaje: 'una' });
    expect(pushearHistorial(strRepo, STR_RAMA_HISTORIAL, STR_OTRO_REMOTO).ok).toBe(true);

    const strEnRemoto = execFileSync('git', ['rev-parse', STR_RAMA_HISTORIAL], {
      cwd: strRemotoDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    expect(strEnRemoto).toBe(puntaLocal(strRepo, STR_RAMA_HISTORIAL));
  });

  it('fetch y comparacion tambien usan el remoto indicado', () => {
    commitearCaptura({ strRepo, strRama: STR_RAMA_HISTORIAL, dicArchivos: { 'a.php': '1\n' }, strMensaje: 'una' });
    pushearHistorial(strRepo, STR_RAMA_HISTORIAL, STR_OTRO_REMOTO);

    expect(traerRemoto(strRepo, STR_RAMA_HISTORIAL, STR_OTRO_REMOTO)).toBe(true);
    expect(puntaRemota(strRepo, STR_RAMA_HISTORIAL, STR_OTRO_REMOTO)).toBe(puntaLocal(strRepo, STR_RAMA_HISTORIAL));
    expect(estadoSincronizacion(strRepo, STR_RAMA_HISTORIAL, STR_OTRO_REMOTO)).toBe('al-dia');
  });

  it('la guarda de rama sigue aplicando con cualquier remoto', () => {
    expect(() => pushearHistorial(strRepo, 'main', STR_OTRO_REMOTO)).toThrow(/solo puede pushear/);
  });
});
