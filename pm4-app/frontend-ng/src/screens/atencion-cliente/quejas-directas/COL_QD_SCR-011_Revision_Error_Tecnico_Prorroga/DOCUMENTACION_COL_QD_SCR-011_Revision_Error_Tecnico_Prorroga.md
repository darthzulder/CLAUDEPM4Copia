# Documentación Funcional — Revisión Error Técnico Prórroga

> **Port a Angular 21 (Fase 5, pantalla 3 de 12).** La trazabilidad funcional de las §1–§11 se
> conserva **textual** respecto de la versión React: los FLD/RUL/MSG/ACT son contrato con el Anexo02,
> no con el framework. Lo único que se actualizó ahí son los **archivos de implementación** (§1) y los
> nombres de los controles del DS (§5–§8), porque nombran componentes que sí cambiaron. Lo que el port
> agregó está en la **§12**, al final.
>
> Documento de origen:
> `frontend/src/screens/atencion-cliente/quejas-directas/COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga/DOCUMENTACION_COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga.md`.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-011** / PAN-11 — Revisión Error Técnico Prórroga |
| Tipo | Pantalla de análisis técnico (prórroga) |
| Tarea BPMN | **SP4-T05** — Corregir error técnico de API en prórroga |
| Proceso | SP4 — Gestionar Prórroga Regulatoria |
| Rol responsable | Analista Técnico (VER+EDITAR) · Analista SAC (INFORMADO) · Control SLA (INFORMADO) |
| Evento de apertura | SP4-T01 falla técnicamente → escala |
| Acción de cierre | Autorizar Reenvío Prórroga → SP4-T01 |
| Slug / `?screen=` | `COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga` |
| Archivos de implementación | `revision-error-tecnico-prorroga.ts` (419 líneas), `revision-error-tecnico-prorroga.html` (255), `revision-error-tecnico-prorroga.spec.ts` (24 casos) · registro en `app/pantallas.ts` **y** `app/pantallas.spec.ts` (config centralizada en `screens/.../fields/`) |
| Versión | 1.2 — 2026-08-16 (port a Angular; funcionalmente = 1.1) |

> Es el análogo, para el flujo de **prórroga (SP4)**, de SCR-004 (error técnico de radicación).
> Desde la v1.1 **comparte exactamente las mismas variables que SCR-004**: los scripts de
> Momento 2/3 escriben siempre `qd_strHttpCode`, `qd_strErrorType`, `qd_strApiTechMessage`,
> `qd_strCompleteLogAPI`, `qd_strEndpointCalled`, `qd_strPayloadSent`, `qd_strAttemptNum`
> ante un fallo de la API — la prórroga viaja como `prorroga_queja` dentro del body de cierre,
> no en una llamada aparte — por lo que las variantes `qd_strExt*` (FLD-190..196) nunca se
> poblaban y se retiraron. Solo cambian los textos y las acciones de la pantalla.

---

## 2. Resumen

