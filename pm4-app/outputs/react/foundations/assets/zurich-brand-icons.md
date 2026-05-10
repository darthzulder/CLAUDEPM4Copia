# Zurich Brand Icons — Foundations / Assets

> **Category:** Foundations / Assets *(third-party brand logos)*
> **Platform:** Platform-agnostic
> **Package:** `@zurich/design-tokens` / `@zurich/web-components`
> **Companion doc:** see [`zurich-icons.md`](./zurich-icons.md) for the **generic Zurich icon set** (action, communication, status, …).
> **Scope of this file:** **social media / third-party brand icons** — Facebook, Instagram, LinkedIn, X (Twitter), YouTube, WhatsApp, TikTok, and friends.

---

## 1. AI Implementation Instructions

When the user asks for **social icons**, **share buttons**, **footer social links**, **a brand logo** (Facebook, Instagram, LinkedIn, etc.), **mono vs color icon**, or wants to **link out to a social network**, use this foundation.

1. **Catalog-first.** Use only the documented brand names in §3. Brand logos are legal/trademark-sensitive — don't invent variants.
2. **Two visual variants** per brand:
   - **Color** — original brand color (default for footers / share rows / playful contexts).
   - **Mono** — monochrome version (use on dark backgrounds, dense UI, when the visual hierarchy demands restraint).
3. **Naming pattern:** the icon string is the **brand name** (lowercase, hyphenated when needed). Use:
   - Color: `icon="<brand>"`
   - Mono:  `icon="<brand>:mono"` *(suffix `:mono`)*
4. **Color brand icons override** the standard "Zurich Blue" default — they carry the brand's own colors. **Don't apply ZDS color tokens on top.**
5. **Don't recolor color icons.** Brand guidelines forbid that. If a single tone is needed, switch to the **mono** variant instead.
6. **Use ZDS components for the trigger.** Wrap the icon in a `<ZrButton href="…" target="_blank" icon="…" />` so the link, focus ring, and accessibility behavior are handled.
7. **Always include an accessible name** when the icon stands alone (e.g. `aria-label="Open Facebook page"`).
8. **External links should open in `_blank`** with `rel="noopener noreferrer"`-equivalent semantics when not handled by ZDS.

---

## 2. Variants

| Variant | Suffix    | Use when                                              |
|---------|-----------|-------------------------------------------------------|
| Color   | *(none)*  | Footers, marketing pages, share rows, playful UI.     |
| Mono    | `:mono`   | Dark / branded backgrounds, dense UI, app chrome.     |

```tsx
{/* Color (default) */}
<ZrIcon icon="facebook" />

{/* Monochrome */}
<ZrIcon icon="facebook:mono" />
```

> ⚠️ **Don't** stack color and mono via `style` overrides. If only one tone is wanted, pick `:mono`.

---

## 3. Available Brand Icons

The catalog covers the main mainstream social platforms. Both **Color** and **Mono** versions are available unless explicitly noted otherwise.

| Icon name      | Brand       | Color | Mono |
|----------------|-------------|:-----:|:----:|
| `bluesky`      | Bluesky     |  ✅    | ✅    |
| `facebook`     | Facebook    |  ✅    | ✅    |
| `instagram`    | Instagram   |  ✅    | ✅    |
| `line`         | LINE        |  ✅    | ✅    |
| `linkedin`     | LinkedIn    |  ✅    | ✅    |
| `pinterest`    | Pinterest   |  ✅    | ✅    |
| `reddit`       | Reddit      |  ✅    | ✅    |
| `spotify`      | Spotify     |  ✅    | ✅    |
| `telegram`     | Telegram    |  ✅    | ✅    |
| `threads`      | Threads     |  ✅    | ✅    |
| `tiktok`       | TikTok      |  ✅    | ✅    |
| `twitter`      | X (Twitter) |  ✅    | ✅    |
| `wechat`       | WeChat      |  ✅    | ✅    |
| `whatsapp`     | WhatsApp    |  ✅    | ✅    |
| `workplace`    | Workplace   |  ✅    | ✅    |
| `youtube`      | YouTube     |  ✅    | ✅    |

> ⚠️ **`line`** is the LINE messenger — don't confuse it with the `:line` outline suffix of generic icons (different concept entirely).
> ⚠️ **`twitter`** still resolves to the X / Twitter brand logo; the icon hasn't been renamed in the catalog.

---

## 4. Canonical Examples

### 4.1 Color icon (default)
```tsx
<ZrIcon icon="facebook" />
<ZrIcon icon="instagram" />
<ZrIcon icon="linkedin" />
```

### 4.2 Monochrome variant (e.g. for dark footers)
```tsx
<ZrIcon icon="facebook:mono" />
<ZrIcon icon="instagram:mono" />
<ZrIcon icon="linkedin:mono" />
```

### 4.3 Social link with `<ZrButton>` (recommended)
```tsx
<ZrButton
  href="https://www.linkedin.com/company/zurich-insurance/"
  target="_blank"
  icon="linkedin"
  aria-label="Open Zurich on LinkedIn"
/>
```

