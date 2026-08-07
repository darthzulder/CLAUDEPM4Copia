# Catálogo completo del vendor Zurich DS (0.8.1) — índice liviano

> **Qué es esto:** lista de **los 116 componentes reales** que trae `@zurich/web-components` 0.8.1
> (`frontend/vendor/zurich-web-components-0.8.1.tgz` + `zurich-dev-utils-0.8.1.tgz`), extraídos
> directamente de los `.d.ts`/`.props.d.ts`/`.js` compilados del paquete — no de un paste web.
> Generado 2026-08-06 a pedido del usuario, tras confirmar que varios patrones de `shared.css`
> (`.kpi-card`, `.pqr-banner*`, `.pqr-footer*`, `.pqr-topnav*`, `.no-docs-card`,
> `.dashboard-pagination`) sí tenían componente Zurich real pero no estaban expuestos ni en
> `ZdsFields.tsx` ni en `zds-cheatsheet.md`. Ver [zurich-index.md](../zurich-index.md).
>
> **Qué NO es esto:** esto **no reemplaza** la ficha completa de 12 secciones (`§6.2` de
> `zurich-index.md`). Es un índice de "¿existe algo para X?" — cuando la respuesta sea sí y se
> vaya a **usar** el componente, seguir el flujo normal: detenerse, documentar la ficha completa
> (como se hizo con los 7 de `§2.3`/`§2.4`/`§2.5`), y solo entonces consumirlo desde `ZdsFields.tsx`.
>
> **Columna "Props/eventos clave":** extraída con grep de los tipos `*_Props`/`*_Events` de cada
> `.props.d.ts` — mezcla props y eventos sin distinguir para mantener el índice compacto. **No es
> una ficha de props fiable para escribir código** — antes de usar cualquiera de estos, abrir su
> `.props.d.ts` real en el vendor (o generar la ficha completa) para confirmar tipos exactos.
>
> **Columna "Propósito":** inferido por el nombre del componente + sus props — el paquete
> vendorizado **no trae descripciones humanas** (se verificó `css-components.html-data.json`, solo
> tiene encabezados vacíos). Tratar como orientación rápida, no como copy oficial de Zurich.
>
> **Estado:**
> - ✅ **Expuesto** — ya importado y re-exportado en `frontend/src/components/fields/ZdsFields.tsx`, listo para usar en screens.
> - 📄 **Documentado** — ficha completa de 12 secciones ya creada en `outputs/react/` (ver §2.3/§2.4/§2.5 de `zurich-index.md`), pero **todavía no** está en `ZdsFields.tsx`.
> - *(vacío)* — ni expuesto ni documentado. Si se necesita, seguir el flujo de "componente DS no documentado" del `CLAUDE.md` del proyecto (Eje A, escalón 3).

---

