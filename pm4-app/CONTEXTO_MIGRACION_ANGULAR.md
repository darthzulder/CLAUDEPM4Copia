# Contexto de trabajo — migración a Angular 21 (Fase 5)

> **Qué es este archivo.** El contexto vivo de la sesión de migración, para sobrevivir un `/clear`.
> No reemplaza al plan (`~/.claude/plans/ahora-debemos-crear-un-calm-hearth.md`, o su copia archivada)
> ni a las `DOCUMENTACION_<slug>.md` de cada pantalla: acá va **el estado y las trampas aprendidas**,
> no la trazabilidad funcional ni el diseño de fases.
>
> **Se actualiza en el momento**, no al final: cada hallazgo que costó más de un intento va acá, con
> la evidencia (qué se mutó, qué se puso rojo). Cuando crezca demasiado, se compacta — pero **nunca se
> borra un hallazgo con evidencia**, se resume.
>
> Última actualización: 2026-08-16.

---

## 1. Estado actual, en una tabla

| Cosa | Estado |
|---|---|
| Rama | `feat/angular-migration` |
| Fase | **5** (las 12 pantallas de negocio, de a una) |
| Pantallas portadas | **5 de 12** — SCR-008 · SCR-004 · SCR-011 · SCR-012 · SCR-003 |
| Último commit | `7d680f4` — SCR-011 (Fase 5, 3/12) |
| Suite, última corrida verde | **909 passed (909)** en 66 archivos, 16.71 s |
| `lint` + `verify` | ✅ **verdes** (2026-08-16, 110.7 s, 11/12 pasos — pytest saltado por no existir `cotizador-service/`) |
| Revisión visual Playwright | ✅ **hecha para SCR-003** — dos defectos encontrados y corregidos (§9). Pendiente para SCR-011 y SCR-012 |

### Trabajo sin commitear (regla 8: nadie commitea sin confirmación explícita)

Son **dos concernos distintos**; al pedir confirmación hay que separarlos:

**(a) El porte de pantallas** — SCR-012 y SCR-003 completas:
- `screens/.../COL_QD_SCR-012_Revision_Error_Funcional_Prorroga/` (nuevo, 4 archivos + DOCUMENTACION)
- `screens/.../COL_QD_SCR-003_Correccion_Error_Funcional/` (nuevo: `.ts` `.html` `.spec.ts` +
  `seccion-campos-payload.ts` `.html` + DOCUMENTACION)
- `core/catalogos.service.ts` + `.spec.ts` (nuevos)
- `screens/.../quejas-directas/fields/matriz-motivos.service.ts` + `.spec.ts` (nuevos)
- `app/pantallas.ts` · `app/pantallas.spec.ts` · `components/fields/paridad-react.spec.ts` (los 3
  archivos de registro)

**(b) Arreglos en pantallas YA COMMITEADAS** — `shared.css` + `components/recaptcha-modal.ts` +
`components/fields/zds-select.ts` + `.spec.ts`. Reparan **cuatro** defectos reales, no son parte del
porte. Van aparte porque tocan código ya entregado — y el de `zds-select` es **transversal**: toca
toda pantalla con un select deshabilitado, no solo SCR-003.

**Y para reportar sin arreglar:** `--zf-h-20--700` está vivo en **8 archivos de React**. Es un token
muerto. Por *"si aparece un bug de la app React, se reporta y se decide aparte"*, la decisión es del
usuario.

---

## 2. Directivas del usuario, vigentes

Todas heredadas, todas vinculantes. Verbatim donde importa.

- **`"debemos priorizar el ZDS"`** — la UI sale solo de `InsumosZurich` → `vendor/zurich-angular` →
  preguntar. Gap = 0, no hay que escalar por ningún componente.
- **`"Recuerda que debemos mantener la arquitectura BFF, es prioridad."`**
- **`"antes, cabe mencionar que la pantalla SCR-010 ya no existe y eres libre de eliminarla"`** —
  hecho. `DIC_ALIAS` quedó `{}` con el mecanismo vivo.
- **`"no toques graphify yo vere ese tema despues."`** — explícitamente tarea del usuario.
- **Política de `shared.css` (2026-08-16):** minimizar la hoja usando componentes del DS; paridad
  visual con React deseable pero no obligatoria; **`"gana el componente del DS"`**; migrar **por
  pantalla, al momento de portar la que usa el bloque** — no antes.
- **Revisión visual:** *"ya puedes revisar tu mismo las pantallas visualmente"* — el Playwright MCP
  cubre la mitad "paridad visual" del gate de Fase 5.
- **La mutación va sobre la IMPLEMENTACIÓN, nunca sobre el spec.** Sin nombrar la línea rota y el test
  que se puso rojo, el test no cuenta.

### Restricciones de seguridad en vigor

