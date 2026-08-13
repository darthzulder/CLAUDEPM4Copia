# Nomenclatura de variables — convención Zurich RPA aplicada a PM4 App

> Adaptado del estándar de nomenclatura del equipo RPA Zurich (*Lineamientos RPA UiPath
> V1.0*, secciones 2.1.2 y 6) al dominio de este proyecto. El estándar original es para
> VB.NET/UiPath; esta versión recorta la tabla de prefijos a los tipos que existen aquí y
> añade las reglas propias del proyecto (dominio `qd_`, fechas, `_desc`).

## Por qué existe esta convención

Los nombres de campo (`qd_str*`, `qd_int*`, …) son el **contrato con PM4**: viajan tal cual
como claves de `task.data` y como `name=` de los campos de `react-hook-form`. Un nombre que
no siga la convención es indistinguible a simple vista de uno que sí, así que el prefijo de
tipo funciona como documentación en el propio nombre — no hace falta abrir el tipo para
saber que `qd_intCountSimilarCases` es un número.

Fuente de verdad de los nombres reales: [`fields/fields.ts`](../../pm4-app/frontend/src/screens/atencion-cliente/quejas-directas/fields/fields.ts)
(registro `QD`). Historial de la migración de nombres antiguos: [`fields/MAPEO_qd_old_new.md`](../../pm4-app/frontend/src/screens/atencion-cliente/quejas-directas/fields/MAPEO_qd_old_new.md).

## Formato

`qd_` (marca de dominio del proceso — Quejas Directas) + `prefijo` (3 letras, minúsculas)
+ `NombreEnInglésCamelCase`.

```
qd_strComplaintStatus
qd_intCountSimilarCases
qd_blnDataAuth
```

Uso: `name={QD.strComplaintStatus}` en JSX, `objWatch[QD.strComplaintStatus]` en lógica.
**Nunca escribir el string `'qd_str...'` a mano fuera de `fields.ts`.**

## Prefijos vigentes en el proyecto

| Prefijo | Tipo | Uso real en `frontend/src` |
|---|---|---|
| `str` | string | 427 campos |
| `int` | integer | 12 campos |
| `bln` | boolean | 11 campos |
| `lst` | list / array de objetos | 10 campos |
| `arr` | array | 5 campos |
| `dic` | diccionario / objeto plano | definido, sin uso actual |
| `obj` | objeto / instancia | definido, sin uso actual — usar si el tipo no es determinable |

Otros dominios de este proyecto (cotizador, colecciones, componentes propios) **no** siguen
esta convención de prefijo por letras — es específica de las variables de proceso PM4 bajo
`qd_*`. No extenderla a props de componentes React, nombres de archivo ni claves de
`OPTIONS`/`GLOBAL_COLLECTIONS`.

### Mapeo de tipos

- `string` → `str`
- `number` entero → `int` · `number` decimal → `dbl` (sin uso actual, reservado)
- `boolean` → `bln`
- Array de objetos / colección dinámica → `lst`
- Array simple / tamaño fijo → `arr`
- `Record<string, unknown>` / objeto plano de configuración → `dic`
- Instancia de clase / objeto sin tipo determinable → `obj`

Si el tipo no es determinable con certeza, usar `obj` y dejar una nota en el comentario del
campo (`fields.ts` documenta cada nombre con `// FLD-xxx · antes qd_nombreViejo`).

## Regla propia del proyecto — las fechas van como `str`, no `dat`

El estándar original define un prefijo `dat` para `DateTime`. **En este proyecto no se
usa**: PM4 transporta las fechas de proceso como texto en formato `DD/MM/YYYY`
(`qd_strFilingDate`, `qd_strClosureDate`, `qd_strDraftDate`, …), no como tipo `Date` nativo.
Usar siempre `str` para campos de fecha que vienen de PM4, y `parsePm4Date()` (vive en
[`core/businessDays.ts`](../../pm4-app/frontend/src/core/businessDays.ts), es la única
definición del repo) para leerlos como `Date` en el cliente — `new Date(stringDDMMYYYY)` los
interpreta como `MM/DD/YYYY` y produce fechas corridas un mes entero. Ojo con el fallback: un
string que **no** matchee `DD/MM/YYYY` (p. ej. un ISO) lo parsea `new Date()` en silencio, y
en UTC-5 eso puede devolver el día anterior. Comportamiento fijado en
`core/businessDays.test.ts`.

## Convención compañera `_desc` — código + descripción

Todo campo respaldado por una colección PM4 guarda el **código** y viaja con una variable
compañera `<campo>_desc` con la descripción legible:

```
qd_strChannel: "13"
qd_strChannel_desc: "Internet"
```

Se sincroniza con `useSyncDesc(form, campo, options)` (`core/useCollection.ts`); el resolver
de solo lectura es `descOf(options, code)`.

## Comentarios de código — estilo natural en español

Al tocar código de este dominio, los comentarios siguen el mismo estilo natural que ya usa
el proyecto: cortos, en español, sin jerga académica, uno por bloque lógico (no por línea
trivial), siempre **antes** de la línea o bloque que describen.

- Sintaxis según lenguaje: `//` en TS/TSX/JS, `#` en Python, `<!-- -->` en HTML.
- Respetar doc-comments existentes (JSDoc, docstrings) — son documentación formal, no se
  tocan igual que un comentario natural.
- No comentar imports.
- No duplicar un comentario ya equivalente.
- No dejar comentarios obvios ("cerramos la función", "fin del bucle").

## Restricciones al renombrar un campo existente

Si se detecta un nombre que no sigue la convención (legado, o un campo nuevo mal nombrado):

- **No cambiar lógica** al renombrar — es un cambio de nombre puro.
- **No** renombrar nombres de función/método, firmas públicas, clases/tipos/interfaces,
  librerías externas, constantes, ni literales/rutas/URLs.
- Todo rename de un campo PM4 real (`qd_*` que viaja en `task.data`) es **contrato con
  PM4** — coordinar con el script/proceso BPM que lo emite o lo espera antes de desplegar
  (ver `fields/MAPEO_qd_old_new.md` para el precedente de la migración de nombres).
- Registrar el nombre anterior en un comentario `// antes qd_nombreViejo` en `fields.ts`,
  como ya se hace con el resto del registro `QD`.