## Atoms (25)

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `badge` | `ZrBadge` | ✅ | `config, text, icon, fill, content, custom` | Badge overlay (numeral/ícono/punto) sobre otro elemento — **no standalone**, es `position:absolute` (confirmado en `zds-cheatsheet.md`). |
| `button` | `ZrButton` | ✅ | `config, content, icon, icon-right, loading, disabled, wide, href, target, popover-target, as-submit, custom, click` | Botón de acción. |
| `chip` | `ZrChip` | ✅ | `content, disabled, readonly, custom, click` | Etiqueta compacta clickeable/removible. |
| `currency` | — | | `amount, currency, decimals, custom` | Formatea un monto como moneda (display-only, no input). |
| `date` | — | | `date, weekday, with-weekday, custom` | Formatea una fecha para mostrar (display-only, no input — no confundir con `date-input`). |
| `flag` | — | | `country, custom` | Bandera de país por código. |
| `icon` | `ZrIcon` | ✅ | `icon, config, custom` | Ícono standalone. |
| `image` | — | | `image-src, config, size, eager, copyright, blank-fallback, sources, custom` | Imagen con lazy/eager load, crédito de copyright y fallback en blanco. |
| `link` | — | | `href, content, is-current-page, target, custom, click` | Enlace de texto, con estado "página actual". |
| `loader` | `ZrLoader` | ✅ | `content, small, custom` | Spinner de carga. |
| `logo` | — | | `config, inline, custom` | Logo Zurich configurable (tamaño/inline). |
| `number` | — | | `amount, unit, compact, truncate, decimals, custom` | Formatea un número (unidad, notación compacta) — display-only. |
| `pictogram` | — | | `pictogram, custom` | Ícono temático grande (usado como prop `pictogram` en `Promo`/`EmptyState`/`StageBanner`). |
| `profile` | — | | `config, content, status, custom` | Avatar + nombre + estado de un usuario. |
| `progress-bar` | `ZrProgressBar` | ✅ | `config, progress, max, progress-bar-title, no-percentage, invalid, highlight, custom` | Barra o anillo de progreso lineal/redondo. |
| `safe-space` | — | | `config, custom` | Espaciador/reserva de layout (nombre sugiere "zona segura" de padding). |
| `scroll-indicator` | — | | `custom` | Indicador de progreso de scroll de la página. |
| `shape` | — | | `shape, custom` | Figura geométrica decorativa (`1`–`7` + `flip`) — usada por `Promo`/`StageBanner`. |
| `skeleton` | — | | `round, custom` | Placeholder de carga tipo "skeleton". |
| `smiling-z` | — | | `config, custom` | Ícono/mascota de marca Zurich (branding). |
| `social-media-icon` | — | | `brand, config, custom` | Ícono individual de una red social. |
| `tag` | `ZrTag` | ✅ | `content, icon, icon-right, fill, custom, click` | Etiqueta de estado/categoría. |
| `time` | — | | `time, format-24, with-seconds, format, as-relative, custom` | Formatea una hora (24h, relativa, con segundos) — display-only. |
| `toast` | — | | `config, content, timestamp, custom, click` | Notificación flotante temporal. |
| `tooltip` | `ZrTooltip` | ✅ | `config, text, content, custom` | Tooltip al hacer hover. |

---

