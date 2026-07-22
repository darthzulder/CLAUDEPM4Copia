# shared.css — Catálogo de clases

> **Para qué sirve:** saber qué clase ya existe antes de escribir CSS o de hacer grep.
> Inventario derivado de [`frontend/src/shared.css`](../frontend/src/shared.css).
> (Tokens/alias `--z-*`, excepciones de color y la regla "CSS nuevo al final con tokens,
> nombrado por componente": ver `CLAUDE.md` — no se repiten aquí.)

---

## 1. Estructura de pantalla

| Clase | Qué hace |
|---|---|
| `.screen-wrapper` | contenedor raíz, `min-height:100vh` + fondo `--z-bg` |
| `.screen-content` | columna central `max-width:960px`, centrada, con padding |
| `.screen-loading` | bloque centrado de carga (úsalo con `<ZrLoader/>`) |
| `.loading-overlay` | overlay full-screen semitransparente para submitting |
| `.section-spacer` | separador vertical (`--zs-100`) |

---

## 2. Grid de campos (layout idiomático de formularios)

| Clase | Qué hace |
|---|---|
| `.form-row` | grid con gap `--zs-150` |
| `.form-row.cols-1/2/3/4` | 1–4 columnas (responsive: colapsa a 2 en ≤900px, a 1 en ≤600px) |
| `.form-row.row-align-bottom` | alinea la fila abajo (campos + botón lookup) |
| `.col-span-2/3/4` | un campo ocupa N columnas |
| `.zds-field-wrap` / `.zds-select-wrap` | caja del campo (reserva `min-height:68px` para alinear pills con/sin helpText). `ZdsInput`/`ZdsSelect` ya las aplican |
| `.field-wrap` | stack label+control gap 4px (`--zs-25`, no expresable con z-flex) |

Para huecos en una fila usa un `<div />` vacío como celda.

---

## 3. Componentes propios (clases que ya consumen)

| Componente | Clases | Notas |
|---|---|---|
| `ScreenHeader` | `.screen-header`, `.title-block`, `.subtitle`, `.header-logo` | cabecera azul + logo |
| `FormSection` | `.form-section-card`, `.form-section-header`, `.form-section-body` | card con header azul (barra de acento via `::before`) |
| `ActionBar` | `.action-bar` | borde/margen/padding; el flex lo da z-flex/z-align |
| `InfoBar` | `.info-bar`, `.info-bar-item`, `.info-bar-label`, `.info-bar-value` | pares label/valor |
| `DocSupportUploader`/`DocItem`/`DocList` | `.doc-row`, `.doc-row-label`, `.doc-item`, `.doc-num-badge`, `.doc-file-area`, `.file-name-chip`, `.doc-table-*` | filas/listas de documentos (upload o validación) |
| `PreviewModal` | `.preview-modal*` | modal vista previa |
| `PdfViewer` | `.pdf-viewer*` | visor de PDF/blob |
| Sub-secciones | `.form-subsection`, `.form-subsection--stack`, `.form-subsection-title`, `.subsection-intro`, `.subsection-note` | bloque dentro de una `FormSection` |

---

## 4. Tipografía (clases utilitarias existentes)

| Clase / selector | Estilo |
|---|---|
| `.section-title`, `.form-subsection-title`, `.subsection-title` | Caption-14 bold azul, con barra de acento `::before` |
| `.info-bar-label`, `.form-label`, `.doc-table-header` | Caption-12 bold, uppercase, letter-spacing |
| `.info-bar-value`, `.doc-name` | Caption-14 bold, color texto |
| `.field-hint`, `.subsection-note`, `.doc-meta` | Caption-12 muted |
| `.required-star` | asterisco rojo de obligatorio |

> No hay componentes tipográficos del DS ni utilitarios tipo Tailwind. Usa estas clases
> o `font: var(--zf-*)` directamente. Tampoco existe `<z-divider>`.

---

## 5. Tablas (`z-table` global)

`z-table` ya trae estilos: borde, zebra, padding (`--z-table--cell-padding`), alineación
por `config*="center"/"right"` en `th/td`. Dentro de `.form-subsection` el overflow se
libera para que los dropdowns no se recorten.

---

## 6. Estilos por pantalla ya existentes (revisa antes de duplicar)

Cotizador/tomador (`.billing-*`, `.checkbox-grid`, `.policyholder-create-body`, `.lookup-wrapper`),
resumen de cotizaciones (`.quote-summary-*`), opciones (`.screen-body`, `.decision-*`),
nota de cobertura (`.doc-card*`, `.no-docs-card`), estado correo (`.email-status-*`),
errores/validación (`.record-*`, `.affected-fields-list`). Si tu caso encaja en uno de
estos patrones, **reúsalo**; si es nuevo y reutilizable (≥3 usos), añade la clase al final.
