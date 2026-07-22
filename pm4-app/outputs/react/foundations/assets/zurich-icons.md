# Zurich Icons — Foundations / Assets

> **Category:** Foundations / Assets
> **Platform:** Platform-agnostic
> **Package:** `@zurich/design-tokens` / `@zurich/web-components`
> **Companion doc:** see [`zurich-brand-icons.md`](./zurich-brand-icons.md) for **social media / third-party brand icons** (Facebook, Instagram, etc.).
> **Scope of this file:** the **Zurich generic icon set** — action, communication, food, economy, device, hands, health, industry, nature, people, signs, recreation, risks, services, transport, charts.

---

## 1. AI Implementation Instructions

When the user asks for an **icon**, **CTA icon**, **icon name**, **icon list**, **outline vs solid**, **icon inside a button**, **icon inside an input / tooltip / select**, **icon by category**, or **the exact icon string to use in `icon="..."`**, use this foundation.

1. **Icon naming syntax:** `name:style`
   - `name` is the icon's canonical identifier (e.g. `search`, `edit`, `arrow-right`, `clipboard-checklist`).
   - `style` is **either** `line` (outline / outlined) **or** the solid form **by omitting the suffix**. Examples:
     - Solid: `icon="edit"` or `icon="search"`.
     - Outline: `icon="edit:line"` or `icon="search:line"`.
2. **Default color is Zurich Blue.** Override only when the design explicitly requires a different brand color.
3. **Default size is `m` (24×24px).** Other sizes: `xs`, `s`, `m`, `l`, `xl`. Most ZDS components expose a `size` token that scales icons accordingly — don't try to force a custom px value.
4. **Pass icons through the existing ZDS prop / attribute**:
   - `<ZrButton icon="edit:line">…` (button)
   - `<ZrTextInput icon="search:line" …/>` (text input)
   - `<ZrTabs … icon="home:line" />` via `tabs` array (object mode)
   - `<output icon="search:line"></output>` inside a `<ZrInputGroup>`
   - `<ZrIcon icon="info:line" />` for standalone usage (e.g. inside slots)
5. **Pick names from the documented catalog** (§3–§17). **Do not invent icon names.** If the user requests an icon that's not in the catalog, suggest the closest match.
6. **The catalog is grouped by category** for browseability. Categories are not part of the icon name — only the bare name (with optional `:line`).
7. **Outline vs solid:** prefer outlines for inline / dense UI (toolbars, tags, captions). Use solids when the icon needs to stand out (CTAs, status indicators, headings).

---

## 2. Sizes & Styles

### 2.1 Sizes

| Size | Approximate pixels | Use when                                |
|------|---------------------|-----------------------------------------|
| `xs` | very small (≤ 12px) | Inline next to caption text.            |
| `s`  | small (≈ 16px)      | Small buttons, chips.                   |
| `m`  | medium (24×24px) — **default** | Standard UI use.             |
| `l`  | large (≈ 32px)      | Heading-level emphasis, list rows.      |
| `xl` | extra large (≥ 40px)| Hero / standalone illustrations.        |

> Sizes are usually inherited from the parent ZDS component's `size` token (`xs` / `s` / `m` / `l` / `xl` on `ZrButton`, `s` / `m` / `l` on inputs, etc.).

### 2.2 Styles

| Style    | Suffix    | Visual                              |
|----------|-----------|-------------------------------------|
| Solid    | *(none)*  | Filled glyph.                        |
| Outline  | `:line`   | Stroked / outlined glyph.            |

```tsx
<ZrButton icon="edit">Edit (solid)</ZrButton>
<ZrButton icon="edit:line">Edit (outline)</ZrButton>
```

> Some icons may exist only in one style — the catalog tables below show `S` (solid) and `O` (outline) availability per icon.

---

## 3. Action Icons

> Use for actions, navigation, ordering / sorting, view controls, and primary CTAs.

