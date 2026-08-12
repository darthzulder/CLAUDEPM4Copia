# Entorno local y gate de verificación

Cómo responder, con evidencia, a la pregunta *"¿mi rama rompió algo del proyecto?"* — antes de
commitear y antes de mergear a `main`.

## Los cuatro anillos

Cada anillo es más lento y más autoritativo que el anterior. Los cuatro ejecutan **la misma
definición de verde**: `pm4-app/scripts/verify.mjs`.

| # | Anillo | Qué responde | Costo | Se puede saltar |
|---|---|---|---|---|
| 1 | `npm run test:watch` | "¿rompí esto que estoy escribiendo?" | instantáneo | — |
| 2 | `.githooks/pre-commit` | "¿rompí lo que toqué?" | ~30 s | sí: `git commit --no-verify` |
| 3 | `.githooks/pre-push` | "¿rompí el proyecto?" | ~30 s (se saltea si el anillo 2 ya verificó este árbol) | sí: `git push --no-verify` |
| 4 | GitHub Actions en el PR | **"¿rompo `main` al MERGEAR?"** | ~2 min | **no** |

### Por qué el anillo 4 no es reemplazable por ninguno local

En eventos `pull_request`, GitHub hace checkout de la **merge commit** — `main` y tu rama ya
integradas — y corre la suite sobre eso. Ningún hook local puede hacerlo: cuando corrés
`verify` en tu máquina, estás probando **tu rama sola**.

La diferencia importa para una clase entera de roturas. `main` renombra un campo `qd_*`; tu
rama, salida de antes, agrega un uso del nombre viejo. Las dos están verdes por separado. La
combinación no compila. Eso es un *semantic conflict*, y **solo aparece al probar el merge**.

Por eso este proyecto integra por PR y no con `git merge` local: un merge local seguido de push
a `main` nunca prueba esa combinación, y CI llega después de que `main` ya está roto.

### Una sola definición de verde

Los tres anillos automatizados llaman a `pm4-app/scripts/verify.mjs`, que corre, en orden de
costo creciente:

```
lint · frontend      lint · backend      typecheck · backend
build · frontend     build · backend
test · frontend      test · backend      test · cotizador (pytest)
```

Esto no es cosmética. Antes cada anillo mantenía su propia lista y **ya habían divergido**: el
hook corría los workspaces de Node pero no el `pytest` del cotizador, que sí corría CI. El
resultado era el clásico "en mi máquina pasaba". Con un script compartido la divergencia es
imposible por construcción.

```bash
cd pm4-app
npm run verify            # silencioso: solo imprime lo que falla
npm run verify:verbose    # stream de cada paso (lo que usa CI)
node scripts/verify.mjs --list   # qué pasos hay y cuáles se saltarían acá
```

> **Si no tenés Python con `pytest`**, el paso del cotizador se **salta con aviso ruidoso** en
> vez de bloquearte: en Windows es normal no tenerlo, y frenar cada commit del frontend por eso
> sería absurdo. CI siempre lo corre, así que la cobertura no se pierde — se retrasa hasta el
> PR. Para tenerlo en local: `pip install -r cotizador-service/requirements-dev.txt`.

## Setup de los hooks (una vez por clon)

```bash
cd pm4-app
npm run setup:hooks
```

Eso hace `git config core.hooksPath .githooks`, que activa **`pre-commit` y `pre-push` a la
vez**. No usa husky — no hace falta una dependencia para esto, y los hooks quedan versionados
en el repo como cualquier otro archivo.

Ambos eligen runner solos:
1. **npm del host**, si existe (ver abajo cómo instalarlo).
2. **`docker exec pm4-app-container`**, si no hay npm pero el contenedor está arriba.
3. Si no hay ninguno: **avisan y dejan pasar** (el anillo 4 lo va a atrapar igual).

### Qué hace el `pre-push` que el `pre-commit` no puede

1. **Alcanza los commits hechos con `--no-verify`.** Ese escape es legítimo para trabajo en
   progreso, pero deja código sin verificar; el anillo 3 lo agarra antes de que salga de la
   máquina.
2. **Avisa si la rama quedó detrás de `origin/main`**, con el número de commits. El aviso **no
   bloquea** a propósito: obligar a traer `main` en cada push volvería insoportable trabajar en
   una rama larga. Quien bloquea es el anillo 4, con *"require branches to be up to date"*,
   donde el chequeo importa porque ahí sí estás por integrar.