### 4.4 Footer with a row of brand icons
```tsx
<footer style={{ background: 'var(--zc-blue-dark)', padding: '1rem 1.5rem' }}>
  <nav z-flex="100" z-align="center" aria-label="Social media">
    <ZrButton href="https://facebook.com/Zurich"  target="_blank" icon="facebook:mono"  aria-label="Facebook" />
    <ZrButton href="https://instagram.com/zurich" target="_blank" icon="instagram:mono" aria-label="Instagram" />
    <ZrButton href="https://linkedin.com/company/zurich-insurance" target="_blank" icon="linkedin:mono" aria-label="LinkedIn" />
    <ZrButton href="https://youtube.com/@zurich"  target="_blank" icon="youtube:mono"  aria-label="YouTube" />
    <ZrButton href="https://twitter.com/zurich"   target="_blank" icon="twitter:mono"  aria-label="X (Twitter)" />
  </nav>
</footer>
```

### 4.5 Share row (color)
```tsx
<aside aria-label="Share this article" z-flex="50">
  <ZrButton href="https://twitter.com/intent/tweet?…"   target="_blank" icon="twitter"  aria-label="Share on X" />
  <ZrButton href="https://www.facebook.com/sharer/…"     target="_blank" icon="facebook" aria-label="Share on Facebook" />
  <ZrButton href="https://www.linkedin.com/sharing/…"    target="_blank" icon="linkedin" aria-label="Share on LinkedIn" />
  <ZrButton href="https://api.whatsapp.com/send?text=…" target="_blank" icon="whatsapp" aria-label="Share on WhatsApp" />
</aside>
```

### 4.6 Standalone icon inside a tooltip
```tsx
<ZrTooltip text="Follow us on Instagram" config="top">
  <ZrIcon icon="instagram" />
</ZrTooltip>
```

### 4.7 React loop over a config-driven social list
```tsx
const socials = [
  { id: 'facebook',  url: 'https://facebook.com/Zurich' },
  { id: 'instagram', url: 'https://instagram.com/zurich' },
  { id: 'linkedin',  url: 'https://linkedin.com/company/zurich-insurance' },
  { id: 'youtube',   url: 'https://youtube.com/@zurich' },
  { id: 'twitter',   url: 'https://twitter.com/zurich' },
  { id: 'tiktok',    url: 'https://www.tiktok.com/@zurich' },
] as const;

export function SocialRow({ mono = false }: { mono?: boolean }) {
  return (
    <nav z-flex="100" z-align="center" aria-label="Social media">
      {socials.map((s) => (
        <ZrButton
          key={s.id}
          href={s.url}
          target="_blank"
          icon={mono ? `${s.id}:mono` : s.id}
          aria-label={`Open ${s.id}`}
        />
      ))}
    </nav>
  );
}
```

### 4.8 Avoid: anti-patterns
```tsx
{/* ❌ Recoloring a Color icon */}
<ZrIcon icon="facebook" style={{ color: 'var(--zc-blue-zurich)' }} />
// → use icon="facebook:mono" instead.

{/* ❌ Inventing a brand name not in the catalog */}
<ZrIcon icon="snapchat" />          // not available — leave the platform out.

{/* ❌ Confusing `line` (LINE messenger) with the outline suffix */}
<ZrIcon icon="instagram:line" />    // wrong — outline doesn't apply to brand icons.

{/* ❌ Missing accessible name on a link-only icon button */}
<ZrButton href="…" target="_blank" icon="linkedin" />  // add aria-label!
```

---

## 5. Behavior Rules (for the AI)

- ❗ **Catalog-first.** Use only the brand names in §3. If a brand isn't listed, **omit it** rather than substituting a similar one.
- ❗ **Variant suffix is `:mono`** for monochrome. Anything else (`:line`, `:solid`, `:white`) does **not** apply to brand icons.
- ❗ **Don't recolor color icons** — switch to `:mono` instead. Brand guidelines disallow color overrides.
- ❗ **`twitter` still maps to X / Twitter** in the catalog.
- ❗ **`line` is the LINE messenger** — not the outline modifier from `zurich-icons.md`.
- ❗ **Pair icons with accessible names** when they are the only content of a link/button (`aria-label="…"`).
- ❗ **Use ZDS components for the trigger** (`<ZrButton href>`) so focus, hover, and a11y behave consistently across the design system.
- ❗ **External links open in `_blank`** unless the user specifies otherwise.
- ❗ **Mono on dark, Color on light** is the default rule of thumb — adjust only when contrast or brand requires it.

---

## 6. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
footer with social icons                                → loop §3 + :mono variants on dark bg
share buttons on a colorful page                        → §3 names, default Color variant
add a single LinkedIn link                              → <ZrButton href="..." target="_blank" icon="linkedin" aria-label="..." />
icon-only social toolbar                                → wrap in z-flex container, add aria-label per ZrButton
icon for a brand not in §3                              → ❌ omit / use a text label only
recolor Facebook blue to Zurich blue                    → ❌ switch to icon="facebook:mono"
the "X" social network                                  → icon="twitter" (catalog hasn't renamed it)
LINE messenger                                          → icon="line" (NOT to be confused with the :line suffix)
TikTok                                                  → icon="tiktok"
WhatsApp                                                → icon="whatsapp"
```

---

## 7. Cheat Sheet

```
NAMING:           icon="<brand>"        → Color variant
                  icon="<brand>:mono"   → Monochrome variant

AVAILABLE:        bluesky | facebook | instagram | line | linkedin |
                  pinterest | reddit | spotify | telegram | threads |
                  tiktok | twitter | wechat | whatsapp | workplace | youtube

ACCESSIBILITY:    always add aria-label when the icon is the only content
                  of a link/button.

DARK BG:          prefer :mono.
LIGHT BG:         prefer Color (default).
```

> Rule of thumb: **brand icons are catalog-only, support Color and `:mono` variants, never recolor manually, and require an accessible label when used inside icon-only buttons.**
