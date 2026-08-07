# ZrPromo — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/Promo.props.d.ts` + `web-components/dist/promo.d.ts` + `css-components/dist/Promo.css`.
> **Platform:** React / Web / CSS
> **Category:** Molecules *(composite content surface — banner asimétrico imagen+texto)*
> **Package:** `@zurich/web-components/react/promo`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida un **banner asimétrico** (imagen/figura circular a un lado + título + texto + CTA al otro) — segundo candidato (junto a `ZrStageBanner`) para reemplazar `.pqr-banner*`, más cercano al layout **rectangular con texto a la izquierda e imagen/figura al lado derecho** que ya tiene el diseño aprobado.

1. Import:
   ```tsx
   import { ZrPromo } from '@zurich/web-components/react/promo';
   ```
2. Estructura: `aside` (imagen circular + figura decorativa superpuesta) + `main` (título `header` grande `--zf-h-44`, `category` chico `--zf-capt-14--500`, `content` como párrafo).
3. `config`: `'left'` (imagen a la izquierda, texto a la derecha — invierte el orden default) | `'narrow'` (contenedor más angosto, cambia el `@container` a `promo_narrow`) | `'left:narrow'` (ambos).
4. `shape` (mismo `ZShape_Value` `1..7`, o `'null'` para desactivarla) — figura decorativa que se posiciona **superpuesta** a la imagen (`position: absolute; bottom:0; right:0` dentro de `aside`), no suelta como en `ZrStageBanner`.
5. Slot `actions` para CTA (botones) — no visible explícitamente en el CSS extraído pero declarado en `zPromoSlots`.

---

## 2. Import

```tsx
import { ZrPromo }   from '@zurich/web-components/react/promo';
import { ZrButton }  from '@zurich/web-components/react/button';
```

---

## 3. Props (Parameters)

| Prop         | Type                                            | Default | Required | Description                                                       |
|--------------|----------------------------------------------------|---------|----------|-----------------------------------------------------------------------|
| `config`     | `'left'` \| `'narrow'` \| `'left:narrow'`          | —       | No       | Orden imagen/texto + ancho del contenedor.                            |
| `header`     | `string` \| `ReactSlot`                            | —       | No       | Título grande (`--zf-h-44`).                                          |
| `content`    | `string` \| `ReactSlot`                             | —       | No       | Párrafo de descripción (`--zf-body-20--300`).                         |
| `category`   | `string` \| `ReactSlot`                             | —       | No       | Titular pequeño sobre el header (`--zf-capt-14--500`).                |
| `shape`      | `ZShape_Value` (`'1'..'7'`) \| `'null'`            | —       | No       | Figura decorativa superpuesta a la imagen.                            |
| `image-src`  | `ZurichImageName` \| URL                            | —       | No       | Imagen circular del lado `aside`.                                      |
| `image-alt`  | `string`                                             | —       | No       | Alt text de la imagen.                                                 |
| `custom`     | `CustomTokens<'bg'\|'color'>`                       | —       | No       | Override de fondo/color.                                              |

---

## 4. Events

> No declara eventos propios (`ZPromo_Events = {}`).

---

## 5. Slots

Slots declarados (`zPromoSlots`): `content`, `header`, `category`, `image-src`, `actions`. Sub-componentes dedicados disponibles: `ZrPromo.Header`, `ZrPromo.Content` (per `web-components/dist/react/promo.d.ts`).

---

## 6. CSS Customization Tokens

| CSS Variable            | Type   | Purpose                                                         |
|---------------------------|--------|---------------------------------------------------------------------|
| `--z-promo--bg`           | color  | Fondo (default `var(--z-bg-primary--inv)`).                          |
| `--z-promo--color`        | color  | Color de texto (default `var(--z-ct--primary)`).                     |
| `--z-promo--gap`          | length | Espacio entre `aside` y `main` (default `var(--zs-grid-gutter)`).     |
| `--z-promo--img-bg`       | color  | Fondo detrás de la imagen circular (default `var(--z-bg-brand)`).     |

---

## 7. Canonical Examples

### 7.1 Mínimo — texto a la izquierda, imagen a la derecha (default)
```tsx
<ZrPromo
  category="Atención al cliente"
  header="Radica tu PQR en minutos"
  content="Cuéntanos qué pasó y te ayudamos a resolverlo lo antes posible."
  image-src="/pqr-hero.webp"
  shape="3"
/>
```

### 7.2 Imagen a la izquierda (`config="left"`)
```tsx
<ZrPromo config="left" category="Atención al cliente" header="Radica tu PQR" content="..." image-src="/pqr-hero.webp" shape="3" />
```

### 7.3 Angosto (para un panel lateral)
```tsx
<ZrPromo config="narrow" header="¿Necesitas ayuda?" content="Contáctanos" image-src="/help.webp" />
```

### 7.4 Con CTA
```tsx
<ZrPromo header="Radica tu PQR" content="..." image-src="/pqr-hero.webp">
  <ZrButton slot="actions" config="positive:s">Empezar</ZrButton>
</ZrPromo>
```

### 7.5 Sin figura decorativa
```tsx
<ZrPromo header="Radica tu PQR" content="..." image-src="/pqr-hero.webp" shape="null" />
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`shape` en `ZrPromo` se superpone a la imagen** (posición absoluta dentro de `aside`), a diferencia de `ZrStageBanner` donde la figura flota suelta junto al banner — no son intercambiables 1:1 visualmente.
- ❗ **`config="left"` invierte imagen/texto**, no solo alinea el texto (diferencia clave vs. `ZrStageBanner.config`).
- ❗ **No inventar el slot `actions` sin confirmarlo en runtime** — está declarado en el tipo (`zPromoSlots`) pero no apareció explícitamente en el CSS extraído; verificar visualmente antes de depender de su posicionamiento exacto.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                              → Use...
------------------------------------------------------------------------------
banner hero CENTRADO (imagen arriba, texto abajo)               → ZrStageBanner (ver zurich-stagebanner.md)
banner RECTANGULAR con imagen a un lado y texto al otro         → ZrPromo (este)
imagen a la derecha, texto a la izquierda (default)              → ZrPromo sin config
imagen a la izquierda                                             → ZrPromo config="left"
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type ZrPromoProps = {
  config?: 'left' | 'narrow' | 'left:narrow';
  header?: string | React.ReactNode;
  content?: string | React.ReactNode;
  category?: string | React.ReactNode;
  shape?: '1'|'2'|'3'|'4'|'5'|'6'|'7'|'null';
  'image-src'?: string;
  'image-alt'?: string;
};
```

---

## 11. Composition Patterns

### 11.1 Candidato de reemplazo de `.pqr-banner*` (layout rectangular actual)
```tsx
<ZrPromo
  category="Atención al cliente"
  header="Radica tu queja o reclamo"
  content="Cuéntanos qué pasó y te ayudamos a resolverlo."
  image-src="/pqr-hero.webp"
  shape="3"
  style={{
    ['--z-promo--bg' as any]: 'var(--z-blue)',
    ['--z-promo--color' as any]: 'var(--zg-white-zurich)',
  }}
/>
```

> Este es el candidato **más cercano** al diseño actual de `.pqr-banner` (rectangular, texto a la izquierda, figura decorativa asomando a la derecha) — más cercano que `ZrStageBanner` (que es centrado/hero). Confirmar visualmente ambos contra el diseño aprobado antes de decidir cuál migrar.
