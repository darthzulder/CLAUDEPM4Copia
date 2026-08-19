import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Grecaptcha, RecaptchaLoaderService, STR_SITE_KEY } from './recaptcha-loader.service';
import { RecaptchaWidgetComponent } from './recaptcha-widget';

/**
 * Specs de `RecaptchaWidgetComponent`.
 *
 * ── El doble del cargador va por `TestBed`, y por qué no hay `vi.mock` acá ───────────────────────
 * El servicio se reemplaza con `provideRecaptchaLoader()`, no con `vi.mock('./recaptcha-loader.service')`:
 * el sistema de test de Angular 21 **no soporta** `vi.mock` sobre imports relativos (dice textualmente
 * *"Please use Angular TestBed for mocking dependencies"*). Es la misma razón por la que
 * `pm4-context.service.ts` expone su `InjectionToken` de fallbacks — y acá sale gratis, porque el
 * cargador ya es inyectable justamente para esto (ver su docstring).
 *
 * Con el doble, el spec controla **cuándo** resuelve la carga y nunca toca la red ni el `<script>`.
 *
 * ── `window.grecaptcha` se stubea igual que en React ────────────────────────────────────────────
 * Mismo patrón que `RecaptchaModal.test.tsx`: `render` devuelve un id fijo y `reset` es un espía. El
 * `render` espiado es además el punto donde se leen las **opciones** que el componente pasó — de ahí
 * salen los casos del `callback` y del `expired-callback`, que es la única forma de dispararlos sin un
 * checkbox real (jsdom no ejecuta el widget de Google).
 */

/**
 * Deja correr la cadena de promesas completa y el render que la siga.
 *
 * ⚠ `await objFixture.whenStable()` **no alcanza para el camino de rechazo**, y la diferencia costó un
 * diagnóstico: el `.catch()` del componente cuelga un eslabón más abajo que el `.then()` (el rechazo
 * atraviesa primero el `then` omitido), así que con solo `whenStable()` el estado se leía todavía en
 * `cargando` — con `console.error` **sin llamar**, que es lo que delató que el handler no había corrido
 * en vez de que el render no hubiera pintado. Un `await Promise.resolve()` tampoco basta por lo mismo.
 * Un turno de macrotask sí drena la cadena entera.
 *
 * El camino feliz funciona con `whenStable()` a secas, pero se usa esto en los dos para no dejar la
 * asimetría como una trampa para el próximo caso que se agregue.
 */
async function dejarCorrer(in_objFixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise<void>((in_fnListo) => setTimeout(in_fnListo, 0));
  await in_objFixture.whenStable();
  in_objFixture.detectChanges();
}

/** Doble del cargador con control manual de cuándo resuelve o rechaza. */
class CargadorFalso {
  public intLlamadas = 0;
  public fnResolver!: () => void;
  public fnRechazar!: (in_objError: Error) => void;

  public cargar(): Promise<void> {
    this.intLlamadas++;
    return new Promise<void>((in_fnResolver, in_fnRechazar) => {
      this.fnResolver = in_fnResolver;
      this.fnRechazar = in_fnRechazar;
    });
  }
}

/** Host que recoge lo que el widget emite, para aseverar los outputs sin espiar la instancia. */
@Component({
  standalone: true,
  imports: [RecaptchaWidgetComponent],
  template: `
    <app-recaptcha-widget
      (verificado)="cllTokens().push($event); cllTokens.set([...cllTokens()])"
      (expirado)="intExpirados.set(intExpirados() + 1)"
    />
  `,
})
class HostWidget {
  public readonly cllTokens = signal<string[]>([]);
  public readonly intExpirados = signal(0);
}

