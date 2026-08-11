// Decisiones puras de la verificación de reCAPTCHA, extraídas de routes/recaptcha.routes.ts
// para poder testearlas: son la única lógica del endpoint que no es I/O, y una de ellas
// (el fail-open) tiene consecuencias de seguridad.

export const STR_SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/** Resultado de decidir qué hacer ANTES de llamar a Google. */
export type DecisionRecaptcha =
  | { kind: 'missing-token' }
  | { kind: 'fail-open' }
  | { kind: 'verify'; secret: string };

/**
 * Decide si hay que verificar contra Google, rechazar, o dejar pasar sin verificar.
 *
 * **Contrato de seguridad — el fail-open es deliberado pero acotado:** sin
 * `RECAPTCHA_SECRET_KEY` configurada no se puede verificar nada, y en vez de bloquear el
 * flujo (lo que dejaría el entorno de dev inutilizable) se deja pasar. Eso es aceptable
 * SOLO porque la respuesta distingue las dos cosas: `success` (la petición se procesó) y
 * `verified` (Google confirmó al humano). Un llamador que mire únicamente `success` estaría
 * tratando "no verificado" como "verificado" — de ahí que `respuestaFailOpen()` esté
 * separada y testeada: garantiza que `verified: false` viaje siempre junto al `success: true`.
 *
 * En producción la clave DEBE estar seteada; el endpoint avisa por consola cuando no lo está.
 */
export function decidirVerificacion(
  in_strToken: string | undefined | null,
  in_strSecret: string | undefined | null,
): DecisionRecaptcha {
  if (!in_strToken) return { kind: 'missing-token' };
  if (!in_strSecret) return { kind: 'fail-open' };
  return { kind: 'verify', secret: in_strSecret };
}

/** Cuerpo de respuesta del fail-open. `verified` SIEMPRE false: ver contrato arriba. */
export function respuestaFailOpen(): { success: true; verified: false; reason: string } {
  return { success: true, verified: false, reason: 'secret-not-configured' };
}

/**
 * Extrae la IP del cliente para mandarla como `remoteip` a Google.
 *
 * `x-forwarded-for` puede venir ausente, como string (`"ip1, ip2"`) o como array de strings
 * si un proxy lo repitió. En todos los casos la IP del cliente es la PRIMERA de la cadena:
 * las siguientes son los proxies intermedios. Devuelve `undefined` si no hay nada usable, y
 * el llamador cae entonces a `req.socket.remoteAddress`.
 */
export function ipDesdeForwardedFor(in_genForwardedFor: string | string[] | undefined): string | undefined {
  const strRaw = Array.isArray(in_genForwardedFor) ? in_genForwardedFor[0] : in_genForwardedFor;
  const strIp = strRaw?.split(',')[0]?.trim();
  return strIp ? strIp : undefined;
}