- **Regla 8:** nunca commitear sin confirmación; nunca pushear salvo pedido explícito. Única
  excepción: los commits de captura en la rama huérfana `pm4-scripts-historial`. **Push y PR NO
  autorizados.**
- **Regla 9:** nunca sobrescribir un script PM4 sin capturar antes y después. Si se escribe por API
  cruda (`curl`/Bash) los hooks **no disparan** → `npm run pm4:capture -- --id <id>` a mano.
- **No modificar:** `.env` (solo agregar variables) · `backend/src/routes/pm4.routes.ts` (agregar
  rutas, no reescribir el proxy) · `../docs (4).json` · `../*.json` (exports de PM4, solo lectura).
- **Credenciales:** el token PM4 y toda credencial viven **solo** en `backend/`. Excepción documentada:
  el `<script>` de reCAPTCHA; la verificación sigue en `POST /api/recaptcha/verify`.
  `RECAPTCHA_SECRET_KEY` nunca entra al generador de env (`env-generated.spec.ts` caso 3 lo asevera
  junto a `PM4_TOKEN` e `IFRAME_ENCRYPTION_KEY`).
- **`frontend-ng/src/env.generated.ts` contiene un JWT de dev** — gitignoreado, jamás commitear. Al
  leer logs, redactar: `sed -E 's/(eyJ[A-Za-z0-9_.-]{10})[A-Za-z0-9_.-]+/\1<REDACTADO>/g'`.
- **`.npmrc` raíz tiene un PAT en base64.** Imprimir solo redactado
  (`sed -E 's/(_password|_authToken|:_auth)=.*/\1=<REDACTADO>/'`). **Nunca copiarlo a otro
  directorio** — para instalar fuera del árbol:
  `npm_config_userconfig="<repo>/.npmrc" npm_config_strict_ssl=false npm install`.
- **`pm4-app/certs/*.pem`** gitignoreado (CA corporativa `CN=ssldecrypt.latam.zurich.com`), no
  commitear.
- **Nunca matar procesos en masa.** Un `taskkill //IM node.exe` fue denegado. Apuntar a PIDs
  específicos y verificar con `netstat -ano` — `TaskStop` puede dejar el hijo huérfano.

---

## 3. Lo que sigue, en orden

1. ~~`lint` + `verify`~~ — **hechos, verdes.** El comando, para la próxima:
   ```bash
   npm run verify --prefix /c/Proyectos/bpm-screens-acz-processmaker/pm4-app
   ```
2. ~~Revisión visual con Playwright MCP de SCR-003, SCR-011 y SCR-012~~ — **las tres hechas**
   (§6-bis y §6-ter). Método, para la próxima pantalla: React `:5173` vs Angular `:4200`, mismo
   `?screen=` y mismo `case_id=32219` (el `.env` no tiene `VITE_TASK_ID`, el fallback es por
   `case_id`). Ojo: los dos títulos de modal de SCR-003 **difieren** de React, y **Angular es el
   correcto**.
3. ~~Typo `"NG0203en"`~~ — **arreglado.**
4. **Deuda declarada, no bloqueante:** la sección de payload no tiene specs de comportamiento (nada
   asevera las cascadas, el `disable()/enable()` de filas, la traducción del picker de producto, ni el
   restaurar-al-destildar). `fmtPayload()` y `esSenalado()` están exportados y marcados en el código.
5. **Pantallas que faltan (7):** OS_SCR-003 · SCR-0052 · SCR-009 · SCR-0051 · SCR-013 · SCR-000 ·
   `smartsupervision-api-docs`.

### Pendientes de fondo (no urgentes)

- **Servidores levantados** que hay que bajar cuando termine la revisión: `btyyusmet` (backend),
  `b2hwhyy5z` (React :5173), `bt4e8434o` (Angular :4200). De a uno.
- **Segundo hallazgo visual, es de DATOS no de CSS:** Angular muestra `—` en "Clasificación
  Regulatoria" donde React muestra Autos/Asistencias/Internet/Entidad vigilada; las fechas de
  borrador también difieren. Sin investigar.
- **Mitad manual del gate de Fase 5 para SCR-011 y SCR-012:** la paridad visual ya está hecha
  (§6-ter); queda la **verificación manual en Docker de los dos submits**.
- **Chequeo de mixed content:** la instancia PM4 de dev es HTTPS; un iframe HTTPS embebiendo
  `http://localhost:4200` puede quedar bloqueado.
- **Alcance de `gen-env-define.mjs`:** hoy hornea `VITE_CASE_ID`/`VITE_TASK_ID`/`VITE_PM4_TOKEN` en el
  bundle, donde React reenviaba solo la site key de reCAPTCHA. Angostarlo es un **cambio funcional** →
  decisión del usuario.
- **Antes del PR:** confirmar si Azure Pipelines también saltea el paso de pytest.
- **Fase 7 (no ahora):** adaptar `docker-compose.yml` / `Dockerfile` / `render.yaml` / `server.ts` para
  servir `frontend-ng`.
