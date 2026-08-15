# Documentación Funcional — Revisión Respuesta SAC

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-008** / PAN-08 — Revisión Respuesta SAC |
| Tipo | Pantalla de revisión y aprobación |
| Tarea BPMN | **SP2-T04** — Revisar respuesta borrador (SAC) |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Analista SAC (VER+APROBAR) · Área Responsable (VER) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | El área envía el borrador para revisión |
| Acción de cierre | Aprobar → SP2-T06 (PDF) · Devolver → SP2-T05 (PAN-07) |
| Slug / `?screen=` | `COL_QD_SCR-008_Revision_Respuesta_SAC` |
| Archivos de implementación | `revision-respuesta-sac.ts` + `.html` + `.spec.ts` (config centralizada en `../fields/fields.ts`) |
| Versión | **2.0 — 2026-08-14 · port a Angular 21** (1.0 — 2026-06-30, React) |

> **Nota de nomenclatura:** el SLUG solicitado (`COL_QD_Revisión_Respuesta_SAC`, con tilde) se
> normalizó a `COL_QD_SCR-008_Revision_Respuesta_SAC` (ASCII, con código SCR) por la convención de
> las pantallas QD hermanas y porque `?screen=` no admite acentos. Ver §10.

> **Nota de port (Fase 5, ago-2026).** Es la **primera** pantalla portada de React a Angular 21, y
> el slug es contrato con PM4 (viaja en la URL del iframe): **no cambia**. Tampoco cambian los
> `data_name` `qd_*`. Lo que cambia es el stack —`useForm`→`FormGroup`, `useTask()`→`TaskService`,
> `Controller`→wrappers CVA— y eso **no altera ninguna regla de negocio de este documento**. Las dos
> divergencias respecto del anexo que el port arrastra, ambas heredadas de la implementación React y
> **no introducidas acá**, están en §10.

---

## 2. Resumen

