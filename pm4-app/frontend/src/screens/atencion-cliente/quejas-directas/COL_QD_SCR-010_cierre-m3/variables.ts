import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

export const COLLECTION_DEFS = {
  estadoQueja: GLOBAL_COLLECTIONS.qd_estadoQueja,
  favorabilidad: GLOBAL_COLLECTIONS.qd_favorabilidad,
  aceptacion: GLOBAL_COLLECTIONS.qd_aceptacion,
  marcacion: GLOBAL_COLLECTIONS.qd_marcacion,
  quejaExpres: GLOBAL_COLLECTIONS.qd_quejaExpres,
  tipoFraude: GLOBAL_COLLECTIONS.qd_tipoFraude,
};

export const OPTIONS = {
  adjuntoRespuestaFinal: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
  siNo: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

export const REGEX_NOMENCLATURA_PDF = /^[^_]+_[^_]+_RESP_FINAL_SFC_\d+\.pdf$/i;

export interface CierreM3FormData {
  // Sección 1 — Estado (solo lectura desde PM4)
  qd_estadoCierreM3:   string; // FLD-170
  qd_intentosCierreM3: string; // FLD-171
  qd_ultimoError:      string; // FLD-172
  // Sección 2 — Datos de cierre
  qd_codigoSFC:          string; // FLD-173 (unificado con SCR-008/009)
  qd_estadoQueja:        string; // FLD-174
  qd_fechaActualizacion: string; // FLD-175
  qd_fechaCierre:        string; // FLD-176
  qd_favorabilidad:      string; // FLD-177
  qd_aceptacion:         string; // FLD-178
  qd_marcacion:          string; // FLD-179
  qd_quejaExpres:        string; // FLD-180
  // Sección 3 — Adjunto respuesta final
  qd_pdfRespuestaFinal:      string; // FLD-181
  qd_validacionNomenclatura: string; // FLD-182 (solo lectura, resultado validación)
  qd_adjuntoRespuestaFinal:  string; // FLD-183
  // Sección 4 — Datos fraude (condicional)
  qd_relacionadaFraude: string; // FLD-184
  qd_tipoFraude:        string; // FLD-185
  qd_montoReclamado:    string; // FLD-186
  qd_montoReconocido:   string; // FLD-187
}
