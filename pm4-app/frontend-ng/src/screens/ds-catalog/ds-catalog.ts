import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileRegistryService } from '../../core/file-registry.service';
import { FormSectionComponent } from '../../components/form-section';
import { ZdsCheckboxField } from '../../components/fields/zds-checkbox-field';
import { ZdsDate } from '../../components/fields/zds-date';
import { ZdsFileInput } from '../../components/fields/zds-file-input';
import { ZdsInput } from '../../components/fields/zds-input';
import { ZdsRadio } from '../../components/fields/zds-radio';
import { ZdsSelect, type OpcionZds } from '../../components/fields/zds-select';
import { ZdsStatusBadge } from '../../components/fields/zds-status-badge';
import { ZdsTextarea } from '../../components/fields/zds-textarea';
import {
  AlertZService,
  ZrAlert,
  ZrAlertInline,
  ZrBadge,
  ZrButton,
  ZrCalendar,
  ZrCard,
  ZrChip,
  ZrEmptyState,
  ZrFooter,
  ZrIcon,
  ZrInputGroup,
  ZrKpiValue,
  ZrLoader,
  ZrModal,
  ZrNavigation,
  ZrPagination,
  ZrProgressBar,
  ZrPromo,
  ZrSegmented,
  ZrSidebar,
  ZrStageBanner,
  ZrStepper,
  ZrSwitch,
  ZrTable,
  ZrTabs,
  ZrTag,
  ZrTemplate,
  ZrTextInput,
  ZrTile,
  ZrTooltip,
  type ModeloTablaZr,
} from '../../components/fields/zds-reexports';

/** Opciones de muestra, con el mismo contenido que `SELECT_OPTS` del catálogo React. */
const CLL_OPCIONES: readonly OpcionZds[] = [
  { value: 'a', text: 'Opción A' },
  { value: 'b', text: 'Opción B' },
  { value: 'c', text: 'Opción C' },
];

/** El par sí/no del `ZrSegmented`, igual que el `SINO` de React. */
const CLL_SINO: readonly OpcionZds[] = [
  { value: 'si', text: 'Sí' },
  { value: 'no', text: 'No' },
];

/**
 * Ruta del logo para los banners. Vive en `public/`, así que se sirve tal cual desde la raíz — la
 * misma decisión (y la misma ruta) que `screen-header.ts`, donde está el razonamiento completo:
 * React lo importaba y Vite lo resolvía a una URL con hash, mientras acá se sirve estático a cambio
 * de perder el cache-busting, que para un logo que no cambia es un intercambio razonable.
 */
const STR_LOGO = 'resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

