// SP2-T07 — Formulario Superintendencia (SCR-009 / PAN-09)
// Proceso: SP2 Gestionar Respuesta Interna y Revisión SAC | Rol: Analista SAC
// Formulario regulatorio SFC (F.1000-166 / Formato 411).
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-009
//
// El Analista SAC diligencia el formulario regulatorio (condición del cliente, condición
// de la queja, datos de fraude si aplica, anexos) tras aprobarse la respuesta y generarse
// el PDF (SP2-T06). Al guardarlo completo habilita el subproceso SP3 de cierre regulatorio.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.
// Catálogos SFC (CAT-*) marcados "Pendiente TI" en 07_Catalogs → se implementan como
// OPTIONS estáticas placeholder con los valores de ejemplo del insumo (ver DOCUMENTACION §10).

// Acción/decisión BPMN según el botón presionado.
export type AccionFormularioSFC = 'GUARDAR' | 'GUARDAR_BORRADOR';

// ---------------------------------------------------------------------------
// OPTIONS estáticas (placeholder de catálogos SFC — pendientes de parametrización)
// ---------------------------------------------------------------------------
export const OPTIONS = {
  sino: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  // CAT-SEXO
  sexo: [
    { value: 'M', label: 'M. Masculino' },
    { value: 'F', label: 'F. Femenino' },
    { value: 'I', label: 'I. No informa' },
  ],
  // CAT-LGBTIQ ⚠ PENDIENTE CRÍTICO — catálogo no confirmado con TI (placeholder).
  lgbtiq: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
    { value: 'NI', label: 'No informa' },
  ],
  // CAT-COND-ESP
  condicionEspecial: [
    { value: 'NINGUNA', label: 'Ninguna' },
    { value: 'ADULTO_MAYOR', label: 'Adulto mayor' },
    { value: 'DISC_FISICA', label: 'Discapacidad física' },
    { value: 'DISC_COGNITIVA', label: 'Discapacidad cognitiva' },
    { value: 'VULNERABLE', label: 'Vulnerable' },
  ],
  // CAT-PROD-DIGITAL
  productoDigital: [
    { value: '1', label: '1. Sí' },
    { value: '2', label: '2. No' },
  ],
  // CAT-ESTADO-QUEJA
  estadoQueja: [
    { value: 'CERR_CF', label: 'Cerrada a favor CF' },
    { value: 'CERR_ENT', label: 'Cerrada a favor entidad' },
    { value: 'DESISTIDA', label: 'Desistida' },
    { value: 'RECTIFICADA', label: 'Rectificada' },
  ],
  // CAT-FAVORAB
  favorabilidad: [
    { value: '1', label: '1. A favor del cliente' },
    { value: '2', label: '2. A favor de la entidad' },
    { value: '3', label: '3. Parcial' },
  ],
  // CAT-ACEPTACION (sin valores de ejemplo en el insumo — placeholder)
  aceptacion: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
    { value: 'PARCIAL', label: 'Parcial' },
  ],
  // CAT-RECTIF (sin valores de ejemplo — placeholder)
  rectificacion: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  // CAT-DESIST (sin valores de ejemplo — placeholder)
  desistimiento: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  // CAT-TUTELA
  tutela: [
    { value: '1', label: '1. Sí' },
    { value: '2', label: '2. No' },
  ],
  // CAT-MARCACION (sin valores de ejemplo — placeholder)
  marcacion: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  // CAT-EXPRES
  quejaExpres: [
    { value: '1', label: '1. Sí' },
    { value: '2', label: '2. No' },
  ],
  // CAT-TIPO-FRAUDE (CE 019/2024)
  tipoFraude: [
    { value: 'EXTERNO', label: 'Fraude externo' },
    { value: 'INTERNO', label: 'Fraude interno' },
    { value: 'PHISHING', label: 'Phishing' },
  ],
  // CAT-MOD-FRAUDE (CE 019/2024)
  modalidadFraude: [
    { value: 'ROBO_INFO', label: 'Robo de información' },
    { value: 'FALSIF_DOCS', label: 'Falsificación de documentos' },
    { value: 'SUPLANTACION', label: 'Suplantación' },
  ],
} as const;

