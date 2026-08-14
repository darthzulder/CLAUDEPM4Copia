import { describe, expect, it } from 'vitest';
import { findDuplicateAttachment } from './file-hash';

/**
 * Spec **nuevo**: este módulo se portó de `frontend/src/core/fileHash.ts`, que **no tenía test** en la
 * app React. No hay paridad que mantener acá — se escribió de cero al traerlo.
 *
 * Lo que puede romperse, y por eso es lo que se asevera:
 *
 * 1. **Que la comparación sea por contenido y no por nombre.** Es la razón de existir del módulo:
 *    Smart Supervision rechaza el binario repetido aunque el archivo se llame distinto, así que un
 *    chequeo por nombre dejaría pasar exactamente el caso que PM4 va a rechazar al guardar. El test de
 *    "mismo contenido, nombre distinto" es el que se pone rojo si alguien "simplifica" esto a comparar
 *    `.name`.
 * 2. **Que se excluya el propio slot.** Sin la exclusión, reemplazar un adjunto por sí mismo se
 *    reportaría como duplicado y el usuario no podría volver a subir el archivo que ya tenía.
 *
 * `crypto.subtle` viene del `webcrypto` de Node, expuesto como global desde Node 20 — no hace falta
 * shim en el `test-setup.ts`. Si algún día el runner corriera sin él, estos tests fallarían con
 * `crypto.subtle is undefined`, que es un mensaje que apunta al lugar correcto.
 */

/** Los `File` de jsdom aceptan `BlobPart[]`, así que el contenido se define por string. */
function archivo(in_strNombre: string, in_strContenido: string): File {
  return new File([in_strContenido], in_strNombre, { type: 'application/pdf' });
}

describe('findDuplicateAttachment', () => {
  it('detecta el duplicado por CONTENIDO aunque el nombre sea distinto', async () => {
    // El caso que justifica todo el módulo. Los dos archivos tienen bytes idénticos y nombres que no
    // se parecen en nada.
    const objRegistro = new Map([['qd_strSoporte', archivo('cedula.pdf', 'MISMO-BINARIO')]]);
    const objNuevo = archivo('documento-de-identidad.pdf', 'MISMO-BINARIO');

    await expect(findDuplicateAttachment(objNuevo, objRegistro, 'qd_strAnexo')).resolves.toBe(
      'qd_strSoporte',
    );
  });

  it('NO reporta duplicado cuando el contenido difiere, aun con el mismo nombre', async () => {
    // El recíproco: mismo nombre no implica mismo binario, y PM4 acepta los dos.
    const objRegistro = new Map([['qd_strSoporte', archivo('anexo.pdf', 'CONTENIDO-A')]]);
    const objNuevo = archivo('anexo.pdf', 'CONTENIDO-B');

    await expect(findDuplicateAttachment(objNuevo, objRegistro, 'qd_strAnexo')).resolves.toBeNull();
  });

  it('excluye el propio slot: reemplazar un archivo por sí mismo no es duplicado', async () => {
    // Sin esta exclusión el usuario no podría re-subir el archivo que ya tenía en ese campo.
    const objArchivo = archivo('cedula.pdf', 'MISMO-BINARIO');
    const objRegistro = new Map([['qd_strSoporte', objArchivo]]);

    await expect(
      findDuplicateAttachment(archivo('cedula.pdf', 'MISMO-BINARIO'), objRegistro, 'qd_strSoporte'),
    ).resolves.toBeNull();
  });

  it('devuelve el docKey del PRIMER duplicado y no sigue recorriendo', async () => {
    // El corto-circuito es lo que hace aceptable el await secuencial dentro del bucle. Se asevera
    // sobre el valor devuelto, que es la única evidencia observable del orden.
    const objRegistro = new Map([
      ['qd_strPrimero', archivo('a.pdf', 'REPETIDO')],
      ['qd_strSegundo', archivo('b.pdf', 'REPETIDO')],
    ]);

    await expect(
      findDuplicateAttachment(archivo('c.pdf', 'REPETIDO'), objRegistro, 'qd_strOtro'),
    ).resolves.toBe('qd_strPrimero');
  });

  it('con el registro vacío devuelve null', async () => {
    await expect(
      findDuplicateAttachment(archivo('a.pdf', 'X'), new Map(), 'qd_strSoporte'),
    ).resolves.toBeNull();
  });
});
