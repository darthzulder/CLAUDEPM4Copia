import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Grecaptcha, RecaptchaLoaderService, STR_SITE_KEY } from './recaptcha-loader.service';
import { RecaptchaModalComponent } from './recaptcha-modal';

/**
 * Specs de `RecaptchaModalComponent`. Portan los 4 casos de `RecaptchaModal.test.tsx` y agregan los del
 * ciclo abrir → cerrar → abrir, que en React no existían porque el modal se desmontaba entero
 * (`if (!open) return null`) y acá el árbol vive.
 *
 * ── Qué NO se asevera, y por qué el "cerrado" se mide distinto que en React ──────────────────────
 * El caso de React era `expect(container).toBeEmptyDOMElement()`, apoyado en ese `return null`. Acá el
 * `<lib-modal-z>` **existe siempre** —es obligatorio: `ModalZ` captura sus slots en un
 * `ngAfterContentInit` que corre una sola vez, ver el ⚠ del componente— así que lo que se asevera es
 * que el **cuerpo** no está: sin título, sin contenedor, sin `render()`. Es la misma garantía
 * observable (el usuario no ve el modal, Google no pintó nada) medida donde acá se puede medir.
 *
 * El resto del patrón es el de React: doble del cargador por `TestBed` (no `vi.mock`, no soportado
 * sobre imports relativos) y `window.grecaptcha` stubeado con `render`/`reset` espiados.
 *
 * ── ⚠ Límite medido: el `@if (abierto())` del cuerpo NO es aseverable bajo jsdom ─────────────────
 * Se intentó y no se pudo, así que queda escrito para que nadie lea el caso de "cerrado" como una guarda
 * de ese `@if`. Al reemplazarlo por `@if (true)` los 12 casos siguen **verdes**, y el motivo es que
 * `ModalZ` captura los `ng-template` de sus slots y **no los proyecta** mientras está cerrado: con el
 * modal cerrado el DOM del host es solo `<lib-modal-z>` con tres `<!--container-->` vacíos, con `@if` o
 * sin él. O sea que ni el `textContent` ni el contenedor distinguen los dos casos, y `render()` tampoco
 * (el `?.` de `renderizar()` corta igual). Lo que el `@if` protege —que el widget no quede montado
 * invisible entre aperturas— vive del lado del custom element de Lit, que jsdom no ejecuta.
 *
 * Es la trampa ya documentada del proyecto (jsdom no renderiza los componentes del DS de verdad), y el
 * hueco lo cubre la verificación manual, no un spec de más. Lo que **sí** queda aseverado es la
 * consecuencia observable del ciclo: que la segunda apertura vuelva a renderizar el checkbox.
 */

/** Doble del cargador con control manual de cuándo resuelve. Cuenta llamadas por apertura. */
class CargadorFalso {
  public intLlamadas = 0;
  private cllResolvers: (() => void)[] = [];

  public cargar(): Promise<void> {
    this.intLlamadas++;
    return new Promise<void>((in_fnResolver) => {
      this.cllResolvers.push(in_fnResolver);
    });
  }

  /** Resuelve todas las cargas pendientes. */
  public resolverTodo(): void {
    for (const fnResolver of this.cllResolvers) fnResolver();
    this.cllResolvers = [];
  }
}

@Component({
  standalone: true,
  imports: [RecaptchaModalComponent],
  template: `
    <app-recaptcha-modal
      [abierto]="blnAbierto()"
      (verificado)="cllTokens.set([...cllTokens(), $event])"
      (cerrar)="intCierres.set(intCierres() + 1); blnAbierto.set(false)"
    />
  `,
})
class HostModal {
  public readonly blnAbierto = signal(false);
  public readonly cllTokens = signal<string[]>([]);
  public readonly intCierres = signal(0);
}

