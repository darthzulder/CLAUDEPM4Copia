import { createCipheriv, createHash, randomBytes } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INT_TOKEN_TTL_SEGUNDOS, decryptToken, pm4Base, resolveToken } from './token';

const STR_KEY = 'llave-de-prueba-no-es-la-real';
const STR_JWT = 'eyJhbGciOiJIUzI1NiJ9.payload.firma';

// Construye un blob con el mismo formato que manda PM4: base64 url-safe de
// IV(16) || AES-256-CBC(JSON{token,ts}), con la llave derivada por sha256.
function fnBlob(in_strToken: string, in_intTs: number, in_strKey = STR_KEY): string {
  const objKey    = createHash('sha256').update(in_strKey).digest();
  const objIv     = randomBytes(16);
  const objCipher = createCipheriv('aes-256-cbc', objKey, objIv);
  const objEnc    = Buffer.concat([
    objCipher.update(JSON.stringify({ token: in_strToken, ts: in_intTs })),
    objCipher.final(),
  ]);
  return Buffer.concat([objIv, objEnc])
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const intAhora = () => Math.floor(Date.now() / 1000);

beforeEach(() => {
  process.env.IFRAME_ENCRYPTION_KEY = STR_KEY;
  delete process.env.PM4_TOKEN;
  delete process.env.PM4_BASE_URL;
  // El módulo loguea en dev; silenciamos para no ensuciar la salida del test.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('decryptToken', () => {
  it('descifra un blob válido y devuelve el JWT que lleva dentro', () => {
    expect(decryptToken(fnBlob(STR_JWT, intAhora()))).toBe(STR_JWT);
  });

  it('acepta base64 url-safe (con - y _ en vez de + y /)', () => {
    // fnBlob ya emite url-safe; que descifre prueba que la conversión inversa funciona.
    const strBlob = fnBlob(STR_JWT, intAhora());
    expect(strBlob).not.toMatch(/[+/]/);
    expect(decryptToken(strBlob)).toBe(STR_JWT);
  });

  it('lanza si falta IFRAME_ENCRYPTION_KEY', () => {
    const strBlob = fnBlob(STR_JWT, intAhora());
    delete process.env.IFRAME_ENCRYPTION_KEY;
    expect(() => decryptToken(strBlob)).toThrow(/IFRAME_ENCRYPTION_KEY not configured/);
  });

  it('lanza si el blob fue cifrado con otra llave', () => {
    const strBlob = fnBlob(STR_JWT, intAhora(), 'otra-llave-distinta');
    expect(() => decryptToken(strBlob)).toThrow();
  });

  it('lanza si el blob excedió la ventana de validez', () => {
    const strBlob = fnBlob(STR_JWT, intAhora() - (INT_TOKEN_TTL_SEGUNDOS + 60));
    expect(() => decryptToken(strBlob)).toThrow(/expired/);
  });

  it('acepta un blob justo dentro de la ventana de validez', () => {
    const strBlob = fnBlob(STR_JWT, intAhora() - (INT_TOKEN_TTL_SEGUNDOS - 60));
    expect(decryptToken(strBlob)).toBe(STR_JWT);
  });
});

describe('resolveToken', () => {
  it('pasa un JWT en claro tal cual, sin intentar descifrarlo', () => {
    expect(resolveToken(STR_JWT)).toBe(STR_JWT);
  });

  it('descifra un blob cifrado que llega por el header', () => {
    expect(resolveToken(fnBlob(STR_JWT, intAhora()))).toBe(STR_JWT);
  });

  it('cae a PM4_TOKEN del entorno cuando no hay header', () => {
    process.env.PM4_TOKEN = STR_JWT;
    expect(resolveToken(undefined)).toBe(STR_JWT);
  });

  it('devuelve cadena vacía si no hay header ni PM4_TOKEN', () => {
    expect(resolveToken(undefined)).toBe('');
  });

  it('el header tiene prioridad sobre PM4_TOKEN', () => {
    process.env.PM4_TOKEN = 'eyJenv.token.env';
    expect(resolveToken(STR_JWT)).toBe(STR_JWT);
  });

  it('NUNCA lanza si el descifrado falla: devuelve el valor crudo', () => {
    // Contrato explícito del módulo — que PM4 responda 401 en vez de tumbar el proxy.
    const strBasura = 'no-es-un-blob-valido';
    expect(() => resolveToken(strBasura)).not.toThrow();
    expect(resolveToken(strBasura)).toBe(strBasura);
  });

  it('tampoco lanza si un blob expiró: devuelve el valor crudo', () => {
    const strVencido = fnBlob(STR_JWT, intAhora() - (INT_TOKEN_TTL_SEGUNDOS + 60));
    expect(resolveToken(strVencido)).toBe(strVencido);
  });
});

describe('pm4Base', () => {
  it('devuelve la URL de PM4_BASE_URL', () => {
    process.env.PM4_BASE_URL = 'https://instancia.example.com';
    expect(pm4Base()).toBe('https://instancia.example.com');
  });

  it('quita la barra final para que concatenar /api/1.0 no duplique la barra', () => {
    process.env.PM4_BASE_URL = 'https://instancia.example.com/';
    expect(pm4Base()).toBe('https://instancia.example.com');
  });

  it('devuelve cadena vacía si PM4_BASE_URL no está definida', () => {
    expect(pm4Base()).toBe('');
  });

  it('relee el entorno en cada llamada (no cachea la instancia)', () => {
    process.env.PM4_BASE_URL = 'https://uno.example.com';
    expect(pm4Base()).toBe('https://uno.example.com');
    process.env.PM4_BASE_URL = 'https://dos.example.com';
    expect(pm4Base()).toBe('https://dos.example.com');
  });
});
