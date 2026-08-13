# Proceso 31 — COL - Gestion de Quejas Directas

Mapa de los scripts PHP que ejecuta el proceso 31 y sus subprocesos: qué nodo BPMN invoca a cuál,
y qué scripts se llaman entre sí en tiempo de ejecución sin aparecer en el BPMN.

**El código no está acá.** PM4 es la fuente de verdad; el historial de cada script vive en la rama
huérfana `pm4-scripts-historial`, que se alimenta sola con `npm run pm4:capture`. Este documento es
el mapa, no el contenido. Ver
[`../../guides/historial-scripts-pm4.md`](../../guides/historial-scripts-pm4.md).

```bash
git show pm4-scripts-historial:proceso-31/col-qd-core-sfc.php    # el código actual
git log  pm4-scripts-historial -- proceso-31/col-qd-core-sfc.php # su historial
```

- **Proceso raíz:** id `31`, uuid `a201d6f6-6266-480e-abf6-e24de2bbf8d2`
- **Proyecto PM4:** id `2` — "COL - Quejas Directas"
- **Instancia de referencia:** la que define `PM4_BASE_URL` en `pm4-app/.env`

> Los **ids numéricos de esta página son de la instancia actual y cambian al migrar**. La autoridad
> es el `uuid`; el id vigente se consulta en `pm4-scripts.index.json`, dentro de la rama de
> historial.

## Árbol de procesos (BPMN `callActivity`)

```
31  COL - Gestion de Quejas Directas - Proceso   (proceso padre)
├─ 32  SP1: Validar y Radicar ante SmartSupervision
├─ 33  SP2: Gestionar Respuesta Interna y Revisión SAC
│   ├─ 77  T05.2 Llenar datos de ayuda        (sin scripts ni sub-callActivity)
│   └─ 35  SP04 Gestionar Prorroga
└─ 34  SP3: Cerrar Queja ante SmartSupervision M3
```

Los XML completos están en [`bpmn/`](bpmn/), descargados con `GET /api/1.0/processes/{id}/bpmn`.

## Scripts por nodo BPMN (`pm:scriptRef`)

| Proceso | Nodo | Tarea | Script (slug en el historial) | id |
|---|---|---|---|---|
| 31 | node_7 | T01 Recibir queja | `col-qd-recibir-datos-queja` | 69 |
| 31 | node_120 | T03 Priorizar caso y recalcular SLA | `col-qd-asignar-sla` | 71 |
| 31 | node_144 | T04 Calcular SLA | `col-qd-asignar-sla` | 71 |
| 31 | node_180 | Notificación de priorización | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_213 | Notificación de registro | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_255 | T05 Validar datos y asignar responsable | `col-qd-revisar-datos-y-asignar-usuario` | 76 |
| 31 | node_425 | T07.2 Respuesta final favorable | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_433 | T08 Encuesta de satisfacción | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_493 | Calcular SLA 2 días | `col-qd-check-sla-expire` | 77 |
| 31 | node_1145 | Notificación de vencimiento y SLA | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_1628 | T07.1 Respuesta final no favorable | `col-qd-enviar-correos-quejas-directas` | 81 |
| 31 | node_1740 | Revisión Momento 1 SS | `col-qd-obtener-queja-sfc-m1` | 86 |
| 32 | node_44 | T02 Payload de creación a API (M1/M2) | `col-qd-crear-queja-sfc-m2` | 83 |
| 33 | node_139 | T06 Generar PDF de respuesta final | `col-qd-docs-to-pdf-libreoffice-7-6` | 80 |
| 34 | node_87 | T05 Payload de cierre a API (M3) | `col-qd-cierre-m3` | 89 |
| 35 | node_8 | T01 Payload de prórroga API (M3) | `col-qd-ss-sla-prolongation` | 78 |
| 35 | node_15 | T03 Notificar prórroga al cliente | `col-qd-enviar-correos-quejas-directas` | 81 |
| 35 | node_23 | T04 Actualizar SLA con nueva fecha | `col-qd-asignar-sla` | 71 |

Nodos `scriptTask` con `pm:scriptRef=""` (declarados pero sin script asignado):
`32/node_31`, `32/node_92`, `32/node_100`, `33/node_7`, `34/node_109`, `34/node_132`, `35/node_35`.

## Scripts que no aparecen en el BPMN

No son tareas de proceso: se invocan desde otro script en tiempo de ejecución. Buscarlos solo en el
BPMN los haría invisibles.

