/**
 * Hash SHA-256 de un archivo — usado para detectar binarios duplicados entre adjuntos, incluso si el
 * usuario los subió con nombres distintos. PM4/Smart Supervision rechaza el binario repetido al
 * guardar el media, sin importar el nombre del archivo, así que la comparación debe ser por
 * contenido, no por nombre.
 *
 * Portado de `frontend/src/core/fileHash.ts` **sin cambios de lógica** (es lógica pura, no depende de
 * React). Solo cambia el nombre del archivo a la convención kebab de este workspace.
 *
 * ── Este módulo NO tenía test en la app React, y ahora sí ─────────────────────────────────────
 * Vale decirlo porque contradice la expectativa razonable de "los tests se portan 1:1": no había
 * nada que portar. Se escribió [`file-hash.spec.ts`](./file-hash.spec.ts) al traerlo, con el caso que
 * importa (mismo contenido y nombre distinto → duplicado) y con la exclusión del propio slot.
 */
const dicHashCache = new WeakMap<File, Promise<string>>();

/**
 * Cachea la promesa, no el string, a propósito: dos llamadas concurrentes sobre el mismo `File`
 * comparten el mismo `digest()` en vez de leer el buffer dos veces. La clave es débil, así que el
 * `File` se puede recolectar cuando el registro lo suelta.
 */
function hashFileSha256(in_objFile: File): Promise<string> {
  let objCached = dicHashCache.get(in_objFile);
  if (!objCached) {
    objCached = in_objFile.arrayBuffer().then(async (in_bufContent) => {
      const bufDigest = await crypto.subtle.digest('SHA-256', in_bufContent);
      return Array.from(new Uint8Array(bufDigest))
        .map((in_intByte) => in_intByte.toString(16).padStart(2, '0'))
        .join('');
    });
    dicHashCache.set(in_objFile, objCached);
  }
  return objCached;
}

/**
 * Busca en el registro de adjuntos si ya existe un archivo con el MISMO contenido binario que
 * `in_objFile` (comparado por hash SHA-256, no por nombre). Excluye `in_strExcludeKey` —el propio
 * slot que se está editando— de la comparación, para que reemplazar un archivo por sí mismo no se
 * reporte como duplicado.
 *
 * Devuelve el `docKey` del duplicado encontrado, o `null` si no hay coincidencia.
 */
export async function findDuplicateAttachment(
  in_objFile: File,
  in_mapRegistry: Map<string, File>,
  in_strExcludeKey: string,
): Promise<string | null> {
  const strTargetHash = await hashFileSha256(in_objFile);
  for (const [strKey, objExistingFile] of in_mapRegistry.entries()) {
    if (strKey === in_strExcludeKey) continue;
    // Await secuencial dentro del bucle, a propósito: son máximo ~5 adjuntos por pantalla y el
    // primer duplicado corta, así que paralelizar con `Promise.all` haría más trabajo (hashea todo)
    // para ahorrar un tiempo que no se nota. En la versión React esta línea llevaba un
    // `eslint-disable no-await-in-loop`; acá esa regla no está habilitada y el disable quedaba
    // muerto (ESLint lo reporta como directiva inútil y `--max-warnings=0` lo hace fallar).
    const strExistingHash = await hashFileSha256(objExistingFile);
    if (strExistingHash === strTargetHash) return strKey;
  }
  return null;
}