```
align-text-center, align-text-left, align-text-right,
arrow-diagonal, arrow-down, arrow-left, arrow-left-arrow-right,
arrow-left-down, arrow-left-from-line, arrow-left-right,
arrow-left-to-line, arrow-long-down, arrow-long-left,
arrow-long-right, arrow-long-up, arrow-right, arrow-right-from-line,
arrow-right-to-line, arrow-right-up, arrow-rotate-left,
arrow-rotate-right, arrow-turn-down, arrow-turn-left, arrow-turn-right,
arrow-turn-up, arrow-up, arrow-up-arrow-down, arrow-up-down,
arrows-to-center-diagonal, arrows-to-center-horizontal,
arrows-to-center-vertical, arrows-to-left-right, arrows-to-up-down,
audio-description, bookmark, check, check-circle, clock, close,
compare, compare-reverse, cursor-click, cursor-move, cut, direction,
dot, download, edit, entrance, equal, export,
fast-backward, fast-backward-circle, fast-forward, fast-forward-circle,
filter-horizontal, filter-vertical, frame, gallery-4, gallery-4-circle,
gallery-9, gallery-view, half-star, heart, hearts, history, home,
launch, link, link-broken, list, list-bullet, list-tick, list-tree,
lock-closed, lock-open, lock-process, login, logout, maximize, menu,
mic-off, mic-on, minimize, minus, more, more-vertical, mouse-movement,
object-align-bottom, object-align-horizontal-center, object-align-left,
object-align-right, object-align-top, object-align-vertical-center,
object-border-bottom, object-border-left, object-border-right,
object-border-top, object-distribute-horizontal, object-distribute-vertical,
pause, pause-circle, pencil, percent, placeholder, play, play-circle,
plus, power, print, reload, repeat, resize-handle, return, search, send,
send-diagonal, share, sorting-alphabet, sorting-alphabet-ascending,
sorting-alphabet-descending, sorting-numbers, sorting-numbers-ascending,
sorting-numbers-descending, sorting-shape, sorting-shape-ascending,
sorting-shape-descending, sorting-size, sorting-size-ascending,
sorting-size-descending, sorting-width, sorting-width-ascending,
sorting-width-descending, sound-off, sound-on, star, switch, tag, text,
thumbnail-view, thumbs-down, thumbs-up, touch-control-click,
touch-control-move, touch-control-resize, translate, trash,
visibility-off, visibility-on, zoom-in, zoom-out
```

---

## 4. Communication Icons

> Notifications, files, documents, locations, mailing, hints, secrecy.

```
alarm-clock, alarm-exclamation, alarm-plus, alert-circle, alert-triangle,
at, attach-file, balloons, barcode, barcode-read, barcode-scan,
battery-empty, battery-exclamation, battery-full, battery-half,
battery-minimum, battery-one-quarter, battery-power, battery-slash,
battery-three-quarters, bell-off, bell-on, bell-plus, bell-ring,
binoculars, bluetooth, book-closed, book-open, box-people, box-person,
calendar, calendar-check, calendar-delete, calendar-edit, calendar-empty,
calendar-end, calendar-forbidden, calendar-forward, calendar-plus,
calendar-save, calendar-search, calendar-start, calendar-upload,
chat, clipboard, clipboard-checklist, clipboard-checklist-search,
clipboard-cut, clipboard-delete, clipboard-edit, clipboard-forbidden,
clipboard-forward, clipboard-forward-payment, clipboard-list,
clipboard-list-search, clipboard-new, clipboard-no-payment,
clipboard-payment, clipboard-return-edit, clipboard-return-payment,
clipboard-save, clipboard-search, clipboard-star, clipboard-tick,
clipboard-upload, clipboards, computer-edit, computer-strategy, cone,
design-tool, document, document-approved, document-barcode,
document-blank, document-contract, document-cut, document-delete,
document-edit, document-forbidden, document-forward, document-new,
document-save, document-screen, document-search, document-upload,
documents, event, face-viewfinder, file-add, file-audio, file-blank,
file-bmp, file-check, file-code, file-copy, file-csv, file-cut,
file-delete, file-doc, file-dxl, file-edit, file-eps, file-forbidden,
file-forward, file-gif, file-html, file-image, file-iso, file-jpg,
file-mp3, file-mp4, file-music, file-pdf, file-png, file-ppt,
file-save, file-search, file-svg, file-text, file-tiff, file-upload,
file-video, file-xls, file-xml, file-zip, filing-documents,
fingerprint-scan, flag, flashing-light, floppy-disk, folder,
folder-multiple, folder-open, folder-search, forbidden, globe,
globe-people, globe-trust, goal, goal-delete, help, hourglass, id-card,
ideation, image, images, info, key, key-slash, lightbulb, lightbulb-on,
lightbulb-slash, location, location-arrow, location-map, location-plus,
location-question, location-zone, mail-closed, mail-open, map,
navigation, newspaper, notebook, phone, pin, point, point-slash,
post-it, question-mark, quote-closed, quote-open, rudder,
scale-balanced, search-group, search-partner, shapes, shield,
shield-check, skeleton-key, speech, strategy, trojan-horse, video, wifi
```