/**
 * Catálogo interno del design system — el "mini-Storybook" del proyecto.
 *
 * Port de `frontend/src/screens/ds-catalog/DsCatalog.tsx`, sección por sección y en el mismo orden,
 * para que la comparación visual contra React sea directa (es el gate de esta pantalla).
 * Ruta: `?screen=ds-catalog`.
 *
 * ── Por qué esta pantalla es parte del entregable y no una página de juguete ────────────────────
 * `pm4-app/CLAUDE.md` la designa como **"referencia visual viva"** y **"molde de uso cuando no exista
 * una pantalla análoga que clonar"**. Mientras no existiera en Angular, el único molde vivo del
 * proyecto era el de React — o sea que quien portara una pantalla nueva iba a copiar props del DS de
 * React que en Angular **no existen o se llaman distinto** (el caso de los alias kebab de
 * `zds-reexports.ts` es exactamente eso). Portarla elimina esa fuente de error.
 *
 * ── Su relación con `gate-fachada`, que NO es la misma pantalla ─────────────────────────────────
 * `screens/gate-fachada/` es el banco de pruebas de los **8 wrappers de campo con CVA** montados en un
 * `FormGroup` real, con su propio checklist manual. Esta cubre la **fachada completa** —los 39 símbolos,
 * campos incluidos— y sobre todo los que no son campos: overlays, banners, tablas, feedback. Se
 * complementan: si un `Zds*` de campo se rompe, las dos se ponen rojas; si se rompe un `Zr*` de
 * display, solo esta.
 *
 * ── No es una pantalla de PM4 ──────────────────────────────────────────────────────────────────
 * No consume `TaskService`, no recibe `task_id` ni `case_id`, no completa ninguna tarea y no tiene
 * campos `qd_*`. Su `FormGroup` es **de muestra**: existe para que los campos tengan un control real
 * que reflejar, con los mismos valores por defecto que React. Por eso su slug es `ds-catalog` en
 * minúsculas y no un `COL_*`: no hay contrato con el BPM que respetar, igual que en
 * `smartsupervision-api-docs`.
 *
 * ── ⚠ Dos familias de `za-*` que se parecen y se bindean distinto ───────────────────────────────
 * Verificado sobre `dist/_shared/za-base.d.ts` y `za-base-input.d.ts`, no asumido. Las dos exponen
 * un `model`, y ahí termina el parecido:
 *
 * | Base | Componentes de esta pantalla | Cómo se bindea |
 * |---|---|---|
 * | `ZaModelElement` | `ZrTabs`, `ZrSidebar`, `ZrPagination` | `ngModel` **partido** — ver abajo |
 * | `ZaBaseInput` (⊂ `ZaModelElement`) | `ZrTextInput`, `ZrSwitch`, `ZrCalendar`, `ZrSegmented`, `ZrStepper` | `[formControl]` — CVA nativo |
 *
 * `ZaModelElement` declara `ngModel` como **input común** (+ `ngModelChange`), sin `NG_VALUE_ACCESSOR`:
 * es un two-way binding y nada más. `ZaBaseInput` lo extiende, implementa `ControlValueAccessor`
 * (`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`) y **cada** componente
 * concreto se provee a sí mismo como `NG_VALUE_ACCESSOR` (`useExisting: ZaCalendar`, etc., verificado
 * en `dist/esm2022/`). Confundir las dos familias **no da error de tipos**: da un control que nunca se
 * actualiza, o un `NG01203` si se le pone `[formControl]` a los de `ZaModelElement`.
 *
 * ── ⚠⚠ El input `[ngModel]` de esa familia es INESCRIBIBLE en una pantalla con forms ────────────
 * **El defecto más caro de esta fase, y el que más veces me hizo cambiar de diagnóstico.** Vale
 * entero porque cualquier pantalla futura que use `ZrTabs`/`ZrSidebar`/`ZrPagination` lo va a pisar.
 *
 * `ZaModelElement` declara `@Input() ngModel` con el **nombre de propiedad pelado**, sin alias
 * (verificado en el fuente embebido del sourcemap de `dist/esm2022/_shared/za-base.mjs`). O sea: se
 * llama exactamente igual que el directivo `NgModel` de Angular. Y `ReactiveFormsModule` re-exporta
 * `NgControlStatus`, cuyo selector es:
 *
 * `[formControlName],[ngModel],[formControl]`   ← un ATRIBUTO, no una etiqueta
 *
 * y cuyo constructor es `constructor(cd: NgControl)` con `{self: true}` y **sin `optional`**. Así
 * que escribir `[ngModel]` en la plantilla hace que `NgControlStatus` matchee el elemento, busque un
 * `NgControl` que nadie provee (el componente del DS no es un CVA) y tire:
 *
 * `NG0201: No provider for NgControl found in NodeInjector`
 *
 * al **montar la pantalla entera**, no solo ese elemento.
 *
 * ── Lo que se midió, con una sonda aislada de 20 líneas ─────────────────────────────────────────
 * No es deducción: se probaron cuatro variantes en un spec desechable, con un `za-tabs` y nada más.
 *
 * | Variante | Resultado |
 * |---|---|
 * | `FormsModule` + `[ngModel]` | ❌ `NG01203` (ahí el que matchea es `NgModel`, que pide un CVA) |
 * | `ReactiveFormsModule` + `[ngModel]`, con o sin `<form>` alrededor | ❌ `NG0201` (`NgControlStatus`) |
 * | **Sin ningún** módulo de forms + `[ngModel]` | ✅ el input llega (`ngModel === 1`) |
 * | `ReactiveFormsModule` + solo `(ngModelChange)`, sin el input | ✅ monta y el output funciona |
 *
 * Las dos conclusiones que importan: **(1)** no es culpa de `FormsModule` —`ReactiveFormsModule`
 * solo también falla, con otro error—, así que "saco `FormsModule`" no era el arreglo; **(2)** el
 * problema es el **atributo del input**, no el output: un binding de salida no crea atributo, así
 * que ningún selector lo ve y `(ngModelChange)` es siempre seguro.
 *
 * ── La forma que queda, y por qué ───────────────────────────────────────────────────────────────
 * El two-way se parte en dos mitades que viajan por caminos distintos:
 * - **ida**: `sincronizarModelosDelDs()` escribe la **propiedad** de la instancia (tomada con
 *   `viewChild.required`), que es el mismo `@Input()` sin pasar por el atributo;
 * - **vuelta**: `(ngModelChange)` en la plantilla, tal cual.
 *
 * Se descartó la alternativa —un directivo propio que provea un `NgControl` de mentira sobre
 * `za-tabs[ngModel]`, que también se probó y **funciona**— porque dejaría a `NgControlStatus`
 * pintando clases `ng-valid`/`ng-touched` a partir de un control `null`: más maquinaria, y encima
 * mintiéndole a Angular sobre lo que el elemento es. Escribir la propiedad no le miente a nadie.
 *
 * `FormsModule` igual **no va** en `imports`: no se usa un solo `[(ngModel)]` de Angular en esta
 * pantalla, y su presencia solo cambiaría `NG0201` por `NG01203` si alguien reintrodujera el input.
 *
 * ── ⚠ `imageSrc` NO se escribe igual en las dos librerías ───────────────────────────────────────
 * `ZaWithImage` (base de `ZrPromo`, `ZrTile`, `ZrEmptyState`) declara `imageSrc` con **alias kebab
 * `image-src`**, así que va `[image-src]`. `StageBannerZ` de `lib-zurich` declara el suyo **sin**
 * alias, así que va `[imageSrc]` camelCase. Escribir la forma equivocada compila y no pinta la
 * imagen. React acertaba en las dos por accidente: le hablaba al elemento de Lit, donde todo es
 * atributo kebab.
 */
