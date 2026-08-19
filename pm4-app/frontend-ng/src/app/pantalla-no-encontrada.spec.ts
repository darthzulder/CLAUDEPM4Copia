import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PantallaNoEncontrada, SLUGS_DISPONIBLES } from './pantalla-no-encontrada';
import { listarSlugsEnrutables } from './pantallas';

/**
 * Specs del destino de la ruta comodín.
 *
 * ── Se monta por el router, no con createComponent — y no es un detalle ───────────────────────
 * El componente lee el slug del `ActivatedRoute`, así que **quién crea la instancia decide qué dato
 * ve**. Un `createComponent(PantallaNoEncontrada)` —incluso habiendo navegado antes— crea una
 * instancia no enrutada cuyo `ActivatedRoute` es el de la raíz: `snapshot.url` sale `[]` y el slug se
 * pinta vacío, mientras los casos que no dependen del path pasan igual. Por eso cada caso navega y
 * lee del `<router-outlet>` (ver `montarEn`).
 *
 * La tabla de rutas es mínima (solo el `**` apuntando al componente) a propósito: así el spec no
 * depende del inventario real, que crece en la Fase 5 y volvería frágil cualquier test sobre qué slug
 * "no existe".
 *
 * ── ⚠ De dónde NO sale el slug: `window.location.search` ─────────────────────────────────────
 * Cuando esta pantalla se activa, el `redirectTo` de `app.routes.ts` ya tradujo `?screen=<slug>` a
 * `/<slug>` y **borró `screen` del query string** (a propósito, para no duplicar el dato en la URL).
 * Leer el query param mostraría `undefined` justo en el caso que esta pantalla existe para
 * diagnosticar. Hay un caso dedicado abajo que lo fija.
 */
/**
 * Anfitrión mínimo para que **el router** cree la instancia bajo prueba.
 *
 * No se usa el `App` real a propósito: traería el `ManejadorDeErrores`, el banner de token de debug y
 * el `PM4_ENV_FALLBACKS`, que no tienen nada que ver con lo que se asevera acá y harían que un cambio
 * en la raíz pusiera rojo este archivo por una causa ajena.
 */
@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class AnfitrionConOutlet {}

