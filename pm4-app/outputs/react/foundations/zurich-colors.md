# Zurich Colors — Foundations

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same tokens everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion doc:** see [`zurich-colors-palettes.md`](./zurich-colors-palettes.md) for the **complete palette tables** (HEX / HSL / RGB values per shade).
> **Scope of this file:** the **token taxonomy** — what each color category is, how it should be used, and the canonical CSS-variable names.

---

## 1. AI Implementation Instructions

When the user asks about **colors**, **brand color**, **Zurich blue**, **palette**, **gray scale**, **status colors** (error / warning / success / info), **overlays / scrims**, **theming**, **accent color**, **background harmony**, **color tokens**, or **accessible color choices**, use this foundation.

1. **Never hardcode HEX values.** Always reference a CSS variable: `var(--zc-blue-zurich)`, `var(--zg-3)`, `var(--zc-peach-aa)`, etc.
2. **Pick from the right category** depending on intent (see §3):
   - `--zc-*` → **Brand**, **Secondary**, and **Tints** (warm/cool accents).
   - `--zg-*` → **Gray** scale + white.
   - `--zo-*` → **Overlay** colors (scrims / dimmed backgrounds).
3. **Zurich Blue is the anchor color.** Use it consistently — it must remain visible across every Zurich communication.
4. **"Blue is our black"** in most contexts. Reach for `--zc-blue-dark` before reaching for actual black for headings and body text.
5. **For status states**, use the semantic shades documented in §7 (e.g. `--zc-peach-aa` for errors). Do **not** invent your own red/green/yellow tokens.
6. **For overlays / modal backdrops**, use `--zo-*` tokens — they already include the alpha channel.
7. **Accessibility:** shades suffixed with `-aa` and `-aaa` are pre-validated for those WCAG contrast levels. Use them when you need text-quality contrast on top of their parent color.
8. **Mix at most 3 background colors per page.** Beyond that, the layout loses the clean, classy Zurich look.
9. **Black** (`--zg-9` ≈ pure black) should only be used for long sections of small body copy in print. On screen, prefer a tint of black (gray scale) or `--zc-blue-dark`.

---

## 2. Token Families at a Glance

| Family   | Prefix     | Purpose                                                                 |
|----------|-----------|--------------------------------------------------------------------------|
| Brand    | `--zc-blue-*`, `--zc-sand-stone`, `--zc-dove`, `--zg-white-zurich`        | Core brand palette — must appear consistently across all surfaces.      |
| Tints    | `--zc-blue-*-<N>`, `--zc-blue-sky-aa`, `--zc-dove-light`                  | Lightened/darkened tints derived from brand colors for harmonious mixes. |
| Secondary| `--zc-azure-*`, `--zc-moss-*`, `--zc-teal-*`, `--zc-mint-*`, `--zc-lime-*`, `--zc-lemon-*`, `--zc-peach-*`, `--zc-candy-*`, `--zc-powder-pink-*`, `--zc-lilac-*` | Warm/cool accents that complement the brand palette.       |
| Gray     | `--zg-1` … `--zg-9`, `--zg-white`                                         | Functional neutrals — backgrounds, dividers, body copy.                 |
| Status   | `--zc-peach-*`, `--zc-lemon-*`, `--zc-moss-*`, `--zc-blue-sky-*`          | Re-using palette shades for error / warning / success / info states.    |
| Overlay  | `--zo-blue-zurich`, `--zo-white`, `--zo-black`                            | Translucent scrims for backdrops, dimming, image overlays.              |

> Prefix conventions:
> - `--zc-` → **c**olor (brand, secondary, tints).
> - `--zg-` → **g**ray.
> - `--zo-` → **o**verlay (translucent).

---

## 3. Brand Colors (8 tokens)

This is the palette used with **consistent visibility across every Zurich communication**. Variations in tone and saturation are curated; use them in harmony with the rest of the design.

| Color           | CSS token              | Notes                                                                 |
|-----------------|------------------------|-----------------------------------------------------------------------|
| Dark blue       | `--zc-blue-dark`       | Default text color on light backgrounds. "Blue is our black."         |
| Zurich blue     | `--zc-blue-zurich`     | The anchor — must be present consistently across every surface.       |
| Mid blue        | `--zc-blue-mid`        | Mid-tone for accents and secondary surfaces.                          |
| Light blue      | `--zc-blue-light`      | Soft brand background.                                                |
| Sky blue        | `--zc-blue-sky`        | Bright accent — used as the brand's information color too.            |
| Sand stone      | `--zc-sand-stone`      | Warm brand neutral.                                                   |
| Dove            | `--zc-dove`            | Warm brand neutral (lighter than sand stone).                         |
| Zurich white    | `--zg-white-zurich`    | The Zurich white — slightly off-white, more friendly than pure white. |

