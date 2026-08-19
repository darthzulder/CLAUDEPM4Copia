import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { appConfig } from './app.config';
import { ManejadorDeErrores } from './error-render.service';

/**
 * Spec del **cableado** de providers, no de su comportamiento (eso lo cubre cada servicio).
 *
 * ── Por qué esto necesita un spec propio, cuando `app.config.ts` está excluido de la cobertura ──
 * La config está fuera del `coverageInclude` a propósito (es bootstrap, ver el plan de la Fase 1), y
 * la tentación es dejarla sin tests por eso mismo. Pero acá vive un defecto que **ningún** otro test
 * puede ver: si `ErrorHandler` se registrara con `useClass` en vez de `useExisting`, Angular crearía
 * dos instancias. Angular reportaría los errores en una y la raíz leería la señal de la otra, que
 * nunca se llenaría.
 *
 * El resultado sería una app que loguea `[ErrorBoundary]` en consola y **no pinta nada**. Y es un
 * fallo silencioso de la peor clase: el log da la impresión de que el mecanismo funciona, así que
 * quien lo mire va a buscar el bug en el template. Los specs del servicio pasan (el servicio está
 * bien), los del componente raíz pasan (el componente está bien), y la app está rota igual porque el
 * error está en cómo se **conectan**. Por eso se asevera por **identidad de instancia**, que es la
 * única aserción que distingue `useExisting` de `useClass`.
 */
describe('appConfig · cableado del ErrorHandler', () => {
  it('⚠ ErrorHandler y ManejadorDeErrores son LA MISMA instancia', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    // `toBe` (identidad), no `toBeInstanceOf`: con `useClass` las dos inyecciones también serían
    // instancias de `ManejadorDeErrores` y un `toBeInstanceOf` pasaría igual, dejando pasar
    // exactamente el defecto que este test existe para atajar.
    expect(TestBed.inject(ErrorHandler)).toBe(TestBed.inject(ManejadorDeErrores));
  });

  it('la señal que lee la raíz es la que se llena al reportar un error', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    const objManejador = TestBed.inject(ManejadorDeErrores);
    const objError = new Error('reportado por Angular');

    // La misma garantía que el caso de arriba, pero por su consecuencia observable en vez de por
    // identidad: se reporta por el token que usa **Angular** y se lee por el token que inyecta **la
    // raíz**. Es la aserción que sobrevive a un refactor del cableado — si algún día esto se
    // resolviera con una factory en vez de `useExisting`, el test de identidad habría que
    // reescribirlo y este seguiría diciendo lo mismo.
    TestBed.inject(ErrorHandler).handleError(objError);

    expect(objManejador.objError()).toBe(objError);
  });
});
