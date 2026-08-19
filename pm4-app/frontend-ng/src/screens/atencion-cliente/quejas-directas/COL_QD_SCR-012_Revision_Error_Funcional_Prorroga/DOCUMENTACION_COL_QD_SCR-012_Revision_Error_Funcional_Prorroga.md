# Documentación Funcional — Corrección Error Funcional Prórroga

> **Port a Angular 21 (Fase 5, pantalla 4 de 12).** La trazabilidad funcional de las §1–§11 se
> conserva **textual** respecto de la versión React: los FLD/RUL/MSG/ACT son contrato con el Anexo02,
> no con el framework. Lo único que se actualizó ahí son los **archivos de implementación** (§1) y los
> nombres de los controles del DS (§5–§8), porque nombran componentes que sí cambiaron. Lo que el port
> agregó está en la **§12**, al final.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-012** / PAN-12 — Corrección Error Funcional Prórroga |
| Tipo | Formulario de corrección (prórroga) |
| Tarea BPMN | **SP4-T06** — Corregir error funcional de cierre prórroga |
| Proceso | SP4 — Gestionar Prórroga Regulatoria |
| Rol responsable | Analista SAC (VER+EDITAR) · Área Responsable (VER+EDITAR) · Líder SAC (VER) |
| Evento de apertura | SmartSupervision rechaza prórroga HTTP 400 funcional |
| Acción de cierre | Reenviar Prórroga → SP4-T01 |
| Slug / `?screen=` | `COL_QD_SCR-012_Revision_Error_Funcional_Prorroga` |
| Archivos de implementación | `error-funcional-prorroga.ts` · `error-funcional-prorroga.html` · `error-funcional-prorroga.spec.ts` (config centralizada en `../fields/fields.ts`) |
| Versión | 2.0 — 2026-08-16 (port a Angular 21; 1.0 React, 2026-06-30) |

> Es el análogo, para el flujo de **prórroga (SP4)**, de SCR-003 (corrección error funcional de
> radicación). Y es la **hermana funcional de SCR-011**: las dos atienden el rechazo de la *misma*
> solicitud de prórroga, pero SCR-011 el error **técnico** (502 del endpoint) y esta el **funcional**
> (los datos que SmartSupervision rechazó por contenido).

---

## 2. Resumen