---

## 5. Food Icons

```
apple, apple-bite, bbq, beer, bowl, bowl-rice, bowl-soup, bread,
buffet, cake, cake-slice, chef-hat, cocktail, coffee, coffee-to-go,
croissant, cutlery, fondue, food-beverage, food-meal, food-tray,
hamburger, picnic-basket, plate-cutlery, sandwich, sandwich-takeaway,
snack, snack-takeaway, sparkling, sushi-nigiri, wine
```

---

## 6. Economy Icons

```
bank-note, credit-card, credit-cards,
currency-bitcoin, currency-coin-bitcoin, currency-coin-dollar,
currency-coin-euro, currency-coin-pound, currency-coin-swissfrancs,
currency-dollar, currency-dollar-down, currency-dollar-up,
currency-euro, currency-euro-down, currency-euro-up,
currency-pound, currency-pound-down, currency-pound-up,
currency-swissfrancs, pension
```

---

## 7. Device Icons

```
air-conditioner, calculator, camera, desktop, devices, drone, fryer,
game, headset, keyboard, kitchen, laptop, microwave, mobile,
mobile-landscape, mobile-search, mouse, oven, table-fan, tablet,
tablet-landscape, tv, vacuum-cleaner, video-call, washing-machine,
watch-analog, web, webcam
```

---

## 8. Hands Icons

```
hand, hand-building, hand-car, hand-click, hand-dollar, hand-euro,
hand-female-male, hand-food, hand-gear, hand-global, hand-heart,
hand-house, hand-palm, hand-person, hand-point, hand-protection,
hand-social, hand-wheel, hand-wine, hands-in-circle,
hands-protection-2, handshake, touch-shield
```

---

## 9. Health Icons

```
arm-injury, brain, building-hospital, cancer-ribbon, eye-dropper,
financial-health, first-aid, health-app, health-app-device,
health-app-landscape, heart-cardio, heart-medical,
location-medication, lungs, medical-card, medication, mental-health,
pharmacy, prevention, shield-medical, shield-person, sleep, smoke,
social-health, stethoscope, thinking
```

---

## 10. Industry Icons

```
automation, award, bag-shopping, bank, box-stack, brain-circuit,
briefcase, building, building-location, building-mixed-use,
builiding-home, builiding-office, builiding-retail, builiding-shop,
car-battery, circuit, claim, code, construction-crane, crane,
electrical-power, factory, fan, fire-detector, fire-extinguisher,
fire-hydrant, funnel, gear, gear-rotation, gears, graduation,
helmet, internet-of-things, microchip, package, repair-time, robot,
shield-heart-cardio, shield-house, shield-leaf, shield-more,
shield-suitcase, shield-tie, shopping-cart, space-planning, sprinkler,
suitecase, test-tube, tool, tools, web-layout, winery
```