- **Corregir el plan archivado:** la suposición sobre `za-fieldset[config=row]` (Fase 7, paso 5).
- **Guarda contra el defecto de CSS silencioso:** un spec o regla de lint que se ponga rojo cuando un
  `class=` de una plantilla no matchea ninguna regla de `shared.css`, y/o cuando un `var(--…)` no
  resuelve.
- **Tarea 3 del plan aprobado, diferida *"despues por pantalla"*:** `.doc-card` +5 →
  `lib-accordion-z`; `.form-subsection`/`.products-card` → `lib-card-z`, cada una con su comparación
  visual.
- **`NG0912`** — colisión de selector `za-calendar` entre `ZaCalendar` y `ZaRangeCalendar`. Warning en
  stderr, no un fallo.
- **graphify — del usuario, no tocar.**

---

## 4. Trampas del entorno (las que cuestan tiempo)

- **Node en este Bash necesita rutas Windows:** `C:/Proyectos/…`, **no** `/c/…`. Un
  `node -e "require('/c/...')"` muere con `MODULE_NOT_FOUND`.
- **Un `cd` dentro de un comando compuesto persiste** el cwd del shell. Usar `npm --prefix`:
  `npm run test --workspace=frontend-ng --prefix /c/Proyectos/.../pm4-app`.
- **El extractor de paridad vive en `pm4-app/frontend-ng/scripts/`**, no en `pm4-app/scripts/`.
- **Strip de ANSI:** `sed -r 's/\x1B\[[0-9;]*[mK]//g'`.
- **`npx vitest --project=frontend-ng` no funciona.** Ir por el script de npm.
- **`TZ=... npx ng test` ≠ `npm run test`** — la variable no llega a los workers de Vitest, solo
  `cross-env` la propaga. La guarda de zona horaria lo detecta (`expected 240 to be 300`) y es fácil
  leerlo como un fallo de la suite.
- **No usar heredocs de shell para mutar archivos.**
- **`npm` lee el `.npmrc` del directorio donde se lo invoca, NO sube por el árbol.** Desde `pm4-app/`
  el registry vuelve al público y el install muere con 404 en `@zurich-col/lib-zurich`.
- **Un fallo de TLS aparece disfrazado de `ERESOLVE ... @angular/common@undefined`.** La pista es el
  **`undefined`**: un choque real de versiones nombra las dos versiones.
- **No hay `git revert` para una pantalla sin commitear.**

---

## 5. El catálogo de trampas técnicas

Todo lo de acá está **verificado en el código o por mutación**, no inferido. Es el activo más caro de
la sesión.

### 5.1 Angular 21 zoneless + Vitest/jsdom

| Trampa | Consecuencia |
|---|---|
| `createComponent()` **no corre `ngOnInit`** bajo zoneless | Hace falta `detectChanges()` entre `createComponent` y el `expectOne` |
| `whenStable()` **no repinta** | El orden de `asentar()` es `whenStable` → `detectChanges`, nunca al revés |
| El cuerpo de un `effect()` **no es contexto de inyección** | **NG0203** en runtime, invisible al compilar → `runInInjectionContext` |
| Un `throw` en `afterRender` **no pone rojo el spec** | Va al `ErrorHandler` global; hay que proveer uno de prueba para aseverar |
| `TestBed.resetTestingModule()` **no destruye** el fixture previo | Los effects de pantallas ya usadas siguen pidiendo catálogos. Se ve como el conteo de `verify()` **creciendo caso a caso** (`found 1`, `found 2`, …): firma de una fuga, no de un drenaje faltante |
| `scrollIntoView` no existe en jsdom | El `TypeError` sale como **error no manejado con los tests en VERDE** (la implementación difiere el scroll en `setTimeout(0)`) |
| `By.directive()` no matchea un `@Directive()` abstracto sin selector | `CampoBase` es así → hay que caminar `By.css('*')` filtrando por los inputs `name`/`label` |
| `HttpTestingController.flush()` tiene trampa de tick | El `flush` del GET va **antes** del `await`, porque `precargar()` corre solo cuando `await cargar()` resuelve |
| `ng build` **no compila** la plantilla de un componente no enrutado | Se cubre con una **sonda de montaje**: montarlo en un spec |
| `PM4_ENV_FALLBACKS` gana sobre `OBJ_ENV_VACIO` | El default lee `src/env.generated.ts` → hay que sobreescribirlo explícitamente |
| Backticks dentro de un literal `styles:` | Rompen sin aviso claro |
| Bug del locale del DS + `Intl.ListFormat` | Ya documentado |
| El grep sobre un `.mjs` minificado devuelve inputs del componente vecino | Verificar contra `types/zurich-col-lib-zurich.d.ts`, **no** por grep sobre el `.mjs` |

### 5.2 Reactive Forms

