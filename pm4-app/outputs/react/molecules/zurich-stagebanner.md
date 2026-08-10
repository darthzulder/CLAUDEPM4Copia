# ZrStageBanner — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/StageBanner.props.d.ts` + `web-components/dist/stage-banner.d.ts` + `css-components/dist/StageBanner.css` + `dev-utils/dist/code/Shape.props.d.ts`.
> **Platform:** React / Web / CSS
> **Category:** Molecules *(composite content surface — banner hero)*
> **Package:** `@zurich/web-components/react/stage-banner`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida un **banner hero centrado** con pictograma/imagen circular + título + descripción + figura decorativa, **o un banner de texto puro (sin imagen) con figura decorativa flotando en una esquina** — este segundo caso reemplazó `.pqr-banner*` en `shared.css` (2026-08-10, ver `PqrPage.tsx`), específicamente el patrón de círculos decorativos hecho a mano con `::before`/`::after` (`.pqr-banner-shapes`).

❗ **Sin `pictogram`/`image-src`/imagen slotted, el componente entra en una rama distinta**
(confirmado en `web-components/dist/stage-banner.js`, getter privado `isShapedConfig`):
renderiza únicamente `main` (texto) + `<z-shape>`, sin ningún contenedor de imagen — y el
CSS alinea el texto a la izquierda automáticamente (`:not([pictogram]):not([image-src])...`
→ `justify-content:flex-start;text-align:left`). Es la vía correcta cuando el diseño no
lleva imagen — no forzar un `image-src` vacío ni ocultar la imagen por CSS.

1. Import:
   ```tsx
   import { ZrStageBanner } from '@zurich/web-components/react/stage-banner';
   ```
2. **`shape` es la prop clave para el reemplazo**: acepta un valor de figura decorativa (con modificador opcional `flip`). Esto sustituye directamente los círculos dibujados a mano con `::before`/`::after` en `.pqr-banner-shapes`. ❗ El tipo declarado es `ZShape_Value = '1'|'2'|...|'7'`, pero en el CSS real de este vendor (0.8.1) **solo existen `--z-shape--1` a `--z-shape--6`** (`web-components/dist/shape.js`) — `shape="7"` no tiene regla CSS que lo defina. Verificar visualmente contra `?screen=ds-catalog` antes de asumir un valor.
3. `pictogram` o `image-src` (mutuamente alternativos, mismo patrón que `ZrEmptyState`) — imagen/ícono circular centrado sobre el banner (el CSS fuerza `border-radius: 50%` en `image-src`).
4. `content` = descripción del banner; el título usa `category` (más pequeño, `--zf-body-20--600`) — **ojo:** en este componente `category` es el "titular chico" (`<h6>`), no hay un prop `header`/título grande — el texto grande (`--zf-h-48`) es el nodo `<h3>` que sale del contenido, revisar el DOM compilado si el mapeo prop→elemento no es evidente en runtime.
5. `config` acepta `'left'` | `'center'` (encadenable) — controla la alineación del texto y la posición de la figura decorativa (`shape`).
6. Es responsive por `@container`: <992px reduce la figura a 6rem y el título a `--zf-h-36`; <768px centra todo el texto.

---

## 2. Import

```tsx
import { ZrStageBanner } from '@zurich/web-components/react/stage-banner';
```

---

## 3. Props (Parameters)

| Prop            | Type                                              | Default | Required | Description                                                       |
|-----------------|------------------------------------------------------|---------|----------|-----------------------------------------------------------------------|
| `config`        | `'left'` \| `'center'` (encadenable)                 | —       | No       | Alineación del texto y posición de la figura decorativa.               |
| `pictogram`     | `PictogramName` (+ `dark`)                           | —       | No       | Ícono circular centrado (alternativo a `image-src`).                   |
| `shape`         | `'1'..'6'` (+ `flip`; tipo declara hasta `'7'` pero no existe en el CSS de este vendor) | — | No | **Figura geométrica decorativa** — reemplazo directo de `.pqr-banner-shapes`. Sin `pictogram`/`image-src`, flota sola junto al texto (sin imagen). |
| `category`      | `string`                                              | —       | No       | Titular pequeño sobre el título principal.                             |
| `content`       | `string \| ReactNode`                                 | —       | No       | Descripción del banner (o título+descripción compuestos, si no hay slot de título grande — ver §8). |
| `image-src`     | `ZurichImageName` \| URL                             | —       | No       | Imagen circular alternativa al pictograma.                             |
| `image-alt`     | `string`                                              | —       | No       | Alt text de la imagen.                                                 |
| `custom`        | `CustomTokens<'color'\|'bg'>`                        | —       | No       | Override de color/fondo.                                               |

---

## 4. Events

> No declara eventos propios (`ZStageBanner_Events = {}`).

---

## 5. Slots

Slots declarados (`zStageBannerSlots`): `content`, `category`, `image-src`, `actions`.

---

## 6. CSS Customization Tokens

