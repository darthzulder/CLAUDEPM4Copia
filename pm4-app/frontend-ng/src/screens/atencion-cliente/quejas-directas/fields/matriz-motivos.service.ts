import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { CatalogosService } from '../../../../core/catalogos.service';
import { labelFromUiValue, toUiOptions, uiValueFromCode } from '../../../../core/collection-helpers';
import type { CollectionOption } from '../../../../core/collection.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { QD, QD_COLLECTIONS } from './fields';

/** Normaliza para comparar columnas de texto de la matriz (trim + minúsculas). */
export const normalizarMatriz = (in_gen: unknown): string => String(in_gen ?? '').trim().toLowerCase();

/**
 * Lee una columna del registro crudo de la matriz. Los campos vienen bajo `data`, pero se acepta el
 * registro plano como fallback: es lo que hace el hook de React y lo que permite escribir fixtures de
 * test sin envolver cada fila.
 */
export function leerColumnaMatriz(in_objRow: Record<string, unknown>, in_strCol: string): string {
  const dicData = (in_objRow['data'] ?? in_objRow) as Record<string, unknown>;
  return String(dicData?.[in_strCol] ?? '').trim();
}

/**
 * Opciones únicas por `value`, descartando vacíos.
 *
 * No es una defensa cosmética: una misma columna de la matriz **se repite** entre filas (varias filas
 * comparten interacción o servicio y solo difieren en el motivo), así que sin deduplicar el select
 * mostraría la misma opción decenas de veces.
 */
function opcionesUnicas(in_cll: readonly CollectionOption[]): CollectionOption[] {
  const setVistos = new Set<string>();
  const cllSalida: CollectionOption[] = [];
  for (const objOpt of in_cll) {
    if (!objOpt.value || setVistos.has(objOpt.value)) continue;
    setVistos.add(objOpt.value);
    cllSalida.push(objOpt);
  }
  return cllSalida;
}

/**
 * Cascada de clasificación regulatoria de `cat_matriz_motivos` (colección 45):
 * **producto SFC (seguro) → momento (interacción) → servicio → motivo SFC**.
 *
 * Reemplaza al hook `useMatrizMotivos()` de React
 * (`frontend/src/screens/atencion-cliente/quejas-directas/fields/useMatrizMotivos.ts`).
 *
 * ── Por qué la matriz se carga COMPLETA y se filtra en CLIENTE ───────────────────────────────────
 * Son ≈385 filas y el filtrado **no puede** delegarse a PMQL: las columnas `tipoSolicitud` y
 * `productoZurich` guardan el **TEXTO** (no el código) y los datos traen espacios sobrantes, así que
 * una comparación del lado de PM4 no es fiable. De ahí `normalizarMatriz()` (trim + minúsculas) en
 * cada comparación — es la mitad que hace funcionar la cascada, no una tolerancia opcional.
 * Detalle en `core/collections.ts → matrixMotivos`.
 *
 * Por eso además la matriz se consume por `records()` y no por `options()`: la cascada filtra por
 * **varias columnas a la vez** y el `rawMap` no serviría, porque la clave se repite entre registros
 * (ver el docstring de `CollectionService`).
 *
 * ── Qué devuelve y qué NO decide ────────────────────────────────────────────────────────────────
 * Expone **solo** las opciones derivadas y la fila del motivo elegido. Qué hacer cuando un valor cae
 * fuera de sus opciones —limpiarlo, avisar, re-derivar los regulatorios— es **política de cada
 * pantalla**, igual que en React. SCR-003 lo resuelve con su `limpiarSiFuera()`, que además re-marca
 * el campo como editable; SCR-000 podría querer otra cosa. Meter esa decisión acá acoplaría la
 * cascada a la primera pantalla que la usó.
 *
 * ── Tres catálogos propios, vía `CatalogosService` ───────────────────────────────────────────────
 * `sfcProduct` (16), `requestType` y `matrixMotivos` (45) son **suyos**, no de la pantalla: son un
 * detalle de cómo se deriva la cascada, y una pantalla que los proveyera tendría que saber que la
 * matriz existe. Se piden a `CatalogosService` con claves prefijadas (`matriz:*`) para no colisionar
 * con un catálogo que la pantalla pida por su cuenta con el mismo nombre.
 *
 * ── `vincular()` en vez de recibir el form por constructor ───────────────────────────────────────
 * El `FormGroup` no existe cuando Angular construye el servicio (la pantalla lo arma en su propio
 * campo de instancia), así que se ata después. Antes de `vincular()` todas las listas derivadas
 * devuelven `[]` en vez de lanzar: es el mismo estado que "la matriz todavía no cargó", y una
 * pantalla que pinte en ese instante muestra selects vacíos, no una excepción.
 *
 * ── Por qué la lectura del form pasa por un signal y no por `form.get()` directo ─────────────────
 * `FormGroup.value` **no es un signal**: leerlo dentro de un `computed()` no crea dependencia, así que
 * la cascada no se recalcularía al cambiar el producto. La pantalla ya mantiene un `sigValores` desde
 * `valueChanges` (patrón de SCR-012); acá se recibe ese mismo signal y todos los `computed()` cuelgan
 * de él. Es la traducción del `watch()` de RHF, que sí era reactivo.
 *
 * El `computed()` cubre además lo que en React costaba `useMemo` explícito: las listas derivadas son
 * dependencias de los efectos de la pantalla, así que una identidad nueva en cada render dispararía
 * esos efectos —y su `setValue`— en bucle. Angular memoiza por identidad de dependencias sin que haya
 * que declararlas, **pero solo si la lectura del form es reactiva**, que es la razón del párrafo
 * anterior.
 */