@Component({
  selector: 'app-ds-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    // Trae `[formControl]`/`[formGroup]` para los 8 wrappers `Zds*` y los 5 `ZaBaseInput` con CVA
    // nativo. `FormsModule` no va: no hay un solo `[(ngModel)]` de Angular en esta pantalla.
    //
    // ⚠ Y **este módulo es el que hace inescribible el `[ngModel]`** de `ZrTabs`/`ZrSidebar`/
    // `ZrPagination`: re-exporta `NgControlStatus`, con selector `[…],[ngModel],[…]` y un `NgControl`
    // no opcional en el constructor. No se puede quitar (los campos lo necesitan) ni convivir con ese
    // atributo, así que la ida de esos tres two-way va por la instancia. Ver el docstring.
    ReactiveFormsModule,
    FormSectionComponent,
    // Los 9 wrappers de campo de la fachada (los que sí necesitan CVA propio porque los `lib-*-z` no
    // lo traen). React exhibía 8: `ZdsFileInput` no existía todavía cuando se escribió su catálogo,
    // así que esta pantalla muestra uno MÁS que el original — no es una diferencia a corregir.
    ZdsCheckboxField,
    ZdsDate,
    ZdsFileInput,
    ZdsInput,
    ZdsRadio,
    ZdsSelect,
    ZdsStatusBadge,
    ZdsTextarea,
    // Re-exports del DS. `ZrTemplate` va acá aunque no se escriba como etiqueta: sin él en `imports`
    // los `<ng-template libZTemplate>` del modal y la tabla montan **vacíos y sin error** (gotcha
    // documentado en la fachada).
    ZrAlert,
    ZrAlertInline,
    ZrBadge,
    ZrButton,
    ZrCalendar,
    ZrCard,
    ZrChip,
    ZrEmptyState,
    ZrFooter,
    ZrIcon,
    ZrInputGroup,
    ZrKpiValue,
    ZrLoader,
    ZrModal,
    ZrNavigation,
    ZrPagination,
    ZrProgressBar,
    ZrPromo,
    ZrSegmented,
    ZrSidebar,
    ZrStageBanner,
    ZrStepper,
    ZrSwitch,
    ZrTable,
    ZrTabs,
    ZrTag,
    ZrTemplate,
    ZrTextInput,
    ZrTile,
    ZrTooltip,
  ],
  // `ZdsFileInput` inyecta `FileRegistryService`, que **no** es `providedIn: 'root'` a propósito: es un
  // servicio **por pantalla**, para que los adjuntos de una no se arrastren a la siguiente dentro del
  // mismo iframe (ver su docstring). Así que toda pantalla que exhiba un campo de archivo tiene que
  // proveerlo, y el catálogo no es la excepción: sin esta línea el componente entero falla al montar
  // con `NG0201`, no solo el campo. Lo descubrió el spec de esta pantalla — `ng build` no lo ve, porque
  // la DI se resuelve en runtime.
  providers: [FileRegistryService],
  templateUrl: './ds-catalog.html',
})
export class DsCatalog {
  /** La cola de alertas del DS es imperativa: el componente no recibe el mensaje por input. */
  private readonly objAlertas = inject(AlertZService);

