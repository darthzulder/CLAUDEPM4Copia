// Espejo local navegable de los scripts capturados.
//
// El historial vive en la rama huérfana `pm4-scripts-historial`, que es el respaldo real y
// versionado. Pero una rama no se navega: para leer un script hay que hacer `git show`, y ni el
// editor, ni el explorador de archivos, ni una búsqueda local lo ven.
//
// Este módulo vuelca esos mismos contenidos a una carpeta en disco. La carpeta se ignora en git a
// propósito: si se versionara, el mismo contenido viviría en dos ramas y podrían desincronizarse
// en silencio — peor que tener una sola copia, porque nunca sabés cuál miente.
//
// Regla del espejo: se genera, no se edita. Editar un archivo acá no cambia nada en PM4 y la
// próxima captura lo sobrescribe.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** README que se deja en la raíz del espejo, para quien lo encuentre sin contexto. */
export const STR_README_ESPEJO = `# Espejo local de los scripts PM4 — GENERADO, NO EDITAR

Esta carpeta la escribe \`pm4-scripts.mjs\` en cada captura. **No está versionada** (ver
\`.gitignore\`) y **editarla no cambia nada en PM4**: la próxima captura la sobrescribe.

- **Fuente de verdad:** la instancia PM4 (\`PM4_BASE_URL\` en \`pm4-app/.env\`).
- **Respaldo versionado:** la rama \`pm4-scripts-historial\`.
- **Esta carpeta:** una vista cómoda para leer, buscar y grepear.

Regenerarla desde cero (por ejemplo tras clonar el repo):

\`\`\`bash
cd pm4-app && npm run pm4:capture -- --all
\`\`\`

Historial de un script:

\`\`\`bash
git log pm4-scripts-historial -- proceso-31/col-qd-core-sfc.php
git show <sha>:proceso-31/col-qd-core-sfc.php
\`\`\`
`;

/**
 * Escribe los archivos bajo `strDirBase`, creando los subdirectorios que hagan falta.
 *
 * @param {string} strDirBase raíz del espejo
 * @param {Record<string, string>} dicArchivos ruta relativa (con `/`) → contenido
 * @returns {string[]} rutas relativas escritas
 */
export function escribirEspejo(strDirBase, dicArchivos) {
  const lstEscritas = [];

  for (const [strRutaRel, strContenido] of Object.entries(dicArchivos)) {
    const strDestino = join(strDirBase, strRutaRel);
    mkdirSync(dirname(strDestino), { recursive: true });
    writeFileSync(strDestino, strContenido, 'utf8');
    lstEscritas.push(strRutaRel);
  }

  if (lstEscritas.length > 0) {
    mkdirSync(strDirBase, { recursive: true });
    writeFileSync(join(strDirBase, 'README.md'), STR_README_ESPEJO, 'utf8');
  }

  return lstEscritas;
}