Pantalla del Analista SAC para revisar el borrador de respuesta elaborado por el Área Responsable.
Muestra el contexto del caso y la clasificación regulatoria en solo lectura, la respuesta del área
(editable — ver §10), la lista de soportes internos y los adjuntos del radicador, y permite
**Aprobar** la respuesta (→ SP2-T06, genera el PDF) o **Devolver con observaciones** (→ SP2-T05 /
PAN-07, "Ajuste en progreso"), además de reasignar el caso o ver la vista previa de la carta final.
Las observaciones son obligatorias solo para devolver.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-008.md` | Campos (FLD-120..131), acciones (ACT-008-*), reglas (RUL-008-*), mensajes (MSG-008-*), permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-025/026/027 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-008-01..04 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T04 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T04 es tarea de Usuario → sin variables canónicas |

> Sin catálogos (07_Catalogs) para campos de entrada: la pantalla no tiene listas desplegables. Sí
> consume la colección **46 (Mails BPM)** para la plantilla de la carta de la vista previa, igual que
> SCR-0051.

---

## 4. Campos Implementados

### S1 — Contexto del Caso (SEC-025, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| ID Caso / Código SFC | `qd_strSfcCode` | `zds-input` `[readOnly]="true"` | FLD-120 |
| SLA: Días hábiles restantes | `qd_strSlaAssigned` | `zds-input` `[readOnly]="true"` | FLD-121 |
| Versión bajo revisión | `qd_strRevisionVersion` | Texto plano (label + valor, sin input) | FLD-122 |
| Área Responsable | `qd_strResponsableRole` | `zds-input` `[readOnly]="true"` | FLD-123 |
| Fecha de elaboración del borrador | `qd_strDraftDate` | `zds-input` `[readOnly]="true"` | FLD-124 |

> **Origen de los campos de contexto (2026-08-10, solicitud del usuario).** Estos tres campos
> llegaban vacíos porque leían variables que nadie escribe en el flujo:
> - **Área Responsable** ahora lee `qd_strResponsableRole` (rol responsable derivado de
>   `cat_matriz_motivos.rolResponsable` en M1), no `qd_strAssigneeArea` (grupo PM4 de asignación,
>   que solo existe si hubo asignación/reasignación explícita). `qd_strAssigneeArea` sigue viajando
>   en el payload.
> - **Fecha de elaboración del borrador** la **sella SCR-0051** al presionar *Enviar*
>   (`qd_strDraftDate` = `YYYY-MM-DD HH:mm` local del envío). *Guardar Borrador* no la sella.
>   **Respaldo:** si el caso no trae `qd_strDraftDate` (casos ya en curso, o un reenvío desde un
>   flujo que no la escribe), la pantalla usa el `created_at` de **su propia tarea** de revisión —
>   el BPM la crea en el mismo instante en que el área envía el borrador. Ambos valores se
>   persisten en el caso al aprobar/devolver.
> - **Versión bajo revisión** (`qd_strRevisionVersion`) la **incrementa SCR-0051** en cada
>   *Enviar*: `v1` en el primer envío, `v2` tras la primera devolución con observaciones del SAC,
>   y así sucesivamente. Se renderiza como texto plano (sin input). **Respaldo:** si el caso no
>   trae contador, muestra `v1` — lo que el SAC tiene enfrente es la primera versión del borrador.
>
> **En Angular las tres cadenas de respaldo viven en `precargar()`**, no en un `reset()` disperso, y
> cada una tiene su caso en el spec (`PRE-008-01..03`): son las tres cosas que, si se rompen, dejan
> la pantalla abriendo con campos vacíos sin que nada falle.

### Clasificación Regulatoria (solo lectura, heredada de M1)

Bloque de referencia que también muestra SCR-0051; acá **siempre** de solo lectura, porque el SAC la
consulta para revisar la respuesta, no la reclasifica. Los 7 campos se pintan como texto plano y usan
la convención `_desc` del proyecto (guardan el código, viajan con su compañera legible):

`qd_strSfcProduct` · `qd_strInteraction` · `qd_strSfcReason` · `qd_strChannel` ·
`qd_strReceptionInstance` · `qd_strAdmission` · `qd_strControlEntity`

> Los `_desc` **no son controles del `FormGroup`**: no se editan y declararlos duplicaría 7 campos.
> `descDe()` los lee de `task.data` directo, prefiere la descripción, cae al código y por último al
> guion — mostrar un código crudo es feo, pero mostrar vacío esconde que el dato existe.

### Descripción de la Queja (solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Asunto de la Queja | `qd_strSfcReason` (`_desc`) | Texto plano | — |
| Descripción / Texto de la Queja | `qd_strComplaintText` | `zds-textarea` `[readOnly]="true"` | — |
| Documentos adjuntos del radicador | `qd_strAttach01..05` | `app-request-file-list` | — |

### S2 — Respuesta del Área (SEC-026)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Respuesta al Cliente | `qd_strClientResponse` | `zds-textarea` **editable** (⚠ §10) | FLD-127 |
| Acciones Tomadas | `qd_strActionsTaken` | `zds-textarea` **editable** (⚠ §10) | FLD-128 |
| ¿Reconocimiento al cliente? | `qd_strCompensation` | `zds-input` `[readOnly]="true"` | FLD-129 |
| Soportes internos adjuntos | `qd_strSupport01..10` | `app-request-file-list` (previsualizar + descargar) (⚠ §10) | FLD-130 |

### S3 — Decisión del Analista SAC (SEC-027)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Observaciones SAC | `qd_strSacRemarks` | `zds-textarea` | Condicional (al devolver) | FLD-131 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`APROBAR` \| `DEVOLVER` \| `REASIGNAR`) | Inferido de ACT-008-01/02/03 (§10) |
| Decisión booleana del SAC | `qd_blnSACApproved` | Ver el contrato en §7 |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Observaciones obligatorias al devolver | `blnPuedeDevolver` (`computed`) deshabilita "Devolver"; **y** el handler corta con `setErrors({required})` + `markAsTouched()` + `scrollToFirstError(form)` | RUL-008-01 · MSG-008-01 · FLD-131 |
| Aprobar sin observaciones | "Aprobar Respuesta" no exige observaciones | ACT-008-01 (Cond. "Siempre") |
| Límite de longitud (efectivo) | `Validators.maxLength(5000)` en respuesta/acciones, `2000` en observaciones | §10 (inferido) |
| Límite de longitud (contador visual) | `[maxLength]` de `zds-textarea` en los 3 editables → el DS pinta `9/5000`, `12/5000`, `0/2000` | Paridad con React |

> **⚠ El `maxLength` de React se parte en DOS acá, y hacen falta los dos.** En React un solo
> `<ZdsTextarea maxLength={5000} />` hacía las dos cosas; en Angular son contratos distintos con
> puntos de falla distintos:
>
> 1. **El límite efectivo** es el `Validators.maxLength(n)` del control, y es el único que invalida.
>    Vive en el control porque `lib-textarea-z` **no llama `generateControl()`**, así que no compone
>    validadores propios: lo que se le pase al componente es puramente visual.
> 2. **El contador visual** (`9/5000`) es el `[maxLength]` de `zds-textarea` en la plantilla.
>
> **Esta ficha decía antes que la fachada no exponía `maxLength` y que pasarlo sería un falso verde.**
> Era cierto cuando se escribió —el `[attr.max-length]` de `lib-textarea-z` muere antes del
> `z-textarea`— y dejó de serlo cuando `zds-textarea` lo neutralizó reponiendo el atributo con un
> `afterRenderEffect`. Mientras el texto quedó viejo, la pantalla se portó **sin** los tres
> `[maxLength]` y ningún contador se pintaba. Medido lado a lado con la task 171840: React mostraba
> `9/5000`, `12/5000` y `0/2000`; Angular ninguno. Aseverar solo el validador **no** habría detectado
> eso; la guarda que lo cubre asevera el `max-length` sobre el `z-textarea` real.
>
> `qd_strComplaintText` **no** lleva contador, igual que en React: es de solo lectura.

> **`qd_strSacRemarks` no lleva `Validators.required`.** La obligatoriedad es **condicional a la
> acción**, no del campo: un `required` fijo dejaría el form inválido al montar y bloquearía
> *Aprobar*, que por ACT-008-01 no pide observaciones. Se aplica en el handler de devolver, igual
> que el `setError` de React.

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-008-01 Observaciones vacías | Devolver con observaciones vacías | `za-alert config="info"` en S3 + botón "Devolver" disabled | 06_Mensajes > MSG-008-01 |
| MSG-008-02 SLA crítico | `qd_strSlaAssigned <= 3` | `za-alert config="negative"` superior | 06_Mensajes > MSG-008-02 |
| MSG-008-03 Respuesta aprobada | Tras aprobar | **No en UI** — lo emite el BPM tras `completarTarea` | 06_Mensajes > MSG-008-03 |
| MSG-008-04 Respuesta devuelta | Tras devolver | **No en UI** — lo emite el BPM | 06_Mensajes > MSG-008-04 |

> Las alertas de esta pantalla son **`za-alert` inline**, no la cola imperativa `AlertZService` de
> `lib-alert-z`: en React eran `<ZrAlert>` dentro del markup, o sea cajas que viven donde está el
> contenido que describen. Mandarlas por el servicio las movería al contenedor global y habría que
> llamar `.remove()` a mano. Ver el punto 5b de `components/fields/zds-reexports.ts`.

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-008-01 (🔴 BLOQUEA) — no devolver sin observaciones | `[disabled]` del botón **+** guarda en `devolver()` + alerta MSG-008-01 | SCR-008 > RUL-008-01 |
| RUL-008-02 (info) — banner SLA si `qd_strSlaAssigned <= 3` | `blnSlaCritico` controla el banner rojo | SCR-008 > RUL-008-02 |

> **⚠ RUL-008-01 se aplica en DOS lugares y ninguno es redundante.** El `[disabled]` del botón es
> **afordancia**; la guarda real vive en el handler. Un botón deshabilitado del DS **igual dispara su
> handler** (trampa 1 de `docs/guides/testing-conventions.md`), y eso está **verificado en runtime**
> acá, no citado: al quitar la guarda del handler dejando solo el `[disabled]`, la pantalla
> **completó la tarea** y el spec se puso rojo con `expected {…} to be null`. Sin el corte en
> `devolver()` el área recibiría el caso de vuelta sin saber qué corregir.

> **⚠ El contrato de `qd_blnSACApproved`, que es lo más fácil de romper sin que se note.** Es la
> decisión booleana del SAC y **solo dos de las tres acciones la escriben**: `APROBAR` ⇒ `true`,
> `DEVOLVER` ⇒ `false`, y **`REASIGNAR` no la toca** (viaja el valor que ya venía en el caso).
> Reasignar no es una decisión sobre la respuesta, así que sobrescribirla con `false` marcaría el
> borrador como rechazado por el solo hecho de haber cambiado de responsable. El spec lo asevera con
> un caso que **entra con `true`**, porque aseverar `false` contra el default `false` pasaría igual
> si alguien agregara la rama prohibida.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Contexto y clasificación solo lectura | `zds-input`/`zds-textarea` con `[readOnly]="true"` y texto plano | SEC-025 |
| Adjuntos del radicador y soportes internos | `app-request-file-list` (filtra por `data_name`), con previsualizar + descargar | FLD-130 (⚠ §10) |
| Devolver como acción destructiva | `lib-button-z [type]="'negative'"` | ACT-008-02 (tipo Destructiva) |
| Reasignar caso | `completarTarea` con `qd_strAction='REASIGNAR'` | ACT-008-03 |
| Vista Previa Respuesta Final | `app-preview-modal` con la carta armada como blob HTML | ACT-008-04 |
| Estados loading/error/submitting | `lib-loader-z`, `za-alert`, botones `[loading]`/`[disabled]` | CLAUDE.md |
| El error de *requerido* no se pinta al abrir | `blnIntentoEnvio` (equivalente del `isSubmitted` de RHF) | RUL-008-01 |

> **Tres diferencias de contrato con el `ZrButton` de React, verificadas en el `.mjs` y no asumidas:**
> el texto va por el input `label` (no como contenido proyectado), la variante se llama **`type`** (no
> `config`, que es el input del `za-button`), y el evento es `(eventClick)`. Y el `[disabled]="false"`
> explícito es **obligatorio**: el default de `lib-button-z` es `disabled = true`, así que omitirlo
> deja el botón muerto.

> **El blob de la vista previa se revoca al cerrar.** No es higiene opcional: sin el
> `URL.revokeObjectURL` cada apertura deja el HTML de la carta retenido hasta recargar el iframe, y
> esta pantalla vive dentro de PM4 donde nadie recarga. Es el port del `return () => …` del
> `useEffect` de React, que en Angular es la función de limpieza del `effect`.

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strSacRemarks` | Botón "Devolver con Observaciones" | Habilita el devolver solo si hay observaciones | RUL-008-01 |
| `qd_strSlaAssigned` | Banner SLA | Muestra banner rojo si ≤ 3 | RUL-008-02 |
| `qd_strFavorability` | Plantilla de la carta (colección 46) | `'1'` = a favor del Cliente ⇒ fila **09** ("queja procede"); cualquier otro ⇒ fila **10** | ACT-008-04 |
| `qd_strCompanyName` | Destinatario de la carta | La razón social gana sobre nombre + apellido | ACT-008-04 |