```css
.title          { color: var(--zc-blue-dark); }            /* body/heading on light bg */
.brand-banner   { background: var(--zc-blue-zurich); color: var(--zg-white-zurich); }
.muted-card-bg  { background: var(--zc-dove); }
.warm-section   { background: var(--zc-sand-stone); }
```

---

## 4. Tints (10 tokens)

Lightened/darkened variants of brand colors used to **balance energy and harmony** when composing surfaces.

| Token                       | Notes                                            |
|-----------------------------|--------------------------------------------------|
| `--zc-blue-dark-90`         | Slightly lighter dark blue.                      |
| `--zc-blue-zurich-90`       | Slightly lighter Zurich blue.                    |
| `--zc-blue-light-40`        | Very pale brand tint.                            |
| `--zc-blue-light-10`        | Wash-level brand tint (background fills).        |
| `--zc-blue-sky-aa`          | Sky blue darkened for AA-accessible foregrounds. |
| `--zc-blue-sky-80`          | Bright sky tint.                                 |
| `--zc-blue-sky-40`          | Light sky tint (alerts, info chips).             |
| `--zc-blue-sky-25`          | Soft sky tint.                                   |
| `--zc-blue-sky-10`          | Wash-level sky tint.                             |
| `--zc-dove-light`           | Lighter dove (warm neutral wash).                |

> ⚠️ **Don't mix more than 3 background colors on the same page.** Keep the look clean.

---

## 5. Secondary Colors (10 hues × 5–8 shades each ≈ 57 tokens)

Purposeful warm and cool accents that complement the brand palette without overpowering it.

Each hue exposes shades **20, 40, 60, 80, 100** (light → saturated), plus optional accessibility shades **aa** and/or **aaa** where applicable.

| Hue          | Token base              | AA shade (if any)     | AAA shade (if any)      |
|--------------|-------------------------|-----------------------|-------------------------|
| Azure        | `--zc-azure-<20/40/60/80/100>`               | —                     | —                       |
| Moss         | `--zc-moss-<20/40/60/80/100>`                | `--zc-moss-aa`        | `--zc-moss-aaa`         |
| Teal         | `--zc-teal-<20/40/60/80/100>`                | `--zc-teal-aa`        | —                       |
| Mint         | `--zc-mint-<20/40/60/80/100>`                | —                     | —                       |
| Lime         | `--zc-lime-<20/40/60/80/100>`                | —                     | —                       |
| Lemon        | `--zc-lemon-<20/40/60/80/100>`               | `--zc-lemon-aa`       | —                       |
| Peach        | `--zc-peach-<20/40/60/80/100>` (also `10`)   | `--zc-peach-aa`       | `--zc-peach-aaa`        |
| Candy        | `--zc-candy-<20/40/60/80/100>`               | `--zc-candy-aa`       | —                       |
| Powder pink  | `--zc-powder-pink-<20/40/60/80/100>`         | —                     | —                       |
| Lilac        | `--zc-lilac-<20/40/60/80/100>`               | —                     | —                       |

> Numerical shade convention: **higher = more saturated**. `20` is the lightest tint, `100` is the fully saturated brand version of the hue.

> **Always pick the `-aa` (or `-aaa`) shade when the color is used as text on a contrasting background.** Other shades are intended for backgrounds, fills, and decoration.

See [`zurich-colors-palettes.md`](./zurich-colors-palettes.md) for the **HEX / HSL / RGB / luminance** values per shade.

---

## 6. Gray Palette (10 tokens) + White

Neutrals fulfill functional roles: dividers, backgrounds, body copy, disabled states.

| Token           | Role                                                              |
|-----------------|-------------------------------------------------------------------|
| `--zg-white`    | Pure white. Use sparingly — `--zg-white-zurich` is usually better. |
| `--zg-1`        | Lightest gray (near-white).                                        |
| `--zg-2`        | Very light surface / divider.                                      |
| `--zg-3`        | Light surface.                                                     |
| `--zg-4`        | Medium-light.                                                      |
| `--zg-5`        | Mid gray.                                                          |
| `--zg-6`        | Medium-dark.                                                       |
| `--zg-7`        | Dark gray.                                                         |
| `--zg-8`        | Very dark gray.                                                    |
| `--zg-9`        | Near black / black.                                                |

> **Black usage rule:** use `--zg-9` only for **long sections of small body copy in print**. On screen, prefer a tint (`--zg-7` / `--zg-8`) or `--zc-blue-dark`. In most Zurich UI, **blue is our black**.

---

