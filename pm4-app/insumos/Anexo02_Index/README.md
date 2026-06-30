# Índice de Mockups y Especificaciones TO-BE (Anexo 02)

Este directorio contiene una versión indexada en Markdown del archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx`. Fue diseñado para facilitar la búsqueda, lectura y análisis de las pantallas, campos, reglas y mensajes por parte de desarrolladores y Modelos de Inteligencia Artificial (IA).

---

## Estructura del Índice

El índice está organizado de la siguiente manera:

1. **[Hojas Maestras (Inventarios Globales)](masters/)**: Hojas de datos consolidadas de la aplicación, útiles para búsquedas globales de campos, reglas o catálogos.
2. **[Fichas Técnicas por Pantalla](screens/)**: Documentos individuales para cada pantalla (`SCR-XXX.md`) que agrupan y correlacionan toda la información relacionada (campos, acciones, reglas, mensajes, permisos, trazabilidad BPMN y checklist QA).

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
| [SCR-001](screens/SCR-001.md) | Crear / Recibir Queja | Formulario de alta | P01-T01 | Gestor de Experiencia |
| [SCR-002](screens/SCR-002.md) | Corrección de Datos | Formulario de corrección | P01-T07 | Gestor de Experiencia |
| [SCR-003](screens/SCR-003.md) | Corrección Error Funcional M1/M2 | Panel de corrección de error funcional | SP1-T05 | Gestor de Experiencia |
| [SCR-004](screens/SCR-004.md) | Revisión Error Técnico API | Pantalla de análisis técnico | SP1-T06 | Analista Técnico |
| [SCR-005](screens/SCR-005.md) | Detalle del Caso / Asignación | Pantalla de detalle + asignación | SP2-T01 | Usuario Zurich / Área Responsable |
| [SCR-006](screens/SCR-006.md) | Reasignación de Caso | Modal de reasignación | SP2-T03 | Usuario Zurich / Área Responsable |
| [SCR-007](screens/SCR-007.md) | Gestión de Queja — Área Responsable | Formulario de análisis y respuesta técnica | SP2-T02 / SP2-T05 | Usuario Zurich / Área Responsable |
| [SCR-008](screens/SCR-008.md) | Revisión Respuesta SAC | Pantalla de revisión y aprobación | SP2-T04 | Analista SAC |
| [SCR-009](screens/SCR-009.md) | Formulario Superintendencia | Formulario regulatorio (F.1000-166/Formato 411) | SP2-T07 | Usuario Zurich / Área Responsable |
| [SCR-010](screens/SCR-010.md) | Formulario Cierre M3 | Formulario de cierre regulatorio (Momento 3) | SP3-T01 / SP3-T04 / SP3-T08 | Usuario Zurich / Área Responsable |
| [SCR-011](screens/SCR-011.md) | Revisión Error Técnico Prórroga | Pantalla de análisis técnico (prórroga) | SP4-T05 | Analista Técnico |
| [SCR-012](screens/SCR-012.md) | Corrección Error Funcional Prórroga | Formulario de corrección (prórroga) | SP4-T06 | Analista SAC / Área Responsable |
| [SCR-000](screens/SCR-000.md) | Formulario de Radicación PQRS (Autoservicio) | Formulario de autoservicio (radicación pública) | P01-T00 | Consumidor Financiero (Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor) |
| [SCR-0051](screens/SCR-0051.md) | Flujo Combinado — Detalle / Reasignación / Respuesta | Pantalla combinada (detalle + asignación/reasignación + elaboración de respuesta) | SP2-T01 / SP2-T02 / SP2-T03 / SP2-T05 | Analista SAC / Área Responsable |
| [SCR-0052](screens/SCR-0052.md) | Respuesta del Área Responsable | Vista del caso asignado — registro de comentario y adjunto | SP2-T02 | Área Responsable |


---

## Cómo Actualizar este Índice

Este índice se autogenera a partir del archivo Excel utilizando un script de Python. Si realizas cambios en el archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx`, puedes regenerar todo el índice de la siguiente manera:

1. Asegúrate de tener instalados `pandas` y `openpyxl`:
   ```bash
   pip install pandas openpyxl
   ```
2. Ejecuta el script de indexación desde este directorio:
   ```bash
   python index_anexo02.py
   ```
