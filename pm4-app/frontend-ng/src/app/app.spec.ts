import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';
import { ManejadorDeErrores } from './error-render.service';
import { PM4_ENV_FALLBACKS } from '../core/pm4-context.service';

/**
 * Specs de la raíz. Cubre las **dos** cosas que quedaron acá después de que el enrutado se mudara a
 * `app.routes.ts`: la página de error y el banner de token de debug.
 *
 * ── Lo que se asevera del error, y lo que no ─────────────────────────────────────────────────
 * No se asevera "el ErrorHandler captura" (eso es de `error-render.service.spec.ts`) ni "los dos
 * tokens son la misma instancia" (eso es de `app.config.spec.ts`). Acá se asevera la **decisión de
 * render**: que con un error en la señal el outlet **desaparece** y aparece el diagnóstico. La parte
 * que desaparece es la que importa y la que un test descuidado omite — un `@if` mal escrito dejaría
 * las dos cosas montadas, y una pantalla que ya lanzó suele volver a lanzar en cada ciclo de
 * detección de cambios.
 *
 * ── Por qué el error se pone en la señal a mano, y no lanzando de verdad ─────────────────────
 * Porque lo que hay que provocar es "la señal tiene un error", no "algo lanzó". Llegar por un throw
 * real obligaría a montar una pantalla que reventara y a esperar que el `ErrorHandler` de Angular la
 * reporte: se estaría probando el camino de Angular, no la decisión del template. Se usa el servicio
 * **real** (no un doble) porque no tiene dependencias y su señal es escribible — un doble solo
 * agregaría un `as never` y la posibilidad de que el contrato se desincronice sin que nada avise.
 */