Pantalla a la que SP4 escala el caso cuando el envío del payload de **prórroga** a
SmartSupervision falla por un error técnico. El Analista Técnico revisa el log del error (código
HTTP, tipo, mensaje técnico, payload, número de intento — todo solo lectura), documenta la **causa
raíz** y la **corrección aplicada** (obligatorias) y **autoriza el reenvío** (vuelve a SP4-T01) o
**escala el incidente al proveedor**.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-011.md` | Campos (FLD-190..196), acciones (ACT-011-*), regla RUL-011-01, mensajes MSG-011-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-037/038 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-011-01/02 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP4-T05 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP4-T05 es tarea de Usuario → sin variables canónicas |

> Sin catálogos (07_Catalogs): la pantalla no tiene listas desplegables.

---

## 4. Campos Implementados

### S1 — Detalle del Error Técnico — Prórroga (SEC-037, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Código HTTP prórroga | `qd_strHttpCode` | `zds-input` readOnly | FLD-190 ≡ FLD-050 |
| Tipo de Error | `qd_strErrorType` | `zds-input` readOnly | FLD-191 ≡ FLD-051 |
| Número de intento prórroga | `qd_strAttemptNum` | `zds-input` readOnly | FLD-194 ≡ FLD-055 |
| Endpoint Invocado | `qd_strEndpointCalled` | `zds-input` readOnly | FLD-053 (paridad SCR-004) |
| Mensaje técnico de la API | `qd_strApiTechMessage` | `zds-textarea` readOnly | FLD-192 ≡ FLD-052 |
| Payload de prórroga enviado (JSON) | `qd_strPayloadSent` | `zds-textarea` (editable si requiere ajuste) | FLD-193 ≡ FLD-054 |
| Log Completo (modal) | `qd_strCompleteLogAPI` | `zds-textarea` readOnly | sin FLD · script M2/M3 |

### S2 — Registro de Corrección — Prórroga (SEC-038, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Causa Raíz | `qd_strRootCause` | `zds-textarea` | **Sí** (para autorizar) | FLD-195 ≡ FLD-056 |
| Corrección Aplicada | `qd_strCorrectionApplied` | `zds-textarea` | **Sí** (para autorizar) | FLD-196 ≡ FLD-057 |
| ¿Requiere ajuste en payload? | `qd_strPayloadAdjustNeeded` | `zds-radio` SÍ/NO | **Sí** | FLD-058 (paridad SCR-004) |

> **La obligatoriedad de los dos campos de S2 es *de la acción*, no del control** — y esa distinción
> es la diferencia estructural con SCR-004. Ver §12.2: acá el `FormGroup` **no** lleva
> `Validators.required` en esos dos controles, porque ACT-011-02 (escalar) tiene que ser alcanzable
> con S2 vacío. El asterisco del rótulo sí se pinta (input `obligatorio` de la fachada), porque la
> regla existe para la salida principal.

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`AUTORIZAR_REENVIO` \| `ESCALAR_PROVEEDOR`) | Inferido de ACT-011-01/02 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Causa raíz obligatoria | Exigida (`trim()`) por `blnPuedeAutorizar()` + `Validators.maxLength(2000)`. **Sin `Validators.required`** — ver §12.2 | FLD-195 · RUL-011-01 |
| Corrección aplicada obligatoria | Ídem causa raíz | FLD-196 · RUL-011-01 |
| Autorizar solo con ambos campos | `blnPuedeAutorizar()` deshabilita el botón + alerta MSG-011-01, **y** corta dentro de `autorizar()` | RUL-011-01 |
| Payload JSON válido si requiere ajuste | Con `qd_strPayloadAdjustNeeded='SI'`, `qd_strPayloadSent` debe parsear como **objeto** JSON (no `null`, no array, no escalar); si no, se bloquea autorizar | Paridad SCR-004 · script M2/M3 descarta payload inválido |
| Longitud máxima causa/corrección | `Validators.maxLength(2000)` en el control **más** `[maxLength]="2000"` en el `zds-textarea`, que es el contador visual del DS (`9/2000`). Son dos mecanismos distintos — ver el comentario de `zds-textarea.ts` | **Suposición** (§10) |
| Campos de S1 solo lectura | `[readOnly]="true"` en los FLD-190..194 y en el log | Anexo02 (Control UI = Label/Solo lectura) |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-011-01 Campos vacíos | causa o corrección vacías | `za-alert config="info"` + "Autorizar" disabled | 06_Mensajes > MSG-011-01 |
| MSG-011-02 Reenvío prórroga autorizado | Tras autorizar | **No en UI** — lo emite el BPM tras `completarTarea` | 06_Mensajes > MSG-011-02 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-011-01 (🔴 BLOQUEA) — no autorizar sin causa y corrección | `blnPuedeAutorizar()` deshabilita el botón + alerta MSG-011-01, **y** el corte real dentro de `autorizar()`. Las dos cosas son necesarias: un botón deshabilitado del DS igual dispara su handler (§12.4) | SCR-011 > RUL-011-01 |
| **La regla NO aplica a ACT-011-02** | `escalar()` no tiene guarda ni levanta el intento de envío: escalar al proveedor es justamente la salida para cuando el analista **no** puede documentar la corrección | SCR-011 > ACT-011-02 (§12.2) |
| Payload editado debe ser objeto JSON | `blnPayloadJsonOk()` se suma a `blnPuedeAutorizar()` + alerta negativa | Paridad SCR-004 (script M2/M3) |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `app-form-section color="var(--z-red)"` (igual que SCR-004) | Tipo "análisis técnico" |
| Banner de error técnico de prórroga | `za-alert config="negative"` con número de intento | Contexto SCR-011 |
| Payload editable solo si "Requiere ajuste = Sí" | **El bloqueo vive en el CONTROL, no en la vista:** `sincronizarEdicionPayload()` hace `enable()`/`disable()` según FLD-058 (§12.3) | FLD-058 + paridad SCR-004 |
| Autorizar reenvío de prórroga | `lib-button-z [type]="'positive'"`; `completarTarea` con `qd_strAction='AUTORIZAR_REENVIO'` | ACT-011-01 |
| Escalar a proveedor | `lib-button-z [type]="'secondary'"`; `completarTarea` con `qd_strAction='ESCALAR_PROVEEDOR'`. **Siempre habilitado** | ACT-011-02 |
| "Ver Log Completo" (modal) | `lib-button-z [type]="'link'"` en el slot `[action]` del header de S1 abre un `lib-modal-z tamanio="l"` con el `qd_strCompleteLogAPI` de solo lectura | Paridad SCR-004 (ACT-004-03) |
| S2 no nace en rojo | `mensajeDeError()` devuelve `''` mientras `blnIntentoEnvio()` sea falso | Criterio de UX del proyecto |
| Estados loading/error/submitting | `za-loader`, `za-alert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strRootCause` + `qd_strCorrectionApplied` | Botón "Autorizar Reenvío Prórroga" | Habilita autorizar solo si ambos están completos (con `trim()`) | RUL-011-01 |
| `qd_strRootCause` + `qd_strCorrectionApplied` | Botón "Escalar a Proveedor" | **Ninguno** — la dependencia no existe a propósito (§12.2) | ACT-011-02 |
| `qd_strPayloadAdjustNeeded` | `qd_strPayloadSent` | `SI` ⇒ el control pasa a `enabled` + alerta de ajuste; `NO` ⇒ `disabled`. **En ambas direcciones** | Paridad SCR-004 |
| `qd_strPayloadSent` | Botón "Autorizar Reenvío Prórroga" | Con ajuste marcado, JSON inválido bloquea autorizar | Paridad SCR-004 |
| `qd_strAttemptNum` | Texto del `za-alert` de S1 | Sufija el número de intento si hay valor | Inferido de FLD-194 |

---

## 10. Suposiciones Realizadas

- **Slug** `COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga` — coincide con el solicitado (ASCII),
  con código SCR consistente con las hermanas.
- **Nombres `data_name` (`qd_*`)** — ya no son propios de SCR-011: se reusan los de SCR-004
  porque son las variables que realmente escribe el script de Momento 2/3 ante un fallo de la
  API (incluido el fallo al enviar la prórroga). Anexo03 no define variables para SP4-T05
  (tarea de Usuario), por lo que FLD-190..196 quedan mapeados a los FLD-050..058 de SCR-004.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-011-01/02).
- **`maxLength=2000`** en causa/corrección: límite estándar del proyecto, no especificado en el insumo.
- **MSG-011-02** (éxito) lo emite el BPM tras `completarTarea`; no se renderiza en la pantalla.
- **"Ver Log Completo"** no figura en el insumo de SCR-011, pero se agregó por paridad con
  SCR-004: el log lo emite el mismo script en `qd_strCompleteLogAPI` y sin el modal el analista
  técnico perdería el detalle (paso fallido, cURL, cuerpo crudo). Igual criterio para
  "Endpoint Invocado" y "¿Requiere ajuste en payload?".
- **Que RUL-011-01 no aplique a ACT-011-02** es lectura del insumo, no una decisión del port: el
  Anexo02 declara las dos acciones de cierre y la regla nombra solo la autorización. Escalar con S2
  vacío es el escenario para el que existe la segunda salida.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-190..196) | 7/7 (100%) | Implementados con las variables de SCR-004 (+3 campos de paridad: endpoint, log completo, ajuste de payload) |
| Secciones (SEC-037/038) | 2/2 (100%) | S1-S2 |
| Acciones (ACT-011-01/02) | 2/2 (100%) | Autorizar Reenvío, Escalar a Proveedor — **las dos aseveradas por mutación** (§12.5) |
| Reglas (RUL-011-01) | 1/1 (100%) | Causa + corrección obligatorias, **y** que la regla no alcanza a escalar |
| Mensajes (MSG-011-01/02) | 1/2 en UI | MSG-011-02 lo emite el BPM |
| Catálogos | N/A | La pantalla no usa catálogos |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, `maxLength=2000`, reuso de las
variables de SCR-004 y los 3 campos de paridad (endpoint, log completo, ajuste de payload).

---

## 12. El port a Angular 21 — qué cambió y qué destapó

Esta sección no tiene equivalente en el documento React. Las §12.1, §12.3 y §12.4 son las mismas
trampas que documentó SCR-004 y acá solo se referencian; **lo propio de esta pantalla es la §12.2**,
que es donde las dos salidas cambian la forma del `FormGroup`, y el hallazgo de la §12.6.

### 12.1 Mapeo react-hook-form → Reactive Forms

Idéntico al de SCR-004 (§12.1 de su documento): `useForm` → `FormGroup`, `Controller` →
`formControlName` sobre el wrapper CVA, `watch(...)` → `computed()` sobre una `signal` alimentada por
`form.valueChanges`, `reset({...})` → `precargar()` con `patchValue`, `handleSubmit` → guarda
explícita + `scrollToFirstError(this.form)`.

`precargar()` copia **solo las claves que el form declara**, por el mismo motivo que allá: un
`patchValue` con claves ajenas es un no-op silencioso, pero copiarlas haría que un campo agregado al
caso por otro nodo del BPM viajara de vuelta en el PUT sin que nadie lo pidiera.

### 12.2 Dos acciones de cierre ⇒ el `required` NO puede vivir en el control

**Es la diferencia estructural con la gemela, y sale de una regla del insumo, no del framework.**
SCR-004 tiene una sola salida (autorizar), así que allá `Validators.required` en los dos controles de
S2 es correcto: si faltan, no hay nada que hacer con la pantalla. Acá **ACT-011-02 (escalar al
proveedor) tiene que ser alcanzable con S2 vacío** — es literalmente la salida para cuando el analista
no logra diagnosticar la causa.

Si esos dos controles llevaran `Validators.required`, el `FormGroup` quedaría `INVALID` al montar y
cualquier guarda futura del estilo `if (this.form.invalid) return` bloquearía **las dos** salidas,
incluida la que el insumo dice que no debe validar. Así que:

- El `FormGroup` **no** declara `Validators.required` en `qd_strRootCause` ni en
  `qd_strCorrectionApplied`. Solo `Validators.maxLength(2000)`.
- La obligatoriedad de RUL-011-01 vive **enteramente** en `blnPuedeAutorizar()`, que es lo que
  gobierna el botón de autorizar y lo que corta dentro de `autorizar()`.
- El asterisco del rótulo se pinta con el input **`obligatorio`** de la fachada, que es visual y
  **no** compone ningún validador. Que ese input se llame así y no `required` no es cosmético: ver
  §12.6.
- El mensaje "Campo requerido" lo produce `mensajeDeError()` con su propio `trim()`, no
  `hasError('required')`.

**La consecuencia a no perder de vista:** el `maxLength(2000)` del control es el **único** validador
que aplica a las dos salidas, y por eso el spec tiene un caso dedicado a que siga viviendo ahí (no
solo en el contador del DS, que es pintura). Y hay un caso que asevera que el form queda **VÁLIDO**
con S2 vacío — se ve raro para un campo con asterisco, y justamente por eso está escrito: es el
invariante que hace alcanzable a ACT-011-02.

### 12.3 El bloqueo del payload vive en el control, y `getRawValue()` no es opcional

Mismo contrato que SCR-004 (§12.2 de su documento): `sincronizarEdicionPayload()` hace
`enable()`/`disable()` sobre el `FormControl` porque un `readonly` del `za-textarea` no se refleja bajo
jsdom, y **`form.value` omite los controles deshabilitados**, así que `enviar()` tiene que usar
`form.getRawValue()`.

**Acá el modo de falla es doble**, y es la única razón por la que vale repetirlo: SCR-011 tiene dos
exits y **las dos** pasan por el mismo `enviar()` privado. Un `value` en lugar de `getRawValue()`
pierde el payload al autorizar **y** al escalar, así que el spec tiene un caso por salida (mutación 5:
2 rojos, uno por exit).

### 12.4 `[disabled]` del DS es afordancia, no guarda

Igual que en SCR-004 (§12.3): un `lib-button-z` deshabilitado igual dispara su `(eventClick)` bajo
jsdom, así que RUL-011-01 está implementada dos veces — el `[disabled]` para que el analista vea que
no puede, y el `if (!this.blnPuedeAutorizar()) return` dentro de `autorizar()` para que efectivamente
no pueda.

El corolario propio de esta pantalla: **`escalar()` no lleva esa guarda, y eso es el requisito, no un
olvido.** Está anotado en el código porque la simetría con `autorizar()` invita a "arreglarlo".
La mutación 4 es exactamente esa: ponerle la guarda de autorizar a `escalar()` pone **3 casos** en
rojo con el mensaje `¿le pusieron la guarda de autorizar?`.

### 12.5 La revisión visual (2026-08-17) — dos textos que la suite verde no veía

La mitad manual del gate de Fase 5. Las 909 estaban en verde y los dos defectos eran de **texto**, así
que ningún test los podía traer: los dos casos que decían cubrir ese texto lo cubrían de más arriba.

| # | Qué estaba mal | Por qué el spec no lo vio | Mutación |
|---|---|---|---|
| 1 | La alerta de S1 decía `falló por un error técnico` **tras varios intentos**, frase que no está ni en el React de esta pantalla (`RevisionErrorTecnicoProrroga.tsx:102`) ni en el anexo (`screens/SCR-011.md`) | El caso *los títulos de sección y la alerta de S1…* aseveraba el **fragmento** `'solicitud de prórroga'` — pasa igual con cualquier frase intercalada. Ahora asevera la **oración completa** con los espacios normalizados | M4 → 1 rojo |
| 2 | El rótulo de FLD-192 decía `Mensaje **T**écnico de la API` | El caso *los rótulos… son textualmente los del Anexo02* **aseveraba la mayúscula**: el mismo test que existe para vigilar los rótulos congelaba la divergencia | M3 → 1 rojo, con el campo en el mensaje |

Sobre el 1: no es corrección de estilo. El conteo lo trae `qd_strAttemptNum` y **puede valer 1**, así
que la frase afirmaba algo que el caso a veces contradice — mientras el sufijo `— Intento acumulado #N`
dice el número real justo al lado.

