# Historial de los scripts PHP de PM4

## El problema

Los scripts de ProcessMaker 4 se editan en la UI de PM4 o por API. **La API no expone historial de
versiones**: cada escritura pisa la anterior sin dejar rastro. No hay forma de saber qué código
corría ayer, ni de volver a una versión que funcionaba.

Eso importa más de lo que parece: los scripts del proceso 31 radican quejas ante la
Superintendencia Financiera de Colombia. Un cambio que rompe una radicación y no se puede revertir
es un problema legal, no solo técnico.

## El modelo: git no gobierna a PM4, lo registra

**PM4 sigue siendo la fuente de verdad y el lugar donde se trabaja.** Los scripts se siguen editando
en la UI —que es donde se pueden probar contra el runtime real— o por API. Git solo se asegura de
que ningún estado se pierda antes de ser pisado.

Por eso **no** hay gate, ni bloqueo por divergencia, ni "publicar". Hay `capture`.

Consecuencia importante: los `.php` capturados **son registro, no fuente**. No se editan a mano.
Editarlos no cambia nada en PM4.

## Dónde vive el historial

En la rama huérfana **`pm4-scripts-historial`**, que nunca se mergea a `dev` ni a `main`. Los `.php`
no aparecen en el working tree de tu rama activa.

Se escribe con *plumbing* de git (`commit-tree` + `update-ref`), no con `git add`/`git commit`. Dos
razones, ambas duras:

1. La captura se dispara **en medio de tu trabajo**. Con porcelain ensuciaría la rama activa, metería
   commits automáticos en tus PRs y podría corromper un `git add -p` a medias.
2. `.githooks/pre-commit` corre `npm run verify` completo. Con porcelain, **cada escritura a un
   script dispararía ese gate** — y a mitad de un cambio el árbol suele estar rojo, así que el
   commit de captura fallaría y se perdería justo el registro que queremos conservar.

El plumbing no invoca hooks de git ni toca el índice. Está cubierto por un test que instala un
`pre-commit` que siempre falla y verifica que la captura funciona igual.

## Las capas

| Capa | Qué cubre | Se puede olvidar |
|---|---|---|
| **1 · Hook `PreToolUse`** | El estado **anterior**, antes de que el asistente lo pise | No — es automático |
| **2 · Hook `PostToolUse`** | El estado **nuevo**, apenas la escritura termina | No — es automático |
| **3 · `capture` manual** | Tu trabajo en la UI de PM4 | Sí — hay que correrlo |
| **4 · Regla en `CLAUDE.md`** | Escrituras por caminos que el matcher no cubre (`curl`, otro MCP) | Sí — depende del asistente |

Son redundantes a propósito: cada una tapa un hueco de las otras.

### Por qué hacen falta los dos hooks

No son lo mismo ni uno reemplaza al otro:

- **Sin el `Pre`**, un cambio que hiciste en la UI y que el asistente pisa después desaparecería
  sin dejar rastro: nadie habría guardado esa versión.
- **Sin el `Post`**, una sesión interrumpida a mitad de trabajo dejaría en PM4 versiones que git
  nunca registró. El `Pre` solo guarda lo viejo; lo nuevo quedaría esperando un `capture --all`
  final que puede no llegar nunca — y si nadie vuelve a tocar ese script, ese estado se pierde.

Con los dos, **cada versión que existió en PM4 queda registrada en el momento**, sin depender de
que la sesión termine bien. Como la captura es idempotente, el `Pre` del cambio siguiente no
duplica nada: ve que ese estado ya está guardado y no genera commit.

### Los tres vectores de escritura

| Vector | Cómo pisa |
|---|---|
| `pm4_update_script` / `PUT /scripts/{id}` | Sobrescribe el código. El caso obvio |
| `pm4_run_script` con `code_adhoc` | **Guarda el código temporal en el script y luego lo restaura.** Si la restauración falla, el script queda con el código de prueba. Escritura encubierta |
| Edición en la UI de PM4 | No pasa por ninguna herramienta: solo la ve la captura manual |

## Comandos

Desde `pm4-app/`:

```bash
npm run pm4:status                                   # qué difiere de la última captura
npm run pm4:capture -- --all                         # registra todo lo que cambió
npm run pm4:capture -- --id 84 --reason "motivo"     # un script puntual
```

Consulta del historial (git directo, no hace falta herramienta):

```bash
git log pm4-scripts-historial                                      # todas las capturas
git log pm4-scripts-historial -- proceso-31/col-qd-core-sfc.php    # historial de un script
git show <sha>:proceso-31/col-qd-core-sfc.php                      # el código en ese momento
git diff <sha1> <sha2> -- proceso-31/col-qd-core-sfc.php           # qué cambió entre dos capturas
```

## Los dos flujos

### A · Trabajaste en la UI de PM4

```bash
npm run pm4:capture -- --all --reason "ajustes de SLA en la UI"
```

Idempotente: si no cambió nada, no genera commit. **Este es el único paso manual del sistema**, y
existe porque la UI de PM4 no pasa por ninguna herramienta que un hook pueda interceptar.

### B · Le pediste un cambio al asistente

No hay que hacer nada. Por cada escritura se disparan los dos hooks: uno guarda el estado anterior
y otro el nuevo, en el momento. Si la sesión se corta a mitad de trabajo, **todo lo que ya se subió
a PM4 está registrado** — no hay ningún paso final del que dependa el historial.