## 7. Status Colors (8 tokens)

Status communicates meaning. Re-use the canonical shades below — do not invent new red/green/yellow values.

| Status      | Tokens                                | Common usage                                                              |
|-------------|---------------------------------------|---------------------------------------------------------------------------|
| Error       | `--zc-peach-aa`, `--zc-peach-80`      | Destructive actions, error states, validation failures.                   |
| Warning     | `--zc-lemon-aa`, `--zc-lemon-80`      | Potentially destructive / "on-hold" / attention-grabbing confirmations.   |
| Success     | `--zc-moss-aa`, `--zc-moss-80`        | Positive action / positive trend / successful confirmation.               |
| Information | `--zc-blue-sky-aa`, `--zc-blue-sky-80`| Neutral information, hints, tips.                                         |

```css
.alert-error    { color: var(--zc-peach-aa);   background: var(--zc-peach-20); }
.alert-warning  { color: var(--zc-lemon-aa);   background: var(--zc-lemon-20); }
.alert-success  { color: var(--zc-moss-aa);    background: var(--zc-moss-20); }
.alert-info     { color: var(--zc-blue-sky-aa);background: var(--zc-blue-sky-25); }
```

> **Foreground = `-aa` shade, background = a `20`/`25`/`40` tint** is the canonical alert pattern.

---

## 8. Overlay Colors (3 tokens)

Translucent scrims with alpha baked in. Use these for modal backdrops, image overlays, loading dimmers.

| Token                 | Notes                                              |
|-----------------------|----------------------------------------------------|
| `--zo-blue-zurich`    | Branded blue overlay (default for modals).         |
| `--zo-white`          | Light overlay — dims with a brightening pass.      |
| `--zo-black`          | Dark overlay — strongest dimming effect.           |

```css
.modal-backdrop  { background: var(--zo-blue-zurich); }
.image-fade      { background: linear-gradient(180deg, transparent, var(--zo-black)); }
.skeleton-shade  { background: var(--zo-white); }
```

---

## 9. Canonical Examples

### 9.1 Default text on light surface
```css
body { color: var(--zc-blue-dark); background: var(--zg-white-zurich); }
```

### 9.2 Branded hero
```tsx
<section style={{
  background: 'var(--zc-blue-zurich)',
  color:      'var(--zg-white-zurich)',
}}>
  <h1 z-heading="display">Welcome to Zurich</h1>
</section>
```

### 9.3 Card with warm neutral background
```tsx
<ZrCard
  config="grid"
  style={{
    ['--z-card--bg' as any]:    'var(--zc-dove)',
    ['--z-card--color' as any]: 'var(--zc-blue-dark)',
  }}
>
  Coverage details
</ZrCard>
```

### 9.4 Success alert
```tsx
<div style={{
  color:      'var(--zc-moss-aa)',
  background: 'var(--zc-moss-20)',
  padding:    '0.75rem 1rem',
  borderRadius: '8px',
}}>
  Your policy has been activated.
</div>
```

### 9.5 Error / destructive button
```tsx
<ZrButton
  config="negative"
  style={{
    ['--z-button--bg' as any]:    'var(--zc-peach-aa)',
    ['--z-button--color' as any]: 'var(--zg-white)',
  }}
>
  Delete
</ZrButton>
```

### 9.6 Modal with branded backdrop
```tsx
<ZrModal
  model={open}
  onChange={(v) => setOpen(v)}
  style={{ ['--z-modal--backdrop' as any]: 'var(--zo-blue-zurich)' }}
>
  Content
</ZrModal>
```

### 9.7 Page with at most 3 background colors
```tsx
<>
  <header style={{ background: 'var(--zc-blue-zurich)' }}>…</header>
  <main   style={{ background: 'var(--zg-white-zurich)' }}>…</main>
  <aside  style={{ background: 'var(--zc-dove)' }}>…</aside>
</>
```

### 9.8 Avoid: anti-pattern examples
```css
/* ❌ Hardcoded HEX */
.card { background: #DBEFF8; }

/* ❌ Using true black for on-screen body copy */
.body { color: #000; }

/* ❌ Inventing a custom red instead of using peach status tokens */
.error { color: red; }

/* ❌ Mixing 4+ background colors in the same page */

/* ❌ Using a non-aa shade as a text color on a contrasting background */
.body-on-moss-100 { color: var(--zc-moss-100); } /* low contrast */
```

---

## 10. Decision Rules (for the AI)