- **Un `FormControl` DESHABILITADO reporta `hasError() === false` **Y** `valid === false`, y ningún
  validador corre.** Los casos que quieren aseverar un formato roto tienen que llamar
  `habilitarFila()` primero. **Y es comportamiento real de la pantalla:** un formato roto en una fila
  que el gestor no desbloqueó **no bloquea el reenvío**.
- **`form.valid` es un getter, no un signal.**
- **`getRawValue()` y nunca `value`** — `value` omite los deshabilitados. Es *"el defecto más caro que
  el porte podía introducir"* (casos 29 y 34 de SCR-003).
- **`validadorFormato()` NO es `Validators.pattern`** deliberadamente: la tolerancia al vacío es la
  mitad del contrato, porque **ningún campo del payload es obligatorio** (RUL-003-01 no bloquea), así
  que un validador de formato no puede colar un `required` de contrabando.
- Un `[attr.x]` **no cablea** un input de propiedad.

### 5.3 El DS (`lib-*-z` y `za-*`)

- **Todo campo de la fachada necesita `formControlName` **Y** `name`.** No es redundancia:
  `formControlName` ata el control al `FormGroup`; `name` produce el `id="field-<name>"` que necesita
  `scrollToFirstError` y **pre-crea el control que el `lib-*-z` adopta**. Con solo `name` el campo
  pinta y **nunca llega al form**.
- **`[obligatorio]`, nunca `[required]`** (se renombró en la fachada, commit `2f56f28`).
- **`ButtonZ.disabled` viene `true` por default** → sin `[disabled]="false"` explícito el botón nace
  muerto.
- **`ButtonZ.type` es la variante del DS** (`primary`/`secondary`/`positive`/`link`), no el `type` del
  HTML. Y `ButtonZ` **no es un `<button>` nativo** (su plantilla es un `<za-button>` de Lit), así que
  no participa del submit implícito del `<form>` — no hace falta `type="button"`.
- **`za-alert` necesita `[hide-close]="true"` BINDEADO.** Un atributo pelado vale `''` → **TS2322**.
- **Las tres reglas de slot de `ModalZ`, las tres con falla silenciosa:**
  1. El contenido va en `<ng-template libZTemplate id="content">`, no como hijo directo.
  2. El `id` es un atributo **ESTÁTICO** (`@Attribute('id')`, resuelve una vez). Un `[id]="expr"`
     llega `null` y el slot queda sin asignar, sin error.
  3. El `ng-template` **NO puede estar dentro de un `@if`** — `ngAfterContentInit` corre una vez y no
     vuelve a mirar. El `@if` va **ADENTRO** del slot.
- **`(close)` de `ModalZ` es obligatorio:** `ModalZ.change()` escribe `this.open = false` sobre su
  propio input, así que sin bajar la bandera de la pantalla el segundo `abrirLog()` no abre nada. **El
  defecto solo se ve al segundo click.**
- **`TableZ` no proyecta markup** — arma la tabla desde `[headers]` + `[data]`. Su `<tbody>` es un
  `@for` pelado **sin rama de lista vacía**, así que el empty state va **afuera** de la tabla.
- **`cllColumnasHistorial` no puede ser `readonly`:** `TableZ` declara `headers: TableModel[]`
  (mutable) → **TS4104**. Igual `cllHistorial`. Son campos de instancia, no `computed()`.
- **El `key` de cada columna ES la propiedad que `TableZ` lee de cada fila** — un typo pinta una celda
  vacía sin ningún error.
- **`TableZ.checkAll` usa `document.querySelector` global** → dos tablas en la misma pantalla
  colisionan.
- **`zds-select` NO se puede deshabilitar** por template: su input `disable` (sin "d") existe pero
  nadie lo lee en la librería, y `disabled` tampoco. Hay que usar `control.disable()`/`enable()`.
  **Y eso deshabilita de verdad pero NO se ve** — nada llega al `za-select`, así que el widget queda
  con `opacity: 1` y aspecto habilitado. La marca visual la pone la fachada con
  `.zds-select-wrap--deshabilitado` (`opacity: .5`, el mismo valor que el `z-select` de React computa
  con `disabled`). Ver §6-bis (b): el defecto vivió commiteado con la suite verde.
- Un `formControlName` **hermano** del `<form>` (como el del modal) necesita un `[formGroup]` local o
  tira **NG01050**.
- **`[formGroup]` no es un atributo del DOM** — detectar "hay form ancestro" va por DI
  (`ControlContainer`), nunca por `closest()`.
- **`@angular/build` ignora el CSS importado desde TS:** compila y queda huérfano sin avisar. El CSS
  global va por el array `styles`.
- **Un custom property CSS indefinido invalida la declaración entera, en silencio.** Y una clase
  referenciada pero nunca definida pasa todos los gates.

### 5.4 Trampas de infraestructura de specs (de SCR-003, las más caras)

