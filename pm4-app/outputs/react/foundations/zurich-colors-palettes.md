# Zurich Color Palettes — Reference Tables

> **Category:** Foundations *(design tokens / cross-platform guidelines)*
> **Platform:** Platform-agnostic (React / Web / CSS — same tokens everywhere)
> **Package:** `@zurich/design-tokens`
> **Companion doc:** see [`zurich-colors.md`](./zurich-colors.md) for the **token taxonomy** (brand / tints / secondary / gray / status / overlay) and usage rules.
> **Scope of this file:** the **full per-shade reference** — HEX, HSL, RGB, luminance, and CSS token — for every secondary hue and the blue brand range.

---

## 1. AI Implementation Instructions

When the user asks for **specific HEX / RGB / HSL values**, **a particular shade**, **the AA / AAA token for a given hue**, **the exact luminance / contrast info**, or **the canonical palette ordering**, use this reference file.

1. **Always** reference colors via CSS variables (`var(--zc-<hue>-<shade>)`). The HEX / RGB / HSL columns here are **informational only** (for design systems, documentation, gradients, or canvas APIs). **Never hardcode the HEX in CSS or JSX.**
2. Shade convention:
   - **`20` → `100`** = light → saturated. `100` is the canonical brand shade for that hue.
   - **`aa`** = darkened variant validated for WCAG **AA** contrast on the corresponding tint.
   - **`aaa`** = darkened variant validated for WCAG **AAA** contrast.
   - **`10`** = wash-level lightest (only available on some hues — e.g. Peach).
3. **Status palette mapping** (see [`zurich-colors.md` §7](./zurich-colors.md)):
   - Error → Peach (`-aa` + `-20/-40`).
   - Warning → Lemon (`-aa` + `-20/-40`).
   - Success → Moss (`-aa` + `-20/-40`).
   - Information → Sky blue (`-aa` + `-25/-40`).
4. **Use `-aa` / `-aaa` shades for text** on top of a lighter shade of the same hue. Other shades are intended for backgrounds, fills, decoration.
5. **HSL is provided** for designers who need to derive new tints in the same hue range. **Don't invent new shades** in production code — request a new token instead.
6. **Luminance (`Lum`)** values are perceived lightness percentages — useful for choosing accessible foreground colors.

---

## 2. Azure

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 90  | `#DAE2F4` | `hsl(222, 54, 91)`   | `rgb(218, 226, 244)` | `--zc-azure-20`   |
| 40    | 80  | `#B6C6E8` | `hsl(221, 52, 81)`   | `rgb(182, 198, 232)` | `--zc-azure-40`   |
| 60    | 69  | `#91A9DD` | `hsl(221, 53, 72)`   | `rgb(145, 169, 221)` | `--zc-azure-60`   |
| 80    | 59  | `#6D8DD1` | `hsl(221, 52, 62)`   | `rgb(109, 141, 209)` | `--zc-azure-80`   |
| 100   | 48  | `#4870C6` | `hsl(221, 53, 53)`   | `rgb( 72, 112, 198)` | `--zc-azure-100`  |

> **No AA/AAA shades** in the Azure ramp. For text usage, pair light shades (20/40) as background with dark blue text (`--zc-blue-dark`).

---

## 3. Moss

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 86  | `#C9DDCE` | `hsl(135, 23, 83)`   | `rgb(201, 221, 206)` | `--zc-moss-20`    |
| 40    | 86  | `#C9DDCE` | `hsl(135, 23, 83)`   | `rgb(201, 221, 206)` | `--zc-moss-40`    |
| 60    | 79  | `#ADCBB5` | `hsl(136, 22, 74)`   | `rgb(173, 203, 181)` | `--zc-moss-60`    |
| 80    | 72  | `#92BA9D` | `hsl(137, 22, 65)`   | `rgb(146, 186, 157)` | `--zc-moss-80`    |
| 100   | 65  | `#77A984` | `hsl(136, 23, 56)`   | `rgb(119, 169, 132)` | `--zc-moss-100`   |
| aa    | 49  | `#428351` | `hsl(134, 33, 39)`   | `rgb( 66, 131,  81)` | `--zc-moss-aa`    |
| aaa   | 37  | `#32623D` | `hsl(134, 32, 29)`   | `rgb( 50,  98,  61)` | `--zc-moss-aaa`   |