Sobre el 2: la T mayúscula viene de **SCR-004**, que es la fuente del copy-paste y la escribe así en su
propio React (`RevisionErrorTecnicoApi.tsx:118`). O sea que la base de React es inconsistente entre las
dos pantallas del mismo campo (FLD-192 ≡ FLD-052) y el porte unificó eligiendo la forma que el anexo
**no** usa: `masters/03_Campos.md` y los dos `screens/` escriben `técnico` en minúscula en las cuatro
filas. Se corrigió SCR-011 (la pantalla bajo revisión) y **SCR-004 quedó con la mayúscula** — su React
ya decía así, y alinearla es una decisión de alcance que no corresponde a este gate. Queda como
divergencia conocida entre las dos pantallas hermanas.

**Lo que sí se investigó y NO era un defecto:** el `qd_strPayloadSent` se ve atenuado cuando FLD-058
está en "No", y React no atenúa ninguno de sus dos textarea de solo lectura. No se tocó, porque las
tres cosas se verificaron en el navegador: (i) acá el bloqueo es `control.disable()` deliberado y no un
`readonly` de vista (§12.3), (ii) React usa `readonly` en los dos y por eso no atenúa, y (iii) el
atenuado **lo pone el propio DS** — `z-textarea[disabled]` computa `opacity: 0.5` en el host, el mismo
mecanismo que el `z-select` de React. O sea que la señal visual es correcta y consistente con el DS;
lo que divergía era el mecanismo, que ya estaba documentado con su motivo.

