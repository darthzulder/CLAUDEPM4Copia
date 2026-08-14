# Gate 2 · verificación manual de la fachada

Checklist de lo que hay que mirar en `?screen=gate-fachada`. Vive acá y no en el plan de migración a
propósito: el plan se archiva en `docs/archive/` al cerrar la Fase 7 y esta pantalla **sobrevive** —
sigue siendo el banco de pruebas cuando se actualice `lib-zurich`.

```bash
cd pm4-app && npm run dev --workspace=frontend-ng
```
→ `http://localhost:4200/?screen=gate-fachada`

> **Docker todavía NO sirve esta pantalla, y no es un olvido.** El `docker-compose.yml` y el
> `pm4-app/Dockerfile` de la raíz siguen siendo los de la era React: mapean **5173** (Vite) y 3001,
> montan `frontend/node_modules` y `backend/node_modules`, y no conocen `frontend-ng` ni el puerto
> **4200**. Además su `npm ci` fallaría para este workspace, porque los `@zurich/*` salen del feed de
> Azure y el `.npmrc` con el PAT no está cableado en el build de la imagen.
>
> Adaptarlos es el **paso 1 de la Fase 7** ("apuntar el despliegue a `frontend-ng`"), junto con
> `render.yaml` — se hace ahí, con el PAT resuelto sin filtrarlo a una capa de imagen. Hasta entonces
> la pasada manual va por el servidor del host, que es lo que este checklist asume.

## Por qué existe este checklist

Los 124 specs de la fachada corren bajo **jsdom, que no hace upgrade de los custom elements de Lit**.
Los `lib-*-z`/`za-*` quedan como elementos inertes con sus atributos puestos, así que **ningún spec
asevera pintado**. Hay una clase entera de fallas que la suite no puede ver, y es la que este
checklist cubre:

- un `[model]` que llega bien al componente pero no se refleja en el `<input>` del shadow root;
- un `help-text`/`label` que el DS recibe y decide ignorar;
- un campo que monta invisible o descolocado por CSS del DS faltante;
- un estado de error que el wrapper calcula bien y el DS pinta al revés (o no pinta).

Los specs cubren el contrato del CVA y el estado del `FormControl`. Estos pasos cubren el resto.

## 1 · Render (lo mínimo, y lo que jsdom no puede ver)

- [ ] Los **8 campos** montan y se ven: nombre, correo, canal, departamento, detalle, fecha, tipo de
      persona (radios), autorización (checkbox), soporte (adjunto).
- [ ] Tienen **estilos del DS**, no texto pelado: tipografía Zurich, bordes, espaciado. Si se ven como
      HTML sin estilo, el problema es `zds-setup.ts` / el chunk de CSS, no los wrappers.
- [ ] El **asterisco de obligatorio** aparece en los 5 campos con `[required]="true"`.
- [ ] El `helpText` se ve **debajo** del campo en los que lo declaran.
- [ ] La **fecha no** muestra help-text (su input no existe en la lib — es lo esperado, no un bug).
- [ ] Los radios salen **en línea** (`[inline]="true"`).
- [ ] Las dos píldoras de estado se ven con color: verde/rojo el `FormGroup`, azul/gris el `touched`.

## 2 · El CVA en las dos direcciones (el corazón de la fachada)

- [ ] **Precargar (simula PM4)** → los 8 campos se llenan. Es el `patchValue` que reemplaza al
      `reset(task.data)` de React: `writeValue` → `[model]` → el DS pinta.
- [ ] Escribir a mano en **Nombre** y en **Detalle** → **Volcar el valor del form** refleja lo tipeado.
      Es la vuelta: `(modelChange)` → `onChange` → `FormControl`.
- [ ] Elegir un **Canal** y un **Departamento** → el volcado trae el `value` (`'13'`, `'11'`), **no**
      la etiqueta visible. Si trajera "Internet", la traducción `{value, description}` está mal.
- [ ] Elegir un **Tipo de persona** → volcado `'N'` / `'J'`.
- [ ] Elegir una **fecha** en el datepicker → volcado con el formato que muestra el campo.
- [ ] **Limpiar** → los 8 campos quedan vacíos en pantalla (el `reset()` viaja por `writeValue`).

## 3 · Estado de error — es donde vivían los gotchas medidos

- [ ] Con el form recién montado y **sin tocar nada**, ningún campo está pintado en rojo.
      **Este es el paso que prueba `manualValidation`**: sin él, `ngOnChanges` de la lib hace
      `if (!manualValidation && group.status == 'INVALID') this.valid = true` y —como en esos
      componentes `valid` **significa** `invalid`— los campos correctos se pintan en rojo porque otro
      campo del form es inválido. Con ~20 obligatorios (SCR-000) sería el form entero en rojo al
      montar.