describe('RecaptchaWidgetComponent', () => {
  let objCargador: CargadorFalso;
  let objGrecaptcha: Grecaptcha;
  let objFixture: ComponentFixture<HostWidget>;

  /** Las opciones con las que el componente llamó a `grecaptcha.render`. */
  function leerOpciones(): Parameters<Grecaptcha['render']>[1] {
    const objEspia = objGrecaptcha.render as unknown as { mock: { calls: unknown[][] } };
    return objEspia.mock.calls[0][1] as Parameters<Grecaptcha['render']>[1];
  }

  beforeEach(() => {
    objCargador = new CargadorFalso();
    objGrecaptcha = { render: vi.fn(() => 7), reset: vi.fn() };
    window.grecaptcha = objGrecaptcha;

    TestBed.configureTestingModule({
      providers: [{ provide: RecaptchaLoaderService, useValue: objCargador }],
    });
    objFixture = TestBed.createComponent(HostWidget);
    objFixture.detectChanges();
  });

  afterEach(() => {
    delete window.grecaptcha;
  });

  it('arranca mostrando el loader y NO llama a render todavía', () => {
    expect(objFixture.nativeElement.querySelector('lib-loader-z')).not.toBeNull();
    expect(objGrecaptcha.render).not.toHaveBeenCalled();
    // La carga se pide en el ngOnInit, no al resolverse: eso es lo que arranca la cadena.
    expect(objCargador.intLlamadas).toBe(1);
  });

  it('el contenedor está montado desde el arranque, ANTES de que la carga resuelva', () => {
    // Ver el bloque del componente: grecaptcha.render() exige un nodo presente y visible, así que el
    // contenedor NO puede vivir dentro de un @if de estado. Si alguien lo mete en una rama, este caso
    // se pone rojo mientras el widget todavía está en 'cargando'.
    expect(objFixture.nativeElement.querySelector('div div')).not.toBeNull();
  });

  it('renderiza el checkbox con la site key cuando la carga resuelve, y oculta el loader', async () => {
    objCargador.fnResolver();
    await dejarCorrer(objFixture);

    expect(objGrecaptcha.render).toHaveBeenCalledTimes(1);
    expect(leerOpciones().sitekey).toBe(STR_SITE_KEY);
    expect(objFixture.nativeElement.querySelector('lib-loader-z')).toBeNull();
    expect(objFixture.nativeElement.querySelector('za-alert')).toBeNull();
  });

  it('emite (verificado) con el token que Google entrega al callback', async () => {
    objCargador.fnResolver();
    await dejarCorrer(objFixture);

    leerOpciones().callback('token-de-prueba');
    objFixture.detectChanges();

    expect(objFixture.componentInstance.cllTokens()).toEqual(['token-de-prueba']);
  });

  it('al expirar hace las DOS cosas: resetea el widget y emite (expirado)', async () => {
    objCargador.fnResolver();
    await dejarCorrer(objFixture);

    leerOpciones()['expired-callback']();
    objFixture.detectChanges();

    // Ver el ⚠ del componente: con solo una de las dos mitades, el estado de la pantalla y lo que se
    // ve quedan en desacuerdo — el checkbox tildado con un token que `siteverify` va a rechazar.
    expect(objGrecaptcha.reset).toHaveBeenCalledWith(7);
    expect(objFixture.componentInstance.intExpirados()).toBe(1);
  });

  it('cae al estado de error si la carga del script falla', async () => {
    const objEspiaConsola = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    objCargador.fnRechazar(new Error('No se pudo cargar reCAPTCHA'));
    await dejarCorrer(objFixture);

    const objAlerta = objFixture.nativeElement.querySelector('za-alert');
    expect(objAlerta).not.toBeNull();
    expect(objAlerta.textContent).toContain('No se pudo cargar la validación de seguridad');
    expect(objFixture.nativeElement.querySelector('lib-loader-z')).toBeNull();
    expect(objGrecaptcha.render).not.toHaveBeenCalled();

    objEspiaConsola.mockRestore();
  });

  it('cae al estado de error si grecaptcha.render() lanza', async () => {
    const objEspiaConsola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    objGrecaptcha.render = vi.fn(() => {
      throw new Error('reCAPTCHA placeholder already rendered');
    });

    objCargador.fnResolver();
    await dejarCorrer(objFixture);

    expect(objFixture.nativeElement.querySelector('za-alert')).not.toBeNull();
    expect(objFixture.nativeElement.querySelector('lib-loader-z')).toBeNull();

    // ⚠ Lo que el try/catch aporta NO es el estado, y esta aserción es la que lo fija. Medido: al quitar
    // el try/catch los 8 casos quedaban en **verde**, porque `renderizar()` se llama dentro del `.then()`
    // y el `.catch()` de la cadena atrapa el throw igual y también pone `error`. O sea que el estado que
    // ve el usuario es el mismo por los dos caminos.
    //
    // La diferencia real es el **diagnóstico**: sin el try/catch el fallo se registra como
    // "no se pudo cargar api.js", que es mentira —el script cargó bien, lo que falló fue `render()`— y
    // manda a buscar el problema en la red en vez de en el contenedor o la site key. Por eso se asevera
    // el mensaje y no solo el estado: es lo único que distingue los dos caminos.
    expect(objEspiaConsola).toHaveBeenCalledWith(
      '[recaptcha] grecaptcha.render() falló:',
      expect.any(Error),
    );

    objEspiaConsola.mockRestore();
  });

  it('no renderiza ni escribe estado si el componente se destruyó mientras la carga viajaba', async () => {
    objFixture.destroy();

    objCargador.fnResolver();
    // Acá no se usa `dejarCorrer`: hace `detectChanges()` y la fixture ya está destruida. Solo hace
    // falta que la cadena de promesas corra, que es el turno de macrotask.
    await new Promise<void>((in_fnListo) => setTimeout(in_fnListo, 0));

    // La bandera de cancelación del useEffect de React: renderizar acá sería escribir sobre un nodo que
    // ya no está en el documento.
    expect(objGrecaptcha.render).not.toHaveBeenCalled();
  });
});
