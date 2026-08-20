import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guarda de inventario del gate, del mismo tipo que `App.smoke.test.tsx` para las pantallas o
 * `core/collections.test.ts` para las colecciones PM4.
 *
 * El riesgo que cubre es asimétrico y silencioso: si alguien AGREGA un paso a `verify.mjs` y está
 * mal, el gate se pone rojo y se nota en el primer commit. Si alguien **saca** un paso, el gate
 * sigue verde —más rápido, incluso— y nadie se entera de que dejó de cubrir un workspace. Eso ya
 * pasó en la práctica: durante meses `verify` enumeró un paso de `pytest` para un microservicio
 * Python que había salido del árbol, y la única señal era una línea de "SALTADO" que se leía como
 * ruido normal.
 *
 * Por eso la aserción es sobre la lista COMPLETA y en orden, no un `toContain`: cambiar el gate
 * tiene que exigir cambiar este archivo en el mismo commit, que es el punto donde alguien decide
 * a conciencia si la cobertura sube o baja.
 *
 * Se compara solo el NOMBRE del paso, nunca si se salta: qué se salta depende de la máquina (Node
 * 24 presente o no, workspace `frontend` en el árbol o no) y afirmarlo acá haría el test
 * dependiente del entorno.
 */

const STR_DIR_PM4 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CLL_PASOS_ESPERADOS = [
  'lint · frontend',
  'lint · frontend-ng',
  'lint · backend',
  'typecheck · backend',
  'build · frontend',
  'build · frontend-ng',
  'build · backend',
  'test · frontend',
  'test · frontend-ng',
  'test · backend',
  'test · scripts',
];

/**
 * Los nombres de paso que `--list` enumera, en orden.
 *
 * `--list` imprime `• <nombre>` o `⏭ <nombre>  (se salta: <motivo>)`, así que se corta en el
 * primer `  (se salta:` — dos espacios, para no partir un nombre que contuviera la palabra.
 */
function listarPasos() {
  const objRes = spawnSync(process.execPath, ['scripts/verify.mjs', '--list'], {
    cwd: STR_DIR_PM4,
    encoding: 'utf8',
  });

  expect(objRes.status, `verify.mjs --list falló:\n${objRes.stderr}`).toBe(0);

  return objRes.stdout
    .split('\n')
    .map((strLinea) => strLinea.trim())
    .filter((strLinea) => strLinea.startsWith('•') || strLinea.startsWith('⏭'))
    .map((strLinea) => strLinea.replace(/^[•⏭]\s*/, '').split('  (se salta:')[0].trim());
}

describe('verify.mjs · inventario de pasos', () => {
  it('enumera exactamente los pasos esperados, en orden', () => {
    expect(listarPasos()).toEqual(CLL_PASOS_ESPERADOS);
  });

  it('no quedó ningún paso apuntando a un runtime que ya no está en el árbol', () => {
    // El microservicio Python de cotización salió del proyecto en `d4e63a4`; su paso de `pytest`
    // sobrevivió un tiempo enumerándose y saltándose. Esta aserción es la que impide que vuelva
    // —o que entre otro paso de un runtime ausente— sin que nadie lo note.
    for (const strPaso of listarPasos()) {
      expect(strPaso).not.toMatch(/pytest|cotizador|python/i);
    }
  });
});