Contratos adicionales del port, todos con falla silenciosa, documentados en el `.html`: los dos
atributos (`formControlName` **y** `name`) en cada campo; los slots de `lib-modal-z` con `id`
estático y el `@if` **dentro** del slot, nunca envolviéndolo; `[hide-close]="true"` como binding.
Y uno propio: **`cerrarLog()` tiene que bajar su propia bandera**, porque `ModalZ.change()` escribe su
propio input y el modal no volvería a abrir.

### 12.5 Mutaciones verificadas (gate 5 del plan)

Cada una sobre la **implementación**, no sobre el spec. Las 1–3 son de la guarda de `[required]` de la
fachada (que este port destapó, §12.6); las 4–8 son de las reglas de la pantalla; la 9 es de la
paridad congelada contra React.

| # | Línea mutada | Rojos | Mensaje |
|---|---|---|---|
| 1 | `[required]="obligatorio()"` repuesto en `za-radio-select` (`zds-radio.ts`) | 1 | `zds-radio filtró un validador al control de la pantalla: expected { required: true } to be null` |
| 2 | Ídem en `za-file-input` (`zds-file-input.ts`) | 1 | `zds-file-input filtró un validador…` |
| 3 | `[required]="true"` escrito en la plantilla del host de `zds-input` (lado pantalla) | 1 | `zds-input filtró un validador…` |
| 4 | `escalar()`: se le agrega la guarda de `blnPuedeAutorizar` + `blnIntentoEnvio` | **3** | `¿le pusieron la guarda de autorizar?` |
| 5 | `enviar()`: `getRawValue()` → `value` | **2** | `expected undefined to be '{"caseId":…'` — uno por exit |
| 6 | `blnPayloadJsonOk`: `!!genParseado` → `genParseado !== undefined` | 1 | `payload null: expected true to be false` |
| 7 | `blnPuedeAutorizar`: sin `.trim()` en el término de `strRootCause` | 1 | `qd_strRootCause con solo espacios habilitó autorizar` |
| 8 | Ídem en el término de `strCorrectionApplied` | 1 | `qd_strCorrectionApplied con solo espacios habilitó autorizar` |
| 9 | `[maxLength]="2000"` borrado del `zds-textarea` de `qd_strRootCause` (`.html`) | 1 | `qd_strRootCause: el contador del DS no coincide con el de React: expected '' to be '2000'` |

