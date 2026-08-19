import { TestBed } from '@angular/core/testing';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOC_TITULO,
  DOC_URL,
  SmartsupervisionApiDocsComponent,
} from './smartsupervision-api-docs';

/**
 * Specs del visor de la doc del Web Service Smartsupervisión.
 *
 * ── Qué se puede aseverar de una pantalla sin campos, y qué no ─────────────────────────────────
 * Esta pantalla no tiene formulario, ni catálogos, ni llamadas al BFF: es un `<iframe>` a un asset
 * estático. Así que no hay reglas de negocio que cubrir y un spec que solo montara el componente
 * sería un smoke — de los que este proyecto no acepta como cobertura.
 *
 * Lo que sí tiene es **un contrato con dos mitades que se rompen distinto**, y de ahí salen los casos:
 *
 * 1. **El markup** — el `src` y el nombre accesible del iframe.
 * 2. **El asset del otro lado** — que el archivo que ese `src` nombra **exista en el disco**.
 *
 * La segunda mitad es la que importa y la que React no cubría: allá el test asevera el atributo `src`
 * y nada más, así que el caso quedaba **verde con la carpeta `public/docs/` ausente**. Y es
 * exactamente lo que pasó en este port: `frontend-ng/public/` no tenía la doc, o sea que la pantalla
 * habría montado, el iframe habría pedido `docs/smartsupervision-webservice.html`, el servidor habría
 * contestado el `index.html` de la SPA y el usuario habría visto la app dentro de sí misma. Sin un
 * solo test rojo. Es el mismo tipo de agujero que `css-global.spec.ts`: el defecto no vive en la
 * lógica, vive en si el archivo está donde el markup dice, y eso solo se ve leyendo el disco.
 *
 * ── Por qué no se monta por el router ──────────────────────────────────────────────────────────
 * A diferencia de `pantalla-no-encontrada.spec.ts`, este componente no lee nada del `ActivatedRoute`
 * —no tiene inputs, ni query params, ni `task_id`—, así que `createComponent` le da el mismo árbol que
 * le daría el router. Que el slug enrute es contrato de `app.routes.ts` y lo cubre su propio spec, más
 * la guarda de inventario de `pantallas.spec.ts`.
 */

/**
 * `process.cwd()` es la raíz del workspace `frontend-ng` cuando el builder invoca Vitest — el mismo
 * supuesto que ya usa `core/css-global.spec.ts`, verificado ahí contra `angular.json`.
 */
const RUTA_PUBLIC = join(process.cwd(), 'public');

