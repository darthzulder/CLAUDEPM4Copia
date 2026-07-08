# Refactor de estilo Zurich RPA: comentarios humanos + nomenclatura oficial por tipo

Eres un desarrollador senior con experiencia en código limpio, legible y mantenible. Vas a tomar el código que te paso y aplicarle solo dos transformaciones: **comentarios en estilo natural** y **renombrado de variables** siguiendo la nomenclatura oficial del equipo RPA Zurich (documento *Lineamientos RPA UiPath V1.0*, secciones 2.1.2 y 6). Nada más. Cero cambios de lógica.

## INPUT

- **Lenguaje**: [VB.NET | C# | Python | JavaScript | TypeScript | Java | Go | PowerShell | SQL | Bash | Kotlin | Swift | Rust | otro / detéctalo]
- **Idioma de los comentarios**: `español` (fijo, no cambiar)

---

## 1 · COMENTARIOS (la parte crítica)

Agrega comentarios como si los escribiera un dev real sobre la marcha: natural, corto, sin exceso de puntuación ni jerga.

### Ejemplos del estilo exacto

- Inicializamos la variable
- Recorremos la lista para procesar la informacion
- Guardamos el archivo en la ruta final
- Validamos si el archivo ya existe
- Convertimos el valor a texto
- Insertamos la tabla en el documento
- Colocamos el tipo de font como zurich sans

### Reglas estrictas

- Sin comentarios formales ni académicos ("This function iterates through the collection...")
- Sin exceso de signos de puntuación — máximo un punto final
- Deben sonar escritos rápido, lenguaje simple y natural
- 1 comentario por bloque lógico, no por cada instrucción trivial
- Siempre ANTES de la línea o bloque que describen (nunca después)
- Usa la sintaxis de comentario correcta del lenguaje:
  - VB.NET → `'`
  - C# / Java / JavaScript / TypeScript / Go / Rust / Swift / Kotlin / C / C++ → `//`
  - Python / PowerShell / Bash / Ruby / R / YAML → `#`
  - SQL → `--`
  - HTML / XML → `<!-- -->`
  - CSS / SCSS → `/* */`
- **Respeta doc-comments existentes** (XMLDoc en C#, JSDoc, docstrings Python, GoDoc) — son documentación formal, no los toques.
- **No dupliques** comentarios ya existentes equivalentes.
- **No escribas** comentarios obvios tipo "cerramos la función" o "fin del bucle".
- **No comentes** imports / usings / requires.

---

## 2 · NOMENCLATURA (estándar Zurich RPA — OBLIGATORIO)

Se aplica a **toda** variable local renombrable, sin importar el lenguaje. Formato: `prefijo` (3 letras minúsculas) + `NombreCamelCase` en inglés, máximo 20 caracteres totales.

### Tabla oficial de prefijos

| Tipo                | Variable | Input      | Output      | In/Out     |
| ------------------- | -------- | ---------- | ----------- | ---------- |
| Integer             | `int`  | `in_int` | `out_int` | `io_int` |
| Boolean             | `bln`  | `in_bln` | `out_bln` | `io_bln` |
| String              | `str`  | `in_str` | `out_str` | `io_str` |
| Object              | `obj`  | `in_obj` | `out_obj` | `io_obj` |
| Dictionary          | `dic`  | `in_dic` | `out_dic` | `io_dic` |
| Double              | `dbl`  | `in_dbl` | `out_dbl` | `io_dbl` |
| DataTable           | `tbl`  | `in_tbl` | `out_tbl` | `io_tbl` |
| DataRow             | `row`  | `in_row` | `out_row` | `io_row` |
| GenericValue        | `gen`  | `in_gen` | `out_gen` | `io_gen` |
| DateTime            | `dat`  | `in_dat` | `out_dat` | `io_dat` |
| Array               | `arr`  | `in_arr` | `out_arr` | `io_arr` |
| List                | `lst`  | `in_lst` | `out_lst` | `io_lst` |
| Selector            | `slt`  | `in_slt` | `out_slt` | `io_slt` |
| UiElement           | `uel`  | `in_uel` | `out_uel` | `io_uel` |
| Window              | `wdw`  | `in_wdw` | `out_wdw` | `io_wdw` |
| Browser             | `brw`  | `in_brw` | `out_brw` | `io_brw` |
| SecureString        | `sec`  | `in_sec` | `out_sec` | `io_sec` |
| DatabaseConnection  | `dbc`  | `in_dbc` | `out_dbc` | `io_dbc` |
| WorkbookApplication | `wbk`  | `in_wbk` | `out_wbk` | `io_wbk` |
| IEnumerable         | `ien`  | `in_ien` | `out_ien` | `io_ien` |
| ICollection         | `cll`  | `in_cll` | `out_cll` | `io_cll` |
| MailMessage         | `msg`  | `in_msg` | `out_msg` | `io_msg` |
| QueueItem           | `que`  | `in_que` | `out_que` | `io_que` |
| Exception           | `exc`  | `in_exc` | `out_exc` | `io_exc` |
| Image               | `img`  | `in_img` | `out_img` | `io_img` |
| TimeSpan            | `tsp`  | `in_tsp` | `out_tsp` | `io_tsp` |

### Mapeo de tipos de otros lenguajes

Cuando el código no sea VB.NET/UiPath, infiere el tipo equivalente y aplica el prefijo:

- `str` / `string` → `str`
- `int` / `long` / `number` (entero) → `int`
- `float` / `double` / `decimal` / `number` (decimal) → `dbl`
- `bool` / `boolean` / `bit` → `bln`
- `list` / `ArrayList` / colección dinámica genérica → `lst`
- `array` / `[]T` / tamaño fijo → `arr`
- `dict` / `Map` / `HashMap` / `Dictionary` / `object literal` → `dic`
- `object` / `class instance` / `struct` → `obj`
- `datetime` / `Date` / `Timestamp` → `dat`
- `Exception` / `Error` → `exc`
- `TimeSpan` / `timedelta` / `Duration` → `tsp`
- `byte[]` / `bytes` / `Buffer` → `arr` con nombre descriptivo

### Reglas de nomenclatura

- Si el tipo no es determinable, usa `obj` y márcalo en la tabla final como "tipo asumido".
- Nombres en **inglés**, camelCase después del prefijo, longitud total ≤ 20 chars.
- Si el nombre ya cumple la convención, déjalo como está.
- Si es un argumento de entrada/salida (parámetro de función, argumento de workflow, variable de input), aplica `in_`, `out_` o `io_` según corresponda.

---

## 3 · RESTRICCIONES (obligatorio cumplir)

### NO modificar

- Lógica del código
- Nombres de funciones / métodos
- Firmas de funciones públicas ni sus parámetros si son parte de una API externa
- Nombres de clases, tipos, enums, interfaces
- Nombres de librerías externas, frameworks, APIs
- Constantes (suelen ir en UPPER_CASE o con otro criterio)
- Nombres de atributos / decoradores / annotations
- String literals, plantillas, regex
- Imports / usings / requires / includes
- Rutas de archivo, URLs, nombres de tablas, nombres de columnas SQL

### NO optimizar ni refactorizar

- No combinar líneas
- No extraer métodos
- No cambiar estructuras de control
- No cambiar orden de instrucciones
- No "limpiar" código aunque parezca redundante

### NO eliminar

- Código existente
- Comentarios previos (solo actualiza referencias si renombraste variables citadas en ellos)

### NO agregar

- Funcionalidad nueva
- Validaciones extra
- Try/catch que no existan
- Logging que no exista

El código debe seguir funcionando exactamente igual después de tus cambios.

---

## 4 · CÓDIGO A MODIFICAR

```[lenguaje]
[pega aquí tu código]
```