- **`drenarColecciones()` corre DOS veces: en `montar()` y en `afterEach` antes de `verify()`.** El
  motivo: el catálogo de municipios se recarga desde un `effect` (`aplicarCascadaMunicipio`), así que
  **toda** escritura al departamento —incluida la de `precargar()`— dispara un GET nuevo. Un solo
  drenaje al montar deja ese GET afuera y el `objMock.verify()` del `afterEach` pone el caso rojo con
  un mensaje sobre la colección 15, no sobre el código bajo prueba.
- **El orden del `afterEach` es `destroy()` → `drenarColecciones()` → `verify()`**, por dos razones
  distintas: (1) la fuga del `resetTestingModule` de arriba; (2) destruir dispara la última ronda de
  effects, así que el drenaje va **después**.
- **El set que drena NO se enumera ni se cuenta**, deliberadamente: se deriva de
  `SCR003_PAYLOAD_M2_FIELDS` + los tres `matriz:*`. Fijar el número pondría rojo el archivo entero
  cada vez que alguien agregue una fila al descriptor — un cambio que este archivo **no vigila** (ya
  lo cubren `catalogos.service.spec.ts` y `matriz-motivos.service.spec.ts`).
- **En SCR-011 la AUSENCIA de `drenarColecciones()` era la aserción** — porque `SeccionCamposPayload`
  declara `CatalogosService`/`MatrizMotivosService` en **su propio** `providers`.
- **El contrato de orden de `montar()`, en cuatro partes:** `fijarQueryString` antes de
  `createComponent` (`ngOnInit`→`cargar()` lee `task_id` al arrancar) · `detectChanges()` **entre**
  `createComponent` y `expectOne` · el `flush` del GET **antes** del `await` · `drenarColecciones()`
  **después** del primer `asentar()`.
- **El fixture es una FUNCIÓN, no una constante** — fresco por caso.
- **El patrón "el conteo va antes del `for`"**, usado dos veces (rótulos, descriptor). Es lo que le
  faltaba a los casos vacuos del gate 4.

### 5.5 La lección transversal de los gates 2 y 4

> **Un registro vacío convierte una aserción en una tautología, y el archivo se ve sano mientras no
> asevera nada.** Cuando el dato de entrada de un spec sale de un módulo que hoy está vacío, hay que
> **inyectarlo**, no leerlo.
>
> **Corolario:** mutar el **spec** no prueba nada — solo demuestra que el test se contradice a sí
> mismo. La mutación va sobre la **implementación** que el test dice cubrir.

Y su gemela, del "fixture que hace coincidir las dos ramas": si el fixture hace que ambas ramas del
`if` den el mismo resultado, el caso pasa con cualquiera de las dos.

---

## 6. SCR-003, la pantalla recién portada

`screens/atencion-cliente/quejas-directas/COL_QD_SCR-003_Correccion_Error_Funcional/`

| Archivo | Líneas | Qué es |
|---|---|---|
| `correccion-error-funcional.ts` | 561 | la pantalla |
| `correccion-error-funcional.html` | 256 | su plantilla |
| `correccion-error-funcional.spec.ts` | 809 | **39 casos** |
| `seccion-campos-payload.ts` | 436 | el editor del payload (exporta `fmtPayload()` / `esSenalado()`) |
| `seccion-campos-payload.html` | — | — |
| `DOCUMENTACION_..._.md` | — | §1–§11 textual del React + **§12 nuevo** (7 subsecciones) |

### Lo que estrena esta pantalla

1. **`lib-table-z` data-driven** — `TableZ` no proyecta markup (ver §5.3).
2. **Nombres de control DINÁMICOS** vía `computed()`. El anexo declara FLD-040..045 pero **ningún
   script los escribe hoy** — `sfcCamposErrorTecnico()` emite el juego que consume SCR-004. Los tres
   campos se atan al nombre que el caso REALMENTE trae, con fallback al del anexo.
3. **El editor de payload como componente propio**, con `CatalogosService`/`MatrizMotivosService` en su
   **propio** `providers` (el padre no tiene ningún select).

### Decisiones de diseño con motivo

- **El `FormGroup` satélite (`objGrupoEdicion`)** aloja los checkboxes "Editar" y el picker de UI del
  producto: son **estado de UI**, no datos del caso — nada llamado `edit-qd_strChannel` puede llegar a
  PM4, y el submit es `{...form.getRawValue()}`. Necesita un control **real** (no solo un signal)
  porque `ZdsCheckboxField` es un CVA.
- **Por qué el producto SFC necesita su propio control y los otros 12 selects no:** la colección 16
  **repite códigos** (104 es a la vez "Garantía extendida" y "Copropiedades") y el picker del DS indexa
  por `value`. React lo resolvió con `toPickerValue`/`fromPickerValue`/`onPickerChange`, que
  **`zds-select` no tiene**. Acá el select se ata a `ui-<var>` con `código::etiqueta`, y un
  `valueChanges` traduce al control real — el form sigue guardando el **código puro**.
