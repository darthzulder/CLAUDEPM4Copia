// SP1-T05 — Corregir datos según error funcional SmartSupervision
// Proceso: SP1-T05 | Gestión de Quejas Directas | Rol: Gestor de Experiencia

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
  canal: [
    { value: '1', label: '1. Presencial' },
    { value: '2', label: '2. Correo electrónico' },
    { value: '3', label: '3. Portal Web' },
    { value: '5', label: '5. Centro de atención telefónica' },
    { value: '6', label: '6. Canal SFC' },
    { value: '7', label: '7. Defensor del Consumidor Financiero' },
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
  // Categorías de error funcional que devuelve SmartSupervision
  categoriaErrorSS: [
    { value: 'DATOS_CONSUMIDOR',    label: 'Datos del consumidor inválidos' },
    { value: 'IDENTIFICACION',      label: 'Tipo / número de identificación' },
    { value: 'PRODUCTO_MOTIVO',     label: 'Producto o motivo SFC no válido' },
    { value: 'FECHA_FUERA_RANGO',   label: 'Fecha fuera del rango permitido' },
    { value: 'ENTIDAD_NO_REGISTRADA', label: 'Entidad no registrada en SS' },
    { value: 'DUPLICADO',           label: 'Queja duplicada en el sistema' },
    { value: 'CLASIFICACION',       label: 'Error en clasificación SFC' },
    { value: 'FORMATO_CAMPO',       label: 'Formato de campo incorrecto' },
    { value: 'OTRO',                label: 'Otro error funcional' },
  ],
  decision: [
    { value: 'CORREGIR_REENVIAR',   label: 'Corregido — Reenviar a SmartSupervision' },
    { value: 'ESCALAR',             label: 'Escalar a supervisor' },
    { value: 'REGISTRAR_MANUAL',    label: 'Registrar manualmente (bypass SmartSupervision)' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SP1-T05
// ---------------------------------------------------------------------------
export interface CorregirErrorFuncionalSSFormData {
  // Respuesta de SmartSupervision (solo lectura, inyectado por el BPM)
  ss_numeroCaso:         string;
  ss_fechaRespuesta:     string;
  ss_codigoError:        string;
  ss_mensajeError:       string;   // mensaje raw devuelto por SS
  ss_camposAfectados:    string;   // JSON: string[] con nombres de campos rechazados
  ss_intentoNumero:      string;   // nº de intento de envío a SS
  ss_categoriaError:     string;   // categoría del error (para clasificar la corrección)
  // Datos del consumidor corregibles
  qd_nombreConsumidor:     string;
  qd_tipoIdentificacion:   string;
  qd_numeroIdentificacion: string;
  qd_correoElectronico:    string;
  qd_tipoPersona:          string;
  qd_codigoPais:           string;
  qd_departamento:         string;
  qd_municipio:            string;
  // Clasificación corregible
  qd_canalRecepcion:     string;
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
  ef_decision:              string;
  ef_justificacionCorreccion: string;
  ef_camposCambiados:       string; // descripción libre de qué campos se modificaron
}