## Inputs (35)

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `boolean-icon` | — | | `config, custom, change, blur, validated, restarted` | Checkbox representado visualmente como ícono sí/no. |
| `calendar` | `ZrCalendar` | ✅ | `model, custom, change, restarted` | Calendario inline (grilla de mes). |
| `checkbox` | `ZrCheckbox` | ✅ | `indeterminate, custom, change, blur, validated, restarted` | Checkbox booleano (con estado indeterminado). |
| `checkbox-group` | — | | `model, options, change, restarted` | Grupo de checkboxes múltiples. |
| `checkbox-select` | — | | `model, options, change, restarted` | Select múltiple con apariencia de checkboxes. |
| `chips-set` | — | | `model, options, custom, change, restarted` | Selector múltiple con apariencia de chips. |
| `color-input` | — | | `model, placeholder, change, blur, validated, restarted` | Input de selección de color. |
| `date-input` | `ZrDateInput` | ✅ | `model, input-type, pattern, custom-ui, placeholder, range, min, max, change, enter, blur, validated, restarted` | Selector de fecha (campo). |
| `file-input` | `ZrFileInput` | ✅ | `model, placeholder, accept, droppable, delete-file-text, browse-file-text, no-file-text, change, restarted, blur` | Carga de 1 archivo. |
| `multi-file-input` | — | | `model, placeholder, accept, droppable, delete-file-text, browse-file-text, no-file-text, change, restarted` | Carga de múltiples archivos en un solo campo. |
| `multi-input` | — | | `model, max-length, max-items, change, validated, blur, search, restarted` | Input de multi-valor tipo tags con búsqueda. |
| `multi-selectable-cards` | — | | `config, options, model, horizontal, checkboxes, compact, change, blur, restarted` | Selección múltiple con apariencia de cards. |
| `multiselect` | — | | `model, change, validated, blur, search, restarted` | Select de opción múltiple con búsqueda. |
| `number-input` | — | | `model, range, min, max, step, data-list, align-right, unit, placeholder, icon, decimals, change, enter, blur, validated, restarted` | Input numérico con step/min/max/unidad. |
| `pagination` | `ZrPagination` | 📄 | `pages, model, show-edges, disabled, change, restarted` | Paginación de listas/tablas. Ficha: [zurich-pagination.md](layout/zurich-pagination.md). |
| `password-input` | — | | `model, placeholder, change, enter, blur, validated, restarted` | Input de contraseña. |
| `progress-tracker` | — | | `model, name, steps, config, change, restarted` | Tracker de progreso por pasos con nombre persistente (similar a `stepper` pero con etiqueta fija por paso). |
| `radio-select` | `ZrRadioSelect` | ✅ | `model, label, config, options, invalid, help-text, change, blur, validated, restarted` | Grupo de radio buttons. |
| `range-calendar` | — | | `model, custom, change, restarted` | Calendario para seleccionar un **rango** de fechas. |
| `range-date-input` | — | | `model, range, min, max, placeholder, change, restarted` | Input de rango de fechas `[from, to]`. |
| `range-input` | — | | `model, range, min, max, step, placeholder, change, restarted` | Input numérico de rango `[min, max]`. |
| `range-slider` | — | | `model, range, min, max, change, restarted` | Slider de rango (2 manijas). |
| `rating` | — | | `model, name, disabled, readonly, show-score, change, blur, restarted, validated` | Selector de calificación (estrellas) con puntaje visible opcional. |
| `segmented-control` | `ZrSegmentedControl` | ✅ | `model, options, name, disabled, change, blur, validated, restarted` | Toggle segmentado (p.ej. SÍ/NO). |
| `select` | `ZrSelect` | ✅ | `name, model, placeholder, change, blur, validated, search, restarted` | Dropdown con/sin búsqueda. |
| `selectable-cards` | — | | `config, options, model, horizontal, compact, change, blur, restarted` | Selección única con apariencia de cards. |
| `selection-tag` | — | | `model, checked, content, name, disabled, invalid, custom, change, blur, restarted, validated` | Chip seleccionable tipo checkbox. |
| `slider` | — | | `model, range, min, max, show-max, show-min, icon-right, icon-left, change, blur, restarted` | Slider de un solo valor. |
| `stepper` | `ZrStepper` | ✅ | `model, steps, label, config, custom, change, restarted` | Contador de pasos 1-based. |
| `switch` | — | | `custom, change, blur, validated, restarted` | Interruptor booleano tipo toggle switch. |
| `tags-select` | — | | `model, options, custom, change, restarted` | Select con opciones en forma de tags. |
| `text-input` | `ZrTextInput` | ✅ | `model, pattern, input-type, max-length, no-counter, min-length, align-right, data-list, placeholder, icon, change, enter, select, blur, validated, restarted` | Input de texto de 1 línea. |
| `textarea` | `ZrTextarea` | ✅ | `model, max-length, placeholder, elastic, pattern, custom, change, enter, blur, validated, restarted` | Texto multilínea. |
| `time-input` | — | | `model, range, min, max, with-seconds, custom-ui, step, placeholder, pattern, change, enter, blur, validated, restarted` | Selector de hora. |
| `vertical-stepper` | — | | `steps, model, header, step-text, config, custom, change, restarted` | Stepper vertical con header/texto por paso (wizard vertical). |

---

## Layouts (18)

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `accordion` | — | | `summary, config, content, model, open, borderless, custom, change` | Panel colapsable individual. |
| `accordion-group` | — | | `config, accordions, model, custom, change, restarted` | Grupo de accordions (control de cuáles están abiertos). |
| `action-menu` | — | | `text, items, href, config, elements, content, custom` | Menú desplegable de acciones (dropdown de opciones con texto/icono/href). |
| `button-group` | — | | `config, custom` | Agrupador visual de botones (usado en `zurich-tile.md` para `actions`). |
| `card` | `ZrCard` | ✅ | `level, size, config, clickable, content, custom, click` | Contenedor de superficie genérico. |
| `card-carousel` | — | | `height, custom` | Carrusel de cards. |
| `carousel` | — | | `config, delay, overflow, no-loop, custom, slide` | Carrusel genérico de slides. |
| `fieldset` | `ZrFieldset` | ✅ | `config, legend, custom` | Agrupador de campos con leyenda. |
| `figure` | — | | `caption, custom` | Imagen con caption/pie de foto. |
| `floating-banner` | — | | `config, header, content, custom, close` | Banner flotante cerrable (aviso persistente en pantalla). |
| `form` | `ZrForm` | ✅ | `config, custom, submit` | Contenedor que cascadea tamaño/forma a los controles hijos. |
| `input-group` | `ZrInputGroup` | ✅ | `config, legend, custom` | Cluster de inputs relacionados con separadores. |
| `modal` | `ZrModal` | ✅ | `model, open, no-close, content, custom, change` | Diálogo modal. |
| `side-menu` | — | | `config, content, model, open, custom, change` | Menú lateral con contenido de navegación (similar a `sidebar` pero orientado a menú). |
| `sidebar` | `ZrSidebar` | ✅ | `config, content, model, open, custom, change` | Panel lateral (drawer) genérico. |
| `snap-scroll` | — | | `config, custom` | Contenedor de scroll con snap entre secciones. |
| `table` | `ZrTable` | ✅ | `config, headers, rows, caption, zebra, custom` | Tabla de datos. |
| `tabs` | `ZrTabs` | ✅ | `model, disabled, tabs, custom, change` | Selector de pestañas 1-based. |