@Injectable()
export class MatrizMotivosService {
  private readonly objCatalogos = inject(CatalogosService);

  /**
   * Los tres catálogos, con clave prefijada para que sean de esta cascada y no del pool general de la
   * pantalla. `sfcProduct` en particular **no** se comparte: la pantalla lo pinta con values de UI
   * desambiguados y la cascada lo lee por código puro, así que compartir instancia acoplaría dos
   * lecturas distintas del mismo catálogo.
   */
  private readonly objProducto = this.objCatalogos.de('matriz:sfcProduct');
  private readonly objTipoSolicitud = this.objCatalogos.de('matriz:requestType');
  private readonly objMatriz = this.objCatalogos.de('matriz:matrixMotivos');

  /** Form atado por `vincular()`. `null` hasta entonces — ver el docstring de la clase. */
  private objForm: FormGroup | null = null;

  /**
   * Valores del form, reactivos. Por defecto un signal vacío propio, de modo que los `computed()` de
   * abajo son legales antes de `vincular()`; al vincular se reemplaza por el de la pantalla.
   */
  private sigValores: Signal<Record<string, unknown>> = signal<Record<string, unknown>>({});

  /** Lee un campo del form a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()[in_strCampo] ?? '');
  }

  // ── Catálogos crudos ────────────────────────────────────────────────────────────────────────────

  /** Producto SFC (colección 16), con el código real como `value`. */
  public readonly cllInsurance = this.objProducto.options;

  /**
   * Producto SFC con values de UI desambiguados, para el picker.
   *
   * La colección 16 **repite códigos** (el 104 es a la vez "Garantía extendida" y "Copropiedades"), y
   * el picker del DS indexa por `value`: con values crudos no podría distinguir cuál de las dos se
   * eligió. El form sigue guardando el código puro.
   */
  public readonly cllInsuranceUi = computed(() => toUiOptions(this.cllInsurance()));

  /** Value de UI que le corresponde al código + `_desc` ya guardados en el form (para preseleccionar). */
  public readonly strInsuranceUiValue = computed(() => uiValueFromCode(
    this.cllInsurance(),
    this.leer(QD.strSfcProduct),
    this.leer(`${QD.strSfcProduct}_desc`),
  ));

  /** Etiqueta del producto elegido — es la que compara contra la columna `productoZurich` de la matriz. */
  public readonly strProductLabel = computed(() => labelFromUiValue(this.strInsuranceUiValue()));