La 9 es la que prueba que sumar esta pantalla a `CLL_PORTADAS` de
[`paridad-react.spec.ts`](../../../../components/fields/paridad-react.spec.ts) **no fue una línea
decorativa**: el dataset congelado declara los dos `maxLength` de S2 en sus dos mitades (contador y
validador), así que los tres casos de paridad comparan de verdad. Su mensaje además corrige un
supuesto del propio spec: al borrar el binding el atributo `max-length` **sigue presente pero vacío**,
así que la guarda de `.not.toBeNull()` sola no lo habría visto — es la aserción del **valor** la que
atrapa el defecto.

**La mutación 7 salió VERDE la primera vez, y eso fue el hallazgo más útil de la fase.** El caso
`RUL-011-01 · un texto de solo espacios` ponía los **dos** campos de S2 en espacios de una sola vez.
Como `blnPuedeAutorizar` es una conjunción, el `.trim()` **superviviente** del otro término alcanzaba
para dar `false`, así que quitarle el `trim()` a `strRootCause` no cambiaba nada observable: un campo
tapaba la falta del otro. Y la aserción de `strErrorCausaRaiz()` tampoco lo atrapaba, porque
`mensajeDeError()` hace su propio `trim()` — es otro camino de código.

Es la **misma familia de vacuidad que mordió tres veces en la Fase 4** (un dato de entrada que vuelve
tautológica la aserción), solo que expresada por cortocircuito de `&&` en vez de por un array vacío.
Se cerró probando los dos campos **de a uno, con el otro lleno de verdad**, y recién ahí las
mutaciones 7 y 8 se ponen rojas de forma independiente, cada una nombrando su campo.

