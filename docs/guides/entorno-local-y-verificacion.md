# Entorno local y gate de verificación

Cómo dejar la máquina lista para correr el gate (build + lint + tests) y cómo se fuerza que
se ejecute.

## Las dos capas

| Capa | Qué es | Se puede saltar |
|---|---|---|
| **GitHub Actions** (`.github/workflows/ci.yml`) | Gate autoritativo: corre en cada push y PR con Node 24 | **No** |
| **Hook `pre-commit`** (`.githooks/pre-commit`) | Feedback rápido antes de commitear | Sí, con `git commit --no-verify` |

Un hook local **siempre** es evitable, así que la autoridad es CI. El hook existe para no
descubrir en el PR algo que se podía ver en 10 segundos.

## Setup del hook (una vez por clon)

```bash
cd pm4-app
npm run setup:hooks
```

Eso hace `git config core.hooksPath .githooks`. No usa husky — no hace falta una dependencia
para esto, y el hook queda versionado en el repo como cualquier otro archivo.

El hook elige runner solo:
1. **npm del host**, si existe (ver abajo cómo instalarlo).
2. **`docker exec pm4-app-container`**, si no hay npm pero el contenedor está arriba.
3. Si no hay ninguno: **avisa y deja pasar el commit** (CI lo va a atrapar igual).

## Node en el host — opcional, pero recomendado

Sin Node en el host todo funciona vía Docker; con Node en el host el hook es más rápido y no
depende de que el contenedor esté encendido.

**Usar `nvm-windows`, no `winget install OpenJS.NodeJS`.** Al momento de escribir esto winget
publica Node **26**, y este proyecto corre Node **24** en el contenedor (`pm4-app/Dockerfile`
→ `node:24-alpine`) y en Render. Un major distinto en el host es exactamente el drift que ya
costó una migración (ver `docs/archive/react19-migration.md`).

```bash
winget install CoreyButler.NVMforWindows
```

Cerrar y reabrir la terminal, después:

```bash
nvm install 24
nvm use 24
node -v          # debe imprimir v24.x
```

### ⚠️ Si `node -v` no funciona: **reiniciá la terminal (y el IDE)**

El instalador de nvm-windows deja el PATH con la indirección **`%NVM_HOME%;%NVM_SYMLINK%`**
(en el PATH de máquina, y define ambas variables también a nivel máquina). Eso **funciona
bien** — Windows las expande al construir el bloque de entorno de un proceso nuevo;
verificado en este proyecto con Node 24.19.0.

La causa real de "instalé Node y `node -v` no existe" es casi siempre mucho más simple: **el
proceso que estás usando arrancó antes de la instalación**. Un proceso hereda su bloque de
entorno al nacer y no se refresca nunca. Aplica a la terminal, y también al IDE o a cualquier
agente que la haya lanzado — cerrar solo la pestaña no alcanza si el proceso padre sigue
siendo el viejo.

```powershell
# Comprobar el PATH PERSISTIDO (crudo, sin expandir) en vez del de la sesión:
(Get-Item 'HKCU:\Environment').GetValue('PATH','','DoNotExpandEnvironmentNames') -split ';' |
  Where-Object { $_ -match 'nvm|NVM' }
```

Si ahí aparecen `%NVM_HOME%` y `%NVM_SYMLINK%`, la instalación está bien: reiniciá la
terminal/IDE y listo. **No hace falta reemplazarlas por rutas literales** — hacerlo solo
desvía la config del default del instalador.

> **Si igual necesitás escribir el PATH desde PowerShell, no uses
> `[Environment]::SetEnvironmentVariable(..., "User")`:** convierte el valor de registro de
> `REG_EXPAND_SZ` a `REG_SZ`, y ahí Windows **deja de expandir** cualquier `%VAR%` del PATH —
> rompe justamente la indirección de nvm. Usar
> `Set-ItemProperty -Path 'HKCU:\Environment' -Name PATH -Value <v> -Type ExpandString`.

### Sobre la versión exacta

El host puede quedar en un patch distinto al del contenedor (p. ej. host `v24.19.0` vs
contenedor `v24.18.0`) y **eso está bien**: tanto `pm4-app/Dockerfile` (`node:24-alpine`)
como el CI (`node-version: '24'`) flotan dentro del major. Lo que hay que mantener alineado
es el **major 24**; un major distinto (winget publica Node 26) sí es el drift a evitar.

Instalar dependencias en el host:

```bash
cd pm4-app
npm ci
```

> **Por qué `npm ci` y no `npm install`:** reproduce exactamente el `package-lock.json`
> commiteado. Este proyecto ya tuvo un incidente de árbol de React duplicado por
> instalaciones incrementales (detalle en `docs/archive/react19-migration.md`).

### Advertencia sobre los dos árboles de `node_modules`

`docker-compose.yml` monta `/app/node_modules`, `/app/frontend/node_modules` y
`/app/backend/node_modules` como **volúmenes anónimos**, así que el contenedor usa su propio
árbol y enmascara los directorios del host (hoy vacíos). Al correr `npm ci` en el host se
llenan esos directorios con binarios compilados **para Windows**.

Mientras existan los volúmenes anónimos no hay conflicto. Pero si alguna vez se borran (p. ej.
`docker compose down -v`), el contenedor Linux vería los `node_modules` de Windows y fallaría
con errores raros de módulos nativos. **Si eso pasa:** vaciar el contenido de los tres
`node_modules` y reinstalar dentro del contenedor.

## Correr el gate a mano

Con Node en el host:

```bash
cd pm4-app
npm run verify      # build (frontend + backend) + lint + tests
```

Vía Docker:

```bash
docker exec pm4-app-container sh -c "cd /app && npm run verify"
```

Si tocaste `cotizador-service/`:

```bash
docker exec cotizador-service-container sh -c "cd /app && pytest -q"
```

> `verify` corre los builds **por workspace** a propósito. El script `build` de la raíz
> dispara `prebuild` (`pm4-registry-sync --update --ci`), que consulta la instancia PM4 real
> y puede reescribir `pm4-registry.json` — algo que no se quiere en medio de un commit.

Qué necesita test y cómo escribirlo: [`testing-conventions.md`](testing-conventions.md).