Panel al que SP4 deriva el caso cuando SmartSupervision rechaza la solicitud de **prórroga** con un
error 400 funcional. Muestra el detalle del error en solo lectura (código SFC, campo afectado,
mensaje, intento) y permite corregir los campos de la prórroga (motivo, nueva fecha límite,
contador y justificación) para **reenviar** (vuelve a SP4-T01) o **cancelar** la prórroga.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-012.md` | Campos (FLD-200..207), acciones (ACT-012-*), regla RUL-012-01, mensajes MSG-012-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-039/040 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-012-01/02 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-MOTIVO-PRORR (origen/estado) |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP4-T06 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP4-T06 es tarea de Usuario → sin variables canónicas |

> **Los ocho rótulos y los cuatro help-text se re-copiaron del anexo durante el port**, columna
> *Etiqueta* de la tabla "Campos de la Pantalla" de `screens/SCR-012.md`, sin el `* ` del obligatorio.
> No es un trámite: cinco de los ocho habían derivado en la versión anterior (ver §12.6).

---

## 4. Campos Implementados

### S1 — Panel de Error — Prórroga (SEC-039, solo lectura)

| Campo (UI) | Variable | Control | Fuente |
|---|---|---|---|
| Código de Error SFC Prórroga | `qd_strExtErrorCode` | `zds-input` `[readOnly]` | FLD-200 |
| Campo Afectado | `qd_strExtAffectedField` | `zds-input` `[readOnly]` | FLD-201 |
| Mensaje de Error SFC | `qd_strExtErrorMessage` | `zds-textarea` `[readOnly]` | FLD-202 |
| Intento N.° actual | `qd_strExtCurrentAttempt` | `zds-input` `[readOnly]` | FLD-203 |

### S2 — Campos de Prórroga a Corregir (SEC-040, editable)

| Campo (UI) | Variable | Control | Obligatorio | Fuente |
|---|---|---|---|---|
| Motivo de Prórroga | `qd_strExtensionReason` | `zds-select` (CAT-MOTIVO-PRORR) | **Sí** | FLD-204 |
| Nueva Fecha Límite | `qd_strNewDeadline` | `zds-date` (`[min]="strHoy"`) | **Sí** | FLD-205 |
| Contador de Prórroga | `qd_strExtensionCounter` | `zds-input` (dígitos) | **Sí** | FLD-206 |
| Justificación | `qd_strExtensionJustif` | `zds-textarea` (`[maxLength]="2000"`) | **Sí** | FLD-207 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`REENVIAR` \| `CANCELAR`) | Inferido de ACT-012-01/02 (§10) |

> **⚠ Los nombres técnicos del anexo NO son los de la implementación, y la divergencia es
> deliberada.** `screens/SCR-012.md` nombra los campos `qd_codigoErrorProrroga`,
> `qd_campoAfectadoProrroga`, `qd_mensajeErrorProrroga`, `qd_intentoActualProrroga`,
> `qd_motivoProrroga`, `qd_nuevaFechaLimite`, `qd_contadorProrroga`, `qd_justificacionProrroga`. La
> implementación usa las constantes `QD.strExt*` de `../fields/fields.ts`, que son las variables PM4
> **reales** del proceso (el diccionario definitivo, ver la última viñeta de §10). El mapeo FLD→control
> de las dos tablas de arriba es el contrato; los nombres del anexo se **mapean**, no se copian. Es la
> misma situación que documenta SCR-011 en su §10, y el motivo por el que la regla 1 de CLAUDE.md
> ("los `qd_*` son contrato con PM4, nunca renombrar") apunta a `fields.ts` y no al anexo.

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Nueva fecha límite posterior a hoy | `[min]="strHoy"` en `zds-date` + `blnFechaValida()` (`>` estricto sobre ISO) + alerta MSG-012-01 | RUL-012-01 · FLD-205 |
| Motivo obligatorio | `Validators.required` en el control + `[obligatorio]` del wrapper | FLD-204 |
| Contador obligatorio y numérico | `Validators.required` + `Validators.pattern(/^\d+$/)` | FLD-206 |
| Justificación obligatoria | `Validators.required` + `Validators.maxLength(2000)` | FLD-207 |
| Reenviar solo con todo completo | `blnPuedeReenviar()` deshabilita el botón **y** corta dentro de `reenviar()` | ACT-012-01 |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-012-01 Fecha inválida | `nuevaFechaLimite <= hoy` | `za-alert config="negative"` en S2, condicionada por `blnMostrarAvisoFecha()` | 06_Mensajes > MSG-012-01 |
| MSG-012-02 Prórroga reenviada | Tras reenviar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-012-02 |

> La alerta de MSG-012-01 **no es redundante** con el `[error]` del campo de fecha: en Angular ese
> `[error]` pinta el borde pero no muestra texto (§10, §12.3). Sin la alerta el gestor vería un borde
> rojo y un botón apagado sin ninguna explicación.

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-012-01 (🔴 BLOQUEA) — la nueva fecha límite debe ser **posterior** a la fecha actual | `blnFechaValida()` + `[min]` del calendario + alerta MSG-012-01; el corte real está en `reenviar()` | SCR-012 > RUL-012-01 |

**RUL-012-01 es la única regla de SCR-012.** Vale decirlo explícito porque un borrador del port citaba
un `RUL-012-02` para el contador de dígitos, y **ese identificador no existe** ni en la hoja local ni
en el inventario maestro de reglas. El contador solo-dígitos es una **restricción de campo**
(FLD-206), no una regla del anexo; está anotado así en el `.ts`, en el banner de esa sección del spec
y en los títulos de sus dos casos. Un ID inventado en el título de un caso es peor que en un
comentario: los títulos son lo que se lee como cobertura de reglas al auditar la trazabilidad, así que
simula una regla cubierta que el anexo nunca pidió y de paso oculta que RUL-012-01 es la única que hay.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `app-form-section color="var(--z-red)"` (token, nunca un hex — regla 3) | Tipo "corrección" |
| Banner de error 400 de prórroga | `za-alert config="negative" [hide-close]="true"` con el N.° de intento, condicionado a que FLD-203 traiga dato | Contexto SCR-012 |
| Cancelar prórroga (destructiva) | `lib-button-z [type]="'negative'"` → `completeTask` con `qd_strAction='CANCELAR'`, **siempre disponible** | ACT-012-02 |
| Reenviar prórroga (primaria) | `lib-button-z [type]="'positive'"` con `[disabled]="!blnPuedeReenviar() \|\| blnEnviando()"` | ACT-012-01 |
| Estados loading/error/submitting | `lib-loader-z`, `za-alert`, `[loading]`/`[disabled]` de los botones | CLAUDE.md |
| Submit nativo (Enter) va a reenviar | `(ngSubmit)="reenviar()"`, nunca a `cancelar()` | Ver §12.4 |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strNewDeadline` | Botón "Reenviar Prórroga" + alerta MSG-012-01 | Bloquea reenvío si la fecha no es posterior a hoy | RUL-012-01 |
| motivo + fecha + contador + justificación | Botón "Reenviar Prórroga" | Habilita reenviar solo si todos están completos y la fecha es válida | ACT-012-01 |
| `qd_strExtensionReason` | `qd_strExtensionReason_desc` | `sincronizarDesc()` escribe la etiqueta de la opción elegida; el `_desc` no tiene campo visible y viaja igual a PM4 | Convención `_desc` |