> **El puente `valueChanges` → signal es lo que hace vivir a esta tabla.** `valueChanges` es un
> `Observable` y **no notifica a los `computed` de Angular**, así que sin el `sigValores` intermedio
> `blnPuedeDevolver` nunca se recalcularía al tipear y el botón *Devolver* quedaría deshabilitado
> para siempre. Se siembra con `getRawValue()` (no con `{}`) para que el estado inicial ya sea
> coherente, y se desuscribe en `ngOnDestroy`.

---

## 10. Suposiciones Realizadas

### Divergencias del port respecto del anexo (heredadas de React, **no** introducidas acá)

Las dos siguientes son casos de la regla *Fuera de alcance* del plan de migración: **"Si aparece un
bug de la app React, se reporta y se decide aparte — no se arregla de contrabando"**. El port sigue
la **implementación**, no el anexo, y la divergencia queda registrada acá para que se decida como
cambio funcional propio si corresponde.

1. **⚠ S2 editable — el anexo la pide de solo lectura.** El título de SEC-026 en `screens/SCR-008.md`
   es *"Respuesta del Área (solo lectura)"* y §4 de la v1.0 de este documento listaba
   `qd_strClientResponse` y `qd_strActionsTaken` como `readOnly`. **La implementación React las deja
   editables**, y el port las mantiene así: en la práctica el SAC corrige el texto del área antes de
   aprobar, y quitarles la edición sería un cambio de comportamiento, no una corrección de port.
   `qd_strCompensation` sí quedó `readOnly` en ambas, coherente con el anexo.