> **Success palette:** foreground `--zc-moss-aa` on background `--zc-moss-20`.

---

## 4. Teal

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 93  | `#D1F1F0` | `hsl(178, 53, 88)`   | `rgb(209, 241, 240)` | `--zc-teal-20`    |
| 40    | 86  | `#A3E3E2` | `hsl(179, 53, 76)`   | `rgb(163, 227, 226)` | `--zc-teal-40`    |
| 60    | 80  | `#75D6D3` | `hsl(178, 54, 65)`   | `rgb(117, 214, 211)` | `--zc-teal-60`    |
| 80    | 74  | `#47C8C5` | `hsl(179, 54, 53)`   | `rgb( 71, 200, 197)` | `--zc-teal-80`    |
| 100   | 69  | `#19BAB6` | `hsl(179, 76, 41)`   | `rgb( 25, 186, 182)` | `--zc-teal-100`   |
| aa    | 50  | `#088487` | `hsl(181, 89, 28)`   | `rgb(  8, 132, 135)` | `--zc-teal-aa`    |

---

## 5. Mint

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 97  | `#EDFBEE` | `hsl(124, 64, 96)`   | `rgb(237, 251, 238)` | `--zc-mint-20`    |
| 40    | 94  | `#DBF6DD` | `hsl(124, 60, 91)`   | `rgb(219, 246, 221)` | `--zc-mint-40`    |
| 60    | 92  | `#CAF2CD` | `hsl(125, 61, 87)`   | `rgb(202, 242, 205)` | `--zc-mint-60`    |
| 80    | 89  | `#B8EDBC` | `hsl(125, 60, 83)`   | `rgb(184, 237, 188)` | `--zc-mint-80`    |
| 100   | 87  | `#A6E9AB` | `hsl(124, 60, 78)`   | `rgb(166, 233, 171)` | `--zc-mint-100`   |

> **No AA/AAA shades** in Mint. Use as background; foreground must be a dark color like `--zc-blue-dark`.

---

## 6. Lime

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 98  | `#F9FCE9` | `hsl( 69, 76, 95)`   | `rgb(249, 252, 233)` | `--zc-lime-20`    |
| 40    | 96  | `#F3F8D3` | `hsl( 68, 73, 90)`   | `rgb(243, 248, 211)` | `--zc-lime-40`    |
| 60    | 95  | `#EDF5BE` | `hsl( 69, 73, 85)`   | `rgb(237, 245, 190)` | `--zc-lime-60`    |
| 80    | 93  | `#E7F1A8` | `hsl( 68, 72, 80)`   | `rgb(231, 241, 168)` | `--zc-lime-80`    |
| 100   | 91  | `#E1EE92` | `hsl( 68, 73, 75)`   | `rgb(225, 238, 146)` | `--zc-lime-100`   |

> **No AA/AAA shades** in Lime. Use as background; foreground must be a dark color like `--zc-blue-dark`.

---

## 7. Lemon

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 99  | `#FFFDE3` | `hsl( 56, 100, 95)`  | `rgb(255, 253, 227)` | `--zc-lemon-20`   |
| 40    | 98  | `#FFFCC7` | `hsl( 57, 100, 89)`  | `rgb(255, 252, 199)` | `--zc-lemon-40`   |
| 60    | 97  | `#FFFAAB` | `hsl( 56, 100, 84)`  | `rgb(255, 250, 171)` | `--zc-lemon-60`   |
| 80    | 96  | `#FFF98F` | `hsl( 57, 100, 78)`  | `rgb(255, 249, 143)` | `--zc-lemon-80`   |
| 100   | 96  | `#FFF773` | `hsl( 57, 100, 73)`  | `rgb(255, 247, 115)` | `--zc-lemon-100`  |
| aa    | 83  | `#FFC828` | `hsl( 45, 100, 58)`  | `rgb(255, 200,  40)` | `--zc-lemon-aa`   |