---

## 10. Suposiciones Realizadas

- **Slug** `COL_QD_SCR-012_Revision_Error_Funcional_Prorroga` — coincide con el solicitado (ASCII),
  con código SCR consistente con las hermanas.
- **CAT-MOTIVO-PRORR sigue "Pendiente TI"** en 07_Catalogs, sin valores de ejemplo. El port lo
  consume por `CollectionService` contra `QD_COLLECTIONS.extensionReason`, así que cuando el catálogo
  SFC oficial se cargue en PM4 la pantalla no cambia. (Divergencia con React, que traía OPTIONS
  estáticas placeholder — ver §12.2.)
- **Nombres `data_name` (`qd_*`)** — se usan los `QD.strExt*` de `../fields/fields.ts`, que es el
  diccionario del proyecto. Los nombres técnicos del anexo son distintos (§4) y **no** se adoptaron:
  renombrar un `qd_*` rompe el proceso en PM4 (regla 1).
- **"Fecha de hoy" se calcula en el navegador y es UTC, no Bogotá** — `new Date().toISOString()`,
  igual que el `hoyISO()` de React. Entre las 19:00 y las 23:59 de Bogotá UTC ya pasó de día, así que
  en esa franja RUL-012-01 acepta una fecha que el usuario lee como *hoy*. **Se portó tal cual a
  propósito** (corregirlo sería un cambio funcional de contrabando) y está anotado como divergencia
  conocida en el docstring de `hoyISO()`.
- **Contador de Prórroga** como `zds-input` de texto con `pattern` de dígitos: el campo viaja como
  string a PM4 (de ahí el `qd_str*`) y un `type="number"` además dejaría entrar `1e3` y notación con
  signo. El insumo también pide "validar contra catálogo SFC" — pendiente de catálogo.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-012-01/02).
- **MSG-012-02** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.
- **⚠ Pérdida de paridad con React, en dos frentes y por la misma causa:** `lib-input-date-z` **no
  tiene input `helpText`** (verificado). Consecuencias en FLD-205:
  1. El `[error]` pinta el borde en rojo pero **el mensaje no se muestra** — React sí lo mostraba. El
     texto visible lo aporta la alerta MSG-012-01, que por eso no es redundante.
  2. El **help-text del anexo de FLD-205** ("Nueva fecha de respuesta solicitada", que React extendía
     con "(posterior a hoy)") **no se puede escribir**, a diferencia de los otros tres campos de S2.
  No se compensa inventando un texto al lado del campo. Está anotado en el `.html` **al lado del
  elemento**, con la instrucción explícita de no "arreglarlo": el input no existe, y escribirlo sería
  un atributo que Angular rechaza o que el DS descarta en silencio según cómo se escriba.
- **Help-text de los otros tres campos de S2: rótulo del anexo + texto de React.** React citaba el
  anexo y le agregaba la referencia de catálogo o de regla (`(CAT-MOTIVO-PRORR)`, `(1, 2, ...)`). Se
  conservó esa forma: es un superconjunto fiel del anexo, no una invención.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-200..207) | 8/8 (100%) | Todos implementados, con sus 8 rótulos aseverados contra el anexo |