// Selects obligatorios de SmartSupervision (S2 + S3) — validados por RUL-009-03.
export const CAMPOS_SFC_OBLIGATORIOS = [
  'qd_sexo', 'qd_lgbtiq', 'qd_condicionEspecial', 'qd_productoDigital',
  'qd_estadoQueja', 'qd_favorabilidad', 'qd_aceptacion', 'qd_rectificacion',
  'qd_desistimiento', 'qd_tutela', 'qd_marcacion', 'qd_quejaExpres',
] as const;

// Campos de fraude obligatorios cuando relacionadaFraude = Sí (RUL-009-01).
export const CAMPOS_FRAUDE = [
  'qd_tipoFraude', 'qd_modalidadFraude', 'qd_montoReclamado', 'qd_montoReconocido',
] as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-009
// ---------------------------------------------------------------------------
export interface FormularioSuperintendenciaFormData {
  // ── S1 Datos Precargados M1 (solo lectura) ──
  qd_codigoSFC:   string; // FLD-140
  qd_canal:       string; // FLD-141
  qd_productoSFC: string; // FLD-142
  qd_motivoSFC:   string; // FLD-143
  qd_admision:    string; // FLD-144
  qd_enteControl: string; // FLD-145

  // ── S2 Datos del Consumidor — Campos SFC (obligatorios) ──
  qd_sexo:             string; // FLD-146 (CAT-SEXO)
  qd_lgbtiq:           string; // FLD-147 (CAT-LGBTIQ ⚠ pendiente)
  qd_condicionEspecial: string; // FLD-148 (CAT-COND-ESP)
  qd_productoDigital:  string; // FLD-149 (CAT-PROD-DIGITAL)

  // ── S3 Condición de la Queja (obligatorios) ──
  qd_estadoQueja:   string; // FLD-150
  qd_favorabilidad: string; // FLD-151
  qd_aceptacion:    string; // FLD-152
  qd_rectificacion: string; // FLD-153
  qd_desistimiento: string; // FLD-154
  qd_tutela:        string; // FLD-155
  qd_marcacion:     string; // FLD-156
  qd_quejaExpres:   string; // FLD-157

  // ── S4 Datos de Fraude CE-019-2024 (condicional) ──
  qd_relacionadaFraude: string; // FLD-158 (SI/NO)
  qd_tipoFraude:        string; // FLD-159 (cond.)
  qd_modalidadFraude:   string; // FLD-160 (cond.)
  qd_montoReclamado:    string; // FLD-161 (cond., COP)
  qd_montoReconocido:   string; // FLD-162 (cond., COP)

  // ── S5 Anexos del Formulario ──
  qd_incluyeAnexosQueja:     string; // FLD-163 (SI/NO)
  qd_incluyeAdjuntoRespuesta: string; // FLD-164 (SI/NO)
  qd_pdfRespuestaFinal:      string; // FLD-165 (nombre del PDF generado, solo lectura)
  qd_diasProrroga:           string; // FLD-166 (número, si viene de SP4)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionFormularioSFC;
}

export const DEFAULTS: Partial<FormularioSuperintendenciaFormData> = {
  qd_sexo: '', qd_lgbtiq: '', qd_condicionEspecial: '', qd_productoDigital: '',
  qd_estadoQueja: '', qd_favorabilidad: '', qd_aceptacion: '', qd_rectificacion: '',
  qd_desistimiento: '', qd_tutela: '', qd_marcacion: '', qd_quejaExpres: '',
  qd_relacionadaFraude: 'NO',
  qd_tipoFraude: '', qd_modalidadFraude: '', qd_montoReclamado: '', qd_montoReconocido: '',
  qd_incluyeAnexosQueja: '', qd_incluyeAdjuntoRespuesta: 'SI', qd_diasProrroga: '0',
  qd_accion: 'GUARDAR',
};
