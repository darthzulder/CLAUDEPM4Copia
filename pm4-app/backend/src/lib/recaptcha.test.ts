import { describe, expect, it } from 'vitest';
import { decidirVerificacion, ipDesdeForwardedFor, respuestaFailOpen } from './recaptcha';

describe('decidirVerificacion', () => {
  it('sin token pide rechazar, incluso si hay secret', () => {
    expect(decidirVerificacion('', 'un-secret')).toEqual({ kind: 'missing-token' });
    expect(decidirVerificacion(undefined, 'un-secret')).toEqual({ kind: 'missing-token' });
    expect(decidirVerificacion(null, 'un-secret')).toEqual({ kind: 'missing-token' });
  });

  it('el token faltante se evalúa ANTES que el secret faltante', () => {
    // Importa el orden: sin token la respuesta es 400 (culpa del cliente), no un fail-open.
    expect(decidirVerificacion('', undefined)).toEqual({ kind: 'missing-token' });
  });

  it('con token pero sin secret hace fail-open', () => {
    expect(decidirVerificacion('tok', undefined)).toEqual({ kind: 'fail-open' });
    expect(decidirVerificacion('tok', '')).toEqual({ kind: 'fail-open' });
  });

  it('con token y secret verifica, y arrastra el secret para usarlo', () => {
    expect(decidirVerificacion('tok', 'sec')).toEqual({ kind: 'verify', secret: 'sec' });
  });
});

describe('respuestaFailOpen', () => {
  it('SIEMPRE marca verified:false junto al success:true', () => {
    // Este es el contrato de seguridad del fail-open: `success` significa "la petición se
    // procesó", NO "el humano se verificó". Si alguien alguna vez cambia `verified` a true
    // (o lo borra), un llamador que mire solo `success` pasaría a tratar tráfico no
    // verificado como verificado. Este test es la única cosa que lo impide en silencio.
    const objResp = respuestaFailOpen();
    expect(objResp.success).toBe(true);
    expect(objResp.verified).toBe(false);
  });

  it('explica el motivo de forma legible por el cliente', () => {
    expect(respuestaFailOpen().reason).toBe('secret-not-configured');
  });

  it('no filtra el secret ni ningún otro dato del entorno', () => {
    expect(Object.keys(respuestaFailOpen()).sort()).toEqual(['reason', 'success', 'verified']);
  });
});

describe('ipDesdeForwardedFor', () => {
  it('devuelve la IP cuando el header trae una sola', () => {
    expect(ipDesdeForwardedFor('203.0.113.7')).toBe('203.0.113.7');
  });

  it('toma la PRIMERA de la cadena (el cliente; el resto son proxies)', () => {
    expect(ipDesdeForwardedFor('203.0.113.7, 10.0.0.1, 10.0.0.2')).toBe('203.0.113.7');
  });

  it('recorta espacios alrededor', () => {
    expect(ipDesdeForwardedFor('  203.0.113.7 , 10.0.0.1')).toBe('203.0.113.7');
  });

  it('si el header vino repetido (array), usa el primer valor', () => {
    expect(ipDesdeForwardedFor(['203.0.113.7, 10.0.0.1', '198.51.100.9'])).toBe('203.0.113.7');
  });

  it.each([
    ['undefined', undefined],
    ['cadena vacía', ''],
    ['array vacío', [] as string[]],
    ['solo espacios', '   '],
    ['solo una coma', ','],
  ])('devuelve undefined para %s (el endpoint cae a socket.remoteAddress)', (_strCaso, in_genValor) => {
    expect(ipDesdeForwardedFor(in_genValor as string | string[] | undefined)).toBeUndefined();
  });
});