  /** `true` si el producto elegido es de la familia Autos (habilita campos propios en la pantalla). */
  public readonly blnIsAutos = computed(() => /autos/i.test(this.strProductLabel()));

  /** `true` si el momento elegido es "Asistencias" — el único donde el servicio prestado aplica. */
  public readonly blnIsAsistencias = computed(() => /asistencias/i.test(this.leer(QD.strInteraction)));

  /**
   * Etiqueta del tipo de solicitud.
   *
   * ⚠ Sale de un catálogo cuyo campo **no tiene widget en SCR-003**: viene precargado en `task.data` y
   * es el primero de los dos criterios del filtro de producto. O sea que la cascada depende de un dato
   * que el gestor no ve ni puede corregir en esta pantalla — si viniera vacío, `cllRowsForProduct`
   * quedaría en `[]` y los tres selects de abajo saldrían vacíos sin ningún mensaje que lo explique.
   */
  private readonly strRequestTypeLabel = computed(() => {
    const strCodigo = this.leer(QD.strRequestType);
    return this.objTipoSolicitud.options().find((in_objOpt) => in_objOpt.value === strCodigo)?.label ?? '';
  });

  // ── La cascada, en cuatro niveles ───────────────────────────────────────────────────────────────

  /**
   * Nivel 1 · filas de la matriz que corresponden al tipo de solicitud **y** al producto.
   * Los dos criterios comparan TEXTO normalizado, por lo dicho en el encabezado de la clase.
   */
  private readonly cllRowsForProduct = computed(() => {
    const strTipo = normalizarMatriz(this.strRequestTypeLabel());
    const strProducto = normalizarMatriz(this.strProductLabel());
    return this.objMatriz.records().filter((in_objRow) =>
      normalizarMatriz(leerColumnaMatriz(in_objRow, 'tipoSolicitud')) === strTipo
      && normalizarMatriz(leerColumnaMatriz(in_objRow, 'productoZurich')) === strProducto);
  });

  /** Nivel 2 · momentos (interacción) disponibles para ese producto. */
  public readonly cllInteraction = computed(() => opcionesUnicas(
    this.cllRowsForProduct().map((in_objRow) => {
      const strValor = leerColumnaMatriz(in_objRow, 'interaccion');
      return { value: strValor, label: strValor };
    }),
  ));

  private readonly cllRowsForInteraction = computed(() => {
    const strInteraccion = normalizarMatriz(this.leer(QD.strInteraction));
    return this.cllRowsForProduct().filter((in_objRow) =>
      normalizarMatriz(leerColumnaMatriz(in_objRow, 'interaccion')) === strInteraccion);
  });

  /**
   * Nivel 3 · servicios prestados.
   *
   * `value === label` a propósito: la columna guarda el **texto**, no un código, así que el form
   * termina guardando esa misma prosa. Es lo que obliga a `descActual()` en la pantalla a devolver el
   * valor crudo para este campo en vez de resolverlo contra las opciones.
   */
  public readonly cllService = computed(() => opcionesUnicas(
    this.cllRowsForInteraction().map((in_objRow) => {
      const strValor = leerColumnaMatriz(in_objRow, 'servicioPrestado');
      return { value: strValor, label: strValor };
    }),
  ));

  /**
   * Nivel 4 · filas candidatas al motivo.
   *
   * El servicio prestado solo estrecha el filtro dentro de "Asistencias"; fuera de ahí no aplica y las
   * filas de la interacción pasan enteras. Filtrar por un servicio vacío dejaría `cllReason` en `[]`
   * para todos los demás momentos.
   */
  private readonly cllRowsForReason = computed(() => {
    if (!this.blnIsAsistencias()) return this.cllRowsForInteraction();
    const strServicio = normalizarMatriz(this.leer(QD.strServiceProvided));
    return this.cllRowsForInteraction().filter((in_objRow) =>
      normalizarMatriz(leerColumnaMatriz(in_objRow, 'servicioPrestado')) === strServicio);
  });