> ⚠️ Heads up: the catalog includes typos that you must use verbatim — `builiding-home`, `builiding-office`, `builiding-retail`, `builiding-shop`, `suitecase`. Don't auto-correct them or the icon will not resolve.

---

## 11. Nature Icons

```
bacteria, bee, bird, bird-flying, bug, car-emissions, cloud,
dog-bone, electric-storm, emissions, fire, fire-slash, footprint,
forest, globe-stand, hurricane, landscape, leaf, lightning, moon,
mountain, paw, rain, recycle, recycling-bin, snow, snowflake, space,
sparkles, sun, temperature, tornado, volcano, water-drop, wind,
windmill, worm
```

---

## 12. People Icons

```
baby, face-anger, face-depression, face-dissappointment,
face-expressionless, face-happy, face-humilitation, face-illness,
face-isolation, face-laugh, face-neutral, face-sad, face-sleep,
face-smile, family, group, group-accident, meeting,
meeting-breakout-room, pregnant, presentation, senior, user-accident,
user-alert, user-criminal, user-event, user-female, user-female-male,
user-gear, user-hat, user-help, user-lock, user-male, user-police,
user-task
```

> ⚠️ Typo verbatim: `face-dissappointment`, `face-humilitation`. Don't auto-correct.

---

## 13. Signs Icons

```
disturb, full-time, gender-female, gender-male, gluten-low, hotel,
information-point, lactose-low, language-DE, language-EN, language-FR,
language-IT, parking, vegan, vegetarian
```

> Language codes (`language-DE`, etc.) are **uppercase**. Use them verbatim.

---

## 14. Recreation Icons

```
basketball, bowling, chess, disco, drama-masks, dumbbell,
group-fitness, guitar, lotus, microphone, music, music-clef,
origami, paint-brush, paint-palette, person-breakdance,
person-dancing, person-fitness, person-jumping, person-running,
person-swimming, person-walking, piano, puzzle, running-shoe, spa,
strength, tennis, wedding-ring, yoga
```

---

## 15. Risks Icons

```
accident, barrel-leak, battery-fire, biohazard, blanket-fire, bomb,
broken-window, car-accident, car-crash, earthquake, fire-explosive,
flood, gas-oven-fire, hazardous-liquids, landslide, pipe-damage,
sink-damage, skull-crossbones, tsunami, vandalism
```

---

## 16. Services Icons

```
bathroom, bathtub, bed-front, bed-side, blanket, chair, cleaning,
desk, dresser, elevator, furniture, hairdresser, hand-cleaning, plug,
rocking-chair, shirt, shower, toaster, washing-machine-laundry
```

---

## 17. Transport Icons

```
bike, boat, bus, car, car-fleet, car-rear, car-repair, e-bike,
electric-car, flat-tire, motorcycle, plane, plane-arrival,
plane-departure, rocket, scooter, ship, station-eletric, station-gas,
steering-wheel, taxi, tire, tractor, train, tram, trolley, van,
wheelchair
```

> ⚠️ Typo verbatim: `station-eletric` (not `electric`).

---

## 18. Charts Icons

```
bar-chart, intersection, line-chart, overlapping, pie-chart
```

---

## 19. Canonical Examples

### 19.1 Icon inside a button
```tsx
<ZrButton icon="edit:line">Edit</ZrButton>
<ZrButton icon="trash" config="negative">Delete</ZrButton>
<ZrButton icon="search:line" />     {/* round, icon-only */}
```

### 19.2 Icon inside an input
```tsx
<ZrTextInput label="Search" icon="search:line" />
```

### 19.3 Icon inside a tab (object mode)
```tsx
<ZrTabs
  tabs={[
    { name: 'Home',     icon: 'home:line' },
    { name: 'Coverage', icon: 'shield:line' },
    { name: 'Claims',   icon: 'document-edit:line' },
  ]}
/>
```

