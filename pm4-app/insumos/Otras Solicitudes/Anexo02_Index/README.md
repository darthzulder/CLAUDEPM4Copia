# Índice de Mockups y Especificaciones TO-BE (Anexo 02) — Otras Solicitudes

Este directorio contiene una versión indexada en Markdown del archivo Excel `Anexo02_Mockups_TOBE_OtrasSolicitudes_v3_2.xlsx`. Fue diseñado para facilitar la búsqueda, lectura y análisis de las pantallas, campos, reglas y mensajes por parte de desarrolladores y Modelos de Inteligencia Artificial (IA).

> Proceso: **Gestión de Otras Solicitudes** (Derechos de Petición, Solicitudes de Información, Modificaciones, Sugerencias/Felicitaciones y Vulneración de Datos) — Servicio de Atención al Consumidor Financiero, Zurich Colombia.
> El índice equivalente para el otro proceso vive en [`../../Quejas directas/Anexo02_Index/`](../../Quejas%20directas/Anexo02_Index/).

---

## Estructura del Índice

El índice está organizado de la siguiente manera:

1. **[Hojas Maestras (Inventarios Globales)](masters/)**: Hojas de datos consolidadas de la aplicación, útiles para búsquedas globales de campos, reglas o catálogos.
2. **[Fichas Técnicas por Pantalla](screens/)**: Documentos individuales para cada pantalla (`SCR-XXX.md`) que agrupan y correlacionan toda la información relacionada (secciones, campos, acciones, reglas, mensajes, catálogos, permisos, trazabilidad BPMN y checklist QA).

---

## Catálogo Maestro de Hojas

Haga clic en los enlaces a continuación para ver las tablas de inventario globales:

* [01_Pantallas - Inventario de Pantallas](masters/01_Pantallas.md)
* [02_Secciones - Secciones por Pantalla](masters/02_Secciones.md)
* [03_Campos - Diccionario General de Campos](masters/03_Campos.md)
* [04_Acciones - Acciones y Botones](masters/04_Acciones.md)
* [05_Reglas - Reglas de Negocio, Validación y Visibilidad](masters/05_Reglas.md)
* [06_Mensajes - Mensajes de Error y Éxito](masters/06_Mensajes.md)
* [07_Catalogs - Catálogos de Datos Referenciados](masters/07_Catalogs.md)
* [08_Permisos - Matriz de Roles y Permisos](masters/08_Permisos.md)
* [10_Trazabilidad_BPMN - Trazabilidad de Pantallas con Diagrama BPMN](masters/10_Trazabilidad_BPMN.md)
* [11_Checklist_QA - Criterios de Calidad de QA](masters/11_Checklist_QA.md)

---

## Inventario de Fichas de Pantallas (TO-BE)

A continuación se listan las pantallas del proceso, agrupadas por su rol y tarea BPMN. Haga clic en el identificador de la pantalla para abrir su ficha detallada:

| ID | Nombre Pantalla | Tipo | Tarea BPMN | Rol Responsable |
| --- | --- | --- | --- | --- |
| [SCR-003](screens/SCR-003.md) | Bandeja de Tareas — Gestión Línea 2 | Bandeja de tareas + formulario | P02-T12 | Usuario de Línea 2 (área especializada) |
| [SCR-004](screens/SCR-004.md) | Formulario de Reporte a SIC (Vulneración Datos) ⚠️ | Formulario regulatorio — PENDIENTE LEGAL | SP01-T03 | Área de Protección de Datos |
| [SCR-005](screens/SCR-005.md) | Formulario de Análisis de Impacto y Medidas Correctivas | Formulario de análisis de incidente | SP01-T04 | Área de Protección de Datos |
| [SCR-006](screens/SCR-006.md) | Asignación de Responsable, Historial de Asignaciones y Preparación de Respuesta del DP | Formulario de asignación | SP02-T03 | Gestor de Experiencia |
| [SCR-081](screens/SCR-081.md) | Formulario Único de Gestión de Requerimientos (Información, Modificación, Cancelación y Otros) | Formulario único de gestión de requerimiento (4 subtipos) | SP03-SP01 a SP03-SP04 | Gestor de Experiencia / Usuario Zurich Responsable |
| [SCR-010](screens/SCR-010.md) | Formulario de Registro de Sugerencia / Felicitación | Formulario de registro | SP04-T02 | Gestor de Experiencia |
| [SCR-012](screens/SCR-012.md) | Pantalla de Aprobación de Respuesta Final | Formulario de aprobación | SP05-T05 | Líder SAC |


---

## Cómo Actualizar este Índice

Este índice se autogenera a partir del archivo Excel utilizando un script de Python. Si realizas cambios en el archivo Excel `Anexo02_Mockups_TOBE_OtrasSolicitudes_v3_2.xlsx`, puedes regenerar todo el índice de la siguiente manera:

1. Asegúrate de tener instalados `pandas` y `openpyxl`:
   ```bash
   pip install pandas openpyxl
   ```
2. El script vive un nivel arriba de este directorio (`pm4-app/insumos/Otras Solicitudes/index_anexo02.py`). Ejecútalo desde ahí:
   ```bash
   cd "pm4-app/insumos/Otras Solicitudes"
   python index_anexo02.py
   ```

> El script **sobrescribe** todo el contenido de `masters/` y `screens/`: no edites esos `.md` a mano, los cambios se pierden en la próxima corrida. La fuente de verdad es el Excel.