> **Warning palette:** foreground `--zc-lemon-aa` on background `--zc-lemon-20`.

---

## 8. Peach

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 10    | 95  | `#FAEDEC` | `hsl(  4, 58, 95)`   | `rgb(250, 237, 236)` | `--zc-peach-10`   |
| 20    | 92  | `#FFE3E1` | `hsl(  4,100, 94)`   | `rgb(255, 227, 225)` | `--zc-peach-20`   |
| 40    | 85  | `#FFC8C3` | `hsl(  5,100, 88)`   | `rgb(255, 200, 195)` | `--zc-peach-40`   |
| 60    | 78  | `#FFACA5` | `hsl(  5,100, 82)`   | `rgb(255, 172, 165)` | `--zc-peach-60`   |
| 80    | 72  | `#FF9187` | `hsl(  5,100, 76)`   | `rgb(255, 145, 135)` | `--zc-peach-80`   |
| 100   | 66  | `#FF7569` | `hsl(  5,100, 71)`   | `rgb(255, 117, 105)` | `--zc-peach-100`  |
| aa    | 50  | `#CB4B40` | `hsl(  5, 57, 52)`   | `rgb(203,  75,  64)` | `--zc-peach-aa`   |
| aaa   | 37  | `#9D342B` | `hsl(  5, 57, 39)`   | `rgb(157,  52,  43)` | `--zc-peach-aaa`  |

> **Error palette:** foreground `--zc-peach-aa` on background `--zc-peach-20`.

---

## 9. Candy

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 94  | `#F9E8F1` | `hsl(328, 59, 94)`   | `rgb(249, 232, 241)` | `--zc-candy-20`   |
| 40    | 87  | `#F3D2E3` | `hsl(329, 58, 89)`   | `rgb(243, 210, 227)` | `--zc-candy-40`   |
| 60    | 81  | `#EDBBD6` | `hsl(328, 58, 83)`   | `rgb(237, 187, 214)` | `--zc-candy-60`   |
| 80    | 75  | `#E7A5C8` | `hsl(328, 58, 78)`   | `rgb(231, 165, 200)` | `--zc-candy-80`   |
| 100   | 69  | `#E18EBA` | `hsl(328, 58, 72)`   | `rgb(225, 142, 186)` | `--zc-candy-100`  |
| aa    | 58  | `#C96BA4` | `hsl(324, 47, 60)`   | `rgb(201, 107, 164)` | `--zc-candy-aa`   |

---

## 10. Powder pink

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token              |
|-------|-----|-----------|----------------------|--------------------|------------------------|
| 20    | 97  | `#FFF3FB` | `hsl(320,100, 98)`   | `rgb(255, 243, 251)` | `--zc-powder-pink-20`  |
| 40    | 94  | `#FFE8F7` | `hsl(321,100, 95)`   | `rgb(255, 232, 247)` | `--zc-powder-pink-40`  |
| 60    | 91  | `#FFDCF2` | `hsl(322,100, 93)`   | `rgb(255, 220, 242)` | `--zc-powder-pink-60`  |
| 80    | 91  | `#FFDCF2` | `hsl(322,100, 93)`   | `rgb(255, 220, 242)` | `--zc-powder-pink-80`  |
| 100   | 86  | `#FFC5EA` | `hsl(322,100, 89)`   | `rgb(255, 197, 234)` | `--zc-powder-pink-100` |

> **No AA/AAA shades.** Use only as background; foreground must be a dark color.

---

## 11. Lilac