describe('SmartsupervisionApiDocs', () => {
  /** El `<iframe>` del componente montado. Falla explícito si no hay ninguno. */
  function montarIframe(): HTMLIFrameElement {
    const objFixture = TestBed.createComponent(SmartsupervisionApiDocsComponent);
    objFixture.detectChanges();

    const objIframe = (objFixture.nativeElement as HTMLElement).querySelector('iframe');
    expect(objIframe, 'el componente no renderizó ningún <iframe>').not.toBeNull();

    return objIframe as HTMLIFrameElement;
  }

  describe('el markup del visor', () => {
    it('apunta al HTML de la doc servido desde `public/`', () => {
      // `getAttribute` y no la propiedad `.src`: la propiedad devuelve la URL **resuelta** contra el
      // origen de jsdom (`http://localhost/docs/...`), así que un `/docs/...` absoluto —el error que
      // rompería el despliegue bajo un subpath— pasaría igual. El atributo conserva el literal.
      expect(montarIframe().getAttribute('src')).toBe(DOC_URL);
    });

    it('la ruta de la doc es relativa, no absoluta', () => {
      // El caso de arriba ya lo fija de hecho, pero este nombra el porqué: la app vive embebida en un
      // iframe de PM4 y no necesariamente en la raíz del host.
      expect(DOC_URL.startsWith('/')).toBe(false);
    });

    it('lleva nombre accesible: un iframe sin `title` se anuncia solo como "marco"', () => {
      expect(montarIframe().getAttribute('title')).toBe(DOC_TITULO);
    });

    it('la geometría va por clase, no por `style` en línea', () => {
      const objIframe = montarIframe();

      // React lo resuelve con un `style` en línea; el proyecto no admite CSS ad-hoc en el markup, así
      // que la geometría vive en `.doc-viewer-frame` de `shared.css`. Se asevera la ausencia del
      // atributo además de la presencia de la clase: sin la segunda mitad, agregar un `style` en línea
      // "para ajustar algo" no pondría rojo nada.
      expect(objIframe.classList.contains('doc-viewer-frame')).toBe(true);
      expect(objIframe.getAttribute('style')).toBeNull();
    });
  });

  /**
   * ── El asset ───────────────────────────────────────────────────────────────────────────────────
   * Estos casos no montan nada: leen el disco. Es lo único que distingue "el markup apunta a una
   * ruta" de "la pantalla funciona".
   */
  describe('el asset que el `src` nombra', () => {
    it('⚠ el HTML de la doc EXISTE en `public/` — sin esto el iframe sirve la SPA dentro de sí misma', () => {
      const strRuta = join(RUTA_PUBLIC, DOC_URL);

      expect(
        existsSync(strRuta),
        `falta ${DOC_URL} en public/. Copialo de frontend/public/docs/ — el iframe apunta ahí y sin el ` +
          `archivo el dev server devuelve el index.html de la SPA, que monta la app dentro del iframe.`,
      ).toBe(true);
    });

    it('la doc trae su propio tema y su propio JS: es lo que el iframe existe para aislar', () => {
      const strHtml = readFileSync(join(RUTA_PUBLIC, DOC_URL), 'utf8');

      // Es la aserción que justifica el iframe en vez de `[innerHTML]`, y por eso mide el archivo real
      // en vez de repetir la afirmación en un comentario: si algún día la doc pasara a ser un fragmento
      // sin estilos propios, el aislamiento dejaría de ser necesario y esto lo delataría.
      expect(strHtml).toMatch(/<style/i);
      expect(strHtml).toMatch(/<script/i);
    });

    it('los assets que la doc CARGA resuelven dentro de `public/docs/`', () => {
      const strHtml = readFileSync(join(RUTA_PUBLIC, DOC_URL), 'utf8');

      // Solo `src` y `<link href>`: son las referencias que el navegador **carga**. Los `<a href>`
      // quedan afuera a propósito, y no por comodidad — un enlace de navegación y un asset tienen
      // contratos opuestos. La doc trae un `<a class="back-index" href="/" target="_top">` que apunta
      // al índice de la app en el frame padre: ahí el `/` es el destino correcto, no una ruta de
      // archivo. Medirlos con la misma regla ponía este caso rojo por el enlace que sí funciona.
      // (Ese `/` sí es frágil ante un despliegue bajo subpath — queda reportado, no arreglado acá:
      // es comportamiento heredado de React y esta es una migración de framework.)
      const cllAssets = [
        ...[...strHtml.matchAll(/\bsrc="([^"]+)"/gi)].map((in_objMatch) => in_objMatch[1]),
        ...[...strHtml.matchAll(/<link\b[^>]*\bhref="([^"]+)"/gi)].map((in_objMatch) => in_objMatch[1]),
      ].filter((in_strRef) => !in_strRef.startsWith('data:'));

      const cllAbsolutos = cllAssets.filter((in_strRef) => in_strRef.startsWith('/'));
      expect(cllAbsolutos, 'un asset con ruta absoluta rompe el despliegue bajo un subpath').toEqual([]);

      // Los locales tienen que existir; uno externo (CDN) sería un hallazgo a reportar, no un fallo.
      const strDirDoc = join(RUTA_PUBLIC, 'docs');
      const cllLocalesFaltantes = cllAssets
        .filter((in_strRef) => !/^https?:/i.test(in_strRef))
        .filter((in_strRef) => !existsSync(join(strDirDoc, in_strRef.split(/[?#]/)[0])));

      expect(cllLocalesFaltantes, 'assets locales de la doc que no existen en public/docs/').toEqual([]);
    });
  });
});