| Secciones (SEC-039/040) | 2/2 (100%) | S1-S2 |
| Acciones (ACT-012-01/02) | 2/2 (100%) | Reenviar Prórroga, Cancelar Prórroga |
| Reglas (RUL-012-01) | 1/1 (100%) | Fecha posterior a hoy. **Es la única regla de la pantalla** (§7) |
| Mensajes (MSG-012-01/02) | 1/2 en UI | MSG-012-02 lo emite el BPM tras `completeTask` |
| Catálogos (CAT-MOTIVO-PRORR) | 1/1 por colección PM4 | El catálogo sigue "Pendiente TI"; la pantalla ya lo consume dinámicamente |
| Help-text del anexo | 3/4 | FLD-205 no se puede escribir: `lib-input-date-z` no tiene el input (§10) |

**Elementos inferidos:** prefijo `qd_*` y el mapeo desde los nombres técnicos del anexo (§4), metadato
`qd_strAction`, contador como texto con `pattern`, `maxLength=2000`, cálculo de "hoy" en cliente (UTC).

---

## 12. El port a Angular 21 — qué cambió y qué destapó

### 12.1 Mapeo react-hook-form → Reactive Forms

Idéntico al de SCR-004 y SCR-011 (§12.1 de sus documentos): `useForm` → `FormGroup`, `Controller` →
`formControlName` sobre el wrapper CVA, `watch(...)` → `computed()` sobre una `signal` alimentada por
`form.valueChanges`, `reset({...})` → `precargar()` con `patchValue`, `handleSubmit` → guarda
explícita + `scrollToFirstError(this.form)`.

`precargar()` copia **solo las claves que el form declara**, iterando `Object.keys(this.form.controls)`
— por el mismo motivo que allá: un `patchValue` con claves ajenas es un no-op silencioso, pero
copiarlas haría que un campo agregado al caso por otro nodo del BPM viajara de vuelta en el PUT sin
que nadie lo pidiera. `task.data` trae el caso **entero**, decenas de `qd_*` de las pantallas
anteriores del proceso; esta pantalla toca sus 8.

La `signal` espejo (`sigValores`) se siembra con `getRawValue()` y **no** con `{}`: los computeds se
leen en el primer render, antes de que ningún `valueChanges` haya emitido.

### 12.2 Las tres cosas que esta pantalla estrena en el proyecto

**1. `zds-date` / `lib-input-date-z` (FLD-205).** Primer uso real del calendario del DS, y trajo la
pérdida de paridad de §10 — que es un límite del wrapper, no de esta pantalla, y por lo tanto lo
hereda la próxima que use una fecha. El `[min]="strHoy"` es **afordancia** (deja los días pasados
fuera de alcance en el calendario), **no** la guarda: el `min` de un `<input type=date>` no impide
tipear a mano, y bajo jsdom no impide nada.

**2. `CollectionService` + `sincronizarDesc()` en una pantalla portada (FLD-204).** Divergencia
deliberada con React, que traía OPTIONS estáticas. Dos detalles de uso que el spec fija:
- El servicio **no** es `providedIn: 'root'`: se provee en el `@Component`, una instancia por select.
  Con un singleton, la próxima pantalla con dos colecciones se pisaría las opciones a sí misma.
- `sincronizarDesc()` va en el **constructor**, no en `ngOnInit`: hace `inject(DestroyRef)` para su
  `takeUntilDestroyed()`, y fuera de un contexto de inyección eso tira `NG0203`. Su tercer parámetro
  es una **función** y no el array, porque cuando se llama la colección todavía no cargó — pasar
  `objColeccion.options()` congelaría `[]` para siempre.

Además, el `[loading]` del select pinta "Cargando opciones..." como help-text pero **no deshabilita el
campo**: `lib-input-select-z` no puede (su input `disable` está muerto, ver el gotcha en
`zds-select.ts`). El usuario puede abrir el desplegable mientras carga y verlo vacío. Es una
limitación del DS que la fachada documenta y no oculta. Y **no tapa el mensaje de error**: el
`strTextoAyudaSelect` del wrapper le da precedencia al `[error]`.