describe('PantallaNoEncontrada', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: PantallaNoEncontrada }])],
    });
  });

  afterEach(() => {
    // La URL es estado global de jsdom: dejarla colgada haría que el orden de ejecución importe.
    window.history.replaceState({}, '', '/');
  });

  /**
   * Navega a `in_strUrl` y devuelve el elemento raíz de la instancia que **el router activó**.
   *
   * ⚠ **El `<router-outlet>` no es adorno: es la diferencia entre probar algo y no probar nada.**
   * La primera versión de este helper hacía `TestBed.createComponent(PantallaNoEncontrada)` después de
   * navegar, y eso crea una **segunda** instancia, no enrutada, cuyo `ActivatedRoute` inyectado es el
   * de la raíz: `snapshot.url` sale `[]` y el slug se pinta **vacío**. El caso de "lista las pantallas
   * disponibles" pasaba igual (esa parte no depende de la ruta), así que el archivo se veía sano
   * mientras el único dato que esta pantalla existe para mostrar no se estaba aseverando nunca.
   *
   * Montando un host con `<router-outlet>` la instancia la crea el router, con el `ActivatedRoute` de
   * la ruta comodín que de verdad matcheó — que es lo que corre en producción.
   */
  async function montarEn(in_strUrl: string): Promise<HTMLElement> {
    const objFixture = TestBed.createComponent(AnfitrionConOutlet);
    await TestBed.inject(Router).navigateByUrl(in_strUrl);
    await objFixture.whenStable();
    return objFixture.nativeElement as HTMLElement;
  }

  it('nombra el slug pedido', async () => {
    const objRaiz = await montarEn('/COL_QD_SCR-999_inexistente');

    // **La aserción central.** Dentro del iframe no hay barra de direcciones: sin el slug en pantalla
    // el síntoma es "iframe vacío" y no hay forma de distinguir un typo en el nodo del BPM de una
    // pantalla que nunca se registró — que son dos arreglos, en dos repos distintos.
    expect(objRaiz.textContent).toContain('COL_QD_SCR-999_inexistente');
  });

  it('⚠ un path de varios segmentos se muestra completo', async () => {
    const objRaiz = await montarEn('/uno/dos/tres');

    // El `**` matchea varios segmentos, así que `snapshot.url` es un array. Sin el `join('/')` se
    // mostraría solo el primero, que **miente** sobre lo que se pidió: mandaría a buscar una pantalla
    // llamada "uno" que nadie pidió nunca.
    expect(objRaiz.textContent).toContain('uno/dos/tres');
  });

  it('⚠ el slug sale del path, NO del query param screen', async () => {
    // El `?screen=` apunta a **otro** slug que el del path. Es artificial a propósito: en producción
    // el `redirectTo` ya borró ese param, así que un componente que lo leyera mostraría `undefined`.
    // Este caso reproduce el error tal como se vería si alguien "arreglara" el componente para leer
    // la query string, y por eso la aserción negativa es la que importa.
    const objRaiz = await montarEn('/el-del-path?screen=el-del-query');

    expect(objRaiz.textContent).toContain('el-del-path');
    expect(objRaiz.textContent).not.toContain('el-del-query');
  });

  it('⚠ lista los slugs disponibles, uno por uno, separados por coma', async () => {
    // ⚠ **Este caso iteraba `listarSlugsEnrutables()` y por eso no probaba nada.** El registro quedó
    // **vacío** al eliminarse la ex SCR-010 (ago-2026), que era su único slug, así que el `for` no
    // corría y lo único que sobrevivía era el rótulo: borrar el `{{ strDisponibles }}` del template
    // dejaba el caso **verde**. Es la misma vacuidad que desarmó cuatro casos de
    // `indice-pantallas.spec.ts`, y se cura igual — **inyectando** los slugs en la instancia en vez de
    // leerlos de un módulo que hoy está vacío.
    //
    // Tampoco se repuso el `toBeGreaterThan(0)` original como `toBe(0)`: eso obligaría a la Fase 5 a
    // tocar este caso por una razón que no es la suya. Con los slugs inyectados el caso vale igual
    // hoy (registro vacío) que en la Fase 5 (registro lleno), sin tener que volver acá.
    // Los dos slugs comparten el prefijo `COL_QD_SCR-00` a propósito: un recorte a los primeros
    // caracteres los volvería indistinguibles y este caso lo ve.
    const cllSlugs = [
      'COL_QD_SCR-008_Revision_Respuesta_SAC',
      'COL_QD_SCR-009_Formulario_Superintendencia',
    ];

    // ⚠ **Se inyecta por provider, no pisando el campo de la instancia** — y no es preferencia de
    // estilo. Acá la instancia la crea el **router**, así que no hay un "antes del primer render"
    // donde pisarla (que es lo que hace `montarConSlugs()` en `indice-pantallas.spec.ts`), y bajo
    // `provideZonelessChangeDetection()` una escritura posterior no notifica nada: el template no se
    // vuelve a pintar y el caso sale rojo por una causa del test, no del componente. Costó dos
    // intentos, el primero además apuntando al `<router-outlet>` en vez de a la pantalla.
    TestBed.overrideProvider(SLUGS_DISPONIBLES, { useValue: cllSlugs });

    const strTexto = (await montarEn('/no-existe')).textContent ?? '';

    // El rótulo es lo que le dice al que mira el iframe que lo de al lado es la lista de slugs
    // válidos; sin él la enumeración se lee como parte del mensaje de error.
    expect(strTexto).toContain('Pantallas disponibles');
    for (const strSlug of cllSlugs) {
      expect(strTexto).toContain(strSlug);
    }
  });

  /**
   * ⚠ **Reemplaza al caso que aseveraba el registro vacío**, hermano del de `indice-pantallas.spec.ts`
   * y por el mismo motivo. La versión de la Fase 4 fijaba `toEqual([])` y anunciaba que se pondría
   * rojo "en la Fase 5 con la primera pantalla portada"; la SCR-008 lo hizo
   * (`expected [ Array(1) ] to deeply equal []`).
   *
   * Se sustituye en vez de borrarse porque es el único caso del archivo que **no** inyecta
   * `SLUGS_DISPONIBLES`: los demás pasan su propia lista por el token, así que si el factory real del
   * token dejara de leer `listarSlugsEnrutables()` —o volviera a devolver `[]`— seguirían todos
   * verdes. Este es el que ata el template al registro de verdad.
   */
  it('⚠ el registro real YA NO está vacío y la lista enumera slugs de verdad', async () => {
    const cllReales = listarSlugsEnrutables();

    // `length > 0` y no un conteo exacto: cada pantalla nueva de la Fase 5 haría rojo un número fijo
    // sin que nada esté mal. El inventario exacto lo vigila `pantallas.spec.ts`.
    expect(cllReales.length).toBeGreaterThan(0);

    // Sin `montarEn` con el token inyectado, o sea con el factory real: es lo que ejercita la cadena
    // `DIC_PANTALLAS` → `listarSlugsEnrutables()` → token → template de punta a punta.
    const objRaiz = await montarEn('/no-existe');
    expect(objRaiz.textContent).toContain('Pantallas disponibles');

    // El slug sale del registro, no escrito acá: si el template enumerara una lista paralela (o el
    // token cayera a `[]`), el rótulo seguiría estando y solo esta línea lo notaría.
    expect(objRaiz.textContent).toContain(cllReales[0]);
  });

  it('ofrece la vuelta al índice con un href, no con routerLink', async () => {
    const objRaiz = await montarEn('/no-existe');

    // `href="/"` y no `routerLink`: la raíz **sin** `?screen=` es la entrada real de la app, y una
    // recarga garantiza pasar por el `redirectTo` de verdad. Un `routerLink` navegaría en cliente y
    // ejercitaría un camino distinto del que usa el BPM.
    expect(objRaiz.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