| CSS Variable                | Type   | Purpose                                                    |
|-------------------------------|--------|--------------------------------------------------------------|
| `--z-stage-banner--bg`        | color  | Fondo del banner (default `var(--z-sf-brand)`).               |
| `--z-stage-banner--color`     | color  | Color de texto (default `var(--z-ct-primary)`).               |

Tokens internos fijos por CSS (no vía prop, pero relevantes al migrar tamaños): `--z-shape--size: 8rem` (desktop) / `6rem` (<992px); `--z-pictogram--size: 6.25rem`; `--z-image--width/height: 6.25rem`; `--z-image--radius: 50%`.

---

## 7. Canonical Examples

### 7.1 Mínimo — centrado con pictograma
```tsx
<ZrStageBanner
  pictogram="shield-check"
  category="Atención al cliente"
  content="Radica tu queja o reclamo en minutos."
/>
```

### 7.2 Con figura decorativa (reemplazo de `.pqr-banner-shapes`)
```tsx
<ZrStageBanner
  pictogram="shield-check"
  category="Atención al cliente"
  content="Radica tu queja o reclamo en minutos."
  shape="3"
/>
```

### 7.3 Alineado a la izquierda
```tsx
<ZrStageBanner config="left" shape="3" category="Atención al cliente" content="Radica tu queja o reclamo en minutos." />
```

### 7.4 Con imagen en vez de pictograma
```tsx
<ZrStageBanner image-src="/soporte.webp" image-alt="Equipo de soporte" category="Atención al cliente" content="..." />
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`pictogram` e `image-src` son alternativos**, no combinar.
- ❗ **`shape` es la figura decorativa** — no reconstruirla con `::before`/`::after` a mano si se adopta este componente; usar el valor `1..6` (no `7`, ver §3) que más se acerque visualmente al diseño (confirmar contra `?screen=ds-catalog` o inyectando el custom element directo en devtools).
- ❗ **`shape` se voltea (`rotateY(180deg)`) automáticamente según `config`**: internamente se le agrega el sufijo `:flip` salvo que `config` empiece con `"left"` (`this.config?.startsWith("left") ? "" : ":flip"`, fuente: `stage-banner.js`). Con `config` sin definir (caso por defecto, figura en la esquina derecha) el flip queda activado; con `config="left"` (figura en la esquina izquierda) queda desactivado. Si la figura se ve "girada" respecto al diseño aprobado, es este mecanismo — no un bug — probar el otro `config` o comparar visualmente los shapes 1-6 antes de descartar el componente.
- ❗ **No hay prop de título grande explícito** — el `<h3>` grande sale del slot de contenido por defecto según el CSS compilado; verificar en runtime (DevTools) qué nodo hijo produce el `--zf-h-48` antes de asumir que es `content`. Solo hay dos niveles de texto (`category` chico arriba, `content` grande abajo) — si el diseño necesita título grande **arriba** + párrafo normal **debajo** (orden inverso al de `category`/`content`), componer ambos dentro de `content` como `ReactNode` con su propio `font` inline (tokens `--zf-*`), ver `PqrPage.tsx`.
- ❗ **No replicar breakpoints a mano** — maneja su propio `@container`.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                          → Use...
------------------------------------------------------------------------------
banner hero centrado con ícono/imagen circular + texto      → <ZrStageBanner pictogram category content>
+ figura decorativa (círculos, formas geométricas)           → + shape="1".."7"
banner alineado a la izquierda                               → config="left"
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrStageBannerProps = {
  config?: 'left' | 'center' | 'left:center';
  pictogram?: string;
  shape?: '1'|'2'|'3'|'4'|'5'|'6'|'7'|`${'1'|'2'|'3'|'4'|'5'|'6'|'7'}:flip`;
  category?: string;
  content?: string;
  'image-src'?: string;
  'image-alt'?: string;
};
```

---

## 11. Composition Patterns

### 11.1 Reemplazo real de `.pqr-banner*` (implementado en `PqrPage.tsx`, 2026-08-10)
Sin imagen/pictograma → rama `isShapedConfig` → texto alineado a la izquierda + `shape`
flotando en la esquina, full-width (no centrado/hero). Título grande y párrafo compuestos
juntos dentro de `content` (ver §8 — solo hay dos slots de texto y el orden no encaja con
"título arriba, párrafo abajo" usando `category`+`content` por separado):
```tsx
<ZrStageBanner
  shape="3"
  content={
    <>
      <span style={{ font: 'var(--zf-h-44)', display: 'block' }}>{title}</span>
      <p style={{ font: 'var(--zf-body-20--300)', margin: 'var(--zs-75) 0 0' }}>{intro}</p>
    </>
  }
  style={{
    ['--z-stage-banner--bg' as never]: 'var(--z-blue)',
    ['--z-stage-banner--color' as never]: 'var(--zg-white-zurich)',
  }}
/>
```
`shape="3"` se eligió comparando visualmente los 6 valores disponibles contra el diseño
aprobado — no hay una regla objetiva para elegirlo, es criterio visual caso por caso.
