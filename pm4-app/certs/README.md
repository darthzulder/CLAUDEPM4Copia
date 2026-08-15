# CA del proxy TLS corporativo

Esta carpeta guarda el certificado de la CA que **la red de Zurich inyecta** en toda conexión
HTTPS saliente (`CN=ssldecrypt.latam.zurich.com`, un proxy de inspección TLS). Sin él, el backend
no puede hablar con PM4: Node rechaza la cadena con `SELF_SIGNED_CERT_IN_CHAIN` y el proxy
devuelve un **500** con `{"message":"self-signed certificate in certificate chain"}` en cualquier
ruta `/api/*`.

El `.pem` **no está versionado** (ver el bloque correspondiente en el `.gitignore` de la raíz, que
explica por qué). Cada quien exporta el suyo con el procedimiento de abajo.

## Por qué no basta con que Windows ya confíe en la CA

El certificado **ya está** en el almacén de Windows (`Cert:\LocalMachine\Root`) — por eso el
navegador abre PM4 sin advertencias. Pero **Node no usa el almacén de Windows**: trae su propia
lista de CAs compilada y solo la extiende vía `NODE_EXTRA_CA_CERTS`. De ahí la asimetría que
confunde al diagnosticar: el navegador entra, `curl -k` responde 401 (o sea que la red llega a
PM4 y solo falta el token), y el backend en Node falla.

## Exportar el certificado

Desde PowerShell, sin permisos de administrador (es lectura del almacén público):

```powershell
# 1. Ubicar la CA en el almacén de Windows y quedarse con su huella
Get-ChildItem Cert:\LocalMachine\Root |
  Where-Object { $_.Subject -like '*ssldecrypt*' } |
  Select-Object Thumbprint, Subject, NotAfter

# 2. Exportarla a PEM (reemplazar <THUMBPRINT> por el del paso 1)
$objCert = Get-ChildItem Cert:\LocalMachine\Root |
  Where-Object { $_.Thumbprint -eq '<THUMBPRINT>' }
$strB64 = [Convert]::ToBase64String($objCert.RawData, 'InsertLineBreaks')
$strPem = "-----BEGIN CERTIFICATE-----`n$strB64`n-----END CERTIFICATE-----`n"
[IO.File]::WriteAllText("$PWD\pm4-app\certs\zurich-ssldecrypt.pem", $strPem)
```

> **Exportar desde el almacén de Windows, NO desde la conexión.** Es tentador sacar el
> certificado de la propia cadena TLS (`openssl s_client -showcerts`), y es un paso más corto —
> pero es **circular**: se estaría confiando en un certificado entregado por la misma conexión que
> todavía no se puede verificar. Si alguien interpusiera un proxy distinto, entregaría *su* CA y se
> aceptaría sin más. El almacén de Windows lo llenó la política corporativa por un canal
> independiente, así que es la fuente legítima.

## Verificar antes de confiar

El paso que cierra el razonamiento de arriba: comparar la huella de lo exportado contra la que
presenta la conexión real. Si coinciden, la CA que la red está usando **es** la que la política
instaló.

```bash
STR_PEM=pm4-app/certs/zurich-ssldecrypt.pem
STR_A=$(openssl x509 -in "$STR_PEM" -noout -fingerprint -sha256 | sed 's/.*=//')
STR_B=$(openssl s_client -connect cozurich.dev.cloud.processmaker.net:443 -showcerts </dev/null 2>/dev/null \
        | awk '/BEGIN CERT/{n++} n==2' | openssl x509 -noout -fingerprint -sha256 | sed 's/.*=//')
[ "$STR_A" = "$STR_B" ] && echo "OK: coinciden" || echo "DIFIEREN: no confiar"
```

Valores verificados el 2026-08-15 (sirven de referencia; **rotan**, así que un valor distinto no
es de por sí una alarma — lo que importa es que las dos huellas coincidan entre sí):

```
subject     = CN=ssldecrypt.latam.zurich.com
issuer      = CN=ssldecrypt.latam.zurich.com     (auto-firmada: es la raíz, y la única que hace falta)
vigencia    = 2021-06-14 → 2031-06-12
SHA-256     = 5C:AD:59:95:96:EB:35:BE:44:31:C2:B6:2F:C5:38:D1:DE:67:52:80:BA:74:3A:84:AB:F6:14:A0:0B:66:3B:8C
```

## Cómo lo consume el backend

Vía `NODE_EXTRA_CA_CERTS` en el script `dev` de `backend/package.json`, con `cross-env` para que
funcione igual en PowerShell, cmd y bash.

**No se puede poner en el `.env`.** El backend carga su entorno con `dotenv.config()` desde
`server.ts`, o sea **después** de que el proceso arrancó — y Node lee `NODE_EXTRA_CA_CERTS` una
sola vez, al inicializar el módulo TLS. Comprobado: asignar `process.env.NODE_EXTRA_CA_CERTS` en
runtime y pedir la URL a continuación sigue fallando con `SELF_SIGNED_CERT_IN_CHAIN`. Tiene que
estar en el entorno del proceso antes de arrancar, y de ahí que viva en el script de npm.

Si el archivo no existe, Node **avisa por stderr y sigue** (`Warning: Ignoring extra certs...`).
No rompe el arranque: falla después, en la primera llamada a PM4, con el 500 de arriba. Es el modo
de falla a reconocer cuando alguien clona el repo y no exportó su certificado.

## Deuda de infra que esto NO cierra

Solo cubre a **Node**. `npm` sigue apoyado en `strict-ssl=false` en el `.npmrc` de usuario, que es
un bypass global de verificación TLS para todas las instalaciones — el mismo problema, resuelto de
la forma insegura. Con este `.pem` ya disponible, la vía limpia pasa a ser posible:

```bash
npm config set cafile "<ruta absoluta>/pm4-app/certs/zurich-ssldecrypt.pem"
npm config delete strict-ssl
```

No se aplicó junto con este cambio para no mezclar el desbloqueo del gate manual con una
modificación de la config global de npm de la máquina, que afecta a todo lo demás que se instale.
Queda anotado como el siguiente paso natural.