**3. RUL-012-01 con su borde.** `blnFechaValida` compara **estrictamente mayor** contra hoy: la regla
es *"posterior"*, no *"hoy o posterior"*. El caso de la fecha de **hoy** es el que delata un `>=`
puesto donde va un `>`, y por eso tiene un `it()` propio en vez de confiarse al caso de la fecha
pasada, que pasa igual con las dos implementaciones. Comparar strings ISO `YYYY-MM-DD` con `>` es
correcto porque el formato es lexicográficamente ordenable, y no parsear evita el desfase de zona que
un `new Date('2026-08-16')` introduce (medianoche **UTC**).

`strHoy` está **congelado al construir** la pantalla, no es un `computed`: el `[min]` del calendario y
la comparación de la regla tienen que usar el **mismo** valor durante toda la sesión del formulario.
Si se recalculara, un formulario abierto a las 23:59 cambiaría de referencia a medianoche y una fecha
válida al elegirla dejaría de serlo al enviar, sin que el usuario tocara nada.

### 12.3 Por qué `cancelar()` no valida nada — y por qué los cuatro `required` sí van en el control

Es el mismo requisito que ACT-011-02 en SCR-011, pero **resuelto al revés**, y la diferencia importa
porque invita a copiar la solución equivocada de una pantalla a la otra.

ACT-012-02 es la salida de excepción: cancelar la prórroga tiene que funcionar **con S2 vacío**,
porque el escenario real es justamente "no se puede corregir". En SCR-011 eso obligó a **sacar**
`Validators.required` de los controles, porque cualquier guarda futura por `form.invalid` habría
bloqueado las dos salidas. Acá los cuatro campos de S2 **sí** llevan `Validators.required`, y es
válido por una razón concreta: **`cancelar()` no mira `form.valid` en ningún momento** — llama a
`enviar('CANCELAR')` y listo. No hay ninguna lectura de validez en ese camino que el `required` pueda
envenenar.

O sea que el invariante a proteger es el mismo (la salida de excepción es alcanzable) pero el
mecanismo es distinto, y **es más frágil**: acá depende de que `cancelar()` siga sin validar. Está
anotado en el docstring del método y en el de la clase, y el spec tiene dos casos que se ponen rojos
si alguien le agrega la guarda de `reenviar()` "por simetría" (mutación 3 de §12.5).

### 12.4 `[disabled]` del DS es afordancia, y el `(ngSubmit)` no es una elección libre

Como en SCR-004 y SCR-011: un `lib-button-z` deshabilitado igual dispara su `(eventClick)` bajo jsdom
(trampa 1 de `testing-conventions.md`), así que RUL-012-01 está implementada dos veces — el
`[disabled]` para que el gestor vea que no puede, y el `if (!this.blnPuedeReenviar()) return` dentro
de `reenviar()` para que efectivamente no pueda.

Y el `[disabled]` **explícito es obligatorio en los dos botones**: el default de `lib-button-z` es
`disabled = true`, así que un botón sin ese binding nace muerto. El `type` es la **variante del DS**
(`primary`/`secondary`/`positive`/`negative`/`link`), no el `type` del HTML: `ButtonZ` renderiza un
`<za-button>` (custom element de Lit), así que no participa del submit implícito del `<form>` y no hay
handler nativo que suprimir.

Lo propio de esta pantalla: **`(ngSubmit)` va a `reenviar()` y no a `cancelar()`**, y no es una
convención sino un requisito de seguridad del flujo. El submit nativo del form (un Enter en cualquier
campo) tiene que coincidir con la acción principal; que un Enter cancelara la prórroga del ciudadano
sería un accidente irreversible desde el lado de PM4.

Contratos adicionales del port, todos con falla silenciosa, documentados en el `.html`: los **dos**
atributos (`formControlName` **y** `name`) en cada campo de la fachada — `formControlName` ata el
control al `FormGroup`, `name` es lo que la fachada usa para el `id="field-<name>"` que necesita
`scrollToFirstError` y para pre-crear el control que el `lib-*-z` adopta; con solo `name` el campo
pinta y **nunca llega al form**. Y `[hide-close]="true"` como **binding**, nunca el atributo pelado
(un atributo sin valor vale `''` y Angular 21 lo rechaza con `TS2322`).

El input de la fachada se llama **`obligatorio`, no `required`**: escribir `[required]` matchearía el
selector del `RequiredValidator` de Angular y filtraría un segundo `{required: true}` por un canal que
la pantalla no declara. Acá el efecto sería invisible (el control ya lo tiene), y por eso mismo
conviene no acostumbrar la mano — en SCR-011, donde el control NO lo lleva, el mismo descuido vuelve
inalcanzable la salida de excepción. El detalle completo está en la §12.6 de SCR-011.