---

## Molecules (17)

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `action-card` | — | | `header, content, wide, tags, pre-line, custom, click` | Card con header+content+tags+preline, clickeable (variante de `tile` orientada a acción). |
| `alert` | `ZrAlert` | ✅ | `config, content, confirm-text, icon, hide-close, custom, click, confirm, close` | Banda de aviso/validación (`info`/`positive`/`negative`/`alert`). |
| `article-card` | — | | `header, content, wide, tags, pre-line, custom, click` | Card de artículo/blog con imagen+tags. |
| `avatar` | — | | `name, content, initials, config, badge, profile-config, dropdown-elements, custom` | Avatar de usuario, con badge y dropdown de acciones. |
| `avatar-list` | — | | `config, profiles, custom` | Lista/pila de avatares (equipo, participantes). |
| `breadcrumbs` | — | | `to, text, home, crumbs, custom` | Migas de pan de navegación. |
| `empty-state` | `ZrEmptyState` | 📄 | `header, content, custom` (+ `pictogram`/`image-src` heredados) | Estado vacío (sin resultados/documentos). Ficha: [zurich-emptystate.md](molecules/zurich-emptystate.md). |
| `event-list-item` | — | | `date, content, header, custom` | Fila de evento con fecha + pictograma (línea de tiempo). |
| `image-stage` | — | | `header, content, shape, config, custom` | Banner con imagen + figura decorativa (variante de `stage` centrada en imagen). |
| `list-item` | — | | `header, content, initials, icon-right, icon-left, timestamp, custom` | Fila de lista genérica con avatar/ícono + timestamp + acciones. |
| `promo` | `ZrPromo` | 📄 | `config, header, content, category, shape, custom` | Banner asimétrico imagen+texto. Ficha: [zurich-promo.md](molecules/zurich-promo.md). |
| `quote` | — | | `quote-src, author-name, content, description, custom` | Cita/testimonio con autor. |
| `share-bar` | — | | `social, content, mailto, custom` | Barra de botones de compartir en redes sociales. |
| `share-button` | — | | `social, config, mailto, custom` | Botón individual de compartir. |
| `stage` | — | | `header, content, shape, no-safe-space, config, custom` | Banner hero centrado (base de `stage-banner`, sin imagen circular obligatoria). |
| `stage-banner` | `ZrStageBanner` | 📄 | `config, pictogram, shape, category, content, custom` | Banner hero centrado con pictograma/imagen + figura decorativa. Ficha: [zurich-stagebanner.md](molecules/zurich-stagebanner.md). |
| `tile` | `ZrTile` | ✅ | `config, header, content, custom` | Card promocional (header+content+imagen+actions). |

---