  constructor() {
    this.sincronizarModelosDelDs();
  }

  /**
   * Empuja los tres signals a la propiedad `ngModel` de su componente del DS.
   *
   * Es la **mitad de ida** del two-way de la familia `ZaModelElement`, y vive acá y no en la
   * plantilla por el conflicto de `[ngModel]` con `NgControlStatus` (docstring de la clase). La
   * vuelta la hace `(ngModelChange)` en el `.html`.
   *
   * Un solo `effect` para los tres: cada lectura de signal lo suscribe, así que cambiar cualquiera
   * reescribe los tres — son tres asignaciones de un número/booleano, no hay nada que optimizar, y
   * un efecto por componente triplicaría el ruido sin comprar nada.
   *
   * ⚠ Los `viewChild.required()` se leen **dentro** del efecto, no antes: antes del primer render no
   * hay vista y `required` tiraría. El efecto corre después, y vuelve a correr cuando el signal de
   * la query se resuelve, así que la primera escritura llega igual.
   */
  private sincronizarModelosDelDs(): void {
    effect(() => {
      this.objTabs().ngModel = this.sigTab();
      this.objPaginacion().ngModel = this.sigPagina();
      this.objSidebar().ngModel = this.sigDrawer();
    });
  }

  /**
   * Formulario de muestra: un control por tipo de campo, con los mismos valores por defecto que el
   * `useForm({ defaultValues: … })` de React. No es un contrato con PM4 — son datos de exhibición.
   */
  readonly objForm = new FormGroup({
    txt: new FormControl('Texto de ejemplo'),
    sel: new FormControl('b'),
    rad: new FormControl('a'),
    fec: new FormControl(''),
    area: new FormControl('Comentario…'),
    chk: new FormControl(true),
    seg: new FormControl('si'),
    step: new FormControl(2),
    cal: new FormControl(''),
    arch: new FormControl(''),
    // Los dos campos que usan el CVA **nativo** del DS, sin pasar por un wrapper `Zds*`. Ver la
    // sección "CVA nativo" del docstring de `zds-reexports.ts`.
    txtNativo: new FormControl('Cantidad'),
    interruptor: new FormControl(true),
  });

  /**
   * Pestaña activa del `ZrTabs`, 1-based como en React (`useState(1)`).
   *
   * El retorno (`(ngModelChange)`) se cablea en la plantilla; la **ida** no puede, por el conflicto
   * de `[ngModel]` documentado arriba — la escribe `sincronizarModelosDelDs()`.
   */
  readonly sigTab = signal(1);
  /** Página activa del `ZrPagination`. Mismo cableado partido que `sigTab`. */
  readonly sigPagina = signal(1);
  /** Visibilidad del modal. Se baja escuchando `(close)`, no solo al hacer clic en el botón. */
  readonly sigModal = signal(false);
  /** Visibilidad del panel lateral. */
  readonly sigDrawer = signal(false);

  /**
   * Las tres instancias de la familia `ZaModelElement`, tomadas por referencia de plantilla.
   *
   * Existen **porque su input `ngModel` no se puede escribir desde la plantilla** (ver la sección
   * del conflicto en el docstring de la clase): el atributo lo intercepta `NgControlStatus` y la
   * pantalla no monta. Así que la ida del two-way se hace por la propiedad de la instancia, en
   * `sincronizarModelosDelDs()`, y la vuelta por `(ngModelChange)` en la plantilla, que sí es seguro.
   *
   * Van con `required` porque los tres elementos están **fuera de todo `@if`**: si alguno dejara de
   * existir, esto se pone rojo al montar en vez de degradarse a un panel que no responde.
   */
  private readonly objTabs = viewChild.required<ZrTabs>('objTabs');
  private readonly objPaginacion = viewChild.required<ZrPagination>('objPaginacion');
  private readonly objSidebar = viewChild.required<ZrSidebar>('objSidebar');

  readonly cllOpciones = CLL_OPCIONES;
  readonly cllSino = CLL_SINO;
  readonly STR_LOGO = STR_LOGO;

  /** Las pestañas tal como las espera `ZaTabs` (`tabs`, no el `headers`/`data` de `TabsZ`). */
  readonly cllTabs = [{ name: 'Resumen' }, { name: 'Detalle' }, { name: 'Historial' }];

  /** Rutas del `lib-navigation-z`. Es uno de los dos inputs que el componente sí tiene. */
  readonly cllRutas = [{ text: 'Inicio' }, { text: 'Contacto' }];