### 12.5 Mutaciones verificadas (gate 5 del plan)

Cada una sobre la **implementación**, no sobre el spec.

| # | Línea mutada | Rojos | Mensaje |
|---|---|---|---|
| 1 | `blnFechaValida`: `strFecha > this.strHoy` → `>=` | **2** | el caso de la fecha de **hoy** y el de la alerta MSG-012-01 |
| 2 | `blnPuedeReenviar` vuelto a `this.form.valid && this.blnFechaValida()` (el defecto medido) | 1 | el botón primario no se habilita nunca |
| 3 | `cancelar()`: se le agrega la guarda de `blnPuedeReenviar` | **2** | los dos casos de ACT-012-02 con S2 vacío |
| 4 | `label="Contador de Prórroga"` → `"Contador de Prórrogas"` (la deriva real, §12.6) | 1 | `rótulo de qd_strExtensionCounter fuera del anexo: expected 'Contador de Prórrogas' to be 'Contador de Prórroga'` |

**La mutación 2 no es hipotética: es el defecto que la pantalla tenía y que el spec encontró en su
primera corrida.** `form.valid` es un *getter* de `AbstractControl`, **no un signal**, así que leerlo
dentro de un `computed` no crea ninguna dependencia reactiva. El computed quedaba con una sola
dependencia real (`blnFechaValida` → `sigValores`) y devolvía el valor cacheado de la primera
evaluación — la del primer render, con el form vacío y por lo tanto inválido.

Medido: tras la precarga se llegaba a `form.valid === true`, `blnFechaValida() === true` y
**`blnPuedeReenviar() === false`**, con los `errors` de los 9 controles en `null`. Consecuencia en la
pantalla real: el botón "Reenviar Prórroga ▶" no se habilita **nunca** y `reenviar()` se va por su
rama de early-return para siempre, o sea que **la acción principal queda inalcanzable**. Se cerró
derivando la validez de `sigValores()`, que sí es un signal. Los tres chequeos de la conjunción
espejan los `Validators` declarados en el `FormGroup`, que siguen siendo la obligatoriedad ejecutable
— esto es el gate de la afordancia, no un segundo juego de reglas. El `trim()` va más allá del
`Validators.required` a propósito: `required` solo rechaza `''` y `null`, así que un textarea con
espacios dejaría reenviar sin justificación.

Es el quinto caso del port de la familia **"el compilador no te lo va a decir"**: `form.valid` tipa
`boolean` y el `computed` compila, corre y devuelve un booleano perfectamente plausible.

### 12.6 Dos hallazgos del port que ningún test podía traer, y de dónde salieron

**a) Cinco de los ocho rótulos habían derivado del anexo, y el caso de paridad estaba VERDE.** La
constante `DIC_ROTULOS` del spec transcribía los rótulos que el `.html` **ya tenía**, así que el caso
comparaba el template contra sí mismo: una tautología. Las derivas: "Código de Error" por "Código de
Error SFC Prórroga", "Intento Actual" por "Intento N.° actual", "Contador de Prórroga**s**" en plural,
más dos. Y tres de los cuatro help-text del anexo faltaban.

Se cerró re-copiando la tabla del anexo y escribiendo la regla de precedencia en el docstring de la
constante: **si esta tabla y el `.html` discrepan, el que se corrige es el `.html`** — salvo que el
anexo haya cambiado, y en ese caso se re-copia de ahí, no del template. La mutación 4 es la que prueba
que ahora el caso compara de verdad.

Es la **misma familia de vacuidad** que mordió tres veces en la Fase 4 (un dato de entrada que vuelve
tautológica la aserción) y una vez en SCR-011 (§12.5 de su documento, el cortocircuito del `&&`), acá
expresada como *"el valor esperado se leyó del sujeto"*. Cuarta aparición del patrón en el port.

**b) `RUL-012-02` era una invención propia, en tres lugares.** Un `.ts`, un banner de sección del spec
y dos títulos de `it()`. El detalle y el por qué está en §7. Salió de grepear mi propio trabajo, no de
ninguna corrida.

