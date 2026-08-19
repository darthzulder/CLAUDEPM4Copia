import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';
import { resolvePath, resolvePmql } from './collection-helpers';
import type { CollectionDef, CollectionOption } from './collection.types';

/** Cuántos records se piden por página. Ver el bloque de contrato del servicio. */
const INT_PER_PAGE = 500;

/**
 * Carga los records de una colección PM4 y los deja listos para un select del DS. Reemplaza al hook
 * `useCollection()` de React (`core/useCollection.ts`).
 *
 * ── La forma expuesta son **exactamente** cuatro campos: `options`, `cargando`, `rawMap`, `records` ──
 * Y en particular **no hay `error`**, aunque `TaskService` sí lo tenga. No es un olvido: el hook de
 * React tampoco lo tenía, y el motivo es que un fallo de colección **no es un error de pantalla**. Si
 * el catálogo de Municipios no responde, el select queda vacío y el usuario ve que no hay opciones;
 * pintar un cartel rojo de error por cada uno de los ~10 selects de SCR-000 que pudieran fallar
 * taparía el formulario entero. El fallo se registra por consola (es diagnóstico de dev) y las cuatro
 * piezas de estado se limpian, que es lo que la pantalla necesita para no mostrar opciones viejas de
 * un catálogo que ya no resolvió.
 *
 * Agregar un `error` acá sería un cambio funcional encubierto: ninguna pantalla lo lee hoy, y darle
 * uno invitaría a que la próxima lo pinte, cambiando el comportamiento de la app sin decidirlo.
 *
 * ── Por qué `records` **además** de `options` y `rawMap` ────────────────────────────────────────
 * Los tres salen de la misma respuesta pero sirven a tres consumidores distintos, y ninguno se puede
 * derivar de otro sin perder información:
 * - `options` son los pares `{value,label}` que come el select, **ya filtrados**: los records cuyo
 *   value o label resuelven a `''` quedan afuera, porque un `<option>` sin texto o sin valor es
 *   basura visible en la UI.
 * - `rawMap` indexa el record **completo** por su value, para cuando la pantalla necesita otra
 *   columna del registro elegido (p. ej. el email del área responsable, que no es ni el código ni
 *   la etiqueta).
 * - `records` es la lista cruda **sin filtrar ni indexar**, y es la que usan las colecciones tipo
 *   "matriz" cuya cascada se filtra en cliente por varias columnas a la vez (SCR-000, vía
 *   `useMatrizMotivos`). Ahí `rawMap` no sirve porque **la clave se repite** entre registros, que es
 *   justo la condición que hace falta para filtrar por un segundo criterio.
 *
 * ── `cargar()` es explícito, no un efecto ──────────────────────────────────────────────────────
 * En React el disparo venía de un `useEffect` con deps `[def.id, String(dependsOnValue)]`. Acá el
 * servicio no observa nada: la pantalla llama `cargar()` en su `ngOnInit` y otra vez desde el
 * `valueChanges` del campo del que depende. Es más código en la pantalla y a cambio el momento de
 * cada petición es visible en el sitio donde ocurre, en vez de estar implícito en una lista de deps
 * cuyo `String()` existía precisamente para esquivar la comparación por referencia de React.
 *
 * ── Instancia por campo, no singleton ──────────────────────────────────────────────────────────
 * Sin `providedIn: 'root'` **a propósito**: cada estado de este servicio pertenece a **un** select.
 * SCR-000 tiene ~10 colecciones distintas en la misma pantalla; con un singleton compartirían
 * `options` y el último `cargar()` le pisaría las opciones a los otros nueve. La pantalla lo provee
 * en su array `providers`, una instancia por campo — mismo criterio que `FileRegistryService`.
 */
@Injectable()
export class CollectionService {
  private readonly objHttp = inject(HttpClient);

  private readonly sigOptions = signal<CollectionOption[]>([]);
  private readonly sigRawMap = signal<Record<string, Record<string, unknown>>>({});
  private readonly sigRecords = signal<Record<string, unknown>[]>([]);
  private readonly sigCargando = signal(false);

  /** Pares `{value,label}` para el select, sin los records que resolvieron a vacío. */
  public readonly options: Signal<CollectionOption[]> = this.sigOptions.asReadonly();
  /** El record completo de cada opción, indexado por su `value`. */
  public readonly rawMap: Signal<Record<string, Record<string, unknown>>> = this.sigRawMap.asReadonly();
  /** Los records crudos tal como los devolvió PM4, sin filtrar ni indexar. */
  public readonly records: Signal<Record<string, unknown>[]> = this.sigRecords.asReadonly();
  /**
   * `true` mientras hay una petición en vuelo. Arranca en **`false`**, no en `true` como el
   * `cargando` de `TaskService`: una colección puede no cargarse nunca (si su `dependsOn` no tiene
   * valor), así que arrancar en `true` dejaría el select con un spinner eterno.
   */
  public readonly cargando: Signal<boolean> = this.sigCargando.asReadonly();