- **La reacción del checkbox va por el `valueChanges` del control satélite, no por un `(output)` de la
  plantilla.** Y es *correcto*, no solo posible: `marcarEditable()` escribe con `emitEvent: false`, así
  que las escrituras programáticas de las cascadas **no re-entran**.
- **`sincronizarDesc()` recibe una FUNCIÓN como tercer argumento** — pasarle el array captura el `[]`
  del primer instante.
- **La doble acción de `limpiarSiFuera()` es deliberada:** limpiar sin re-marcar el checkbox deja el
  campo vacío **y bloqueado**. El `in_blnActivo` evita tocar un campo que el gestor no pidió editar.
- **El piso de 5 caracteres de `esSenalado`:** sin él, `id`/`cod` matchean dentro de cualquier mensaje
  y **todas** las filas salen marcadas.
- **`precargar()` pasa los defaults por el mismo filtro `Object.keys(this.form.controls)`** porque
  `SCR003_DEFAULTS` incluye `qd_lstAttemptHistory`, una **lista sin control**. Esparcirlo crudo daba
  **TS2345** que `ng build` nunca vio. **Lo encontró la sonda de montaje.**
- **El guard `Number.isFinite` de `blnMuchosIntentos` es DOCUMENTACIÓN, no una rama** (`NaN >= 3` ya es
  `false`). Un guard conductualmente equivalente a su ausencia **no se puede cubrir** por
  comportamiento.
- **`objPayloadEnviado` devuelve `null` también para arrays** (un array pasa `typeof === 'object'`).
- **El formato de `lstCambios()` es contrato:** `<rótulo>: <antes> → <ahora> (<descripción>)` unido con
  `'; '`. El paréntesis lleva el **`<variable>_desc`** del valor nuevo, **no** el `note` de la
  definición. Las filas auxiliares se rotulan por **variable**, no por `key` (su key es el literal
  `'—'`).
- **`abrirLog()`/`cerrarLog()` existen los dos** por el bug de `ModalZ.change()` (§5.3).

### La tabla de mutaciones (7 filas, M1–M7)

Dos vale destacarlas:

- **M5 — quitar el `ZrTemplate`:** el modal abre **VACÍO**, con `ng build` y la suite **entera verde**.
- **M7 — soltar la `e` final de un campo de nombre ESTÁTICO** (`formControlName="qd_strErrorType"` →
  `qd_strErrorTyp`): **42 casos rojos** — los 3 de paridad de SCR-003 (incluido *"⚠ todo campo montado
  existe en el contrato que declaraba React"*) más ~39 del spec de la pantalla. Prueba que
  `DIC_NOMBRES_DINAMICOS` queda **más angosto** que el defecto que el caso persigue.
  **El revert está puesto** — confirmado en `correccion-error-funcional.html:70-75`.

### Los cuatro hallazgos que ningún test podía traer (§12.6 de la DOCUMENTACION)

1. **El dataset congelado de React solo nombra campos resolubles ESTÁTICAMENTE, por diseño.**
   `paridad-react.json` tiene **5** campos para SCR-003; la pantalla Angular monta ~44 más. No es
   obsolescencia: `scripts/extraer-paridad-react.mjs` resuelve cada `name` por análisis de AST de
   TypeScript y **descarta** lo que no puede evaluar estáticamente, empujándolo a `cllSinResolver` —
   que se imprime por consola pero **no se persiste**. La herramienta de evidencia autoritativa es
   **`node scripts/extraer-paridad-react.mjs --check`** (desde `pm4-app/frontend-ng`), que para SCR-003
   imprime las 7 entradas `dinamico:*` sin resolver y cierra con *"✓ el dataset congelado coincide con
   el .tsx de React"*.
   **Corolario:** una lista de exenciones necesita su propia guarda de *"¿sigue siendo alcanzable?"* —
   la mía atrapó tres exenciones muertas (`qd_strErrorCodeSFC`, `qd_intAttemptNumber`,
   `qd_strErrorMessageSFC` no montan con `data: {}`) y se quitaron.
2. El **TS2345** que encontró la sonda de montaje (arriba).
3. **NG0203** / `runInInjectionContext`, con el contraste explícito contra SCR-012.
4. El comportamiento del `FormControl` deshabilitado, **como consecuencia funcional** (§5.2).

### Los tres archivos de registro (los tres obligatorios)

`app/pantallas.ts` · `app/pantallas.spec.ts` · `components/fields/paridad-react.spec.ts`.

**Dos de los tres se auto-vigilan**, por el mismo mecanismo (los dos recorren `DIC_PANTALLAS`). La
única omisión que **no pone rojo nada** es la **primera** (`DIC_PANTALLAS` mismo) — sin ella la
pantalla no existe para el router, así que las otras dos guardas no tienen forma de saber que faltaba
registrar algo.

Estado: los tres editados y verdes. `DIC_PANTALLAS` tiene la 5ª entrada en `pantallas.ts:84-87`;
el slug es el 5º de `CLL_SLUGS_CON_SPEC` en `pantallas.spec.ts:54`.

---

## 6-bis. La revisión visual de SCR-003 (2026-08-16) — dos defectos que ningún test veía

Método: Playwright MCP, viewport 1440×1000, captura de página completa de los dos lados con
`?screen=COL_QD_SCR-003_Correccion_Error_Funcional&case_id=32219`. **Los dos defectos estaban en
código que la suite daba por verde**, y en los dos casos el spec existente aseveraba el defecto.

### (a) El `@if` se comía las cabeceras del historial

- **Síntoma:** React pinta los cuatro rótulos (Intento / Fecha / Campo afectado / Código error) con
  el "Sin intentos anteriores registrados" adentro; Angular mostraba **solo el texto**, sin tabla.
- **La causa es una lectura de más del propio comentario del código.** El comentario decía —
  correctamente — que `TableZ` no tiene rama de lista vacía y que el empty state va afuera. La
  plantilla fue un paso más allá y envolvió **la tabla** en `@if (cllHistorial().length)`, que no es
  lo que el comentario pedía. El mismo comentario ya decía la respuesta: *"con `data: []` pinta el
  encabezado y nada más"* — o sea que hay que **dejarla montada**.
- **Arreglo:** tabla siempre montada, `@if (!length)` solo para el cartel.
- **El spec aseveraba el defecto:** el caso decía `querySelector('lib-table-z')).toBeNull()`.
  Reescrito a `not.toBeNull()` + el conteo antes. **Mutación M2:** re-envolver en el `@if` → **1
  caso rojo**, el correcto.

### (b) `zds-select` bloqueaba de verdad pero se veía habilitado

- **Síntoma:** en React los 21 controles del payload que el gestor no marcó "Editar" se ven
  claramente apagados; en Angular se veían normales.
- **El bloqueo funcional NUNCA estuvo roto** — verificado en el navegador: `control.disabled` es
  `true` en los 21, un click en País **no abre** el listado y el valor queda `''`. Era **solo** la
  señal visual. Vale distinguirlo: un reporte de "el select no se deshabilita" habría mandado a
  arreglar lo que ya funcionaba.
- **La causa, y el hueco en la doc previa:** el §5.3 ya decía que `disable`/`disabled` son inputs
  muertos en `lib-input-select-z` y que hay que usar `control.disable()`. Cierto — pero incompleto:
  no registraba que hacerlo así **deja el widget sin ninguna marca visual**, porque nada llega al
  `za-select` (verificado: sin atributo `disabled`, `opacity: 1`, `pointer-events: auto`).
- **El valor no se inventó.** En React, `z-select` con el atributo `disabled` computa
  **`opacity: .5`** en el host — eso es el DS de React, no CSS del proyecto. Se replicó ese mismo
  valor, así que sigue siendo "gana el componente del DS".
- **Arreglo:** `[class.zds-select-wrap--deshabilitado]="deshabilitado()"` sobre el envoltorio que ya
  existía (la señal `deshabilitado` de `CampoBase` ya venía llena por `setDisabledState`, solo no la
  consumía nadie: `zds-date` y `zds-textarea` sí bindean `[disabled]`, este no puede) + la regla en
  `shared.css`. **`pointer-events` no se toca**: el bloqueo real ya lo hace Angular.
- **Alcance transversal:** arregla toda pantalla con un select deshabilitado, no solo SCR-003.
- **Mutación M1:** quitar el binding de clase → **1 caso rojo**. El caso viejo pasaba con el defecto
  puesto porque solo aseveraba `deshabilitado() === true` (la señal), nunca que algo la pintara — con
  el comentario *"no hay forma de deshabilitar visualmente este campo"*, que era la conclusión
  equivocada. Ahora cubre las dos mitades, con el conteo antes.

> **La lección, y es la del §5.5 con otra cara:** un comentario correcto pero **incompleto** produce
> un spec que asevera el defecto y lo congela. Los dos casos se veían sanos y los dos aseveraban la
> ausencia de algo que React sí mostraba. **Ningún test podía traer esto: hacía falta mirar.**

---

## 6-ter. Las revisiones visuales de SCR-011 y SCR-012 (2026-08-17)

Cierran la mitad manual del gate. Las 909 en verde antes y después.

### SCR-011 — dos defectos, los dos de texto

Detalle completo en el §12.5 de su DOCUMENTACION. En corto:

| # | Defecto | Por qué el spec no lo vio | Mutación |
|---|---|---|---|
| 1 | La alerta de S1 decía `falló por un error técnico` **tras varios intentos** — frase que no está ni en el React de esa pantalla ni en el anexo | El caso de la alerta aseveraba el **fragmento** `'solicitud de prórroga'`, así que cualquier frase intercalada pasaba. Ahora asevera la oración completa (espacios normalizados) | M4 → 1 rojo |
| 2 | El rótulo de FLD-192 decía `Mensaje **T**écnico de la API` | El caso *los rótulos… son textualmente los del Anexo02* **aseveraba la mayúscula** — el test escrito para vigilar rótulos congelaba la divergencia | M3 → 1 rojo, con el campo en el mensaje |

Dos cosas que valen para la próxima pantalla:

- **La T mayúscula sale de SCR-004**, que es la fuente del copy-paste y la escribe así **en su propio
  React**. O sea que la base de React es inconsistente entre las dos pantallas del mismo campo
  (FLD-192 ≡ FLD-052) y el porte "unificó" eligiendo la forma que el anexo no usa (`técnico` en
  minúscula en las 4 filas: los dos `screens/` y `masters/03_Campos.md`). **Se corrigió solo SCR-011**;
  SCR-004 queda con la mayúscula porque su React ya decía así y alinearla es alcance de otra tarea →
  **divergencia conocida entre las dos hermanas.**
- **Un `toContain` de fragmento no es una aserción de texto.** Es el primo del `toBeNull()` del §6-bis:
  el caso existía, nombraba la alerta, y no podía fallar por lo que le agregaran al medio.

**Lo que se investigó y NO era defecto:** el `qd_strPayloadSent` atenuado con FLD-058 en "No", que
React no atenúa. No se tocó — acá el bloqueo es `control.disable()` deliberado (documentado con su
motivo: bloquear también las escrituras programáticas), React usa `readonly` y por eso no atenúa, y el
atenuado **lo pone el propio DS** (`z-textarea[disabled]` → `opacity: 0.5` en el host), el mismo
mecanismo que el `z-select` de React del §6-bis (b). Registrado como divergencia justificada.

### SCR-012 — sin defectos

Paridad exacta: los 8 rótulos de la fachada coinciden uno a uno, ningún control deshabilitado, el
`_desc` de la convención presente, y el form arranca inválido → "Reenviar Prórroga" gris y "Cancelar
Prórroga" habilitado en los dos lados. **Ninguno de los dos defectos del §6-bis reaparece:** no usa
`lib-table-z`, y sus dos `zds-select` nunca llaman `disable()`/`enable()`.

**Falso positivo a no perseguir:** la banda `⚠ Usando token de debug` del shell de dev de Angular se
ve solapada con el header azul. Es nodo de texto directo de `app-root` con `position: static` (no se
superpone por CSS: empuja, y el header con su propio posicionamiento queda encima). Es del shell, sale
en **toda** pantalla `:4200` — incluida SCR-003, ya aprobada — y no es de ninguna pantalla en
particular.

---

## 7. Para documentar en `docs/guides/testing-conventions.md`

Todo el §5 de este archivo es candidato. Lo más valioso, en orden:

1. Las trampas de drenaje del §5.4 (incluida la firma de fuga del `verify()` que crece caso a caso).
2. El `FormControl` deshabilitado: `hasError()` false **y** `valid` false, sin correr validadores.
3. Un guard conductualmente equivalente a su ausencia no se puede cubrir por comportamiento.
4. El hallazgo del dataset congelado (§6): solo nombra lo estáticamente resoluble; `--check` es
   autoritativo; una lista de exenciones necesita su propia guarda de alcanzabilidad.
5. **La lección del §6-bis:** un comentario correcto pero incompleto produce un spec que asevera el
   defecto. Los dos casos aseveraban la **ausencia** de algo que React sí mostraba, y la suite estaba
   verde. Corolario práctico: cuando un spec asevera un `toBeNull()` / un "no está", preguntarse si
   la ausencia es el contrato o solo lo que el código hace hoy. **Y: la paridad visual no es
   opcional en el gate — hay defectos que solo se ven mirando.**
6. **La lección del §6-ter, que es la misma familia:** un caso que asevera un **fragmento** de texto
   (`toContain('solicitud de prórroga')`) no vigila el texto — no puede fallar por lo que le agreguen
   al medio. Para copy que viene de React o del anexo, aseverar la **oración completa** con los
   espacios normalizados. Y el caso de rótulos de SCR-011 muestra el peor modo: el test escrito
   *específicamente* para vigilar los rótulos era el que congelaba la divergencia.
7. Todas las trampas del §5.1 y §5.3.

---

## 8. Cómo mantener este archivo

- **Agregar en el momento.** Un hallazgo que costó más de un intento va acá **con su evidencia** (qué
  se mutó, qué se puso rojo), no con una conclusión suelta.
- **Compactar cuando crezca**, no borrar. Un hallazgo con evidencia se resume; no se elimina.
- **Lo que NO va acá:** trazabilidad funcional (va en `DOCUMENTACION_<slug>.md`) · el diseño de fases
  (va en el plan) · estructura del código o historia de git (ya están en el repo y en el grafo).