## Organisms (6)

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `async-content` | — | | `custom` | Wrapper de contenido con estado de carga asíncrona (loading/error/success) — props internas no capturadas por el grep superficial, revisar `.d.ts` completo antes de usar. |
| `cookies-consent` | — | | `custom` | Banner de consentimiento de cookies. Irrelevante para este proyecto (app dentro de iframe PM4, no sitio público con cookies propias — salvo la página pública `pqr-*`). |
| `footer` | `ZrFooter` | 📄 | `columns, social, footer, social-text, custom` | Footer corporativo (columnas + social + legales). Ficha: [zurich-footer.md](layout/zurich-footer.md). |
| `language-selector` | — | | `locales, custom, change, blur` | Selector de idioma/locale. |
| `mobile-nav-bar` | — | | `config, model, routes, custom` | Barra de navegación inferior para mobile. |
| `navigation` | `ZrNavigation` | 📄 | `social, footer, config, with-top, isotype, menu, routes, custom` | Navbar superior con logo + rutas + panel lateral responsive. Ficha: [zurich-navigation.md](navigation/zurich-navigation.md). |

---

## Data *(charts analíticos, 14)*

> Categoría `data` en el registro propio del DS. La mayoría solo expuso `custom` en el grep superficial — sus props reales (esquema de datos, ejes, series) son objetos complejos no capturados por una búsqueda de una sola línea; **abrir el `.props.d.ts` completo antes de usar cualquiera de estos**. Dominio poco probable en esta app de formularios de tarea PM4 — mantenidos en el índice por completitud, no por relevancia esperada.

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `bar-chart` | — | | `config, values, text, value, steps, y-values, has-y-axis, tooltips, custom` | Gráfico de barras. |
| `box-plot-chart` | — | | `custom` | Gráfico de caja (distribución estadística). |
| `donut-chart` | — | | `custom` | Gráfico de dona. |
| `gannt-chart` | — | | `custom` | Diagrama de Gantt (planificación de tareas/cronograma). |
| `group-bar-chart` | — | | `custom` | Gráfico de barras agrupadas. |
| `heatmap` | — | | `custom` | Mapa de calor. |
| `histogram` | — | | `custom` | Histograma. |
| `kpi-value` | `ZrKpiValue` | 📄 | `config, amount, header, description, difference, no-icon, custom` | KPI numérico con flecha de variación (2 estados). Ficha: [zurich-kpivalue.md](molecules/zurich-kpivalue.md). |
| `line-chart` | — | | `custom` | Gráfico de líneas. |
| `metric-progress` | — | | `custom` | Progreso de una métrica hacia una meta. |
| `pie-chart` | — | | `custom` | Gráfico circular. |
| `scatter-plot-chart` | — | | `custom` | Gráfico de dispersión. |
| `stacked-bar-chart` | — | | `custom` | Gráfico de barras apiladas. |
| `waterfall-chart` | — | | `custom` | Gráfico de cascada (waterfall). |

---

## Functionalities *(1)*

| Componente (kebab) | `Zr*` | Estado | Props/eventos clave | Propósito (inferido) |
|---|---|---|---|---|
| `resizer` | — | | `resize, desktop, landscape, portrait, mobile` | Utilidad de detección de breakpoint/viewport (no parece tener salida visual propia — confirmar en runtime antes de asumir que es un componente renderizable). |

---

## Cómo usar este índice

1. **¿Necesito algo que no está en `ZdsFields.tsx`/`zds-cheatsheet.md`?** Buscar aquí primero por nombre o por función.
2. **¿Aparece con 📄?** Ya hay ficha completa en `outputs/react/` — solo falta importarlo/exportarlo en `ZdsFields.tsx` y usarlo.
3. **¿Aparece sin estado (ni ✅ ni 📄)?** Seguir la regla del `CLAUDE.md` del proyecto (Eje A, escalón 3): **detenerse y documentar la ficha completa antes de usarlo** — no inventar props a partir de este índice, es solo una guía de "esto existe, esto hace más o menos". Abrir el `.props.d.ts` real del componente en `frontend/vendor/zurich-dev-utils-0.8.1.tgz` (`dist/code/<PascalName>.props.d.ts`) para generar la ficha con datos exactos, igual que se hizo con los 7 ya documentados.
4. **Fuente para volver a extraer:** los 4 `.tgz` en `frontend/vendor/` — descomprimir con `tar -xzf` a una carpeta temporal (no committear los extraídos). Los datos de este índice salen de `dist/react/*.d.ts` (lista de componentes), `dist/cjs/code/*.js` (grep `name:"X",category:"Y"`) y `dist/code/*.props.d.ts` (props/eventos) dentro de `zurich-dev-utils-0.8.1.tgz`.
