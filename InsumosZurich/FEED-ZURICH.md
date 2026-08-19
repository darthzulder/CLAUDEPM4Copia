# Feed de librerías Zurich (Azure Artifacts)

> Referencia para no volver a investigar. Última consulta: **2026-08-13**.

## Qué es este feed

Feed npm privado de **Azure Artifacts** (Azure DevOps, org `ZurichInsurance-CO`, feed `ZurichCo-DesingSystem`).
Aloja las librerías internas del **design system de Zurich** y además actúa como **proxy/caché de npmjs.org**
(tiene *upstream sources*: sirve también cualquier dependencia pública que se haya pedido a través de él).

- **Registry npm:** `https://pkgs.dev.azure.com/ZurichInsurance-CO/_packaging/ZurichCo-DesingSystem/npm/registry/`
- **API packaging:** `https://feeds.dev.azure.com/ZurichInsurance-CO/_apis/packaging/feeds/ZurichCo-DesingSystem/packages`

## Librerías propias de Zurich (6)

Design system moderno (`@zurich/*`, todas en 0.8.2) + la lib de Colombia (`@zurich-col/lib-zurich`).

| Paquete | Última | Nº versiones | Notas |
|---|---|---|---|
| `@zurich/angular-components` | 0.8.2 | 1 | Componentes Angular del design system |
| `@zurich/css-components` | 0.8.2 | 1 | Componentes/estilos CSS |
| `@zurich/design-tokens` | 0.8.2 | 1 | Tokens de diseño (colores, spacing, tipografía) |
| `@zurich/dev-utils` | 0.8.2 | 1 | Utilidades de desarrollo |
| `@zurich/web-components` | 0.8.2 | 1 | Web Components |
| `@zurich-col/lib-zurich` | 2.6.16 | 23 | **La que usa `pm4-app/frontend`.** Lib Angular Zurich Colombia |

### Versiones de `@zurich-col/lib-zurich` (23)

`2.6.16` (latest), `2.6.15`, `2.6.14`, `2.6.13`, `2.6.12`, `2.6.11`, `2.6.10`, `2.6.9`, `2.6.8`,
`2.6.6`, `2.6.5`, `2.5.5`, `2.4.5`, `2.4.4`, `2.4.3`, `2.3.3`, `2.2.3`, `2.2.2`, `2.1.2`,
`2.1.1`, `2.0.1`, `2.0.0`, `1.5.21`

> Copias locales presentes en el repo: `InsumosZurich/lib-zurich-2.6.16/` (2.6.16) y
> `InsumosZurich/fe-lib-zurich/` (código fuente, package.json en 2.6.14).

## Autenticación

- El `.npmrc` de la raíz del proyecto ya contiene el PAT (base64) en `:_password`.
  El token expira periódicamente → si sale **401**, regenerarlo con:
  ```
  npx vsts-npm-auth -config .npmrc
  ```

## Certificado TLS corporativo (importante)

La red de Zurich intercepta HTTPS con un proxy de inspección SSL:
`CN=ssldecrypt.latam.zurich.com`. Node/npm no confían en esa CA por defecto → error
`SELF_SIGNED_CERT_IN_CHAIN`.

Estado actual: se resolvió con `npm config set strict-ssl false` (parche global, no ideal).
Alternativa limpia pendiente: exportar la CA de Zurich y apuntar `cafile` / `NODE_EXTRA_CA_CERTS`.

`curl` **sí** funciona usando el almacén de certificados de Windows (que tiene la CA de Zurich),
añadiendo `--ssl-no-revoke`.

## Cómo volver a consultar el feed SIN instalar (npm)

### Listar todos los paquetes (incluye públicos cacheados; tope 1000)

```powershell
$line   = Get-Content .npmrc | Where-Object { $_ -match ':_password=' } | Select-Object -First 1
$b64pat = ($line -split '_password=')[1].Trim()
$pat    = [Text.Encoding]::ASCII.GetString([Convert]::FromBase64String($b64pat))
$api    = "https://feeds.dev.azure.com/ZurichInsurance-CO/_apis/packaging/feeds/ZurichCo-DesingSystem/packages?api-version=7.1-preview.1&`$top=1000&includeAllVersions=true"
$data   = (& curl.exe -s --ssl-no-revoke -u "user:$pat" $api) | ConvertFrom-Json

# Solo las propias de Zurich:
$data.value | Where-Object { $_.name -like '@zurich*' } | Sort-Object name | ForEach-Object {
  "{0,-40} {1}" -f $_.name, (($_.versions | Where-Object isLatest).version)
}
```

### Ver metadatos/versión de un paquete concreto (usa .npmrc, requiere strict-ssl false)

```powershell
npm view "@zurich-col/lib-zurich" --registry=https://pkgs.dev.azure.com/ZurichInsurance-CO/_packaging/ZurichCo-DesingSystem/npm/registry/
```

## Notas

- El `count` de la API llega a 1000 = tope de página. Para el inventario completo de públicos
  habría que **paginar** con `&$skip=N`. Los `@zurich*` propios ya caben en la primera página.
- Warning `Unknown project config "always-auth"`: es obsoleto en npm nuevo; con PAT en la URL ya no
  hace falta, se puede quitar del `.npmrc` sin afectar la auth.
