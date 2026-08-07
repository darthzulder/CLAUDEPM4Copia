# ZrFooter — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/Footer.props.d.ts` + `web-components/dist/footer.d.ts` + `css-components/dist/Footer.css`.
> **Platform:** React / Web / CSS
> **Category:** Layout *(structural/footer corporativo)*
> **Package:** `@zurich/web-components/react/footer`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida un **footer corporativo** con columnas de enlaces + redes sociales + legales — candidato directo a reemplazar `.pqr-footer*` en `shared.css`.

1. Import:
   ```tsx
   import { ZrFooter } from '@zurich/web-components/react/footer';
   ```
2. `columns`: array de **2 a 4** grupos `{ header: string, items: {to, text}[] }` — se renderizan en columnas iguales (`grid-auto-flow: column`).
3. `footer`: array plano de `{to, text}` — fila inferior de enlaces legales, alineada a la derecha (`nav ul { justify-content: right }`).
4. `social`: objeto `{ [nombreDeRedSocial]?: url }` con claves de `SocialMediaIconName` (`bluesky`, `facebook`, `instagram`, `line`, `linkedin`, `pinterest`, `reddit`, `spotify`, `telegram`, `threads`, `tiktok`, `twitter`, `wechat`, `whatsapp`, `workplace`, `youtube`).
5. `social-text` — texto junto a los íconos sociales (p.ej. "Síguenos").
6. No declara eventos ni slots (`zFooterSlots: never[]`) — todo el contenido va por props estructurados, no por children.

---

## 2. Import

```tsx
import { ZrFooter } from '@zurich/web-components/react/footer';
```

---

## 3. Props (Parameters)

| Prop            | Type                                                                 | Default | Required | Description                                                          |
|-----------------|-------------------------------------------------------------------------|---------|----------|--------------------------------------------------------------------------|
| `columns`       | `{ header: string; items: {to: string; text: string}[] }[]` (longitud 2\|3\|4) | —       | No       | Columnas de enlaces con título.                                          |
| `footer`        | `{ to: string; text: string }[]`                                       | —       | No       | Fila inferior de enlaces legales (alineada a la derecha).                |
| `social`        | `Partial<Record<SocialMediaIconName, string>>`                         | —       | No       | Íconos sociales → URL.                                                    |
| `social-text`   | `string`                                                                | —       | No       | Texto junto a los íconos sociales.                                        |
| `custom`        | `CustomTokens<'bg'\|'color'>`                                          | —       | No       | Override de fondo/color.                                                  |

---

## 4. Events

> No declara eventos propios.

---

## 5. Slots

> `zFooterSlots: never[]` — no declara slots. Todo el contenido se pasa por los props estructurados de §3.

---

## 6. CSS Customization Tokens

| CSS Variable         | Type   | Purpose                                                       |
|-----------------------|--------|------------------------------------------------------------------|
| `--z-footer--bg`      | color  | Fondo (default: `var(--z-sf-brand)`).                             |
| `--z-footer--color`   | color  | Color de texto/enlaces (default: `var(--z-ct-clickable)`).        |

---

## 7. Canonical Examples

### 7.1 Mínimo — solo legales
```tsx
<ZrFooter
  footer={[
    { to: '/privacidad', text: 'Política de privacidad' },
    { to: '/terminos', text: 'Términos y condiciones' },
  ]}
/>
```

### 7.2 Con columnas de enlaces
```tsx
<ZrFooter
  columns={[
    { header: 'Productos', items: [{ to: '/dyo', text: 'D&O' }, { to: '/cc', text: 'CC' }] },
    { header: 'Ayuda', items: [{ to: '/faq', text: 'Preguntas frecuentes' }] },
  ]}
  footer={[{ to: '/legal', text: 'Aviso legal' }]}
/>
```