  /**
   * Motivos SFC. `value` = `codigoMotivoSFC` (el código real que espera la Superintendencia),
   * `label` = `motivoSFC`. Es el único nivel de la cascada donde el value **no** es el texto.
   */
  public readonly cllReason = computed(() => opcionesUnicas(
    this.cllRowsForReason().map((in_objRow) => ({
      value: leerColumnaMatriz(in_objRow, 'codigoMotivoSFC'),
      label: leerColumnaMatriz(in_objRow, 'motivoSFC'),
    })),
  ));

  /**
   * Fila completa del motivo elegido.
   *
   * La pantalla la usa para re-derivar los campos regulatorios que cuelgan del motivo (los que el
   * anexo marca como derivados y no editables). Es la razón por la que el servicio expone la fila y no
   * solo el código.
   */
  public readonly objSelectedReasonRow = computed(() => this.cllRowsForReason().find(
    (in_objRow) => leerColumnaMatriz(in_objRow, 'codigoMotivoSFC') === this.leer(QD.strSfcReason)));

  /** `true` mientras cualquiera de los tres catálogos está en vuelo — para el `[loading]` de los selects. */
  public readonly blnCargando = computed(() =>
    this.objProducto.cargando() || this.objTipoSolicitud.cargando() || this.objMatriz.cargando());

  /**
   * Ata el form y arranca la carga de los tres catálogos.
   *
   * ⚠ **Hay que llamarlo desde un contexto de inyección** (el constructor de la pantalla o un
   * inicializador de campo, nunca `ngOnInit`): adentro llama a `sincronizarDesc()`, que hace
   * `inject(DestroyRef)` y lanzaría fuera de ese contexto.
   *
   * El `_desc` del **motivo** lo sincroniza este servicio, porque su código sale de la cascada y la
   * pantalla no tiene forma de resolverlo sola. El del **producto** NO: la colección 16 repite códigos,
   * así que se escribe desde el `onPickerChange` con la etiqueta que el usuario realmente eligió — de
   * ahí `syncProductDesc()`.
   */
  public vincular(in_objForm: FormGroup, in_sigValores: Signal<Record<string, unknown>>): void {
    this.objForm = in_objForm;
    this.sigValores = in_sigValores;

    void this.objProducto.cargar(QD_COLLECTIONS.sfcProduct);
    void this.objTipoSolicitud.cargar(QD_COLLECTIONS.requestType);
    void this.objMatriz.cargar(QD_COLLECTIONS.matrixMotivos);

    // Tercer argumento como **función**, no como array: si se pasara el array se capturaría el `[]`
    // del primer instante y el `_desc` nunca se escribiría. Ver `sincronizar-desc.ts`.
    sincronizarDesc(in_objForm, QD.strSfcReason, () => this.cllReason());
  }

  /**
   * Escribe el `_desc` del producto con la etiqueta del value de UI elegido.
   *
   * Va por acá y no por `sincronizarDesc()` porque el código del producto **no determina** su
   * etiqueta: dos productos comparten el 104, así que resolver por código elegiría cualquiera de los
   * dos. La única fuente correcta es lo que el usuario clickeó, que es el value de UI.
   *
   * `emitEvent: false` para no reentrar en el `valueChanges` que alimenta `sigValores`: el `_desc` no
   * participa de la cascada y una vuelta extra solo dispararía los efectos de la pantalla de nuevo.
   *
   * ⚠ Corolario para quien llame: como no emite, esta escritura **no** refresca el espejo `sigValores`
   * por sí sola. Hay que llamarla **antes** de escribir el código del producto, para que la emisión de
   * ese `setValue` fotografíe los dos campos juntos. Al revés, el espejo queda un paso atrás y el
   * resumen MSG-000-08 —que lee del espejo— pinta "Producto: —". Ver el `valueChanges` del satélite en
   * `seccion-detalle-queja.ts`, que documenta el orden.
   */
  public syncProductDesc(in_strUiValue: string): void {
    const objControl = this.objForm?.get(`${QD.strSfcProduct}_desc`);
    if (!objControl) return;
    objControl.setValue(labelFromUiValue(in_strUiValue), { emitEvent: false });
  }
}