  /**
   * Columnas del `za-footer`. Es el input que la nota de `pm4-app/CLAUDE.md` advierte que
   * `lib-footer-z` **no** tiene — y que efectivamente no tiene: `FooterZ` está vacía. Este es el
   * componente de `@zurich/angular-components`, que sí lo declara.
   *
   * ── ⚠ Son TRES columnas y no una, porque el tipo lo exige ────────────────────────────────────
   * `ZFooter_Props.columns` no es un array común: es
   * `{header, items: Link[]}[] & { length: 2 | 3 | 4 }`, una **restricción de longitud** en el tipo.
   * React le pasa **una sola** columna, así que su footer **viola el contrato del componente** — allá
   * no se nota porque le habla al elemento de Lit por atributo y ningún tipo lo revisa; acá
   * `[columns]` con un array de 1 falla con `TS2322` ("Type 'number' is not assignable to type
   * '3 | 2 | 4'"). Se reporta como diferencia de React, no se "arregla" React (migración de
   * framework). Acá va con tres, que es la forma legal más cercana a lo que el CSS del componente
   * espera: su `<section>` es `grid-auto-flow: column` y además **siempre** agrega la columna
   * "Follow us", así que con una sola quedaría partido al medio.
   *
   * La anotación de tipo es deliberada y va acá y no en el binding: sin ella el literal se infiere
   * como `{...}[]` y el error sale recién en el `.html` —o sea solo bajo `ng build`, no bajo
   * `tsc`—. Anotado en la declaración, agregar o quitar una columna se pone rojo en el archivo
   * donde se edita el dato.
   */
  readonly cllColumnasFooter: NonNullable<ZrFooter['columns']> = [
    {
      header: 'Ayuda',
      items: [
        { to: '#', text: 'PQR' },
        { to: '#', text: 'Contacto' },
      ],
    },
    {
      header: 'Productos',
      items: [
        { to: '#', text: 'Autos' },
        { to: '#', text: 'Hogar' },
      ],
    },
    {
      header: 'Nosotros',
      items: [
        { to: '#', text: 'Quiénes somos' },
        { to: '#', text: 'Trabaja con nosotros' },
      ],
    },
  ];

  /**
   * Redes del `za-footer`. Es un diccionario `red → URL`, no un array, y las claves son un union
   * cerrado de 16 nombres (`SOCIAL_MEDIA_ICONS`: `facebook`, `instagram`, `linkedin`, `twitter`,
   * `whatsapp`, `youtube`, `tiktok`…), así que una clave inventada no compila.
   *
   * ⚠ Va poblado a propósito, aunque React lo dejaba sin pasar: `ZaFooter` **siempre** dibuja la
   * columna "Follow us" —está fija en su plantilla, no detrás de un condicional—, así que sin
   * `social` la columna sale con el título y la lista vacía. Es la clase de detalle que un catálogo
   * tiene que mostrar tal como es en vez de tapar.
   */
  readonly dicRedesFooter: NonNullable<ZrFooter['social']> = {
    facebook: '#',
    instagram: '#',
    linkedin: '#',
  };

  /** Enlaces del pie del pie. `Link` es exactamente `{ to, text }` — no acepta `label` ni `href`. */
  readonly cllPieFooter = [
    { to: '#', text: 'Aviso legal' },
    { to: '#', text: 'Política de privacidad' },
  ];

  /**
   * Cabeceras de `lib-table-z`: `title` es la etiqueta visible y **`key` la propiedad que se lee de
   * cada fila** de `data`. Pasar `string[]` falla con `TS2322`, que es la forma correcta de enterarse.
   */
  readonly cllCabeceras: ModeloTablaZr[] = [
    { title: 'Producto', key: 'strProducto' },
    { title: 'Estado', key: 'strEstado' },
    { title: 'Prima', key: 'strPrima' },
  ];

  readonly cllFilas = [
    { strProducto: 'D&O', strEstado: 'Activa', strPrima: '$1.200' },
    { strProducto: 'Cyber', strEstado: 'En revisión', strPrima: '$3.400' },
  ];

  /** Dispara una alerta de cada tipo en la cola imperativa, para mostrar el `lib-alert-z` en uso. */
  encolarAlertas(): void {
    this.objAlertas.info('Alerta encolada por AlertZService.');
    this.objAlertas.positive('Operación exitosa.');
  }

  /** Vacía la cola del `lib-alert-z`. El servicio **acumula**, así que hay que poder limpiarla. */
  limpiarAlertas(): void {
    this.objAlertas.clear();
  }
}