## Volver atrás

```bash
git log pm4-scripts-historial -- proceso-31/col-qd-core-sfc.php   # elegir el sha bueno
git show <sha>:proceso-31/col-qd-core-sfc.php                     # revisar el código
```

Y se republica pegando ese código en la UI de PM4, o con `pm4_update_script` (que disparará su
propia captura previa, así que el estado roto también queda registrado).

## Alcance: por proceso, no toda la instancia

En la instancia conviven varios proyectos (FAST-FLOW, CUW, pruebas). Solo se vigilan los procesos
declarados en **`pm4-app/scripts/pm4-scripts/pm4-scripts.config.json`** — hoy el 31, que son 13
scripts de los 62 de la instancia.

**Los scripts de cada proceso se descubren de su BPMN**, siguiendo también los `callActivity` hacia
sus subprocesos. Así, agregar un `scriptTask` en PM4 no obliga a tocar configuración: la próxima
captura lo incluye solo.

Lo único que hay que declarar a mano es lo que **ningún BPMN referencia**, en `scriptsExtra`:

| Caso | Ejemplo en el proceso 31 |
|---|---|
| Un script que otro invoca en runtime | el CORE SFC (84) y la utilidad de días hábiles (95) |
| Un script que dispara el frontend como watcher | `COL_QD_Check_Similitud` (70), desde SCR-000 |

Detectarlos automáticamente exigiría analizar el PHP y el TSX — frágil, y con falsos negativos
justo en los scripts más críticos. Por eso se declaran, cada uno con su motivo.

### Vigilar un proceso nuevo

Agregá una entrada a `procesos` en el config y corré `npm run pm4:capture -- --all`. Sus scripts
salen del BPMN; solo hace falta declarar los `scriptsExtra` si los tiene.

Si el hook dispara sobre un script **fuera de alcance**, no bloquea: avisa que se sobrescribe sin
registrar historial y sigue.

### Nombres de archivo

Slugs del título, **sin el id numérico**: el id cambia entre instancias PM4 y un nombre que lo
incluyera obligaría a renombrar todo tras cada migración, rompiendo `git log --follow`. El mapeo
`uuid → archivo → id actual` vive en `pm4-scripts.index.json`, dentro de la misma rama.

## La copia navegable

Además de la rama, cada captura vuelca los scripts a **`pm4-scripts/`** en la raíz del repo, para
poder abrirlos y grepearlos como archivos normales. Esa carpeta:

- **Está ignorada en git** (`/pm4-scripts/`, anclado a la raíz). Versionarla duplicaría contenido
  que ya vive en la rama, y dos copias pueden desincronizarse en silencio.
- **Se genera, no se edita.** Editar un archivo ahí no cambia nada en PM4 y la próxima captura lo
  sobrescribe.
- **Se regenera sola:** si la borrás o clonás el repo de cero, `npm run pm4:capture -- --all` la
  reconstruye.

El respaldo real y versionado sigue siendo la rama `pm4-scripts-historial` — conviene pushearla al
remoto como cualquier otra.

## Detalles que importan

**Forma canónica.** Todo el código se normaliza antes de hashear o guardar: UTF-8 sin BOM, LF,
exactamente un `\n` final. La función es idempotente, así que el round-trip PM4 → git → PM4 es
estable aunque PM4 recorte el salto final al guardar. Sin esto, un CRLF o un BOM producirían
"cambios" fantasma en cada corrida.

**Nunca se compara por tamaño.** Un archivo con acentos reporta largos distintos en bytes y en code
points (5456 vs 5421 en un caso real). Solo se comparan hashes SHA-256 de los bytes UTF-8 de la
forma canónica.

**Un script vacío no se captura.** Registrar un `code` vacío sobrescribiría el último estado bueno
del historial con nada.

**Los borrados en PM4 se conservan.** Si un script desaparece de la instancia, su historial queda:
es justamente lo que hay que preservar.

**Escape del hook.** `PM4_CAPTURE_SKIP=1` permite escribir sin capturar, y lo deja anotado en el
contexto para que quede constancia. Es para emergencias, no para uso normal.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El hook deniega la escritura | La captura falló (PM4 caído, token vencido). El mensaje trae el detalle |
| `faltan PM4_BASE_URL / PM4_TOKEN` | No están en `pm4-app/.env` ni en el entorno |
| `git user.name no está configurado` | El plumbing necesita identidad para firmar el commit |
| Un script aparece como MODIFICADO y no lo tocaste | Alguien lo editó en la UI. Es exactamente lo que el sistema existe para registrar: capturalo |

## Arquitectura

```
pm4-app/scripts/pm4-scripts/
├── pm4-scripts.mjs          cáscara de CLI: I/O, flags, salida
└── core/                    lógica pura, testeada (73 tests)
    ├── canonicalizar.mjs    forma canónica y hash
    ├── estado.mjs           clasificación contra la última captura
    ├── payload.mjs          whitelist del read-modify-write
    └── historial.mjs        plumbing de git
.claude/hooks/pm4-capture.mjs   el hook PreToolUse
```

El hook está en Node y no en PowerShell porque la política de ejecución de esta máquina es
`AllSigned`: un `.ps1` sin firma digital no corre.