| Shade | Lum | HEX       | HSL                  | RGB                | CSS Token         |
|-------|-----|-----------|----------------------|--------------------|-------------------|
| 20    | 90  | `#E2E1F5` | `hsl(243, 50, 92)`   | `rgb(226, 225, 245)` | `--zc-lilac-20`   |
| 40    | 80  | `#C5C4EC` | `hsl(242, 51, 85)`   | `rgb(197, 196, 236)` | `--zc-lilac-40`   |
| 60    | 70  | `#A7A6E2` | `hsl(241, 51, 77)`   | `rgb(167, 166, 226)` | `--zc-lilac-60`   |
| 80    | 60  | `#8A89D9` | `hsl(241, 51, 69)`   | `rgb(138, 137, 217)` | `--zc-lilac-80`   |
| 100   | 50  | `#6D6BCF` | `hsl(241, 51, 62)`   | `rgb(109, 107, 207)` | `--zc-lilac-100`  |

> **No AA/AAA shades.** Use only as background; foreground must be a dark color.

---

## 12. Blue (brand range)

| Shade  | Lum | HEX       | HSL                  | RGB                | CSS Token             |
|--------|-----|-----------|----------------------|--------------------|-----------------------|
| dark   | 24  | `#23366F` | `hsl(225, 52, 29)`   | `rgb( 35,  54, 111)` | `--zc-blue-dark`      |
| zurich | 43  | `#2167AE` | `hsl(210, 68, 41)`   | `rgb( 33, 103, 174)` | `--zc-blue-zurich`    |
| mid    | 60  | `#5495CF` | `hsl(208, 56, 57)`   | `rgb( 84, 149, 207)` | `--zc-blue-mid`       |
| sky    | 68  | `#1FB1E6` | `hsl(196, 80, 51)`   | `rgb( 31, 177, 230)` | `--zc-blue-sky`       |
| light  | 75  | `#91BFE3` | `hsl(206, 59, 73)`   | `rgb(145, 191, 227)` | `--zc-blue-light`     |

> The blue range follows the **named shade** convention (`dark`, `zurich`, `mid`, `sky`, `light`) rather than `20`–`100` numerics — it is the brand range.

> Companion shades (tints) live in [`zurich-colors.md` §4](./zurich-colors.md): `--zc-blue-dark-90`, `--zc-blue-zurich-90`, `--zc-blue-light-40`, `--zc-blue-light-10`, `--zc-blue-sky-aa`, `--zc-blue-sky-80`, `--zc-blue-sky-40`, `--zc-blue-sky-25`, `--zc-blue-sky-10`.

---

## 13. Accessibility Cheat Sheet

| Use case                                                                  | Token combination                                |
|---------------------------------------------------------------------------|--------------------------------------------------|
| Body text on light background                                             | `color: var(--zc-blue-dark)` on white            |
| Body text on dark / branded background                                    | `color: var(--zg-white-zurich)`                  |
| Error chip / inline error message                                         | `color: --zc-peach-aa` on `background: --zc-peach-20` |
| Warning chip / "on hold" message                                          | `color: --zc-lemon-aa` on `background: --zc-lemon-20` |
| Success chip / activation toast                                           | `color: --zc-moss-aa` on `background: --zc-moss-20`  |
| Info chip / hint                                                          | `color: --zc-blue-sky-aa` on `background: --zc-blue-sky-25` |
| High-contrast destructive heading on peach background                     | `color: --zc-peach-aaa` on `background: --zc-peach-20` |
| High-contrast success heading on moss background                          | `color: --zc-moss-aaa` on `background: --zc-moss-20`   |
| Text on a non-AA hue (Mint, Lime, Powder pink, Lilac, Azure 20–60)        | Use `--zc-blue-dark` as the foreground.          |
| Branded surface                                                           | `background: --zc-blue-zurich`, `color: --zg-white-zurich` |

---

## 14. Decision Rules (for the AI)

