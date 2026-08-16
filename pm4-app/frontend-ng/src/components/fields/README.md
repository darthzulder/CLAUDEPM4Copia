# `components/fields/` — la fachada del Zurich Design System

Construida en la **Fase 2** de la migración a Angular. **124 tests en 15 archivos, verde.**

Este README es el registro de lo que se **midió** al construirla, y su valor está casi todo en las
correcciones: **cinco afirmaciones del plan de migración resultaron falsas al medirlas contra el
bundle publicado**, y otras tantas se descubrieron recién al compilar. Están todas abajo, marcadas
como corrección, con el número de la línea del código que las asevera. Si vas a portar una pantalla,
la parte que te importa es [Cómo se usa](#cómo-se-usa-desde-una-pantalla) y la
[tabla de contrato por campo](#el-contrato-de-cada-campo-no-hay-dos-iguales).

## Qué es este directorio

Uno de los **dos únicos puntos autorizados** a importar `@zurich/*` o `@zurich-col/*` — el otro es
[`src/zds-setup.ts`](../../zds-setup.ts), que trae los assets globales. La restricción la aplica
ESLint (`no-restricted-imports`), no la buena voluntad: un import del DS desde una pantalla es
error de lint, no una observación de code review.

Es el equivalente Angular de [`frontend/src/components/fields/ZdsFields.tsx`](../../../../frontend/src/components/fields/ZdsFields.tsx)
(695 líneas, 36 símbolos). La diferencia de forma —una carpeta acá, un archivo allá— es consecuencia
del framework, no un cambio de arquitectura: un wrapper con `Controller` de react-hook-form son ~15
líneas, mientras que un wrapper Angular es un componente standalone con su `ControlValueAccessor`.
El choke point sigue siendo uno.

## Cómo se usa desde una pantalla

```html
<form [formGroup]="form">
  <zds-input formControlName="qd_strChannel" name="qd_strChannel" label="Canal" [obligatorio]="true" />
  <zds-select formControlName="qd_strDepartment" name="qd_strDepartment" label="Departamento"
              [options]="cllDepartamentos()" [loading]="blnCargando()" />
  <zds-file-input formControlName="qd_strSoporte" name="qd_strSoporte" label="Soporte"
                  (rechazado)="strError = $event" />
</form>
```

`formControlName` **y** `name` van los dos, y no es redundancia: el `formControlName` lo consume
Angular para enganchar el control; el `name` es el nombre real del campo en PM4 (`qd_*`, regla 1 de
CLAUDE.md) y además la clave con la que la lib adopta el control y con la que se emite el
`id="field-<name>"` que `scrollToFirstError` necesita. En la práctica siempre valen lo mismo.

Los componentes sin CVA (botón, modal, tabla, alerta…) se importan de
[`zds-reexports.ts`](./zds-reexports.ts) y se usan con el **selector nativo del DS**
(`<lib-button-z>`, `<lib-modal-z>`). Son alias, no wrappers — el porqué está
[abajo](#los-re-exports-son-alias-y-el-motivo-es-proyección-de-contenido).

## Por qué hay que envolver, y no re-exportar los campos

`@zurich-col/lib-zurich` **no implementa `ControlValueAccessor`** (0 ocurrencias de
`NG_VALUE_ACCESSOR` y de `ControlValueAccessor` en su `fesm2022/*.mjs`). Cada campo usa
`@Input() model` + `@Output() modelChange` + `@Input() group: FormGroup`, y **genera su propio
nombre de control** vía `UtilService.getControlName()` → `name-<timestamp>-<n>`. Es decir:
`formControlName` y `[formControl]` **no funcionan** sobre un `lib-*-z`.

Lo que hace viable usarlos igual, **aseverado en runtime** en el gate 0 (no inferido del `.mjs`):
`generateControl()` solo inventa el nombre aleatorio si el control **no existe ya** en el
`FormGroup`. Si el wrapper pre-crea el control con el `name` real antes del `ngOnInit` del hijo, la
librería **lo adopta**. Y `generateControl()` **compone** validadores
(`setValidators(compose([previo, generateValidation()]))`), así que los `Validators` que la pantalla
declaró **sobreviven**: `required`/`maxLength` siguen viviendo en la definición del `FormGroup`.

```
<lib-...-z>  o  <za-...>          ← componente Zurich (nunca se toca)
      ▲
ZdsInput / ZdsSelect / ...        ← wrapper CVA (traduce Reactive Forms ↔ model/group)
      ▲
formControlName="qd_strChannel"   ← lo único que ve la pantalla
```

### Dos bases distintas, porque hay dos problemas distintos

| Base | Para | Quién aporta el CVA |
|---|---|---|
| [`CampoBase<T>`](./campo-base.ts) | los 5 `lib-*-z` | **el wrapper**: `writeValue` → `model`, `(modelChange)` → `onChange` |
| [`CampoZaBase`](./campo-za-base.ts) | los 2 `za-*` | **el componente de Zurich** (`ZaBaseInput` ya registra `NG_VALUE_ACCESSOR`); el wrapper solo aporta un **accessor de paso** con los 4 métodos vacíos |

El accessor de paso no es un stub pendiente: `formControlName` sobre el wrapper **exige** un
`NG_VALUE_ACCESSOR` en el host (sin él, `NG01203: No value accessor for form control name`), pero un
CVA con cuerpo sería un **segundo escritor** del mismo control — el `[formControl]` del template le
entrega al `za-*` **el mismo objeto** `FormControl`, y el valor viaja por ahí, no por el accessor.
Dos detalles que costaron diagnóstico: el `useExisting` tiene que nombrar la **subclase concreta**
(el injector es de elemento, no de la base abstracta), y `NgControl` se pide por `Injector` en
`ngOnInit`, no por constructor.

## Correcciones al plan de migración (medidas, no leídas)

El plan traía una lista de gotchas escrita leyendo el `.mjs`. Cinco puntos eran incorrectos. Se
dejan acá con la evidencia porque **son afirmaciones plausibles que alguien volvería a escribir**, y
tres de ellas, implementadas tal como el plan pedía, habrían sido bugs.

### 1. `ModalZ` NO bloquea el scroll del body — portar el `ngOnDestroy` sería un bug

El plan pedía que el wrapper *"mantenga el `ngOnDestroy` que restaura
`document.body.style.overflow`"*. Medido: **`document.body.style` tiene 0 ocurrencias en toda la
librería**. El único `overflow` es CSS propio (`.overflow_content { max-height: 53vh; overflow-y:
auto }`, que scrollea el *contenido* del modal). El `body.style.overflow` de
[`ZdsFields.tsx:43`](../../../../frontend/src/components/fields/ZdsFields.tsx#L43) era un workaround
del componente **React**.

Restaurarlo acá **desbloquearía** un scroll que nadie bloqueó — pisando, por ejemplo, el lock de un
modal externo. Aseverado en [`zds-reexports.spec.ts:156`](./zds-reexports.spec.ts#L156), y la
desviación está protegida por mutación: se implementó **exactamente lo que el plan pedía** (un
`ZrModalMutado` con ese `ngOnDestroy`) y el spec se puso **rojo** (`expected '' to be 'hidden'`).

### 2. `LoaderZ.customStr` es un input MUERTO — el wrapper no puede "decidir cuál gana"

El plan decía *"tiene un `custom-str` hardcodeado verde además del bindeado → el wrapper decide y
documenta cuál gana"*. El wrapper **no puede decidir**: la plantilla del DS pone las dos cosas sobre
el mismo elemento.

```html
<za-loader [custom-str]="customStr"
           custom-str="color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;">
```

El `[custom-str]` escribe una **propiedad** del DOM; el atributo estático escribe el **atributo**; el
`za-loader` de Lit lee el atributo. Medido con un spec desechable que bindeó
`customStr="color:#ff0000; size: 99px;"`: `{ attr: 'color:#06e7a3; …', prop: 'SIN-PROP' }` — el verde
gana siempre y la propiedad ni existe.

**Consecuencia práctica: el loader del DS es verde y de 50 px, y no hay input que lo cambie.** Si una
pantalla necesita otro tamaño o color, va por CSS sobre el `za-loader`. `label` sí funciona.

### 3. `lib-kpi-value-z` no existe

`lib-zurich` exporta **26** selectores `lib-*-z`, y entre ellos **no hay** `lib-icon-z`,
`lib-switch-z`, `lib-kpi-value-z` ni `lib-pagination-z`. Esos cuatro se toman de
`@zurich/angular-components`, que está en el **mismo nivel 1** de la jerarquía de fuentes
(`InsumosZurich` → `vendor/zurich-angular` → preguntar), así que **no hubo que escalar nada**.

### 4. Los dos gotchas del plan que sí eran exactos

- **`ButtonZ.disabled` arranca en `true`** → `<lib-button-z label="X" />` **monta deshabilitado**.
  Toda pantalla pasa `[disabled]` explícito. Aseverado en dos formas
  ([`zds-reexports.spec.ts:116`](./zds-reexports.spec.ts#L116)): sobre el DOM montado y sobre
  `new ZrButton().disabled`, para que mover el default a un `input(false)` idiomático se vea.
- **`TableZ.generciEndName`** — el typo es parte del contrato y hay que escribirlo así. Su hermano
  `genericStartName` está bien escrito, que es lo que hace fácil equivocarse. Escribir el nombre
  correcto no bindea nada: el pie sale vacío **sin ningún error**.

### 5. `ZdsStatusBadge` va sobre `za-tag`, no sobre `za-badge`

El plan mapeaba `ZdsStatusBadge`/`ZrBadge` → `za-badge`. `za-badge` **no acepta las variantes de
color** que la fachada React expone: su tipo de color no incluye `'teal'` y falla en **compilación**
con `TS2322`. `za-tag` sí. La mutación acá es de las mejores que se pueden pedir: volver a `za-badge`
**no compila**, así que el error no puede llegar a runtime.

## Gotchas por componente, y el que no se puede neutralizar

Todo verificado sobre `InsumosZurich/lib-zurich-2.6.16/package/fesm2022/zurich-col-lib-zurich.mjs`
y `@zurich/angular-components/dist/fesm2022/angular.mjs`.

| Componente | Trampa | Qué se hace |
|---|---|---|
| `lib-input-text-z`, `-date`, `lib-textarea-z` | el input se llama `valid` pero **significa `invalid`** (su template hace `[invalid]="valid"`) | el wrapper expone `error`/estado del control y traduce |
| `lib-input-select-z` | acá el input **ya se llama `invalid`** — la polaridad **no** se invierte | se pasa directo; ojo al copiar de otro wrapper |
| `lib-checkbox-z` | acá `valid` **significa `valid`** (tercera polaridad), pero **no llega al DOM**: su template pasa `id name label help-text ngModel required` y nada más | **no se bindea**: sería un binding sin efecto, y copiarlo a un componente con polaridad invertida sería un bug |
| `lib-input-text-z`, `-select`, `-date` | `valid` se auto-asigna mirando **el group entero**: `if (!manualValidation && group.status == 'INVALID') this.valid = true` → un campo correcto se pinta en rojo si **cualquier otro** del form es inválido | se pasa **`manualValidation = true`** y el error se gobierna desde el `FormControl` propio (`invalid && touched`) |
| `lib-textarea-z` | **`manualValidation` NO existe** (no está en su lista de inputs), así que el contagio de arriba **no se puede apagar por input** | un `[valid]` bindeado **no alcanza** (medido): el `ngOnChanges` de la lib lo pisa. El wrapper **sobreescribe `ngOnChanges`**; ver la cabecera de [`zds-textarea.ts`](./zds-textarea.ts) |
| `lib-input-select-z` | `options` usa **`description`**, no `text` ni `label` — una opción con `text` renderiza vacía sin error | el wrapper traduce a `{value, description}` |
| `lib-input-text-z` | `maxLength` está tipado **`boolean`** y ni él ni `maxNumber` llegan al `za-text-input` — **inputs muertos** | **no se expone**; el límite va como `Validators.maxLength(n)` en el control |
| `lib-textarea-z` | acá `maxLength`/`maxNumber` **sí** funcionan, y hacen falta **los dos**: `[attr.max-length]="maxLength ? maxNumber : ''"` (booleano = interruptor, número = valor) | el wrapper esconde el par detrás de un solo `maxLength` numérico |
| `lib-input-date-z` | **no tiene `helpText`** (0 ocurrencias en la clase) | no se finge que el prop funciona; queda anotado en la cabecera |
| `lib-checkbox-z` | `disabled` y `showHelpText` son **inputs muertos**; `readonly` no existe ni como input | no se bindean. `helpText` sí funciona |
| `lib-modal-z` | `ShowBackdrop` con **S mayúscula** (default `true`); `change()` hace `this.open = false` — **muta su propio input** además de emitir `(close)` | con `[open]` de una sola vía la pantalla se desincroniza al cerrar por backdrop/X → **hay que escuchar `(close)`** |
| `lib-table-z` | `headers` es **`TableModel[]`**, no `string[]`: `{title (etiqueta visible), key (propiedad que se lee de cada fila)}`. Otro typo: `statuData` | se re-exporta el tipo como `ModeloTablaZr`; pasar strings falla con `TS2322`, que es la forma correcta de enterarse |
| `lib-table-z` | `checkAll` se resuelve con `document.querySelector` → **dos tablas con `tableCheck` en la misma pantalla colisionan** | límite documentado; hoy ninguna pantalla lo hace |
| `lib-alert-z` | **no tiene ningún `@Input`**: es un contenedor de render suscrito a `AlertZService.alerts$` | las alertas son **imperativas** — ver abajo |
| `lib-avatar-z` | `ngOnInit` hace `name.split(' ')[1][0]` → **explota con nombres de una palabra** | no lo usa ninguna pantalla; anotado |
| `lib-footer-z` | contenido **hardcodeado** (links y redes) | — |
| Slots | `Card`/`Modal`/`Tile`/`Table`/`Accordion` usan `<ng-template libZTemplate id="...">`, pero **`lib-tabs-z` usa `<ng-template #localRef>`** | no mezclar las dos formas |
| `za-icon` | usa **`icon`**, no `name` → `NG8008: Required input 'icon' must be specified` | buena señal: prueba que el compilador lee los metadatos del paquete 18.2.13 |
| `za-switch` | tiene **CVA nativo** (hereda de `ZaBaseInput`) | una pantalla puede usarlo con `[formControl]` directo, sin wrapper |

### El único gotcha que NO se neutraliza: `validRequired()` del checkbox está invertido

```js
generateValidation() { if (this.validRequired()) return { errorRequired: true }; return null; }
validRequired()     { return this.required && this.model; }   // ← sin negación
```

Con `required` en `true`, la lib marca `errorRequired` **cuando el checkbox SÍ está tildado** y lo
deja limpio cuando está vacío — al revés de lo que un obligatorio significa. Y `lib-checkbox-z` no
tiene `manualValidation`, así que **no hay input que apague la composición**.

**Regla para las pantallas, no sugerencia:** la obligatoriedad de un checkbox se declara **solo** con
`Validators.requiredTrue` en el `FormControl`. El `obligatorio` del wrapper se usa **únicamente por
su efecto visual** (el asterisco del label).

> **Y se llama `obligatorio`, no `required`, por una razón estructural** — no es preferencia de
> nomenclatura. `RequiredValidator`, el directivo estándar de Angular, tiene selector
> `:not([type=checkbox])[required][formControlName]`, así que un input público llamado `required`
> obligaría a las pantallas a escribir el atributo que **matchea ese selector** y Angular les
> engancharía un `{required: true}` al control sin que nadie lo declare. Con el nombre cambiado la
> colisión es imposible. El detalle completo, con las dos pruebas de runtime, está en el docstring de
> [`CampoBase.obligatorio`](./campo-base.ts) y la guarda está en
> [`zds-required.spec.ts`](./zds-required.spec.ts).

No se intercepta el validador a propósito: hacerlo significaría pisar el `setValidators` que la lib
compone, y eso rompería la adopción de validadores del padre — la pieza sobre la que se apoya toda la
fachada — para arreglar un caso que la pantalla ya resuelve declarando bien el control.

### Y el otro caso sin neutralizar: las alertas son imperativas

`AlertZ` no recibe el mensaje por input. Se monta `<lib-alert-z />` **una vez** por pantalla y los
mensajes se disparan por el servicio (`providedIn: 'root'`, re-exportado por la fachada porque sin él
el componente no muestra nada):

```ts
private readonly objAlertas = inject(AlertZService);
this.objAlertas.negative('No se pudo guardar');  // .info() .positive() .alert() .show() .remove() .clear()
```

El servicio asigna el `id` solo, y los métodos rápidos setean el `config` que decide el color.

## El contrato de cada campo (no hay dos iguales)

Cinco componentes que hacen lo mismo, con cinco contratos distintos. Esta tabla es el resumen de la
razón por la que la fachada existe:

| | polaridad del estado | `manualValidation` | `helpText` | límite de largo |
|---|---|---|---|---|
| `lib-input-text-z` | `valid` = **invalid** | ✅ existe, se usa | ✅ | ❌ input muerto |
| `lib-input-select-z` | `invalid` = invalid | ✅ existe, se usa | ✅ | — |
| `lib-textarea-z` | `valid` = **invalid** | ❌ **no existe** → `ngOnChanges` propio | ✅ | ✅ `maxLength`(bool) + `maxNumber`(num) |
| `lib-input-date-z` | `valid` = **invalid** | ✅ existe, se usa | ❌ **no existe** | — |
| `lib-checkbox-z` | `valid` = **valid**, y no llega al DOM | ❌ no existe (pero mira su propio control, no el group) | ✅ | — |

### El checkbox es el único con `FormGroup` satélite

Los otros cuatro wrappers le pasan a la lib el `FormGroup` **real** de la pantalla, que es lo
correcto: hace que la composición de validadores respete lo que la pantalla declaró. El checkbox
hace lo contrario a propósito, por **dos** razones medidas:

1. **La lib es un segundo escritor, y acá escribe el tipo equivocado.** `updateControl()` hace
   `group.get(name).setValue(this.model)`, y el `model` que este wrapper le pasa es el **booleano**
   que el `za-checkbox` necesita. Con el group real, ese `setValue` pisa el contrato de texto de PM4:
   medido, `qd_strAutoriza` pasaba de `'NO'` a `false` **solo por montar**. Es el único wrapper
   afectado porque es el único que **transforma** el valor — en los otros cuatro la lib reescribe el
   mismo valor que recibió (también medido: redundante, no destructivo).
2. Con el group satélite, el `validRequired()` invertido se compone sobre el control satélite y deja
   de poder marcar `errorRequired` en el form real.

Y el mapeo `checkedValue`/`uncheckedValue` compara **contra `checkedValue`**, no con `!!valor`: con el
contrato `'SI'`/`'NO'`, la cadena `'NO'` es **truthy**, así que un `!!` pintaría el checkbox tildado
justo cuando el usuario dijo que no.

## El bug que los tests no veían (y por qué el spec de adopción cambió)

La primera versión resolvía el `FormGroup` **una sola vez** en el `ngOnInit` del wrapper, leyendo
`ngControl.control.parent`. **Ahí ese `parent` todavía es `null`**: `formControlName` engancha el
control en el `ngOnChanges` de su propia directiva, que corre *después* del `ngOnInit` de este
componente. O sea que la rama "dentro de un form" **nunca se ejecutaba** y los cinco wrappers le
pasaban al `lib-*-z` un group privado con un solo control.

Lo peligroso no fue el bug: fue que **el spec pasaba**. Comparaba las claves del `FormGroup` del host
y daba verde… porque el hijo nunca tocaba ese group. **Pasaba por la razón opuesta a la que decía
cubrir.** Se descubrió midiendo `objHijo.group === host.form` de casualidad, persiguiendo otra cosa.

Por eso [`adopcion-grupo.spec.ts`](./adopcion-grupo.spec.ts) asevera la **identidad** del group, no
solo las claves, y el getter es perezoso (el template lo lee durante la detección de cambios, que
siempre ocurre después). Corolario del gate 0 que conviene repetir: conviene asertar **el conteo** de
controles además de los nombres — al renombrar el control pre-creado, el group pasó a tener **3**
controles (el propio + el que la lib generó), no 2.

## El segundo bug que los tests no veían: `patchValue` y la validez

Mismo patrón que el de arriba —una suite verde por la razón equivocada— y lo encontró la pantalla del
gate 2, no un spec. Vale entero porque **`patchValue` es la precarga de PM4** (el `reset(task.data)`
de React) y es el camino que `TaskService` va a recorrer en cada pantalla de la Fase 5.

**Qué pasa sin el `tick()` de `writeValue`.** El valor llega bien; lo que queda mal es la **validez**.
Traza medida sobre `precargar()` con el `tick()` quitado:

```
inmediato         → 3 controles inválidos · valores CORRECTOS
tras microtask    → los mismos 3          · valores CORRECTOS
tras 1 macrotask  → los mismos 3          · valores CORRECTOS
tras 2 macrotasks → ninguno inválido      · valores CORRECTOS
```

**Por qué.** El validador que `generateControl()` compone lee **`this.model` del hijo**, no el valor
del control (`return this.required && !String(this.model || '').trim();`), y
`UtilService.updateControlValitor` difiere el `updateValueAndValidity()` en un `setTimeout`. Bajo
zoneless, un `patchValue` que no venga de un handler no propaga `[model]` antes de que ese timer
venza: el validador corre con el `model` viejo (`''`) y marca `errorRequired` sobre un campo que sí
tiene dato.

**Por qué importa siendo transitorio.** Porque la pantalla lee el estado en la misma vuelta —
`form.valid` para habilitar el submit — y ve `false` con los datos correctos puestos. El síntoma
además no señala la causa: `errorRequired` es la clave del **DS**, no de Angular, lo que invita a
revisar la definición del form en vez de la propagación del binding.

**Por qué ningún spec de wrapper podía verlo, y es estructural.** Todos propagan `model` a mano con un
`detectChanges()` antes de drenar los timers — [`colision-escritores.spec.ts`](./colision-escritores.spec.ts)
incluido, que es justamente el que documenta quién escribe el control. O sea que la suite verificaba
el contrato de la lib **con la carrera ya resuelta a favor**. Un `patchValue` real no hace eso, y el
hueco solo apareció al montar una pantalla de verdad — que es exactamente para lo que existe el gate
manual. El guardián dedicado es [`precarga-patchvalue.spec.ts`](./precarga-patchvalue.spec.ts), que
llama `patchValue` y **nada más**.

> **Y una diagnosis equivocada que conviene no repetir.** La primera lectura fue que
> `updateControl()` pisaba el control y **destruía** el `patchValue`; se escribió el comentario y un
> spec que lo aseveraba. **Es falso:** ese spec pasaba con el `tick()` mutado, o sea que no guardaba
> nada. El valor sobrevive siempre — hay un test que lo fija a propósito, como contraprueba. Lo que se
> pierde es la validez, y la diferencia importa porque manda a buscar el bug a otro lado.

## Los re-exports son alias, y el motivo es proyección de contenido

[`zds-reexports.ts`](./zds-reexports.ts) exporta **alias**, no wrappers. Un alias no puede
neutralizar un default ni renombrar un input — la pantalla sigue escribiendo el selector y los inputs
reales del DS. Se eligió igual porque un componente envoltorio **rompería la proyección de
contenido** de la mitad de la lista: `ModalZ`, `TableZ` y `TileZ` leen sus slots con
`@ContentChildren(ZTemplate)` sobre `<ng-template libZTemplate id="...">`. Un envoltorio intermedio se
quedaría con esos `ng-template` en **su** `ContentChildren` y el componente del DS recibiría cero
slots — **un modal que monta vacío, sin ningún error**.

La consecuencia asumida: los gotchas de esos componentes **no se pueden esconder**. Se documentan y
se aseveran en [`zds-reexports.spec.ts`](./zds-reexports.spec.ts), que es lo que los convierte en
algo que se rompe en rojo en vez de en una sorpresa en runtime. `ZrTemplate` se exporta porque las
pantallas lo necesitan en sus `imports` para que el atributo `libZTemplate` no sea inerte.

## `ZdsFileInput` — el wrapper con más lógica, y sus dos hallazgos

**1. El evento `change` no trae un `File`: trae un `Blob` sin nombre.** `ZFileInput.onFileInput()` lee
el archivo con un `FileReader` y **construye un `Blob` nuevo** con el `ArrayBuffer`
(`new Blob([arrayBuffer], { type })`), que es lo que emite. La identidad del `File` (su `.name`) se
**descarta** en el camino. Si ese `Blob` se sube tal cual, `FormData` lo manda como `"blob"` y **PM4
no puede resolver la extensión**. Por eso hay que reconstruirlo: `new File([objBlob], strNombre,
{ type })`, con el nombre sacado de `_fileName` del elemento (declarado en su `.d.ts`).

**2. El duplicado se detecta por CONTENIDO, no por nombre.** Smart Supervision rechaza un binario que
ya existe en el request **aunque tenga otro nombre** → hash SHA-256 contra el resto del registro.

Dos decisiones más, con su porqué: el rechazo usa el **`reset()` público** del elemento en vez de
manipularle campos privados como hacía React (y `requestUpdate()` **no existe** en `file-input.js` —
venía de `LitElement`); y el aviso sale por un `output` en vez de `control.setErrors()`, porque
`setErrors` **reemplaza** en vez de componer y borraría el `required` de la pantalla.

**El efecto secundario que hay que conocer:** `reset()` **re-entra** en el mismo handler emitiendo
`change` con `detail: null`. Por eso el orden es *resetear primero, avisar después*.

### `usesInheritance: true` — el metadato que hay que mirar antes de concluir

El `ɵɵngDeclareComponent` de `ZaFileInput` declara `inputs` pero **ningún `outputs`**, y su
`propDecorators` trae solo `Input`. Eso invita a concluir que un `(change)` en la plantilla se
engancharía al evento **DOM nativo** en vez del `EventEmitter`. **Es una lectura incorrecta**:
`ZaFileInput` se declara con `usesInheritance: true` y `change` vive en su base `ZaModelElement`
(`outputs: { ngModelChange, change }`); el **linker de Angular** resuelve la cadena de herencia al
compilar. Verificado en runtime.

La regla es *"los metadatos parciales no se leen sin mirar `usesInheritance`"*, no *"los outputs no se
heredan"*.

## Qué se testea acá, y qué estos tests NO pueden probar

jsdom **no hace upgrade de los custom elements de Lit**, así que ningún spec de esta carpeta asevera
**pintado**. Se asevera lo que sí es observable: el contrato del CVA, el estado del `FormControl`,
los inputs que llegan al componente hijo, atributos en el DOM y la cola del `AlertZService`.

**La lección más importante de la fase, y aplica a todo test de esta carpeta: una aserción de
ausencia no prueba que el código corrió.** Verificado por mutación: dejando **muerto** el handler de
`ZdsFileInput`, **112 de 113 tests seguían verdes**. Los tests de rechazo aseveran ausencias
(`toBeUndefined()`, control en `''`, `errors` intacto) y esas condiciones se cumplen solas cuando no
pasa nada; los de aceptación tampoco alcanzaban, porque el CVA nativo del DS escribe el valor por su
cuenta. El único que cayó fue el del duplicado — el que asevera un mensaje **presente**.

Otras cuatro trampas que costaron tiempo y conviene no repetir:

- **`whenStable()` no alcanza para un handler `async`.** `findDuplicateAttachment` hace
  `await file.arrayBuffer()`, que bajo jsdom resuelve por `FileReader` — un **macrotask**. El síntoma
  era engañoso: registro vacío + `NG0953: Unexpected emit for destroyed OutputRef`. La solución es el
  `drenarAsincronia()` de [`zds-file-input.spec.ts`](./zds-file-input.spec.ts).
- **Los componentes del DS tienen DI en el constructor**, así que no se pueden instanciar pelados en
  un spec: `TableZ` recibe `platformId` (es SSR-aware) y `AlertZ` recibe `(AlertZService,
  ChangeDetectorRef)`. Un helper que los reciba como tipo necesita
  `abstract new (...args: never[]) => T`; con `new () => T` el compilador lo rechaza (`TS2345`).
- **`npx ng test` NO es `npm run test`.** El script es `cross-env TZ=America/Bogota ng test`;
  invocando `ng test` crudo, `zona-horaria.spec.ts` reporta `expected 240 to be 300`. No es un
  defecto: es un error de invocación. **Y el atajo obvio tampoco sirve:** prefijar
  `TZ=America/Bogota npx ng test` en el shell **no arregla nada**, porque la variable llega al proceso
  padre pero **no a los workers de Vitest**; `cross-env` sí se propaga. Medido: mismo árbol,
  `npm run test` → 143/143, `TZ=... npx ng test` → ese único test rojo en 4 de 4 corridas.
- **`npm run lint` no ve errores de tipos que solo existan en un spec** (usa `tsconfig.app.json`). El
  chequeo complementario es `npx tsc -p tsconfig.spec.json --noEmit`.

Ruido preexistente del DS en el log de tests, no es nuestro: `NG0912` por colisión de component-ID
entre `ZaCalendar` y `ZaRangeCalendar` (los dos declaran `selector: 'za-calendar'`),
`Locale "en-US" not found`, y warnings de dev-mode de Lit.

> **Un tercer caso de "el test no veía nada", fuera de esta carpeta pero de la misma familia.** Al
> cerrar el gate 2 se mutó el `loadComponent` de la ruta para que resolviera a un símbolo inexistente
> **sin romper la compilación**, y la suite entera quedó **verde**: el `redirectTo` actualiza la URL
> antes de que el componente resuelva, así que aseverar `router.url` da bien con la pantalla en
> `undefined` — un iframe en blanco. Se cerró aseverando el componente resuelto del snapshot. Detalle
> y medición en [`app.routes.spec.ts`](../../app/app.routes.spec.ts). Vale leerlo junto con las dos
> secciones de arriba: tres veces en la misma fase, el test verde no probaba lo que decía.

**El hueco que jsdom deja lo cubre la verificación manual en Docker**, que es parte del gate de las
Fases 2, 5 y 6 — no un extra opcional. Ver
[`docs/guides/testing-conventions.md`](../../../../../docs/guides/testing-conventions.md).

## Contrato de la fachada React que se preserva

`id="field-<name>"`, `label`, `readOnly`, `helpText`, `error`, `placeholder`, `icon` (con el default
`mail-closed:line` para `inputType="email"`), `maxLength`, `min`, `elastic`.

**Una sola divergencia deliberada de nombre: el `required` de React acá es `obligatorio`.** En React
no había colisión posible porque no existe un directivo que matchee por atributo; en Angular sí, y el
nombre viejo la garantizaba. Ver la nota del checkbox más arriba.

Dos límites heredados, anotados donde alguien los va a buscar:

- **`id` va en el `<div class="zds-field-wrap">`, no en el `lib-*-z`.** La fachada React lo pone
  directo sobre el componente del DS; acá no se puede, porque `lib-input-text-z` cablea `[id]="name"`
  sobre su `za-text-input` interno y no expone input para sobrescribirlo — habría **dos** elementos
  con id distinto para el mismo campo.
- **El `focus?.()` de `scrollToFirstError` no enfoca el input de verdad**, ni acá ni en React: los
  custom elements del DS no declaran `delegatesFocus` (0 ocurrencias, medido en los dos paquetes), así
  que el foco queda en el host y no baja al `<input>` del shadow root. **No se arregla en esta
  migración** — es comportamiento de la app React que se porta tal cual; cambiarlo sería un cambio
  funcional de contrabando. El `tabindex="-1"` del wrap existe para que el `focus()` caiga en un
  elemento válido, y para que el día que el DS agregue `delegatesFocus` no haya que tocar nada.

## Detalle de infraestructura: el hoisting es asimétrico

`@zurich/angular-components` queda en `pm4-app/node_modules/` (hoisteado por el workspace) y
`@zurich-col/lib-zurich` en `frontend-ng/node_modules/`. No es un error de instalación; importa
saberlo para no buscar un paquete en el lugar equivocado.

Y el layout de los dos paquetes es distinto: `lib-zurich` es `fesm2022/` **en la raíz**, mientras que
`@zurich/angular-components` vive en **`dist/fesm2022/angular.mjs`**. Su superficie de tipos es una
cadena de barriles (`exports["."].types` → `dist/index.d.ts` → `export * from './index.auto'` →
`./atoms/za-icon`, `./data/za-kpi-value`, …), así que **un grep al nivel equivocado no devuelve nada y
parece un símbolo faltante**. Pasó: los cuatro `za-*` se reportaron como ausentes por un glob mal
apuntado, y existían.