2. **⚠ FLD-130 — chips vs. lista con descarga.** El anexo pide *"lista de adjuntos, solo
   visualización"*, y la v1.0 lo implementó como lista de `.file-name-chip` **sin** descarga ni
   preview. La implementación real usa `RequestFileList`, que **sí** ofrece previsualizar y
   descargar. El port mantiene `app-request-file-list`: es más capaz que lo especificado, no menos,
   y es el componente que las pantallas hermanas ya usan para lo mismo.

### Resto de las suposiciones (sin cambios respecto de la v1.0)

- **Slug normalizado** (ver §1).
- **Nombres `data_name` (`qd_*`)** provisionales — Anexo03 no tiene variables para SP2-T04 (tarea
  de Usuario). Se actualizarán con el diccionario final. **Son contrato con PM4: el port no renombra
  ninguno** (regla 1 de `pm4-app/CLAUDE.md`).
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-008-01/02/03) para
  informar la decisión al BPM.
- **`maxLength`**: `2000` en observaciones y `5000` en respuesta/acciones — límites estándar del
  proyecto, no especificados en el insumo.
- **Reasignar (ACT-008-03)** abre PAN-06 en el mockup; aquí se implementó como `completarTarea` con
  `qd_strAction='REASIGNAR'` (el enrutamiento a PAN-06/SP2-T03 lo resuelve el BPM). Si debe abrir un
  modal in-situ, se ajustará.
