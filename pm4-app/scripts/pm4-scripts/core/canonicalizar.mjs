// Forma canónica del código de un script PM4 — la base de todo el sistema de captura.
//
// El problema que resuelve: el código viaja por JSON (API de PM4) y se guarda como blob de git.
// Si se comparan bytes crudos, cualquier diferencia irrelevante de bordes —un BOM que agregó un
// editor, CRLF de un checkout en Windows, un salto de línea final que PM4 recorta al guardar—
// produce un diff espurio y el sistema registraría "cambios" que nadie hizo, en cada corrida y
// para siempre.
//
// La solución es comparar CLASES DE EQUIVALENCIA en vez de bytes: se normaliza ambos lados a una
// forma única antes de hashear. Que la función sea IDEMPOTENTE es el requisito clave —
// canonicalizar(canonicalizar(x)) === canonicalizar(x)— porque garantiza que el round-trip
// PM4 → git → PM4 converge sin importar qué haga PM4 con los bordes al guardar.

import { createHash } from 'node:crypto';

/**
 * Normaliza el código a: UTF-8 sin BOM, saltos de línea LF, exactamente un `\n` final.
 *
 * Deliberadamente NO toca el whitespace de fin de línea, los tabs ni la indentación: en PHP los
 * espacios finales dentro de un heredoc/nowdoc son parte del string y podrían cambiar el texto de
 * un correo enviado a un cliente. El beneficio de "limpiarlos" es cosmético; el costo es un bug
 * silencioso en producción. Esta función normaliza bordes, no formatea código.
 *
 * @param {string} strRaw código tal como viene de PM4 o de un blob de git
 * @returns {string} la forma canónica; siempre termina en exactamente un `\n`
 */
export function canonicalizar(strRaw) {
  if (typeof strRaw !== 'string') {
    throw new TypeError(`canonicalizar espera un string, recibió ${typeof strRaw}`);
  }

  let strOut = strRaw;

  // El BOM: readFileSync(..., 'utf8') de Node NO lo consume — lo deja como U+FEFF al inicio del
  // string. Publicado a un script PHP produce el clásico "headers already sent".
  if (strOut.charCodeAt(0) === 0xfeff) strOut = strOut.slice(1);

  // CRLF y CR suelto (Mac clásico) → LF. Barato, y elimina toda una clase de bug de una vez.
  strOut = strOut.replace(/\r\n?/g, '\n');

  // Exactamente un salto final. Colapsar los múltiples es lo que hace idempotente a la función:
  // si PM4 recorta el `\n` al guardar, la siguiente lectura lo vuelve a agregar y el hash coincide.
  strOut = strOut.replace(/\n+$/, '') + '\n';

  return strOut;
}

/**
 * SHA-256 en hex de los BYTES UTF-8 de la forma canónica.
 *
 * Se hashea sobre `Buffer.from(str, 'utf8')` y no sobre el string a secas por una razón concreta:
 * el largo de un string JS son unidades UTF-16, no bytes. Un archivo con acentos reporta largos
 * distintos según cómo se mida (5456 bytes vs 5421 code points en un caso real de este repo), y
 * comparar longitudes lleva a perseguir un problema de CRLF que no existe. El hash de bytes es la
 * única comparación confiable.
 *
 * @param {string} strCanonico salida de canonicalizar()
 * @returns {string} sha256 en hexadecimal minúscula
 */
export function hashCanonico(strCanonico) {
  return createHash('sha256').update(Buffer.from(strCanonico, 'utf8')).digest('hex');
}

/**
 * ¿La forma canónica corresponde a un script vacío?
 *
 * Guarda dura contra el peor fallo posible del sistema: publicar `code: ""` sobre un script vivo
 * —por ejemplo el CORE SFC, del que dependen las radicaciones ante la Superintendencia— dejaría el
 * proceso roto sin ningún error visible. Como canonicalizar() siempre agrega el `\n` final, el
 * caso vacío se detecta comparando contra "\n", no contra "".
 *
 * @param {string} strCanonico salida de canonicalizar()
 * @returns {boolean}
 */
export function esCodigoVacio(strCanonico) {
  return strCanonico.trim() === '';
}

/**
 * Atajo de conveniencia: canonicaliza y hashea en un paso.
 * Es el camino que usan capture y restore; existe para que sea imposible hashear por accidente
 * un contenido sin canonicalizar (el bug que invalidaría todas las comparaciones del sistema).
 *
 * @param {string} strRaw código crudo
 * @returns {{ codigo: string, sha256: string, vacio: boolean }}
 */
export function normalizar(strRaw) {
  const strCodigo = canonicalizar(strRaw);
  return {
    codigo: strCodigo,
    sha256: hashCanonico(strCodigo),
    vacio: esCodigoVacio(strCodigo),
  };
}