### 7.3 Con redes sociales
```tsx
<ZrFooter
  social={{ linkedin: 'https://linkedin.com/company/zurich', youtube: 'https://youtube.com/zurich' }}
  social-text="Síguenos"
  footer={[{ to: '/legal', text: 'Aviso legal' }]}
/>
```

### 7.4 Themed
```tsx
<ZrFooter
  columns={[/* ... */]}
  style={{
    ['--z-footer--bg' as any]: 'var(--zc-blue-dark)',
    ['--z-footer--color' as any]: 'var(--zg-white-zurich)',
  }}
/>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`columns` acepta entre 2 y 4 elementos** — el tipo lo restringe (`& {length: 2|3|4}`); no pasar 1 ni 5+.
- ❗ **No hay slots** — no intentar pasar `children`/`slot="..."`. Todo el contenido (columnas, legales, social) va por props de datos.
- ❗ **`footer` (prop) es la fila inferior, no confundir con el componente `<ZrFooter>` mismo** — nombre desafortunado pero así está tipado en el DS.
- ❗ **`social` usa claves fijas** de `SocialMediaIconName` — no inventar nombres de red social fuera de esa lista.
- ❗ **BUG del vendor (confirmado en runtime, 0.8.1):** `columns`/`footer`/`social` son props array/objeto. El wrapper React del vendor (`useCustomElement()`) las serializa con `JSON.stringify()` antes de pasarlas al custom element; como el elemento ya declara esas props como reactive properties de Lit, React las asigna como PROPIEDAD del nodo (no como atributo) y la propiedad queda con el string crudo sin re-parsear — `this.columns?.map is not a function` en runtime. **La fachada `ZdsFields.tsx` ya parchea esto** (reasigna las props reales por `querySelector` en un `useEffect` tras el montaje) — usar `ZrFooter` **solo desde `ZdsFields.tsx`**, nunca importar `@zurich/web-components/react/footer` directo, o se vuelve a romper.
- ❗ **La columna "social" siempre se renderiza**, incluso sin pasar `social` — el título por defecto es literalmente **"Follow us"** (hardcodeado en el template si no se pasa `social-text`), y la columna aparece vacía de íconos si `social` no trae claves. Si el diseño no quiere esa columna, hay que ocultarla con CSS (`[data-social]{display:none}` vía `custom`/`style`) — no hay prop para omitirla.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                    → Use...
--------------------------------------------------------------------------
footer corporativo con columnas + legales + social    → <ZrFooter columns footer social>
solo fila de legales (sin columnas)                    → <ZrFooter footer>
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type Link = { to: string; text: string };
type ZrFooterProps = {
  columns?: ({ header: string; items: Link[] })[]; // length 2|3|4
  footer?: Link[];
  social?: Partial<Record<
    'bluesky'|'facebook'|'instagram'|'line'|'linkedin'|'pinterest'|'reddit'|'spotify'|
    'telegram'|'threads'|'tiktok'|'twitter'|'wechat'|'whatsapp'|'workplace'|'youtube', string>>;
  'social-text'?: string;
};
```

---

## 11. Composition Patterns

### 11.1 Candidato de reemplazo de `.pqr-footer*`
```tsx
<ZrFooter
  columns={[
    { header: 'Zurich Colombia', items: [{ to: '/nosotros', text: 'Quiénes somos' }] },
    { header: 'Atención al cliente', items: [{ to: '/pqr', text: 'PQR' }, { to: '/contacto', text: 'Contacto' }] },
  ]}
  footer={[
    { to: '/legal', text: 'Aviso legal' },
    { to: '/privacidad', text: 'Política de privacidad' },
  ]}
/>
```

> Diferencia clave con `.pqr-footer` actual: el diseño hecho a mano usa una **divisoria vertical** (`.pqr-footer-divider`) entre bloques de link y legales — `z-footer` no expone esa divisoria como prop; si es un requisito visual estricto del diseño aprobado, puede necesitar un pequeño ajuste vía `custom`/`style` o quedar como diferencia aceptada al migrar.
