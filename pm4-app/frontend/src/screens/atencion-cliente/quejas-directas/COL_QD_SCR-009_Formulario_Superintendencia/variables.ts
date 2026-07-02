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
// Catálogos SFC (CAT-*) ya creados en PM4 (ver collections.ts, GLOBAL_COLLECTIONS) →
// se consumen vía COLLECTION_DEFS + useCollection. Solo CAT-LGBTIQ sigue "Pendiente TI"
// (catálogo no confirmado, ver OPTIONS.lgbtiq).

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

// Acción/decisión BPMN según el botón presionado.
export type AccionFormularioSFC = 'GUARDAR' | 'GUARDAR_BORRADOR';

// ---------------------------------------------------------------------------
// Catálogos PM4 (CAT-*) — S2/S3/S4
// ---------------------------------------------------------------------------
export const COLLECTION_DEFS = {
  sexo: GLOBAL_COLLECTIONS.qd_sexo,
  condicionEspecial: GLOBAL_COLLECTIONS.qd_condicionEspecial,
  productoDigital: GLOBAL_COLLECTIONS.qd_prodDigital,
  estadoQueja: GLOBAL_COLLECTIONS.qd_estadoQueja,
  favorabilidad: GLOBAL_COLLECTIONS.qd_favorabilidad,
  aceptacion: GLOBAL_COLLECTIONS.qd_aceptacion,
  rectificacion: GLOBAL_COLLECTIONS.qd_rectificacion,
  desistimiento: GLOBAL_COLLECTIONS.qd_desistimiento,
  tutela: GLOBAL_COLLECTIONS.qd_tutela,
  marcacion: GLOBAL_COLLECTIONS.qd_marcacion,
  quejaExpres: GLOBAL_COLLECTIONS.qd_quejaExpres,
  tipoFraude: GLOBAL_COLLECTIONS.qd_tipoFraude,
  modalidadFraude: GLOBAL_COLLECTIONS.qd_modFraude,
};

// ---------------------------------------------------------------------------
// OPTIONS estáticas — solo catálogos aún sin colección PM4 confirmada
// ---------------------------------------------------------------------------
export const OPTIONS = {
  sino: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  // CAT-LGBTIQ ⚠ PENDIENTE CRÍTICO — catálogo no confirmado con TI (placeholder).
  lgbtiq: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
    { value: 'NI', label: 'No informa' },
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
