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
  estadoCierreM3:   string;
  intentosCierreM3: string;
  ultimoError:      string;
  // Sección 2 — Datos de cierre
  codigoSFC:          string;
  estadoQueja:        string;
  fechaActualizacion: string;
  fechaCierre:        string;
  favorabilidad:      string;
  aceptacion:         string;
  marcacion:          string;
  quejaExpres:        string;
  // Sección 3 — Adjunto respuesta final
  pdfRespuestaFinal:      string;
  adjuntoRespuestaFinal:  string;
  // Sección 4 — Datos fraude (condicional)
  relacionadaFraude: string;
  tipoFraude:        string;
  montoReclamado:    string;
  montoReconocido:   string;
}
