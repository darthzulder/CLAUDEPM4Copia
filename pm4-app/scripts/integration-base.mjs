#!/usr/bin/env node
/**
 * ¿Contra qué rama se integra la rama actual?
 *
 * El proyecto tiene DOS ramas de larga vida, y cada una es un entorno desplegado:
 *
 *   feat/… fix/… chore/…  ──►  dev   ──►  Render de desarrollo (pruebas)
 *   dev  (release)        ──►  main  ──►  Render de producción
 *
 * Esa pregunta la necesitan tres consumidores —el hook `pre-push`, el default de
 * `coverage-diff.mjs` y la documentación—, así que la regla vive acá y no repetida en cada uno.
 * Cuando el modelo de ramas cambie, se cambia en un solo archivo.
 *
 * Por qué importa acertarle: antes esto estaba cableado a `main` en los dos primeros. Como `dev`
 * contiene todo `main`, una rama salida de `dev` cumplía "contiene main" por construcción y el
 * chequeo daba verde sin haber mirado nada — mientras la pregunta real ("¿estoy atrás de `dev`?")
 * quedaba sin responder. En cobertura era peor: diffear contra `main` atribuía a tu rama todos
 * los commits que `dev` tiene de más.
 *
 * Uso:
 *   node scripts/integration-base.mjs            # base de la rama actual
 *   node scripts/integration-base.mjs feat/algo  # base de una rama dada
 *
 * Imprime el nombre de la rama base, o nada (y sale con 0) si la rama no se integra en ninguna
 * —`main`, que es la punta—. Un `git config pm4.integrationBase <rama>` local pisa la regla, para
 * casos puntuales sin editar código.
 */

import { spawnSync } from 'node:child_process';

/** Ramas de larga vida: cada una es un entorno desplegado, ninguna se integra "hacia arriba". */
export const STR_RAMA_DESARROLLO = 'dev';
export const STR_RAMA_PRODUCCION = 'main';

/**
 * Rama base de integración, o `null` si no hay ninguna.
 *
 * - `main` → `null`: es la punta del flujo, no se integra en nada.
 * - `dev` → `main`: no porque haya que mergear dev a main en cada push, sino porque un hotfix
 *   aplicado directo sobre `main` deja a `dev` sin ese arreglo. Avisar acá es lo que impide que
 *   el próximo release lo pise silenciosamente.
 * - `release/*` y `hotfix/*` → `main`: van a producción, no a desarrollo.
 * - cualquier otra (feat/…, fix/…, chore/…, docs/…) → `dev`.
 */
export function baseDeIntegracion(in_strRama) {
  if (in_strRama === STR_RAMA_PRODUCCION) return null;
  if (in_strRama === STR_RAMA_DESARROLLO) return STR_RAMA_PRODUCCION;
  if (/^(release|hotfix)\//.test(in_strRama)) return STR_RAMA_PRODUCCION;
  return STR_RAMA_DESARROLLO;
}

/** Rama actual, o `null` si el HEAD está desprendido (no hay rama de la que deducir la base). */
export function ramaActual() {
  const objRes = spawnSync('git symbolic-ref --short HEAD', { encoding: 'utf8', shell: true });
  return objRes.status === 0 ? objRes.stdout.trim() : null;
}

/** Override local: `git config pm4.integrationBase <rama>`. Vacío si no está configurado. */
function baseConfigurada() {
  const objRes = spawnSync('git config --get pm4.integrationBase', { encoding: 'utf8', shell: true });
  return objRes.status === 0 ? objRes.stdout.trim() : '';
}

/** La base efectiva de la rama actual, respetando el override. */
export function baseEfectiva() {
  const strConfigurada = baseConfigurada();
  if (strConfigurada) return strConfigurada;
  const strRama = ramaActual();
  return strRama ? baseDeIntegracion(strRama) : null;
}

// Modo CLI: lo consume el hook `pre-push`, que es sh y no puede importar este módulo.
// `import.meta.main` no está disponible en todas las versiones, así que se compara el argv.
if (process.argv[1] && process.argv[1].endsWith('integration-base.mjs')) {
  const strRamaPedida = process.argv[2];
  const strBase = strRamaPedida
    ? (baseConfigurada() || baseDeIntegracion(strRamaPedida))
    : baseEfectiva();
  if (strBase) console.log(strBase);
}
