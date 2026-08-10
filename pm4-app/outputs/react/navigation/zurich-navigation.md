# ZrNavigation — Zurich Web Components (React)

> **Status:** ⚠️ Experimental — documentado desde el **paquete vendorizado** (`frontend/vendor/zurich-*-0.8.1.tgz`). Fuente: `dev-utils/dist/code/Navigation.props.d.ts` + `web-components/dist/navigation.d.ts` + `css-components/dist/Navigation.css`.
> **Platform:** React / Web / CSS
> **Category:** Navigation *(nueva categoría — barra de navegación superior, ver `zurich-index.md` §6.4 "future categories")*
> **Package:** `@zurich/web-components/react/navigation`

---

## 1. AI Implementation Instructions

Usar cuando el usuario pida una **barra de navegación superior con logo + menú + panel lateral responsive** — candidato directo a reemplazar `.pqr-topnav*` en `shared.css`.

1. Import:
   ```tsx
   import { ZrNavigation } from '@zurich/web-components/react/navigation';
   ```
2. `menu`: array de **arrays** (columnas del panel lateral) de `{ text, items: [...], icon? }` — cada sub-item puede ser un link simple `{text, href}` o un submenú anidado `{text, items: [{text,href}]}`.
3. `routes`: array plano de `{text, icon?, href?}` — enlaces visibles directamente en la barra superior (no en el panel lateral).
4. `isotype` (`boolean`) — muestra solo el isotipo/logo reducido en vez del logo completo.
5. `with-top` (`boolean`) — reserva espacio superior extra (`--z-navigation--top`, default `--zs-200`) — útil si hay un banner fijo encima.
6. `config` admite `'left'` y/o `'rounded'` (encadenables vía `ToAttrChain`) — `left` mueve el botón de menú/isotipo al lado izquierdo; `rounded` redondea las esquinas inferiores de la barra.
7. **Es responsive por `@container`**: bajo 1200px oculta el texto del botón de menú; bajo 768px el panel lateral pasa a ocupar el 100% del ancho y el layout interno cambia a columna — no replicar breakpoints a mano.
8. Slots (`nav`, `logo`) — usar para JSX rico (p.ej. el logo real de Zurich vía `<img>`).

---

## 2. Import

```tsx
import { ZrNavigation } from '@zurich/web-components/react/navigation';
```

---

## 3. Props (Parameters)

| Prop         | Type                                                                                     | Default | Required | Description                                                          |
|--------------|--------------------------------------------------------------------------------------------|---------|----------|--------------------------------------------------------------------------|
| `menu`       | `{ text: string; items: MenuSubItem[]; icon?: SizelessIconAttr }[][]`                      | —       | No       | Columnas del panel lateral desplegable.                                  |
| `routes`     | `{ text: string; icon?: SizelessIconAttr; href?: string }[]`                              | —       | No       | Enlaces directos en la barra superior.                                   |
| `social`     | `Partial<Record<SocialMediaIconName, string>>`                                            | —       | No       | Íconos sociales en el footer del panel lateral.                          |
| `footer`     | `{ text: string; href: string }[]`                                                         | —       | No       | Enlaces del footer del panel lateral.                                    |
| `config`     | `'left'` \| `'rounded'` (encadenables)                                                     | —       | No       | Posición del botón de menú / esquinas redondeadas.                       |
| `with-top`   | `boolean`                                                                                   | `false` | No       | Reserva espacio superior extra (`--z-navigation--top`).                  |
| `isotype`    | `boolean`                                                                                   | `false` | No       | Logo reducido (isotipo) en vez del logo completo.                        |
| `custom`     | `CustomTokens<'bg'>`                                                                        | —       | No       | Override de fondo.                                                       |

`MenuSubItem` = `{text, href}` | `{text, items: {text, href}[]}` (submenú anidado, 1 nivel).

---

## 4. Events

> No se encontró tabla de eventos propia en `Navigation.props.d.ts` (no exportado explícitamente) — el toggle del panel lateral se maneja internamente vía `<input type="checkbox">` (ver CSS), no hay evento React documentado para "menú abierto/cerrado". No inventar un `onToggle`/`onOpen` sin confirmarlo en el bundle JS runtime.

---

## 5. Slots

Slots declarados (`zNavigationSlots`): `nav`, `logo`.

| Slot    | Purpose                                                    |
|---------|-------------------------------------------------------------|
| `logo`  | Logo/isotipo real (p.ej. `<img>` del logo Zurich).           |
| `nav`   | Contenido adicional de la barra (JSX rico más allá de `routes`). |

---

## 6. CSS Customization Tokens

| CSS Variable              | Type   | Purpose                                                              |
|-----------------------------|--------|---------------------------------------------------------------------|
| `--z-navigation--height`    | length | Alto de la barra (default `5rem` = 80px — **coincide con `.pqr-topnav` actual, que está hardcodeado a `height: 80px`**). |
| `--z-navigation--bg`        | color  | Fondo del panel lateral (default `var(--z-sf-base)`).                |
| `--z-navigation--color`     | color  | Color de texto del panel lateral (default `var(--z-ct-clickable--secondary)`). |
| `--z-navigation--top`       | length | Espacio superior reservado cuando `with-top` está activo.             |
| `--z-navigation--index`     | number | `z-index` de la barra (default `100`).                                |

