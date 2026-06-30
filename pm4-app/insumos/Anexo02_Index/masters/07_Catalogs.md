# Master Sheet: 07_Catalogs

| ID Catálogo | Nombre | Origen | Descripción / Valores de ejemplo | Estado | Dependencia | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-CANAL | Canal de Recepción | SFC | Ej: 5. Centro atención telefónica, 3. Web, 1. Presencial... | Pendiente TI | — | Validar lista completa con SmartSupervision. |
| CAT-TIPO-ID | Tipo de Identificación | SFC | CC, CE, NIT, Pasaporte, TI | Pendiente TI | — | — |
| CAT-TIPO-PERSONA | Tipo de Persona | SFC | 1. Natural / 2. Jurídica | Pendiente TI | — | — |
| CAT-PAIS | Código País | SFC | 170. Colombia y demás países | Pendiente TI | — | Por defecto: 170. |
| CAT-DPTO | Departamentos | SFC | 32 depts + D.C. | Pendiente TI | CAT-MPIO | Carga dinámica municipios. |
| CAT-MPIO | Municipios | SFC | Municipios por departamento | Pendiente TI | CAT-DPTO | Dependiente del departamento. |
| CAT-PRODUCTO-SFC | Producto SFC | SFC | 101. Automóviles, 102. Vida, 103. Hogar... | Pendiente TI | — | Homologar con Producto Zurich. |
| CAT-MOTIVO-SFC | Motivo SFC | SFC | 301. No pago siniestro, 302. Demora pago... | Pendiente TI | — | Campo crítico: condiciona fraude. |
| CAT-TIPO-SOL | Tipo Solicitud Zurich | Zurich | Queja Directa SmartSupervision, Requerimiento, Sugerencia... | Activo — Zurich | — | No va a SFC. Solo uso interno. |
| CAT-INSTANCIA | Instancia de Recepción | SFC | 2. Entidad vigilada, 1. Defensor CF, 3. SFC | Pendiente TI | — | — |
| CAT-PUNTO | Punto de Recepción | SFC | 5. Call Center, 1. Presencial, 2. Virtual, 3. Escrito | Pendiente TI | — | — |
| CAT-ADMISION | Admisión | SFC | 9. No aplica, 1. Admitida, 2. No admitida | Pendiente TI | — | — |
| CAT-ENTE | Ente de Control | SFC | 99. Otros, 1. SFC, 2. Defensor CF | Pendiente TI | — | — |
| CAT-SEXO | Sexo | SFC | M. Masculino / F. Femenino / I. No informa | Pendiente TI | — | — |
| CAT-LGBTIQ | LGBTIQ+ | SFC | ⚠ PENDIENTE CONFIRMACIÓN CON TI — catálogo no confirmado | PENDIENTE CRÍTICO | — | Campo FLD-147 identificado en SCR-09 AS-IS. Confirmar con TI antes de implementar. |
| CAT-COND-ESP | Condición Especial | SFC | Ninguna, Adulto mayor, Discapacidad física, Cognitiva, Vulnerable | Pendiente TI | — | — |
| CAT-PROD-DIGITAL | Producto Digital | SFC | 1. Sí / 2. No | Pendiente TI | — | — |
| CAT-ESTADO-QUEJA | Estado Queja/Reclamo | SFC | Cerrada a favor CF, Cerrada a favor entidad, Desistida, Rectificada | Pendiente TI | — | — |
| CAT-FAVORAB | Favorabilidad | SFC | 1. CF / 2. Entidad / 3. Parcial | Pendiente TI | — | — |
| CAT-ACEPTACION | Aceptación | SFC | Valores catálogo SFC | Pendiente TI | — | — |
| CAT-RECTIF | Rectificación | SFC | Valores catálogo SFC | Pendiente TI | — | — |
| CAT-DESIST | Desistimiento | SFC | Valores catálogo SFC | Pendiente TI | — | — |
| CAT-TUTELA | Tutela | SFC | 2. No / 1. Sí | Pendiente TI | — | — |
| CAT-MARCACION | Marcación | SFC | Valores catálogo SFC | Pendiente TI | — | — |
| CAT-EXPRES | Queja Exprés | SFC | 2. No / 1. Sí | Pendiente TI | — | — |
| CAT-TIPO-FRAUDE | Tipo de Fraude | SFC — CE 019/2024 | Fraude externo / Fraude interno / Phishing... | Pendiente TI | — | ⚠ Obligatorio desde 1 julio 2025. |
| CAT-MOD-FRAUDE | Modalidad de Fraude | SFC — CE 019/2024 | Robo info / Falsificación docs / Suplantación... | Pendiente TI | — | ⚠ Obligatorio desde 1 julio 2025. |
| CAT-AREA | Área Responsable Zurich | Zurich | Siniestros Auto, Siniestros Vida, Pagos, Producto, SAC | Activo — Zurich | CAT-USUARIOS-ROLE | Filtro de usuarios. |
| CAT-USUARIOS-ROLE | Usuarios por Rol | BPM | Usuarios autorizados por área y rol | Activo — BPM | CAT-AREA | Filtrado dinámico. |
| CAT-MOTIVO-REASIG | Motivo Reasignación | Zurich | Error asignación inicial, Área equivocada, Derivación producto... | Pendiente TI | — | — |
| CAT-MOTIVO-PRORR | Motivo Prórroga | SFC | Motivos aceptados por SmartSupervision para prórroga | Pendiente TI | — | Validar con catálogo SFC vigente. |
| CAT-ROL-RADICADOR | Rol del Radicador | Zurich | Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor | Activo — Zurich | CAT-INSTANCIA | Determina la instancia y el punto de recepción SFC. |
| CAT-TIPO-SOLIC-PQRS | Tipo de Solicitud (PQRS Front) | Zurich | Solicitud, Felicitación, Queja, Sugerencia, Derecho de petición | Activo — Zurich | — | Lista #2 del formulario PQRS. Homologar con CAT-TIPO-SOL. |
| CAT-DETALLE-PRODUCTO | Detalle del Producto | SFC | Subnivel del producto SFC seleccionado | Pendiente TI | CAT-PRODUCTO-SFC | Pendiente confirmar lista con TI/SFC. |
| CAT-FAVOR | Respuesta a Favor de | Zurich | Cliente / Compañía | Pendiente TI | — | ⚠ Pendiente parametrización. Indica a quién favorece la resolución (FLD-350, PAN-05.1). Homologar con CAT-FAVORAB. |