  /**
   * Trae los records de la colección y publica las cuatro piezas de estado.
   *
   * **Gating por `dependsOn`:** si la definición declara que depende de otro campo y ese campo no
   * tiene valor, **no se llama a PM4** y el estado se limpia. Es lo que hace funcionar la cascada
   * Departamento → Municipio: sin Departamento elegido, pedir los municipios traería el catálogo
   * entero del país (o un PMQL con el placeholder vacío, que filtra por `""` y devuelve 0). Limpiar
   * además de no pedir es la otra mitad del contrato: si el usuario cambia el Departamento a vacío,
   * los municipios del anterior tienen que desaparecer, no quedar seleccionables.
   *
   * No lanza. Un fallo deja las cuatro piezas vacías y lo registra por consola — ver el bloque de
   * arriba sobre por qué no hay `error`.
   *
   * @param in_objDef Definición de la colección. `null` no hace nada (el hook de React salía con un
   *   `if (!def) return` **sin limpiar**, y se preserva: hay pantallas que pasan `null` mientras
   *   resuelven qué colección corresponde, y limpiar ahí borraría opciones válidas ya cargadas).
   * @param in_dicWatchValues Valores actuales del form. Se usan para el gating y para resolver el
   *   PMQL. Sin ellos, un `pmqlTemplate` **no se aplica** (mismo `if` que React): mandar el template
   *   con los placeholders crudos haría que PM4 filtrara por el literal `{{campo}}`.
   */
  public async cargar(
    in_objDef: CollectionDef | null,
    in_dicWatchValues?: Record<string, unknown>,
  ): Promise<void> {
    if (!in_objDef) return;

    if (in_objDef.dependsOn && !in_dicWatchValues?.[in_objDef.dependsOn]) {
      this.limpiar();
      return;
    }

    let objParams = new HttpParams().set('per_page', String(INT_PER_PAGE));
    if (in_objDef.pmqlTemplate && in_dicWatchValues) {
      const strPmql = resolvePmql(in_objDef.pmqlTemplate, in_dicWatchValues);
      objParams = objParams.set('pmql', strPmql);
      console.log(`[CollectionService] id=${in_objDef.id} pmql=`, strPmql);
    }

    this.sigCargando.set(true);
    try {
      const objResp = await firstValueFrom(
        this.objHttp.get<{ data?: Record<string, unknown>[] }>(
          urlApi(`/collections/${in_objDef.id}/records`),
          { params: objParams },
        ),
      );
      const cllRecords = objResp?.data ?? [];
      console.log(`[CollectionService] id=${in_objDef.id} → ${cllRecords.length} registros`);
      this.publicar(cllRecords, in_objDef);
    } catch (in_excError: unknown) {
      console.error(
        `[CollectionService] id=${in_objDef.id} error:`,
        in_excError instanceof Error ? in_excError.message : String(in_excError),
      );
      this.limpiar();
    } finally {
      this.sigCargando.set(false);
    }
  }

  /**
   * Mapea los records a opciones y arma el índice, en un solo recorrido.
   *
   * El filtro descarta la opción si **value o label** resuelven a `''` — es el mismo criterio que
   * React (`value !== '' && label !== ''`) y no es cosmético: un value vacío haría que el select
   * guardara `''` en el form, indistinguible de "sin elegir", y un label vacío daría una fila
   * clickeable en blanco. Los records descartados **tampoco** entran al `rawMap` (no tendrían clave
   * con la que indexarse), pero **sí** siguen en `records`, que es crudo por definición.
   */
  private publicar(
    in_cllRecords: Record<string, unknown>[],
    in_objDef: CollectionDef,
  ): void {
    this.sigRecords.set(in_cllRecords);

    const cllMapeados = in_cllRecords
      .map((in_dicRec) => ({
        value: resolvePath(in_dicRec, in_objDef.valueField),
        label: resolvePath(in_dicRec, in_objDef.labelField),
        rec: in_dicRec,
      }))
      .filter((in_objOpt) => in_objOpt.value !== '' && in_objOpt.label !== '');

    this.sigOptions.set(cllMapeados.map(({ value, label }) => ({ value, label })));
    this.sigRawMap.set(Object.fromEntries(cllMapeados.map(({ value, rec }) => [value, rec])));
  }

  /** Deja las tres colecciones de datos vacías. `cargando` no se toca: lo gobierna el `finally`. */
  private limpiar(): void {
    this.sigOptions.set([]);
    this.sigRawMap.set({});
    this.sigRecords.set([]);
  }
}