describe('App', () => {
  /**
   * Monta la raíz con el estado que interesa.
   *
   * `in_objError` fija la señal del manejador; `in_strEnvToken` decide si el entorno tiene token, que
   * es la mitad de la condición del banner (la otra mitad es la query string, que se fija aparte).
   */
  async function montar(in_objError: Error | null, in_strEnvToken = '') {
    const objManejador = new ManejadorDeErrores();
    if (in_objError) {
      // Se escribe la señal directo en vez de pasar por `handleError`, que loguearía a consola: el
      // log es contrato del servicio y está aseverado en su propio spec, acá sería solo ruido.
      objManejador.objError.set(in_objError);
    }

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // Las rutas reales, no `[]`: así este archivo también se rompe si alguien deja
        // `app.routes.ts` sintácticamente inválido.
        provideRouter(routes),
        { provide: ManejadorDeErrores, useValue: objManejador },
        {
          provide: PM4_ENV_FALLBACKS,
          useValue: { token: in_strEnvToken, taskId: '', caseId: '' },
        },
      ],
    }).compileComponents();

    const objFixture = TestBed.createComponent(App);
    await objFixture.whenStable();
    return objFixture;
  }

  afterEach(() => {
    // La query string es estado global de jsdom y se comparte entre casos: dejarla colgada haría que
    // el orden de ejecución importe.
    window.history.replaceState({}, '', '/');
  });

  it('monta la raíz de la app', async () => {
    const objFixture = await montar(null);
    expect(objFixture.componentInstance).toBeTruthy();
  });

  describe('sin error', () => {
    it('renderiza el router-outlet', async () => {
      const objFixture = await montar(null);
      expect(
        (objFixture.nativeElement as HTMLElement).querySelector('router-outlet'),
      ).not.toBeNull();
    });

    it('no pinta la página de error', async () => {
      const objFixture = await montar(null);
      expect((objFixture.nativeElement as HTMLElement).querySelector('.pm4-diag')).toBeNull();
    });
  });

  describe('con un error no atrapado', () => {
    it('pinta el diagnóstico con el mensaje y el stack', async () => {
      const objError = new Error('la pantalla reventó');
      objError.stack = 'Error: la pantalla reventó\n    at unaPantalla (pantalla.ts:42:7)';

      const objFixture = await montar(objError);
      const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';

      // Los dos, no uno: el mensaje dice **qué** pasó y el stack dice **dónde**. Dentro de un iframe
      // no hay otra forma de averiguar el segundo — la consola del navegador está a varios clicks y
      // la pantalla de error es lo único que se puede fotografiar y mandar.
      expect(strTexto).toContain('la pantalla reventó');
      expect(strTexto).toContain('pantalla.ts:42:7');
    });

    it('⚠ el router-outlet DESAPARECE', async () => {
      const objFixture = await montar(new Error('x'));

      // **La aserción de ausencia es el punto de este bloque.** Con un `@if`/`@else` mal escrito el
      // diagnóstico se pintaría *al lado* de la pantalla y el caso de arriba pasaría igual — pero la
      // pantalla que ya lanzó seguiría montada, volviendo a lanzar en cada ciclo de detección de
      // cambios sobre un error ya reportado. React tampoco la conserva: su boundary devuelve el
      // fallback *en lugar de* `children`.
      expect((objFixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeNull();
    });

    it('usa las clases de diagnóstico de shared.css', async () => {
      const objFixture = await montar(new Error('x'));
      const objRaiz = objFixture.nativeElement as HTMLElement;

      // Las clases son el contrato con `shared.css` (regla 3: no hay CSS por pantalla). Sin ellas la
      // página de error se pinta igual pero sin estilo, y el stack sale sin `pre` — o sea, en una
      // sola línea ilegible, que es justo cuando más se necesita leerlo.
      expect(objRaiz.querySelector('.pm4-diag')).not.toBeNull();
      expect(objRaiz.querySelector('.pm4-diag-stack')).not.toBeNull();
    });
  });

  describe('el banner de token de debug', () => {
    it('aparece cuando el token sale del entorno y no de la URL', async () => {
      const objFixture = await montar(null, 'token-de-desarrollo');

      // El texto va aseverado, no solo la clase: el banner existe para que alguien lo **lea** antes
      // de reportar un caso creado con el token de dev como si fuera de un usuario real.
      const objBanner = (objFixture.nativeElement as HTMLElement).querySelector('.pm4-banner-debug');
      expect(objBanner).not.toBeNull();
      expect(objBanner?.textContent).toContain('token de debug');
    });

    it('no aparece cuando el token viene en la URL, como en producción', async () => {
      window.history.replaceState({}, '', '/?token=token-real-de-pm4');

      // El entorno **también** tiene token a propósito: si el banner mirara solo el `.env` este caso
      // pasaría a rojo. Es la mitad de la condición que se rompe con un `||` mal puesto.
      const objFixture = await montar(null, 'token-de-desarrollo');

      expect(
        (objFixture.nativeElement as HTMLElement).querySelector('.pm4-banner-debug'),
      ).toBeNull();
    });

    it('no aparece cuando no hay token en ningún lado', async () => {
      const objFixture = await montar(null, '');
      expect(
        (objFixture.nativeElement as HTMLElement).querySelector('.pm4-banner-debug'),
      ).toBeNull();
    });

    it('⚠ se pinta TAMBIÉN sobre la página de error', async () => {
      const objFixture = await montar(new Error('x'), 'token-de-desarrollo');
      const objRaiz = objFixture.nativeElement as HTMLElement;

      // El banner está **fuera** del `@if` del error, y no es un descuido: un error mientras se corre
      // con el token de dev es precisamente el caso en que saber cuál token se usó cambia el
      // diagnóstico (un 401 de PM4 se ve como un error de la pantalla). Si el banner viviera dentro
      // del `@else`, desaparecería justo cuando más informa.
      expect(objRaiz.querySelector('.pm4-diag')).not.toBeNull();
      expect(objRaiz.querySelector('.pm4-banner-debug')).not.toBeNull();
    });
  });
});
