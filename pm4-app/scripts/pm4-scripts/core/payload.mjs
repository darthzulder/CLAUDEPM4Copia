// Construcción del body para `PUT /scripts/{id}` — solo lo usa `restore`.
//
// Por qué existe este módulo en vez de mandar `{ code }` y ya: el schema `scriptsEditable` de la
// API de PM4 **no declara ningún campo como required**, así que un PUT parcial no es rechazado —
// se acepta y los campos ausentes quedan vacíos o nulos. Mandar solo `code` puede borrar el
// `title`, el `timeout` y, lo más grave, el `script_executor_id`: un script sin ejecutor deja de
// correr en PM4, y el proceso que lo invoca falla en producción sin un error evidente.
//
// La defensa es read-modify-write: se lee el script completo, se cambia únicamente `code`, y se
// reenvía el resto tal cual vino. Este módulo es la parte "modify" y está aislado para poder
// testear la whitelist sin tocar la red.
//
// Nota: `script_executor_id` NO figura en el schema documentado, pero el GET sí lo devuelve y es
// crítico. Se reenvía a propósito, por conservador.

/**
 * Campos que se reenvían en el PUT. Todo lo demás que devuelve el GET se descarta.
 *
 * `id`/`uuid` van en la URL, no en el body. `created_at`/`updated_at` los maneja el servidor.
 * `status` se omite porque cambiarlo por accidente activaría o desactivaría el script.
 */
export const LST_CAMPOS_EDITABLES = Object.freeze([
  'title',
  'description',
  'language',
  'timeout',
  'run_as_user_id',
  'key',
  'script_category_id',
  'script_executor_id',
]);

/** Campos que nunca deben viajar en el body, aunque el GET los devuelva. */
const LST_CAMPOS_PROHIBIDOS = Object.freeze([
  'id',
  'uuid',
  'created_at',
  'updated_at',
  'status',
  'code',
]);

/**
 * Arma el body del PUT a partir del script remoto y el código que se quiere publicar.
 *
 * @param {Record<string, unknown>} objRemoto respuesta de `GET /scripts/{id}`, fresca
 * @param {string} strCodigoCanonico el código a publicar, ya canonicalizado
 * @returns {Record<string, unknown>} body listo para el PUT
 * @throws {Error} si el código está vacío — publicar `code: ""` sobre un script vivo es el peor
 *   fallo posible del sistema y se ataja acá, no en el llamador
 */
export function construirPayloadRestore(objRemoto, strCodigoCanonico) {
  if (typeof strCodigoCanonico !== 'string' || strCodigoCanonico.trim() === '') {
    throw new Error('construirPayloadRestore: el código está vacío; se aborta para no borrar el script en PM4.');
  }

  const dicPayload = {};

  for (const strCampo of LST_CAMPOS_EDITABLES) {
    const genValor = objRemoto?.[strCampo];

    // Un campo ausente se omite: que PM4 conserve lo que tenga. Un campo presente pero null se
    // omite también, EXCEPTO description: PM4 lo devuelve como null con frecuencia y la validación
    // del lado servidor lo rechaza, así que se manda como string vacío.
    if (genValor === undefined || genValor === null) {
      if (strCampo === 'description') dicPayload.description = '';
      continue;
    }
    dicPayload[strCampo] = genValor;
  }

  dicPayload.code = strCodigoCanonico;
  return dicPayload;
}

/**
 * Verifica que un body no arrastre campos prohibidos.
 *
 * Se usa como aserción defensiva antes del PUT: si alguien amplía LST_CAMPOS_EDITABLES sin pensar,
 * o pasa el objeto remoto entero por error, esto lo detiene antes de tocar PM4.
 *
 * @param {Record<string, unknown>} dicPayload
 * @returns {string[]} campos prohibidos encontrados (vacío si está limpio)
 */
export function detectarCamposProhibidos(dicPayload) {
  return LST_CAMPOS_PROHIBIDOS
    .filter((strCampo) => strCampo !== 'code')
    .filter((strCampo) => Object.hasOwn(dicPayload, strCampo));
}
