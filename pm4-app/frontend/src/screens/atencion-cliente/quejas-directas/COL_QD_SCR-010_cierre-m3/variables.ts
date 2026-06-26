export const OPTIONS = {
  estadoQueja: [
    { value: 'CERRADA_CF',      label: 'Cerrada a favor CF' },
    { value: 'CERRADA_ENTIDAD', label: 'Cerrada a favor entidad' },
    { value: 'DESISTIDA',       label: 'Desistida' },
    { value: 'RECTIFICADA',     label: 'Rectificada' },
  ],
  favorabilidad: [
    { value: '1', label: '1. CF' },
    { value: '2', label: '2. Entidad' },
    { value: '3', label: '3. Parcial' },
  ],
  aceptacion: [
    { value: '1', label: '1. Aceptada' },
    { value: '2', label: '2. No aceptada' },
  ],
  marcacion: [
    { value: '1', label: '1. Marcación A' },
    { value: '2', label: '2. Marcación B' },
  ],
  quejaExpres: [
    { value: '2', label: '2. No' },
    { value: '1', label: '1. Sí' },
  ],
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