> **Regla que este caso confirma:** cuando la condición bajo prueba es una conjunción, un caso que
> falsea **todos** los términos a la vez no cubre ninguno. Cubre la conjunción entera, que es una
> aserción mucho más débil de la que el título del caso promete.

### 12.6 El port destapó un defecto de la fachada: el `[required]` filtrado

**Este es el hallazgo que SCR-011 encontró y que SCR-004 no podía encontrar**, y vale registrarlo acá
porque la causa es exactamente la §12.2.

`RequiredValidator` es un directivo estándar de Angular cuyo selector es
`:not([type=checkbox])[required][formControlName]` — más las variantes `[required][formControl]` y
`[required][ngModel]`. Mientras los wrappers de la fachada aceptaron un input público llamado
`required`, marcar un campo obligaba a la pantalla a escribir el atributo literal `required` **junto
a** `formControlName`, o sea ese mismo selector: Angular enganchaba su validador y le sumaba
`{required: true}` a un control que la pantalla nunca declaró obligatorio.

**En SCR-004 el defecto era invisible**, porque allá los dos controles de S2 sí llevan
`Validators.required`: el validador filtrado era redundante y no cambiaba nada observable. Acá no —
acá la pantalla necesita el asterisco **sin** el validador, y con la fuga el `FormGroup` nacía
`INVALID` y ACT-011-02 quedaba expuesta a cualquier guarda por `form.invalid`.