- [ ] **Marcar todo tocado** → los 5 obligatorios vacíos se pintan en rojo, y **Departamento**
      (sin `required`) **NO**. Si Departamento también se pinta, el contagio del group volvió.
- [ ] Escribir en un campo en rojo → el rojo se va.
- [ ] **Alternar error de servidor** → Correo se pinta en rojo con el mensaje del servidor, incluso
      con un correo válido escrito. El `[error]` explícito manda sobre `invalid && touched`, y
      **desplaza al `helpText`** (no se apilan los dos textos).
- [ ] Correo con formato inválido (`abc`) + tocado → rojo por `Validators.email`.
- [ ] Detalle con menos de 10 caracteres + tocado → rojo por `minLength`.

## 4 · Checkbox — el que tiene el validador invertido

- [ ] Arranca **destildado** y el volcado dice `qd_strAutoriza: "NO"`.
      Ojo: `'NO'` es **truthy** en JS. Si arrancara tildado, el `blnTildado` dejó de comparar contra
      `checkedValue` y volvió a un `!!valor`.
- [ ] Tildarlo → volcado `"SI"`. Destildarlo → `"NO"`. El control guarda el **texto** de PM4 mientras
      el `za-checkbox` recibe el booleano que necesita.
- [ ] **Con el checkbox destildado y todo lo demás lleno, el `FormGroup` está inválido**
      (píldora roja). Con él tildado, válido. Eso lo declara `requerirTildado('SI')`, un validador
      propio: `Validators.requiredTrue` compara con `=== true` y sobre un control que guarda texto
      **nunca** se satisface, así que el form no podría enviarse nunca. Lo cazó un spec, no el
      navegador — pero si esta casilla falla, ese es el primer lugar donde mirar.
- [ ] **El checkbox NO se pinta en rojo por estar tildado.** Es el gotcha que no se puede neutralizar:
      el `validRequired()` de `lib-checkbox-z` es `return this.required && this.model` (sin negación),
      así que marcaría `errorRequired` justo cuando el usuario **sí** autorizó. Lo que impide que eso
      llegue al form es el **FormGroup satélite** del wrapper.
- [ ] Tras tildar y destildar, el volcado **no** muestra `qd_strAutoriza: false`. Si mostrara un
      booleano, el group satélite se perdió y el `updateControl()` de la lib está pisando el control
      real (medido: `'NO'` → `false` solo por montar).

## 5 · Adjunto

- [ ] Subir un **PDF** → el nombre del archivo queda en el campo y el volcado trae **el nombre**
      (`"cedula.pdf"`), no un objeto.
- [ ] Subir un **`.exe`** o un archivo > 5 MB → mensaje de rechazo y el campo queda **vacío**.
- [ ] Subir el **mismo PDF con otro nombre** → rechazo por duplicado ("ya fue adjuntado"). La
      detección es por **hash del contenido**, que es lo que Smart Supervision rechaza al guardar.
- [ ] Tras un rechazo, el campo se puede volver a usar (el `reset()` del elemento lo dejó limpio).

## 6 · Re-exports con gotcha medido

- [ ] **Todos los botones responden al click.** Los 6 pasan `[disabled]="false"` explícito porque
      `ButtonZ.disabled` **arranca en `true`**: un `<lib-button-z label="X" />` monta inerte.
      Si algún botón no responde, falta ese binding.
- [ ] **Alternar loading** → el select de Canal muestra "Cargando opciones..." como help-text, y
      **sigue siendo usable**. No se deshabilita: `disable` es un input muerto en la lib, y el wrapper
      no promete lo que no puede cumplir.
- [ ] El **loader** que aparece al lado de las píldoras es **verde y de ~50 px**, y no hay forma de
      cambiarlo: la plantilla del DS pone un `custom-str` estático que gana sobre el bindeado (Lit lee
      el atributo, no la propiedad). Medido: `customStr` es un input muerto.

## 7 · Consola del navegador

- [ ] **Ningún error.** Warnings esperados y ajenos (no son nuestros):
      `NG0912` por colisión de component-ID entre `ZaCalendar` y `ZaRangeCalendar` (los dos declaran
      `selector: 'za-calendar'`), `Locale "en-US" not found`, y warnings de dev-mode de Lit.
- [ ] Sin `NG01203` (falta de value accessor), sin `NG0200` (dependencia circular), sin `NG8008`
      (input requerido sin especificar).

## Qué hacer si algo falla

El wrapper que falle tiene su gotcha documentado en la cabecera de su propio archivo y en
[`../../components/fields/README.md`](../../components/fields/README.md), con la evidencia medida
sobre el bundle. Antes de "arreglar" un comportamiento raro del DS, leer ahí: varias de esas rarezas
son **deliberadas y están aseveradas por un spec**, así que revertirlas pone la suite en rojo — que es
justamente lo que se quería.