---

## 7. Canonical Examples

### 7.1 Mínimo — solo logo + rutas directas
```tsx
<ZrNavigation routes={[{ text: 'Inicio', href: '/' }, { text: 'Contacto', href: '/contacto' }]}>
  <img slot="logo" src="/zurich-logo.svg" alt="Zurich" />
</ZrNavigation>
```

### 7.2 Con panel lateral (menú de columnas)
```tsx
<ZrNavigation
  menu={[
    [{ text: 'Seguros', items: [{ text: 'Auto', href: '/auto' }, { text: 'Hogar', href: '/hogar' }] }],
    [{ text: 'Ayuda', items: [{ text: 'PQR', href: '/pqr' }, { text: 'Contacto', href: '/contacto' }] }],
  ]}
  footer={[{ text: 'Aviso legal', href: '/legal' }]}
>
  <img slot="logo" src="/zurich-logo.svg" alt="Zurich" />
</ZrNavigation>
```

### 7.3 Con espacio reservado arriba (banner fijo)
```tsx
<ZrNavigation with-top routes={[{ text: 'Inicio', href: '/' }]}>
  <img slot="logo" src="/zurich-logo.svg" alt="Zurich" />
</ZrNavigation>
```

### 7.4 Alineado a la izquierda + esquinas redondeadas
```tsx
<ZrNavigation config="left:rounded" routes={[{ text: 'Inicio', href: '/' }]}>
  <img slot="logo" src="/zurich-logo.svg" alt="Zurich" />
</ZrNavigation>
```

---

## 8. Behavior Rules (for the AI)

- ❗ **`menu` es array de arrays** — cada array interno es una columna del panel lateral; no pasar un array plano de items esperando una sola columna.
- ❗ **No replicar breakpoints a mano** — el `@container` interno ya maneja <1200px/<768px.
- ❗ **No inventar eventos de apertura/cierre** — no está documentado en los `.d.ts`; si se necesita reaccionar al toggle, verificar primero en el bundle JS runtime (`javascript.js`) antes de asumir un evento.
- ❗ **`--z-navigation--height` default es `5rem` (80px)** — al migrar `.pqr-topnav` (que también usa `height: 80px` a mano) el valor coincide, pero **confirmarlo visualmente** antes de eliminar el CSS manual.
- ❗ **BUG del vendor (confirmado en runtime, 0.8.1):** `menu`/`routes`/`footer`/`social` son props array/objeto. El wrapper React del vendor (`useCustomElement()`) las serializa con `JSON.stringify()` antes de pasarlas al custom element; como el elemento ya declara esas props como reactive properties de Lit, React las asigna como PROPIEDAD del nodo (no como atributo) y la propiedad queda con el string crudo sin re-parsear — `this.routes?.map is not a function` en runtime (reproducido y confirmado en `?screen=ds-catalog`). Comparado con `ZrTabs` (sí funciona con su prop array `tabs`): la diferencia es que `ZrTabs` declara un evento (`onChange`) y por eso usa `useCustomElementWithEvents()`, que además reasigna la propiedad real por ref en un `useEffect` tras el montaje — `ZrNavigation`/`ZrFooter` no declaran eventos, así que el vendor no aplica ese fix. **La fachada `ZdsFields.tsx` ya parchea esto** (reasigna las props reales por `querySelector` en un `useEffect`) — usar `ZrNavigation` **solo desde `ZdsFields.tsx`**, nunca importar `@zurich/web-components/react/navigation` directo, o se vuelve a romper.

---

## 9. Quick Decision Tree (for the AI)

```
User asks for...                                        → Use...
------------------------------------------------------------------------------
navbar superior con logo + menú lateral responsive        → <ZrNavigation menu footer social>
navbar superior simple, solo enlaces directos              → <ZrNavigation routes>
navbar con espacio reservado para un banner fijo arriba     → + with-top
```

---

## 10. TypeScript Type Hint (suggested)

```ts
type MenuSubItem = { text: string; href: string } | { text: string; items: { text: string; href: string }[] };
type MenuItem = { text: string; items: MenuSubItem[]; icon?: string };
type ZrNavigationProps = {
  menu?: MenuItem[][];
  routes?: { text: string; icon?: string; href?: string }[];
  social?: Partial<Record<string, string>>;
  footer?: { text: string; href: string }[];
  config?: 'left' | 'rounded' | 'left:rounded';
  'with-top'?: boolean;
  isotype?: boolean;
};
```

---

## 11. Composition Patterns

### 11.1 Candidato de reemplazo de `.pqr-topnav*`
```tsx
<ZrNavigation
  routes={[{ text: 'Radicar PQR', href: '/pqr' }]}
  footer={[{ text: 'Política de privacidad', href: '/legal' }]}
>
  <img slot="logo" src="/zurich-logo.svg" alt="Zurich" />
</ZrNavigation>
```

> Antes de migrar: el diseño actual de `.pqr-topnav` es una barra **estática sin menú desplegable** (solo logo a la derecha) — usar `ZrNavigation` sin `menu` (solo `routes` o nada) para no introducir un panel lateral que el diseño original no contempla.