- **Vista Previa (ACT-008-04)**: ya no es el modal placeholder de la v1.0 — arma la carta real
  (plantilla de la colección 46, con respaldo a la plantilla local `buildRespuestaFinalHtml`) y la
  sirve como blob HTML en `app-preview-modal`, igual que SCR-0051.
- **MSG-008-03/04** los emite el BPM tras `completarTarea`; no se renderizan en la pantalla.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-120..131) | 10/10 (100%) | Todos implementados |
| Secciones (SEC-025/026/027) | 3/3 (100%) | S1-S3, más Clasificación Regulatoria y Descripción de la Queja (bloques de referencia) |
| Acciones (ACT-008-01..04) | 4/4 (100%) | Aprobar, Devolver, Reasignar, Vista Previa |
| Reglas (RUL-008-01/02) | 2/2 (100%) | Observaciones obligatorias + banner SLA |
| Mensajes (MSG-008-01..04) | 2/4 en UI | MSG-008-03/04 los emite el BPM |
| Catálogos | N/A para entrada | La pantalla no tiene selects; consume la colección 46 solo para la carta |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, los `maxLength`,
"Reasignar" resuelto por BPM.

---

## 12. Cobertura de Tests (port Angular)

`revision-respuesta-sac.spec.ts` — **10 casos, uno por regla/acción, no un smoke genérico**, según el
gate 5 del plan de migración. La mutación de cada uno está verificada: se rompió la línea de
implementación y se confirmó el rojo antes de revertir.

