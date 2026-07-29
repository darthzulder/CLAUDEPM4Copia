// Hash SHA-256 de un archivo — usado para detectar binarios duplicados entre
// adjuntos, incluso si el usuario los subió con nombres distintos. PM4/Smart
// Supervision rechaza el binario repetido al guardar el media, sin importar el
// nombre del archivo, así que la comparación debe ser por contenido, no por nombre.
const dicHashCache = new WeakMap<File, Promise<string>>();

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
 * Busca en el registro de adjuntos si ya existe un archivo con el MISMO contenido
 * binario que `in_objFile` (comparado por hash SHA-256, no por nombre). Excluye
 * `in_strExcludeKey` (el propio slot que se está editando) de la comparación.
 * Devuelve el docKey del duplicado encontrado, o null si no hay coincidencia.
 */
export async function findDuplicateAttachment(
  in_objFile: File,
  in_mapRegistry: Map<string, File>,
  in_strExcludeKey: string,
): Promise<string | null> {
  const strTargetHash = await hashFileSha256(in_objFile);
  for (const [strKey, objExistingFile] of in_mapRegistry.entries()) {
    if (strKey === in_strExcludeKey) continue;
    // eslint-disable-next-line no-await-in-loop -- comparación secuencial simple, máx ~5 adjuntos
    const strExistingHash = await hashFileSha256(objExistingFile);
    if (strExistingHash === strTargetHash) return strKey;
  }
  return null;
}
