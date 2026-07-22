# Baseline React 18 — evidencia de Etapa 0 (migración React 19)

Estado verde de referencia capturado el **2026-07-01** en la rama `migracion/react19`, **antes**
de tocar cualquier dependencia. Sirve para atribuir cualquier regresión en etapas posteriores al
cambio de esa etapa y no a ruido previo. Ver plan completo en `../migracion-react19-plan.md`.

## Entorno
- Ejecución dentro de `pm4-app-container` (no hay npm/node local).
- **Node:** v20.20.2 · **npm:** 10.8.2 · imagen base `node:20-alpine`.

## Builds / lint verdes (React 18)
| Comando | Resultado |
|---|---|
| `npm run build --workspace=frontend` (tsc + vite) | ✅ exit 0 — `vite v5.4.21`, 308 módulos, `built in ~5s` |
| `npm run build --workspace=backend` (tsc) | ✅ exit 0 |
| `npm run lint --workspace=frontend` (eslint) | ✅ exit 0 |

> Nota de build: Vite emite el warning conocido "CJS build of Vite's Node API is deprecated" y el
> aviso de chunk > 500 kB (bundle único). Son informativos, no errores — se registran para
> comparar contra las etapas siguientes.

## Versiones REALMENTE instaladas (resueltas por los rangos `^`)
Importante: los `^` ya flotaron dentro de su major, así que lo instalado ≠ lo declarado en package.json.

### Frontend
| Paquete | Declarado | **Instalado** |
|---|---|---|
| react | ^18.3.1 | **18.3.1** |
| react-dom | ^18.3.1 | **18.3.1** |
| react-hook-form | ^7.52.1 | **7.75.0** |
| typescript | ^5.5.3 | **5.9.3** |
| vite | ^5.3.3 | **5.4.21** |
| @vitejs/plugin-react | ^4.3.1 | **4.7.0** |
| @typescript-eslint/parser | ^8.62.0 | **8.62.0** |
| @zurich/css-components | 0.8.1 | **0.8.1** |
| @zurich/web-components | 0.8.1 | **0.8.1** (peer react/react-dom 18.3.1) |

### Backend
| Paquete | Declarado | **Instalado** |
|---|---|---|
| express | ^4.19.2 | **4.22.1** |
| multer | ^2.1.1 | **2.1.1** |
| axios | ^1.7.2 | **1.16.0** |

**Implicación para el plan:** TypeScript ya está en **5.9.3** por el caret → el objetivo "TS 5.9.x"
de la Etapa 3 ya se cumple; la única decisión abierta de TS es si subir a 6.0.x. react-hook-form ya
está en 7.75.0 (muy cerca del objetivo 7.80.0).

## Baseline visual
- `?screen=ds-catalog` renderizado y verificado sobre React 18 (captura mostrada en el transcript
  de la sesión de migración): botones (Primario/Secundario/Destructivo/Con ícono/Pequeño/Con
  tooltip) y campos (Texto, Select, Fecha, Radio, Área de texto, Checkbox, Segmented Sí/No)
  hidratan correctamente. Los web-components `z-*` del DS funcionan sin errores en consola.
- Pantallas reales: sin captura de baseline (no había token PM4 a mano); su regresión se validará
  funcionalmente y contra `ds-catalog` en las etapas siguientes.

## Lockfile de referencia
`../package-lock.baseline.json` — copia congelada de `pm4-app/package-lock.json` en este punto, para
diffing en etapas posteriores.