**No repite trabajo.** Si el `pre-commit` ya verificó exactamente este árbol, el `pre-push` lo
saltea. La marca vive en `.git/pm4-verified-tree` y guarda el hash del árbol verificado; solo se
escribe cuando no había cambios sin stagear (si los hubiera, lo verificado y lo commiteado no
serían lo mismo y la marca mentiría). Mismo árbol ⇒ mismo resultado.

## Protección de `main` (el anillo 4, y hay que activarlo a mano)

**Sin esto, CI es un reporte post-mortem, no un gate.** El workflow existe, pero nada impide
mergear una rama roja ni pushear directo a `main`.

En GitHub → *Settings* → *Branches* → *Add branch protection rule* para `main`:

- ✅ **Require a pull request before merging** — es lo que fuerza que se pruebe el merge.
- ✅ **Require status checks to pass before merging** → agregar **`Verificación (anillo 4)`**.
- ✅ **Require branches to be up to date before merging** — sin esto, el check puede ser de una
  base vieja y el *semantic conflict* pasa igual.
- ✅ **Do not allow bypassing the above settings** — si el admin puede saltarlo, no es un gate.

Con `gh` instalado, el equivalente por API:

```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["Verificación (anillo 4)"] },
  "required_pull_request_reviews": null,
  "enforce_admins": true,
  "restrictions": null
}
JSON
```

> **No pongas `Cobertura del diff` como check requerido.** Es una señal, no un gate: un umbral
> de cobertura obligatorio premia el test que ejecuta la línea sin asertar nada, que es
> exactamente la deuda que este proyecto ya pagó una vez.

## El flujo, de punta a punta

```bash
git switch -c feat/lo-que-sea      # nunca trabajar sobre main
# … código + sus tests …
git commit                          # anillo 2 (~30 s)
git merge origin/main               # traer main ANTES de pushear para integrar
npm run verify                      # verificar el resultado integrado
git push -u origin feat/lo-que-sea  # anillo 3
gh pr create                        # o el botón en GitHub → anillo 4 sobre la merge commit
# check verde ⇒ Merge. Nunca `git merge` local a main.
```

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
npm run verify
```

Vía Docker:

```bash
docker exec pm4-app-container sh -c "cd /app && npm run verify"
```

El paso de `pytest` va incluido; para correrlo solo:

```bash
docker exec cotizador-service-container sh -c "cd /app && pytest -q"
```

> `verify` corre los builds **por workspace** a propósito. El script `build` de la raíz
> dispara `prebuild` (`pm4-registry-sync --update --ci`), que consulta la instancia PM4 real
> y puede reescribir `pm4-registry.json` — algo que no se quiere en medio de un commit.

## "¿Qué parte de mi cambio no está probada?"

`verify` verde significa "nada de lo cubierto se rompió". No dice nada de lo que **no** está
cubierto, y quedan archivos sin test. Para ver la cobertura **de las líneas que tocaste**:

```bash
cd pm4-app
npm run coverage        # genera frontend/coverage/lcov.info
npm run coverage:diff   # cruza ese lcov con git diff origin/main...HEAD
```

Sale una línea por archivo del diff, con los números de línea sin cubrir, y marca aparte los
archivos que **ningún test carga** (que no es lo mismo que 0 %). En un PR, lo mismo aparece en
el job summary automáticamente.

Es una **señal, no un gate**. Que una línea esté cubierta significa que un test la ejecutó, no
que la asserte — el criterio de aceptación del proyecto sigue siendo romper el código a
propósito y ver el test en rojo. Ver [`testing-conventions.md`](testing-conventions.md).

## Lo que el gate NO verifica

Vale tenerlo explícito para no confundir "verde" con "seguro":

- **Que el registro PM4 siga resolviendo.** `prebuild` (`pm4-registry-sync`) consulta la
  instancia real y CI lo saltea a propósito (no tiene credenciales). Si en PM4 renombraron una
  colección o un script, el gate no se enterará.
- **Que la app funcione dentro del iframe de PM4.** El smoke test (`App.smoke.test.tsx`) monta
  las pantallas en jsdom y verifica que no revienten; no es un navegador real ni valida el
  contrato con PM4.
- **Que los tests aserten algo.** Un test puede ejecutar la línea y no comprobar nada. Eso lo
  cubre la disciplina de mutación, no la automatización.

Qué necesita test y cómo escribirlo: [`testing-conventions.md`](testing-conventions.md).