- ❗ **Token-first, HEX-never.** Even when the user gives you a HEX, look up the closest token and use that.
- ❗ **For text, always pick `-aa` (or `-aaa`)** if the hue offers one. If it doesn't, switch the foreground to `--zc-blue-dark` or `--zg-white-zurich`.
- ❗ **`Lum` values are guidance**, not contrast ratios. Use them when computing accessible foreground/background pairings inside the same hue.
- ❗ **HSL deltas** between adjacent shades aren't uniform — don't infer new shades by linear interpolation. Request a new token if needed.
- ❗ **Moss `20` and `40` share the same HEX** in the documented palette — treat them as visually equivalent.
- ❗ **Powder pink `60` and `80` share the same HEX** — same caveat.
- ❗ **Peach has a unique `10` shade** for ultra-soft error washes (not present in other hues).
- ❗ **Blue is named, not numeric.** Don't reach for `--zc-blue-100` — it doesn't exist. Use `--zc-blue-sky`, `--zc-blue-zurich`, `--zc-blue-mid`, `--zc-blue-light`, `--zc-blue-dark`.

---

## 15. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
the HEX of "Zurich blue"                                → #2167AE  (use token: --zc-blue-zurich)
the AA error red                                        → --zc-peach-aa  (#CB4B40)
the AAA error red                                       → --zc-peach-aaa (#9D342B)
the AA success green                                    → --zc-moss-aa   (#428351)
the AA warning yellow                                   → --zc-lemon-aa  (#FFC828)
the AA info blue                                        → --zc-blue-sky-aa (see colors.md §4)
text on Mint / Lime / Powder pink / Lilac / Azure 20–60 → --zc-blue-dark
text on Peach 20–40                                     → --zc-peach-aa (or --zc-peach-aaa)
text on Moss 20–40                                      → --zc-moss-aa (or --zc-moss-aaa)
text on a Zurich-blue surface                           → --zg-white-zurich
deriving a custom in-between shade                      → ❌ request a new token
```

---

## 16. JSON Reference (for the AI to parse programmatically)

```json
{
  "azure":      ["--zc-azure-20", "--zc-azure-40", "--zc-azure-60", "--zc-azure-80", "--zc-azure-100"],
  "moss":       ["--zc-moss-20", "--zc-moss-40", "--zc-moss-60", "--zc-moss-80", "--zc-moss-100", "--zc-moss-aa", "--zc-moss-aaa"],
  "teal":       ["--zc-teal-20", "--zc-teal-40", "--zc-teal-60", "--zc-teal-80", "--zc-teal-100", "--zc-teal-aa"],
  "mint":       ["--zc-mint-20", "--zc-mint-40", "--zc-mint-60", "--zc-mint-80", "--zc-mint-100"],
  "lime":       ["--zc-lime-20", "--zc-lime-40", "--zc-lime-60", "--zc-lime-80", "--zc-lime-100"],
  "lemon":      ["--zc-lemon-20", "--zc-lemon-40", "--zc-lemon-60", "--zc-lemon-80", "--zc-lemon-100", "--zc-lemon-aa"],
  "peach":      ["--zc-peach-10", "--zc-peach-20", "--zc-peach-40", "--zc-peach-60", "--zc-peach-80", "--zc-peach-100", "--zc-peach-aa", "--zc-peach-aaa"],
  "candy":      ["--zc-candy-20", "--zc-candy-40", "--zc-candy-60", "--zc-candy-80", "--zc-candy-100", "--zc-candy-aa"],
  "powder-pink":["--zc-powder-pink-20", "--zc-powder-pink-40", "--zc-powder-pink-60", "--zc-powder-pink-80", "--zc-powder-pink-100"],
  "lilac":      ["--zc-lilac-20", "--zc-lilac-40", "--zc-lilac-60", "--zc-lilac-80", "--zc-lilac-100"],
  "blue":       ["--zc-blue-dark", "--zc-blue-zurich", "--zc-blue-mid", "--zc-blue-sky", "--zc-blue-light"]
}
```

> Rule of thumb: **token-first, HEX-only-for-reference, `-aa`/`-aaa` for text, and never invent new shades.**