| Mutación aplicada | Test que se puso rojo | Aserción que falló |
|---|---|---|
| Se **agregó** la rama prohibida `REASIGNAR ⇒ false` | `ACT-008-03 · "Reasignar" PRESERVA el qd_blnSACApproved` | `to match object { qd_strAction: 'REASIGNAR', …(1) }` |
| Se borró la guarda `if (!blnPuedeDevolver())` del handler | `RUL-008-01 · "Devolver" sin observaciones NO completa la tarea` | `expected {…} to be null` |
| Se borró solo el `markAsTouched()` | **el mismo caso**, otra aserción | `expected false to be true` |
| `intSla <= UMBRAL` → `>=` | **los dos** casos de `RUL-008-02` | `false to be true` **y** `true to be false` |
| Se borró el bloque `@if (blnSlaCritico())` del `.html` | `RUL-008-02 · SLA crítico muestra el banner` | `to contain 'Priorice la'` |
| Se borró la rama `APROBAR ⇒ true` | `ACT-008-01 · "Aprobar" completa con APROBAR y …=true` | `to match object { qd_strAction: 'APROBAR', …(1) }` |

### 12.1 Los tres casos puente del registro, y sus dos mutaciones

Registrar esta pantalla en `DIC_PANTALLAS` puso **rojos tres casos de la Fase 4** que aseveraban que
el registro estaba vacío, en `indice-pantallas.spec.ts`, `pantalla-no-encontrada.spec.ts` y
`app.routes.spec.ts`. Los tres estaban **escritos para eso** (sus comentarios lo anunciaban), así que
funcionaron como se diseñaron. Cada uno se **reemplazó por su contrario** en vez de borrarse: los
demás casos de esos archivos inyectan sus propios slugs, así que sin el reemplazo re-vaciar el
registro no pondría nada rojo en ninguno de los tres.

El tercero (`app.routes.spec.ts`) asevera algo que los otros dos no pueden: que la pantalla
registrada **tiene ruta con componente resuelto**. Estar en el registro y cargar de verdad son cosas
distintas — es el defecto #3 del gate 2, ahora sobre una pantalla de negocio.

| Mutación aplicada | Resultado |
|---|---|
| `loadComponent` de la SCR-008 → `.then((m) => (m as never)['NoExiste'])` (compila; en runtime es `undefined`) | ✅ **1 rojo**, `app.routes.spec.ts:220`, `expected undefined to be defined`. Los otros **13 casos del archivo quedaron verdes** — sin este puente, un `loadComponent` roto en una pantalla de negocio pasa inadvertido |
| `DIC_PANTALLAS` vaciado a `{}` (el escenario del merge mal resuelto) | ✅ **3 rojos, uno por archivo**, los tres con `expected 0 to be greater than 0`; los otros 23 casos verdes |

La segunda mutación es la que justifica el reemplazo: prueba que los tres puentes cubren direcciones
distintas del mismo hecho y que ninguno quedó de adorno.

> Los puentes aseveran `length > 0`, **nunca un conteo exacto**: un número fijo enrojecería estos tres
> archivos con cada pantalla nueva de la Fase 5 sin que nada esté mal. El inventario exacto lo vigila
> `pantallas.spec.ts` vía `CLL_SLUGS_CON_SPEC`, que es su lugar.

Tres cosas que la tabla de arriba enseña y conviene no re-descubrir:

- **Un caso puede aseverar varias cosas independientes.** Quitar la guarda y quitar solo el
  `markAsTouched()` enrojecen el *mismo* caso con aserciones *distintas*.
- **Un par de casos complementarios tiene que enrojecer en direcciones opuestas.** Invertir el
  comparador del SLA rompió los dos casos de RUL-008-02; con uno solo, un `computed` constante los
  satisfaría.
- **Una aserción de clase no atrapa un bloque de template borrado.** Al eliminar el `@if` del
  `.html` el `computed` seguía valiendo `true`; solo falló la aserción sobre el DOM. Es lo que
  justifica la única aserción de DOM deliberada del archivo.

> **Falta el gate manual.** Los specs no cubren el pintado real (jsdom no ejecuta los custom
> elements de Lit): quedan pendientes la **paridad visual React vs Angular** con el mismo `?screen=`
> y `task_id`, y la verificación del flujo real (precarga desde PM4, adjuntos, submit que completa la
> tarea). Corre sobre el servidor del host (`npm run dev --workspace=frontend-ng`, puerto **4200**);
> adaptar Docker es el paso 1 de la Fase 7.
