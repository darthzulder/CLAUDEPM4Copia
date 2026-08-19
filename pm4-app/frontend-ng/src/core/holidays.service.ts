import { computed, inject, Injectable, Signal } from '@angular/core';
import { CollectionService } from './collection.service';
import { GLOBAL_COLLECTIONS } from './collections';

/**
 * Los feriados de Colombia como set de fechas `YYYY-MM-DD`, para alimentar los helpers de
 * `business-days.ts`. Reemplaza al hook `useHolidaySet()`, que en React vivía al final de
 * `core/businessDays.ts`.
 *
 * ── Compone `CollectionService`, no repite el fetch ─────────────────────────────────────────────
 * `useHolidaySet` delegaba en `useCollection(GLOBAL_COLLECTIONS.holidaysColombia)` y este servicio
 * hace lo mismo con `CollectionService`: los feriados **son** una colección PM4 (`cat-feriados-colombia`,
 * id 48 vía registro), así que el paginado `per_page=500`, el filtro de opciones vacías y el manejo
 * del fallo ya están resueltos ahí y no se duplican. Lo único propio de este servicio es la forma en
 * que el consumidor necesita el dato: un `Set` para preguntar `has(fecha)` en un bucle día por día.
 *
 * Por qué eso importa: `countBusinessDaysBetween` consulta el set **una vez por día** del rango. Con
 * un array de ~18 feriados y un SLA de 15 días hábiles serían ~380 comparaciones lineales por
 * render; con el `Set` son 21 lookups. No es micro-optimización, es la razón de que el hook de React
 * memoizara en lugar de pasar el array.
 *
 * ── El `Set` es un `computed`, no un `signal` que se escribe ────────────────────────────────────
 * Es el equivalente exacto del `useMemo(() => new Set(...), [options])` de React: se recalcula solo
 * cuando `options` cambia, así que la pantalla puede leerlo antes de que la colección llegue (da un
 * set vacío) y vuelve a leer el valor correcto cuando llega, sin suscribirse a nada. Un `signal`
 * escrito a mano desde `cargar()` obligaría a acordarse de actualizarlo y podría quedar desfasado.
 *
 * ── Instancia por pantalla, no singleton ───────────────────────────────────────────────────────
 * Sin `providedIn: 'root'` porque `CollectionService` tampoco lo es: este servicio necesita su
 * propia instancia de colección, y dos pantallas abiertas en el mismo iframe no deben compartir el
 * estado de carga. La pantalla lo declara en sus `providers` junto con `CollectionService`.
 *
 * ── Un feriado que no llega NO es un error visible, y es correcto ───────────────────────────────
 * Si la colección falla, `CollectionService` deja `options` vacío y el set queda vacío: el cálculo
 * de días hábiles sigue funcionando, solo que contando los feriados como hábiles. Es degradación
 * gradual heredada de React (el hook tampoco exponía `error`) y es la decisión correcta acá: un SLA
 * corrido por un día es mucho menos grave que una pantalla que no abre por no poder pintar un badge.
 */
@Injectable()
export class HolidaysService {
  private readonly objColeccion = inject(CollectionService);

  /**
   * Fechas de feriado en formato `YYYY-MM-DD` — el mismo que produce `toIsoDate()` de
   * `business-days.ts`, porque el `valueField` de la colección es `data.holyday_date`. Si esos dos
   * formatos se desalinearan, `isBusinessDay` no encontraría nunca un feriado y **no fallaría**:
   * contaría todos los días como hábiles. Va con caso de test.
   */
  public readonly feriados: Signal<ReadonlySet<string>> = computed(
    () => new Set(this.objColeccion.options().map((in_objOpt) => in_objOpt.value)),
  );

  /** `true` mientras la colección está en vuelo. Se delega tal cual, sin estado propio. */
  public readonly cargando: Signal<boolean> = this.objColeccion.cargando;

  /** Trae la colección de feriados. La pantalla la llama en su `ngOnInit`. */
  public async cargar(): Promise<void> {
    await this.objColeccion.cargar(GLOBAL_COLLECTIONS.holidaysColombia);
  }
}