```
86 (Obtener Queja M1) ──┐
83 (Crear Queja M2)   ──┼──▶ 84  col-qd-core-sfc
89 (Cierre M3)         ──┤      login + firma HMAC-SHA256 + HTTP contra la SFC.
78 (Prórroga)          ──┘      Único script que conoce el secret de SmartSupervisión.

77 (Check SLA Expire) ──▶ 95  col-util-dias-habiles
                            Resuelto por UUID (a26a713d-…), no por id: el id cambia entre instancias.
```

Y uno más, que tampoco está en el BPMN porque lo invoca el **frontend** como watcher desde SCR-000:

| Script | slug | id | Quién lo llama |
|---|---|---|---|
| COL_QD_Check_Similitud | `col-qd-check-similitud` | 70 | La app React, vía `resolveScriptId('similarCasesQuejas')` |

## Inventario (13 scripts del proceso 31)

| slug | título en PM4 | id | rol |
|---|---|---|---|
| `col-qd-recibir-datos-queja` | COL_QD_Recibir_datos_queja | 69 | arma `qd_strBpmCaseId` / `qd_strFilingDate` al crear el caso |
| `col-qd-check-similitud` | COL_QD_Check_Similitud | 70 | detecta casos similares (watcher del frontend) |
| `col-qd-asignar-sla` | COL_QD_Asignar_SLA | 71 | asigna/recalcula SLA y fecha de vencimiento |
| `col-qd-revisar-datos-y-asignar-usuario` | COL QD - Revisar datos y Asignar usuario | 76 | deriva el rol responsable (colección `cat_matriz_motivos`, 45) |
| `col-qd-check-sla-expire` | COL_QD_Check_SLA_Expire | 77 | alerta si quedan ≤2 días hábiles |
| `col-qd-ss-sla-prolongation` | COL_QD_SS_Sla_Prolongation | 78 | prórroga de SLA ante la SFC |
| `col-qd-docs-to-pdf-libreoffice-7-6` | COL - QD - Docs to PDF - LibreOffice 7.6 | 80 | llena plantilla DOCX y convierte a PDF |
| `col-qd-enviar-correos-quejas-directas` | COL - QD - Enviar correos Quejas Directas | 81 | notificaciones por correo (Mailjet) |
| `col-qd-crear-queja-sfc-m2` | COL - QD - Crear Queja SFC - M2 | 83 | radica la queja + anexos (Momento 2) |
| `col-qd-core-sfc` | COL - QD - Core SFC | 84 | **CORE**: login, firma y HTTP hacia la SFC |
| `col-qd-obtener-queja-sfc-m1` | COL - QD - Obtener Queja SFC - M1 | 86 | captura quejas de la SFC y crea el caso (Momento 1) |
| `col-qd-cierre-m3` | COL - QD - Cierre - M3 | 89 | sube anexo y cierra la queja (Momento 3) |
| `col-util-dias-habiles` | COL_UTIL_Dias_Habiles | 95 | utilidad de días hábiles (feriados: colección 48) |

## Otros scripts QD en la instancia — FUERA de alcance

Existen en PM4 con nombre parecido, pero **ningún BPMN del proceso 31 los referencia** y no los
invoca ningún script vigilado. **No se capturan:** su historial no se está registrando.

| id | título | por qué está fuera |
|---|---|---|
| 73, 74, 75 | `COL_QD_… 2` | duplicados con sufijo " 2" |
| 85 | COL - QD - Firma HMAC-SHA256 SFC V2 | la firma la hace el CORE (84) |
| 87 | COL - QD - Momento 2 | reemplazado por el 83 |
| 88 | COL - QD - Obtener Queja SFC - M1 Directo | variante del 86 |
| 90 | COL - QD - Actualizacion Usuario - M4 | Momento 4, no cableado en el BPMN del 31 |

Si alguno resulta estar vivo, hay dos formas de incorporarlo: cablearlo en el BPMN (el
descubrimiento lo tomará solo) o declararlo en `scriptsExtra` del proceso 31 en
`pm4-app/scripts/pm4-scripts/pm4-scripts.config.json`.

## Dependencias externas

- **Colección 45** `cat_matriz_motivos` — deriva rol responsable, SLA, resarcimiento y relación de fraude.
- **Colección 48** `cat-feriados-colombia` — feriados para el cálculo de días hábiles.
- **~18 variables de entorno de PM4** (`SFC_SECRET_KEY_*`, `SFC_USER_*`, `API_TOKEN`, `HOST_URL`,
  `APP_ENV`, `ID_CATALOGO_MAILS_QD`, `API_GATEWAY_URL`…). Git no las lleva: al migrar de instancia
  hay que recrearlas, o el CORE lanza `Secret key no configurada` y la radicación falla entera.