**Y el modo en que los dos se encontraron es el dato operativo:** el defecto de `form.valid` lo trajo
el spec en su primera corrida; el de los rótulos salió de una pregunta **cosmética** sobre el layout
de la fila del contador; el ID inventado salió de un grep. Ninguno de los dos últimos lo habría
encontrado la suite, porque los dos vivían **dentro** de lo que la suite aseveraba.

### 12.7 Cobertura de los 22 casos del spec

Un caso por RUL/ACT/FLD, no un smoke.

**Estructura y montaje** — (1) precarga los 8 campos de la tarea y **descarta las claves ajenas** ·
(2) los 8 campos declaran `formControlName` y llegan al componente del DS (el puente form↔DS) ·
(3) **los 8 rótulos son los del anexo** (el caso de §12.6a) · (4) los cuatro campos de S1 son de solo
lectura y los de S2 no · (5) los títulos de sección son los de SEC-039/SEC-040 y **no quedó el de otra
pantalla** (el negativo contra SCR-011).

**RUL-012-01, la única regla — cuatro caras** — (6) una fecha futura es válida y no muestra el aviso ·
(7) una fecha pasada es inválida y muestra MSG-012-01 · (8) **⚠ la fecha de HOY bloquea**, que es el
caso que distingue `>` de `>=` · (9) con el campo vacío **no** se muestra el aviso (vacío ≠ elegido
mal).

**La divergencia con React, aseverada** — (10) el mensaje de error de la fecha **se calcula pero el DS
no lo muestra**. Está escrito para que nadie "arregle" el campo agregando un `helpText` que el wrapper
descarta en silencio (§10).

**FLD-206 y FLD-207, restricciones de campo** — (11) el contador rechaza un valor no numérico y lo
dice · (12) acepta dígitos · (13) la justificación tope en 2000 **y el contador del DS lo refleja**
(las dos mitades: el validador y la pintura).

**ACT-012-01** — (14) con el formulario completo y una fecha válida, completa la tarea con `REENVIAR` ·
(15) con un campo obligatorio vacío **no** completa la tarea · (16) con la fecha de hoy tampoco
(RUL-012-01 bloqueando el envío, no solo el botón) · (17) los mensajes de error recién aparecen
**después** del primer intento de envío.

**ACT-012-02, la salida de excepción** — (18) **cancela con los campos de S2 vacíos**, que es el
contrato de §12.3 · (19) cancelar **tampoco** enciende los mensajes de error (no levanta
`blnIntentoEnvio`).

**Estado de error** — (20) el error de carga reemplaza el formulario y **no queda ningún campo** donde
escribir un dato que no se va a poder enviar.

**FLD-203** — (21) el sufijo del intento solo aparece si la tarea lo trajo (el negativo: sin dato no se
inventa un "#") · (22) con el intento presente, la alerta de S1 lo nombra.

**Sobre `drenarPeticiones()`:** a diferencia de SCR-011, este spec **sí** lo necesita — el select de
FLD-204 dispara un GET de colección en el montaje, además del GET de la tarea. Drena solo `GET`, así
que el PUT de las acciones sigue siendo aseverable caso por caso.

---

**Registro de la pantalla (tres archivos, los tres obligatorios):** entrada en `DIC_PANTALLAS`
(`app/pantallas.ts`) · slug en `CLL_SLUGS_CON_SPEC` (`app/pantallas.spec.ts`) · entrada en
`CLL_PORTADAS` (`components/fields/paridad-react.spec.ts`, por el `maxLength` de FLD-207).

**Los dos últimos se auto-guardan, y el mecanismo es el mismo en los dos:** cada uno tiene un caso que
recorre `DIC_PANTALLAS` —el registro del router, que es donde una pantalla queda declarada como
portada— y exige que su propia lista lo cubra. Si falta el slug en `CLL_SLUGS_CON_SPEC`, la guarda de
inventario de `pantallas.spec.ts` pone la suite roja nombrándolo; si falta la entrada en
`CLL_PORTADAS`, el caso `⚠ toda pantalla enrutada con datos congelados está comparada acá` hace lo
mismo (filtrando a las que el dataset de React conoce, así que una pantalla sin contrato congelado
—`gate-fachada`, `ds-catalog`— no es un olvido). O sea que la única omisión que **no** pone nada rojo
es la del **primero**: sin la entrada en `DIC_PANTALLAS` la pantalla simplemente no existe para el
router, y las otras dos guardas no tienen de dónde saber que había algo que registrar.
