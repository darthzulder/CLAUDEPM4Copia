// Resolución del token PM4 y de la URL base de la instancia.
//
// Se extrajo de routes/pm4.routes.ts para poder testearlo: es la única lógica no trivial
// del backend (descifrado AES + política de expiración) y estaba encerrada como función
// privada de un archivo de rutas, donde no había forma de cubrirla.
//
// CONTRATO con PM4: el iframe puede llegar con el token de dos formas distintas y hay que
// aceptar ambas —
//   1. JWT en claro (empieza con "eyJ"): es el caso de dev local vía VITE_PM4_TOKEN.
//   2. Blob cifrado AES-256-CBC en base64 url-safe: es lo que manda PM4 en producción.
// Nunca se lanza al llamador por un token inválido: si el descifrado falla se devuelve el
// valor crudo y que PM4 responda 401 — así un cambio de formato del lado de PM4 degrada a
// un error de autenticación legible en vez de tumbar el proxy con un 500.

import { createDecipheriv, createHash } from 'crypto';

// Gate de logs de depuración — apagado en producción para no imprimir tokens.
const blnIsProd = process.env.NODE_ENV === 'production';

/** Ventana de validez del blob cifrado, en segundos. */
// TODO: bajar a 300 (5 min) en producción.
export const INT_TOKEN_TTL_SEGUNDOS = 3600;

/**
 * Descifra el blob que manda PM4 y devuelve el JWT que lleva dentro.
 *
 * Formato del blob: base64 url-safe de `IV (16 bytes) || AES-256-CBC(JSON)`, donde el JSON
 * es `{ token, ts }` con `ts` en segundos epoch. La llave se deriva por sha256 de
 * `IFRAME_ENCRYPTION_KEY` (así cualquier longitud de secreto termina en los 32 bytes que
 * exige aes-256).
 *
 * Lanza si: falta `IFRAME_ENCRYPTION_KEY`, el descifrado falla (llave/IV/padding), el JSON
 * no parsea, o el blob tiene más de `INT_TOKEN_TTL_SEGUNDOS` de antigüedad.
 */
export function decryptToken(in_strBlob: string): string {
  // Leemos la llave de encriptacion desde el entorno
  const strKeyRaw = process.env.IFRAME_ENCRYPTION_KEY;
  if (!strKeyRaw) throw new Error('IFRAME_ENCRYPTION_KEY not configured');

  // Derivamos la llave a 32 bytes con sha256
  const objKey = createHash('sha256').update(strKeyRaw).digest(); // siempre 32 bytes
  // Decodificamos el blob base64 url-safe a buffer
  const objBuf = Buffer.from(in_strBlob.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  // Separamos el vector de inicializacion del texto cifrado
  const objIv     = objBuf.subarray(0, 16);
  const objCipher = objBuf.subarray(16);

  // Desciframos el contenido con aes-256-cbc
  const objDecipher  = createDecipheriv('aes-256-cbc', objKey, objIv);
  const objDecrypted = Buffer.concat([objDecipher.update(objCipher), objDecipher.final()]);
  const dicPayload   = JSON.parse(objDecrypted.toString('utf8')) as { token: string; ts: number };

  // Validamos que el token no haya expirado
  if (Math.floor(Date.now() / 1000) - dicPayload.ts > INT_TOKEN_TTL_SEGUNDOS) {
    throw new Error('Encrypted token expired (>1h)');
  }

  return dicPayload.token;
}

/**
 * Resuelve el token a usar contra PM4 a partir del header `x-pm4-token`.
 *
 * Orden: header → `PM4_TOKEN` del entorno (respaldo de dev) → `''`. Un JWT en claro pasa
 * tal cual; cualquier otra cosa se trata como blob cifrado. **Nunca lanza:** si el
 * descifrado falla, avisa por consola y devuelve el valor crudo (ver nota de contrato
 * arriba).
 *
 * Recibe el valor del header en vez del `Request` de Express a propósito, para que sea
 * testeable sin construir un objeto de request.
 */
export function resolveToken(in_strHeader: string | undefined): string {
  // Tomamos el token del header o del entorno como respaldo
  const strRaw = in_strHeader ?? process.env.PM4_TOKEN ?? '';

  // Logs de diagnóstico — solo en dev (nunca imprimen token/datos en producción).
  if (!blnIsProd) {
    console.log('[token] raw header:', strRaw ? strRaw.slice(0, 40) + '…' : '(vacío)');
    console.log('[token] tipo:', !strRaw ? 'vacío' : strRaw.startsWith('eyJ') ? 'JWT directo' : 'blob encriptado');
  }

  // JWTs empiezan con "eyJ" — pasar directo (dev local con VITE_PM4_TOKEN)
  if (!strRaw || strRaw.startsWith('eyJ')) return strRaw;

  // Cualquier otra cosa → blob AES encriptado desde PM4
  try {
    const strDecrypted = decryptToken(strRaw);
    if (!blnIsProd) console.log('[token] 🔓 desencriptado:', strDecrypted.slice(0, 40) + '…');
    return strDecrypted;
  } catch (excError) {
    console.warn('[token] decrypt failed:', (excError as Error).message);
    return strRaw;
  }
}

/**
 * URL base de la instancia PM4 activa, sin barra final.
 *
 * Se lee de `PM4_BASE_URL` en cada llamada (no se cachea) porque el valor cambia entre
 * entornos/migraciones y nunca debe quedar horneado. Devuelve `''` si no está definida —
 * la petición fallará con una URL relativa, que es más diagnosticable que un default falso
 * apuntando a otra instancia.
 */
export function pm4Base(): string {
  return (process.env.PM4_BASE_URL ?? '').replace(/\/$/, '');
}