describe('RecaptchaModalComponent', () => {
  let objCargador: CargadorFalso;
  let objGrecaptcha: Grecaptcha;
  let objFixture: ComponentFixture<HostModal>;

  function leerOpciones(in_intLlamada = 0): Parameters<Grecaptcha['render']>[1] {
    const objEspia = objGrecaptcha.render as unknown as { mock: { calls: unknown[][] } };
    return objEspia.mock.calls[in_intLlamada][1] as Parameters<Grecaptcha['render']>[1];
  }

  /** Abre el modal y espera a que la carga resuelva y el widget se renderice. */
  async function abrir(): Promise<void> {
    objFixture.componentInstance.blnAbierto.set(true);
    objFixture.detectChanges();
    objCargador.resolverTodo();
    await objFixture.whenStable();
    objFixture.detectChanges();
  }

  beforeEach(() => {
    objCargador = new CargadorFalso();
    objGrecaptcha = { render: vi.fn(() => 7), reset: vi.fn() };
    window.grecaptcha = objGrecaptcha;

    TestBed.configureTestingModule({
      providers: [{ provide: RecaptchaLoaderService, useValue: objCargador }],
    });
    objFixture = TestBed.createComponent(HostModal);
    objFixture.detectChanges();
  });

  afterEach(() => {
    delete window.grecaptcha;
  });

  it('con abierto=false no pinta el cuerpo ni llama a render', () => {
    // El port del `toBeEmptyDOMElement()` de React. Ver el bloque del spec: se mide el cuerpo, no el
    // <lib-modal-z>, que tiene que existir siempre.
    expect(objFixture.nativeElement.textContent).not.toContain('Validación de seguridad');
    expect(objGrecaptcha.render).not.toHaveBeenCalled();
    expect(objCargador.intLlamadas).toBe(0);
  });

  it('al abrir muestra el título, el texto y renderiza el checkbox una sola vez', async () => {
    await abrir();

    expect(objFixture.nativeElement.textContent).toContain('Validación de seguridad');
    expect(objFixture.nativeElement.textContent).toContain(
      'Confirma que no eres un robot para radicar tu solicitud.',
    );
    expect(objGrecaptcha.render).toHaveBeenCalledTimes(1);
    expect(leerOpciones().sitekey).toBe(STR_SITE_KEY);
  });

  it('emite (verificado) con el token que Google entrega al callback', async () => {
    await abrir();

    leerOpciones().callback('token-de-prueba');
    objFixture.detectChanges();

    expect(objFixture.componentInstance.cllTokens()).toEqual(['token-de-prueba']);
  });

  it('el botón Cancelar emite (cerrar)', async () => {
    await abrir();

    const objBoton = objFixture.nativeElement.querySelector('lib-button-z');
    expect(objBoton).not.toBeNull();
    // El evento del DS es `eventClick`, no `click`: se dispara como CustomEvent porque en jsdom el
    // custom element de Lit no corre y un click nativo no produce nada. Es la trampa ya documentada.
    objBoton.dispatchEvent(new CustomEvent('eventClick'));
    objFixture.detectChanges();

    expect(objFixture.componentInstance.intCierres()).toBe(1);
  });

  it('al cerrar resetea el widget para matar el timer de expiración', async () => {
    await abrir();

    objFixture.componentInstance.blnAbierto.set(false);
    objFixture.detectChanges();
    await objFixture.whenStable();

    // Ver el bloque del componente: sin este reset queda vivo un timer que a los dos minutos dispara el
    // expired-callback de un widget que ya no está en el DOM — el origen del "reCAPTCHA Timeout (d)".
    expect(objGrecaptcha.reset).toHaveBeenCalledWith(7);
  });

  it('vuelve a renderizar el checkbox en la SEGUNDA apertura', async () => {
    await abrir();
    expect(objGrecaptcha.render).toHaveBeenCalledTimes(1);

    objFixture.componentInstance.blnAbierto.set(false);
    objFixture.detectChanges();
    await objFixture.whenStable();

    await abrir();

    // Es la consecuencia del `intWidgetId = null` del cierre: el contenedor anterior murió con el @if,
    // así que sin renderizar de nuevo la segunda apertura mostraría el loader para siempre.
    expect(objGrecaptcha.render).toHaveBeenCalledTimes(2);
    expect(objFixture.nativeElement.textContent).toContain('Validación de seguridad');
  });

  it('cae al estado de error si grecaptcha.render() lanza, y lo registra como fallo de render', async () => {
    const objEspiaConsola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    objGrecaptcha.render = vi.fn(() => {
      throw new Error('reCAPTCHA placeholder already rendered');
    });

    await abrir();

    expect(objFixture.nativeElement.querySelector('za-alert')).not.toBeNull();
    expect(objFixture.nativeElement.querySelector('lib-loader-z')).toBeNull();

    // ⚠ Mismo punto que en el widget, y por el mismo motivo: el **estado** llega a `error` por los dos
    // caminos (el `.catch()` de la cadena atrapa el throw de `renderizar()` porque se llama dentro del
    // `.then()`), así que aseverar solo la alerta no guarda el try/catch — se comprobó midiendo en el
    // widget, donde quitarlo dejaba todo verde. Lo que el try/catch aporta es no mentir en el log: sin
    // él, un `render()` que falla se reporta como "no se pudo cargar api.js" y manda a diagnosticar la
    // red en lugar del contenedor o la site key.
    expect(objEspiaConsola).toHaveBeenCalledWith(
      '[recaptcha] grecaptcha.render() falló:',
      expect.any(Error),
    );

    objEspiaConsola.mockRestore();
  });

  it('el expired-callback destilda el checkbox y NO emite nada hacia la pantalla', async () => {
    await abrir();

    leerOpciones()['expired-callback']();
    objFixture.detectChanges();

    // A diferencia del widget suelto: el modal no guarda token en la pantalla, así que no hay copia que
    // invalidar. Solo se resetea. Es el comportamiento de React.
    expect(objGrecaptcha.reset).toHaveBeenCalledWith(7);
    expect(objFixture.componentInstance.cllTokens()).toEqual([]);
  });

  describe('el listener de unhandledrejection', () => {
    it('silencia el "reCAPTCHA Timeout" interno de Google', () => {
      const objEvento = new Event('unhandledrejection', { cancelable: true }) as Event & {
        reason?: unknown;
      };
      objEvento.reason = new Error('reCAPTCHA Timeout (d)');

      window.dispatchEvent(objEvento);

      expect(objEvento.defaultPrevented).toBe(true);
    });

    it('NO silencia un rechazo cualquiera de la app', () => {
      const objEvento = new Event('unhandledrejection', { cancelable: true }) as Event & {
        reason?: unknown;
      };
      objEvento.reason = new Error('Cannot read properties of undefined');

      window.dispatchEvent(objEvento);

      // El filtro es doble a propósito: un preventDefault() a cualquier rechazo escondería errores
      // propios. Ver el bloque del componente.
      expect(objEvento.defaultPrevented).toBe(false);
    });

    it('NO silencia un timeout que no sea de recaptcha', () => {
      const objEvento = new Event('unhandledrejection', { cancelable: true }) as Event & {
        reason?: unknown;
      };
      objEvento.reason = new Error('Request timeout');

      window.dispatchEvent(objEvento);

      expect(objEvento.defaultPrevented).toBe(false);
    });

    it('se quita del window al destruirse el componente', () => {
      objFixture.destroy();

      const objEvento = new Event('unhandledrejection', { cancelable: true }) as Event & {
        reason?: unknown;
      };
      objEvento.reason = new Error('reCAPTCHA Timeout (d)');
      window.dispatchEvent(objEvento);

      // Mientras la pantalla vive, silencia; al salir, deja de tocar el window global.
      expect(objEvento.defaultPrevented).toBe(false);
    });
  });
});
