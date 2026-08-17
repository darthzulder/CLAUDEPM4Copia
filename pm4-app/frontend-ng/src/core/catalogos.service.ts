import { inject, Injectable, Injector } from '@angular/core';
import { CollectionService } from './collection.service';
import type { CollectionDef } from './collection.types';

/**
 * Fábrica de `CollectionService` indexada por catálogo: una instancia **por colección**, creadas bajo
 * demanda y compartidas por clave dentro de la misma pantalla.
 *
 * ── El problema que resuelve, y por qué no se resuelve con `providers` ───────────────────────────
 * `CollectionService` es deliberadamente **no singleton** (ver su docstring): su estado pertenece a
 * *un* select, y un singleton haría que el último `cargar()` le pisara las `options` a los demás. Las
 * pantallas con un solo catálogo lo declaran en su `providers` y listo — así lo hacen SCR-008 y
 * SCR-012.
 *
 * Eso deja de escalar a partir del segundo catálogo, y el motivo es que **el array `providers` de
 * Angular resuelve por token**: repetir `providers: [CollectionService, CollectionService]` no da dos
 * instancias, da una sola (la última gana). SCR-003 necesita **13** catálogos distintos en la misma
 * pantalla —10 selects del payload de Momento 2 más los 3 de la cascada de `cat_matriz_motivos`—, así
 * que la vía del array exigiría 13 `InjectionToken` declarados a mano, y otros tantos por cada
 * pantalla futura que repita el patrón (SCR-000 tiene ~10).
 *
 * Acá cada instancia se crea en un **`Injector` hijo** del de la pantalla, que es la forma que Angular
 * provee para pedir "otra instancia de este proveedor" sin inventar un token nuevo. El padre se toma
 * del contexto de inyección (`inject(Injector)`), así que las instancias heredan todo lo que la
 * pantalla tenga provisto — en particular el `HttpClient` que `CollectionService` inyecta.
 *
 * ── Se provee POR PANTALLA, igual que `CollectionService` ────────────────────────────────────────
 * Sin `providedIn: 'root'`, y por la misma razón que el servicio que fabrica: el `Map` es la caché de
 * *esta* pantalla. Como singleton global, dos pantallas que pidieran `'city'` compartirían el estado
 * del select, que es exactamente el bug que `CollectionService` evita al no ser singleton. La pantalla
 * lo declara en su `providers` y con eso alcanza para los 13.
 *
 * ── Por qué la caché por clave es lo correcto y no un atajo ──────────────────────────────────────
 * Dos llamadas con la misma clave devuelven la **misma** instancia a propósito: en una pantalla, un
 * catálogo es un catálogo. Es lo que permite que la plantilla llame `de('city').options()` en cada
 * detección de cambios sin crear una instancia nueva por render ni disparar un GET por frame — y es
 * también lo que hace que el `cargar()` de la cascada y la lectura del select hablen del mismo estado.
 *
 * ⚠ El corolario: **dos selects que necesiten el mismo catálogo con filtros distintos NO pueden
 * compartir clave.** Hoy no pasa en ninguna pantalla; si pasara, la clave tiene que distinguirlos
 * (`'city'` vs `'city:envio'`), no reusarse — de ahí que la clave sea un `string` libre y no
 * `keyof QD_COLLECTIONS`.
 */
@Injectable()
export class CatalogosService {
  private readonly objInjector = inject(Injector);

  /** Clave de catálogo → su `CollectionService`. Es la caché de esta pantalla, no un registro global. */
  private readonly dicInstancias = new Map<string, CollectionService>();

  /**
   * Devuelve el `CollectionService` de esa clave, creándolo la primera vez.
   *
   * No dispara ninguna petición: quien la necesite llama `cargar(def)` sobre el servicio devuelto.
   * Separar obtener de cargar es lo que permite llamar `de()` desde una plantilla (que se evalúa en
   * cada detección de cambios) sin efectos de red.
   *
   * @param in_strClave Identidad del catálogo dentro de la pantalla. Normalmente una clave de
   *   `QD_COLLECTIONS`, pero se acepta cualquier string para poder distinguir dos usos del mismo
   *   catálogo con filtros distintos (ver el ⚠ del encabezado).
   */
  public de(in_strClave: string): CollectionService {
    const objExistente = this.dicInstancias.get(in_strClave);
    if (objExistente) return objExistente;

    // `parent` es el injector de la pantalla: sin él, `CollectionService` no encontraría `HttpClient`
    // y fallaría en runtime con NG0201 — un `Injector.create()` sin padre no ve nada de la app.
    const objHijo = Injector.create({
      providers: [{ provide: CollectionService }],
      parent: this.objInjector,
      name: `catalogo:${in_strClave}`,
    });
    const objNuevo = objHijo.get(CollectionService);
    this.dicInstancias.set(in_strClave, objNuevo);
    return objNuevo;
  }

  /**
   * Atajo de `de(clave).cargar(def, valores)` para el caso normal, donde la clave del catálogo y su
   * definición van juntas. Devuelve la promesa de `cargar()` para poder encadenar o descartar con
   * `void`, igual que se hace hoy con `CollectionService` directo.
   */
  public cargar(
    in_strClave: string,
    in_objDef: CollectionDef | null,
    in_dicValores?: Record<string, unknown>,
  ): Promise<void> {
    return this.de(in_strClave).cargar(in_objDef, in_dicValores);
  }
}
