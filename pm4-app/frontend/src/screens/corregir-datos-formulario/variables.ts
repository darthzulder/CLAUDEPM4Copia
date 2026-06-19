// P01-T07 — Corregir datos del formulario · Validación preventiva detectó errores
// Proceso: P01-T07 | Gestión de Quejas Directas | Rol: Gestor de Experiencia

export const OPTIONS = {
  tipoIdentificacion: [
    { value: '1', label: '1. Cédula de ciudadanía' },
    { value: '2', label: '2. Cédula de extranjería' },
    { value: '3', label: '3. NIT' },
    { value: '4', label: '4. Pasaporte' },
    { value: '5', label: '5. Tarjeta de identidad' },
  ],
  tipoPersona: [
    { value: '1', label: '1. Natural' },
    { value: '2', label: '2. Jurídica' },
  ],
  codigoPais: [
    { value: '170', label: '170 — Colombia' },
  ],
  productoSFC: [
    { value: '101', label: '101. Seguro de automóviles' },
    { value: '102', label: '102. Seguro de vida individual' },
    { value: '103', label: '103. Seguro de hogar' },
    { value: '104', label: '104. Seguro colectivo de vida' },
    { value: '109', label: '109. Otros seguros generales' },
  ],
  motivoSFC: [
    { value: '301', label: '301. No pago de siniestro' },
    { value: '302', label: '302. Demora en el pago de siniestro' },
    { value: '303', label: '303. Terminación unilateral del contrato' },
    { value: '304', label: '304. Cobro de prima o descuento' },
    { value: '305', label: '305. Incumplimiento en cobertura' },
    { value: '399', label: '399. Otro motivo' },
  ],
  tipoSolicitud: [
    { value: 'QUEJA_DIRECTA', label: 'Queja Directa SmartSupervision' },
    { value: 'REQUERIMIENTO', label: 'Requerimiento' },
    { value: 'SUGERENCIA', label: 'Sugerencia' },
    { value: 'FELICITACION', label: 'Felicitación' },
    { value: 'DERECHO_PETICION', label: 'Derecho de petición' },
  ],
  instanciaRecepcion: [
    { value: '1', label: '1. Defensor del Consumidor Financiero' },
    { value: '2', label: '2. Entidad vigilada' },
    { value: '3', label: '3. SFC' },
  ],
  puntoRecepcion: [
    { value: '1', label: '1. Presencial' },
    { value: '2', label: '2. Virtual' },
    { value: '3', label: '3. Escrito' },
    { value: '4', label: '4. Telefónico' },
    { value: '5', label: '5. Call Center' },
  ],
  admision: [
    { value: '1', label: '1. Admitida' },
    { value: '2', label: '2. No admitida' },
    { value: '9', label: '9. No aplica' },
  ],
  enteControl: [
    { value: '1', label: '1. SFC' },
    { value: '2', label: '2. Defensor del Consumidor Financiero' },
    { value: '99', label: '99. Otros' },
  ],
  decision: [
    { value: 'REENVIAR',  label: 'Corregido — Reenviar a SmartSupervision' },
    { value: 'ESCALAR',   label: 'Escalar para revisión manual' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — P01-T07
// ---------------------------------------------------------------------------
export interface CorregirDatosFormData {
  // Info de validación (solo lectura, pre-poblado por el BPM)
  cf_numeroCaso:        string;
  cf_fechaValidacion:   string;
  cf_erroresValidacion: string; // JSON: Array<{ campo: string; label: string; mensaje: string }>
  cf_totalErrores:      string;
  // Datos del consumidor (editables, mismos campos de P01-T01)
  qd_nombreConsumidor:     string;
  qd_tipoIdentificacion:   string;
  qd_numeroIdentificacion: string;
  qd_correoElectronico:    string;
  qd_tipoPersona:          string;
  qd_codigoPais:           string;
  qd_departamento:         string;
  qd_municipio:            string;
  // Clasificación (editable)
  qd_asunto:             string;
  qd_descripcionQueja:   string;
  qd_productoSFC:        string;
  qd_motivoSFC:          string;
  qd_tipoSolicitud:      string;
  qd_instanciaRecepcion: string;
  qd_puntoRecepcion:     string;
  qd_admision:           string;
  qd_enteControl:        string;
  // Decisión
  cf_decision:                  string;
  cf_observacionesCorreccion:   string;
}