### 19.4 Icon as a prefix inside an input group
```tsx
<ZrInputGroup>
  <output icon="search:line"></output>
  <ZrTextInput label="Search" />
</ZrInputGroup>
```

### 19.5 Standalone icon inside a tooltip slot
```tsx
<ZrTooltip text="More information" config="top">
  <ZrIcon icon="info:line" />
</ZrTooltip>
```

### 19.6 Icon inside a status alert
```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: 'var(--zc-moss-aa)',
  background: 'var(--zc-moss-20)',
  padding: '0.75rem 1rem',
  borderRadius: 8,
}}>
  <ZrIcon icon="check-circle" />
  <span style={{ font: 'var(--zf-body-16)' }}>Policy activated.</span>
</div>
```

### 19.7 Avoid: anti-patterns
```tsx
{/* ❌ Invented icon name */}
<ZrButton icon="email" />            // not in catalog (use mail-open / mail-closed / at)

{/* ❌ Auto-corrected typo */}
<ZrButton icon="building-home" />    // wrong — catalog has `builiding-home`

{/* ❌ Hardcoded size */}
<ZrIcon icon="search:line" style={{ width: 17, height: 17 }} />
// → rely on the parent component's `size` token instead

{/* ❌ Inverted suffix */}
<ZrButton icon="line:edit" />        // wrong — suffix comes after the colon
```

---

## 20. Decision Rules (for the AI)

- ❗ **Catalog-first.** Pick an icon name from §3–§18. **Never invent names.**
- ❗ **Outline = `name:line`, solid = `name`.** No other style suffixes.
- ❗ **Default color is Zurich Blue.** Override only when there's a specific reason.
- ❗ **Sizes are inherited** from the parent ZDS component's `size` token. Don't apply inline `width` / `height` to `<ZrIcon>`.
- ❗ **Typos must be preserved verbatim** (`builiding-*`, `suitecase`, `face-dissappointment`, `face-humilitation`, `station-eletric`) — the design system ships those literal names.
- ❗ **Search by intent first:** for "email", look in §4 (`mail-closed`, `mail-open`, `at`); for "settings", look in §10 (`gear`, `gears`, `gear-rotation`); for "back", §3 (`arrow-left`, `arrow-long-left`, `return`).
- ❗ **Status icons mapping:** `check-circle` (success), `alert-triangle` (warning), `alert-circle` (error/info), `info` (information).
- ❗ **Use solid for high-emphasis** (CTAs, status banners) and **outline for inline/dense UI**.

---

## 21. Quick Lookup (intent → icon)

```
edit / write                → edit | pencil
delete / remove             → trash | close
confirm / done              → check | check-circle
warn / caution              → alert-triangle
error                       → alert-circle
info                        → info
search                      → search | search-group
add                         → plus
remove (minus)              → minus
external link / open        → launch | export | link
back                        → arrow-left | arrow-long-left | return
forward                     → arrow-right | arrow-long-right
upload                      → file-upload | document-upload
download                    → download
filter                      → filter-horizontal | filter-vertical
sort                        → sorting-alphabet[-ascending/descending]
sort numbers                → sorting-numbers[-ascending/descending]
settings                    → gear | gears | gear-rotation
profile / user              → user-male | user-female | user-female-male | user-gear
home / dashboard            → home
calendar                    → calendar | calendar-check | calendar-edit
mail                        → mail-open | mail-closed | at
phone                       → phone
location                    → location | location-map | pin
help                        → help | question-mark | info
star / favorite             → star | half-star | bookmark | heart
visibility                  → visibility-on | visibility-off
lock                        → lock-closed | lock-open | lock-process
login / logout              → login | logout
shield / protection         → shield | shield-check | shield-medical | shield-person
chart / analytics           → bar-chart | line-chart | pie-chart | intersection | overlapping
```

> Rule of thumb: **icon strings are `name[:line]`, pick from the documented catalog, preserve verbatim typos, and let the parent component handle size/color via its tokens.**