- ❗ **Always reference tokens** via `var(--zc-*)`, `var(--zg-*)`, or `var(--zo-*)`. **Never** hardcode HEX.
- ❗ **Zurich blue is non-negotiable.** It must remain consistently visible across all Zurich UI.
- ❗ **Dark blue is the default text color** on light backgrounds; white on dark.
- ❗ **For text on a saturated brand/secondary color**, switch to the `-aa` or `-aaa` shade so contrast remains accessible.
- ❗ **Status palette is fixed:** error = peach, warning = lemon, success = moss, info = sky blue. Don't substitute.
- ❗ **Status pattern:** `color: -aa` shade + `background: -20/-25/-40` tint.
- ❗ **Overlays (`--zo-*`) include alpha** — don't add additional opacity layers on top.
- ❗ **Gray scale** for functional neutrals; **black only** for printed body copy.
- ❗ **Maximum 3 background colors** per page.
- ❗ **Tokens are global CSS variables** — usable in inline `style`, CSS rules, CSS-in-JS, ZDS component `--z-*-bg` tokens, etc.

---

## 11. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
default page background                                 → --zg-white-zurich
default body / heading text color                       → --zc-blue-dark
branded hero / banner background                        → --zc-blue-zurich
accent / hover color                                    → --zc-blue-sky or --zc-blue-mid
warm neutral background                                 → --zc-dove or --zc-sand-stone
divider line / muted surface                            → --zg-2 / --zg-3
error state (text + bg pair)                            → --zc-peach-aa + --zc-peach-20
warning state                                           → --zc-lemon-aa + --zc-lemon-20
success state                                           → --zc-moss-aa + --zc-moss-20
information state                                       → --zc-blue-sky-aa + --zc-blue-sky-25
modal backdrop                                          → --zo-blue-zurich
image overlay / dimmer                                  → --zo-black or --zo-white
text on a saturated -100 color                          → use the matching -aa (or -aaa) shade
inventing a custom red / green / yellow                 → ❌ use status palette
hardcoded HEX                                           → ❌ use the CSS variable
4+ different background colors                          → ❌ trim down to ≤ 3
```

---

## 12. Composition Patterns

### 12.1 Reusable semantic CSS layer
```css
:root {
  --z-color-text:        var(--zc-blue-dark);
  --z-color-text-muted:  var(--zg-7);
  --z-color-background:  var(--zg-white-zurich);
  --z-color-surface:     var(--zc-dove);
  --z-color-primary:     var(--zc-blue-zurich);
  --z-color-info:        var(--zc-blue-sky-aa);
  --z-color-success:     var(--zc-moss-aa);
  --z-color-warning:     var(--zc-lemon-aa);
  --z-color-error:       var(--zc-peach-aa);
}

body {
  color:      var(--z-color-text);
  background: var(--z-color-background);
}
```

### 12.2 Themed card via Color foundation + Card tokens
```tsx
<ZrCard
  config="grid"
  style={{
    ['--z-card--bg' as any]:     'var(--zc-blue-light-10)',
    ['--z-card--color' as any]:  'var(--zc-blue-dark)',
    ['--z-card--radius' as any]: '12px',
  }}
>
  <h3 z-heading="22" style={{ margin: 0 }}>Plan summary</h3>
  <p style={{ font: 'var(--zf-body-16)' }}>Premium plan — €19 / month</p>
</ZrCard>
```

### 12.3 Status alert factory (React)
```tsx
type Status = 'info' | 'success' | 'warning' | 'error';

const ALERT_TOKENS: Record<Status, { color: string; background: string }> = {
  info:    { color: 'var(--zc-blue-sky-aa)', background: 'var(--zc-blue-sky-25)' },
  success: { color: 'var(--zc-moss-aa)',     background: 'var(--zc-moss-20)'    },
  warning: { color: 'var(--zc-lemon-aa)',    background: 'var(--zc-lemon-20)'   },
  error:   { color: 'var(--zc-peach-aa)',    background: 'var(--zc-peach-20)'   },
};

export function Alert({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: 8, ...ALERT_TOKENS[status] }}>
      {children}
    </div>
  );
}
```

### 12.4 Brand-respectful page composition (≤ 3 backgrounds)
```tsx
<>
  <header style={{ background: 'var(--zc-blue-zurich)', color: 'var(--zg-white-zurich)' }}>
    {/* header */}
  </header>

  <main style={{ background: 'var(--zg-white-zurich)' }}>
    {/* main content */}
  </main>

  <aside style={{ background: 'var(--zc-dove)' }}>
    {/* highlighted sidebar */}
  </aside>
</>
```

> Rule of thumb: **Pick tokens by intent (brand / tint / secondary / gray / status / overlay), use `-aa` / `-aaa` shades for text, status pairs `color: -aa` + `background: -20/-25/-40`, overlays via `--zo-*`, and never more than 3 backgrounds on a page.**