Se cerró **renombrando el input público a `obligatorio`** (decisión del usuario entre tres opciones):
el selector de Angular exige el atributo literal `required`, así que la colisión se vuelve imposible
por estructura y no por disciplina. La guarda es
[`zds-required.spec.ts`](../../../../components/fields/zds-required.spec.ts), que monta los 7 wrappers
con un control **pelado** y asevera que sigue sin validadores después de montar — se afirma el
**efecto**, no la forma del código, así que vale para cualquier forma futura de reintroducir el nombre.

**Y esa guarda encontró una segunda mitad que el renombre no cerraba:** los dos wrappers sobre
`CampoZaBase` (`zds-radio` y `zds-file-input`) escriben `[formControl]="control"` sobre el `za-*`
interno, y ese control es **el mismo objeto** de la pantalla (esa base lo presta, no lo copia). Como
el selector cubre `[required][formControl]`, el `[required]` interno —que se creía inocuo— filtraba
igual. Se cerró escribiendo `required` sobre la instancia del hijo (`viewChild` + `effect`) en vez de
bindearlo en la plantilla. Los cinco `lib-*-z` **sí** conservan su `[required]` interno: en ese
elemento no hay ningún control que contaminar. El detalle de por qué `[attr.required]` y clonar el
control no eran salidas está en el docstring de `ZdsRadio.objHijo`.

### 12.7 Cobertura de los 24 casos del spec

Un caso por RUL/ACT/FLD, no un smoke:

**Estructura y montaje** — (1) contrato estructural de campos de la fachada · (2) monta y precarga
desde `task.data` · (3) los rótulos son textualmente los del Anexo02 (FLD-190…196) · (4) los títulos
de sección y la alerta de S1 nombran la prórroga · (5) los dos textarea llevan el contador de 2000
del DS.

**El invariante de la §12.2** — (6) no pinta S2 en rojo al montar · (7) **el form queda VÁLIDO con S2
vacío** (para que escalar sea alcanzable) y aun así el mensaje aparece · (8) el `maxLength(2000)` SÍ
vive en el control.

**RUL-011-01** — (9) no autoriza sin ninguno de los dos + MSG-011-01 · (10) tampoco con solo uno ·
(11) un texto de solo espacios no satisface la regla, **probando los dos campos de a uno** (§12.5).

**FLD-058 y el payload** — (12) arranca deshabilitado y se habilita al marcar el ajuste, en ambas
direcciones · (13) JSON que no parsea bloquea · (14) JSON válido que no es objeto bloquea, recorriendo
`null` / array / escalar · (15) sin ajuste marcado no valida el JSON.

**ACT-011-01** — (16) autoriza con el payload y la acción correctos · (17) el payload deshabilitado SÍ
viaja (`getRawValue`) · (18) con ajuste marcado viaja el payload **editado**.

**ACT-011-02, las cuatro caras de "la regla no la alcanza"** — (19) escala con S2 **vacío** ·
(20) escalar **no** pinta S2 en rojo (no levanta el intento de envío) · (21) el payload deshabilitado
también viaja al escalar · (22) el botón está disponible aunque la regla no se cumpla.

**Resto** — (23) abre y cierra el modal del log · (24) el error de carga reemplaza el formulario.

**Ausencia deliberada, y es en sí misma una aserción:** el spec **no** tiene `drenarPeticiones()`.
SCR-011 no consume colecciones, así que la única petición del montaje es el GET de la tarea, y el
`objMock.verify()` del `afterEach` es lo que mantiene eso verdadero — agregar un provider de
`CollectionService` dejaría un GET pendiente y **todos** los casos en rojo.

---

**Registro de la pantalla (dos archivos, los dos obligatorios):** entrada en `DIC_PANTALLAS`
(`app/pantallas.ts`) **y** slug en `CLL_SLUGS_CON_SPEC` (`app/pantallas.spec.ts`). Si falta el segundo,
la guarda de inventario pone la suite roja nombrando el slug.
