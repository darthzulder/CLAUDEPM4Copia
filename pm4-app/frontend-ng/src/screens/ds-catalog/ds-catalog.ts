import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileRegistryService } from '../../core/file-registry.service';
import { FormSectionComponent } from '../../components/form-section';
import { ZdsCheckboxField } from '../../components/fields/zds-checkbox-field';
import { ZdsDate } from '../../components/fields/zds-date';
import { ZdsFileInput } from '../../components/fields/zds-file-input';
import { ModeloZa } from '../../components/fields/modelo-za';
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
 * | `ZaModelElement` | `ZrTabs`, `ZrSidebar`, `ZrPagination` | `[(modeloZa)]` — ver abajo |
 * | `ZaBaseInput` (⊂ `ZaModelElement`) | `ZrTextInput`, `ZrSwitch`, `ZrCalendar`, `ZrSegmented`, `ZrStepper` | `[formControl]` — CVA nativo |
 *
 * `ZaModelElement` declara `ngModel` como **input común** (+ `ngModelChange`), sin `NG_VALUE_ACCESSOR`:
 * es un two-way binding y nada más. `ZaBaseInput` lo extiende, implementa `ControlValueAccessor`
 * (`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`) y **cada** componente
 * concreto se provee a sí mismo como `NG_VALUE_ACCESSOR` (`useExisting: ZaCalendar`, etc., verificado
 * en `dist/esm2022/`). Confundir las dos familias **no da error de tipos**: da un control que nunca se
 * actualiza, o un `NG01203` si se le pone `[formControl]` a los de `ZaModelElement`.
 *
 * ── El `[ngModel]` de esa familia es inescribible, y lo resuelve `modeloZa` ─────────────────────
 * `ZaModelElement` declara su input con el **nombre pelado** `ngModel`, o sea el mismo que la
 * directiva `NgModel` de Angular. Con `ReactiveFormsModule` en `imports` —que esta pantalla necesita
 * para los wrappers `Zds*`— un `[ngModel]` en la plantilla hace matchear a `NgControlStatus` y tira
 * **`NG0201` tirando la pantalla entera**.
 *
 * Los tres se bindean con **`[(modeloZa)]`**, la directiva de
 * [`components/fields/modelo-za.ts`](../../components/fields/modelo-za.ts), que envuelve el defecto:
 * ahí está la causa raíz leída del fuente del vendor, la tabla de las cuatro variantes medidas, por
 * qué hacen falta las dos mitades y la alternativa descartada. **No repetir esa explicación acá ni en
 * ninguna pantalla nueva:** estaba duplicada en esta clase, en tres comentarios de la plantilla y en
 * SCR-013, y eso fue precisamente la deuda que la directiva cerró.
 *
 * `FormsModule` **no va** en `imports`: no se usa un solo `[(ngModel)]` de Angular en esta pantalla.
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
    // no opcional. No se puede quitar (los campos lo necesitan), así que esos tres van por `ModeloZa`.
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
    // La directiva que restituye el two-way de los tres `ZaModelElement` de arriba. No se escribe
    // en la plantilla: su selector es el atributo `[modeloZa]`. Ver `components/fields/modelo-za.ts`.
    ModeloZa,
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

  /** Pestaña activa del `ZrTabs`, 1-based como en React (`useState(1)`). Two-way por `[(modeloZa)]`. */
  readonly sigTab = signal(1);
  /** Página activa del `ZrPagination`. Mismo binding que `sigTab`. */
  readonly sigPagina = signal(1);
  /** Visibilidad del modal. Se baja escuchando `(close)`, no solo al hacer clic en el botón. */
  readonly sigModal = signal(false);
  /** Visibilidad del panel lateral. */
  readonly sigDrawer = signal(false);

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
