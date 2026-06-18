// SCR-001 — Recibir Queja (TO-BE v2.0)
// Proceso: P01-T01 | Rol: Gestor de Experiencia

// ---------------------------------------------------------------------------
// Opciones estáticas
// ---------------------------------------------------------------------------
export const OPTIONS = {
  canal: [
    { value: '1', label: '1. Presencial' },
    { value: '2', label: '2. Correo electrónico' },
    { value: '3', label: '3. Portal Web' },
    { value: '5', label: '5. Centro de atención telefónica' },
    { value: '6', label: '6. Canal SFC' },
    { value: '7', label: '7. Defensor del Consumidor Financiero' },
  ],
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
  incluyeAnexos: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Catálogos geográficos Colombia (placeholder — pendiente integración PM4)
// ---------------------------------------------------------------------------
export const DEPARTAMENTOS = [
  { value: 'ANTIOQUIA', label: 'Antioquia' },
  { value: 'ATLANTICO', label: 'Atlántico' },
  { value: 'BOGOTA', label: 'Bogotá D.C.' },
  { value: 'BOLIVAR', label: 'Bolívar' },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
  { value: 'MAGDALENA', label: 'Magdalena' },
  { value: 'RISARALDA', label: 'Risaralda' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'VALLE', label: 'Valle del Cauca' },
];

export const MUNICIPIOS_POR_DPTO: Record<string, { value: string; label: string }[]> = {
  ANTIOQUIA:    [{ value: 'MEDELLIN', label: 'Medellín' }, { value: 'BELLO', label: 'Bello' }, { value: 'ENVIGADO', label: 'Envigado' }, { value: 'ITAGUI', label: 'Itagüí' }, { value: 'RIONEGRO', label: 'Rionegro' }],
  ATLANTICO:    [{ value: 'BARRANQUILLA', label: 'Barranquilla' }, { value: 'SOLEDAD', label: 'Soledad' }, { value: 'MALAMBO', label: 'Malambo' }],
  BOGOTA:       [{ value: 'BOGOTA', label: 'Bogotá D.C.' }],
  BOLIVAR:      [{ value: 'CARTAGENA', label: 'Cartagena' }, { value: 'TURBACO', label: 'Turbaco' }, { value: 'MAGANGUE', label: 'Magangué' }],
  CUNDINAMARCA: [{ value: 'SOACHA', label: 'Soacha' }, { value: 'CHIA', label: 'Chía' }, { value: 'CAJICA', label: 'Cajicá' }, { value: 'FACATATIVA', label: 'Facatativá' }],
  MAGDALENA:    [{ value: 'SANTA_MARTA', label: 'Santa Marta' }, { value: 'CIENAGA', label: 'Ciénaga' }, { value: 'FUNDACION', label: 'Fundación' }],
  RISARALDA:    [{ value: 'PEREIRA', label: 'Pereira' }, { value: 'DOSQUEBRADAS', label: 'Dosquebradas' }, { value: 'SANTA_ROSA', label: 'Santa Rosa de Cabal' }],
  SANTANDER:    [{ value: 'BUCARAMANGA', label: 'Bucaramanga' }, { value: 'FLORIDABLANCA', label: 'Floridablanca' }, { value: 'GIRON', label: 'Girón' }],
  VALLE:        [{ value: 'CALI', label: 'Cali' }, { value: 'PALMIRA', label: 'Palmira' }, { value: 'BUENAVENTURA', label: 'Buenaventura' }, { value: 'TULUA', label: 'Tuluá' }],
};

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-001
// ---------------------------------------------------------------------------
export interface RecibirQuejaFormData {
  // Encabezado (FLD-001 a FLD-003)
  qd_numeroCaso: string;
  qd_canalRecepcion: string;
  qd_fechaHoraCreacion: string;
  // Consumidor (FLD-004 a FLD-011)
  qd_nombreConsumidor: string;
  qd_tipoIdentificacion: string;
  qd_numeroIdentificacion: string;
  qd_correoElectronico: string;
  qd_tipoPersona: string;
  qd_codigoPais: string;
  qd_departamento: string;
  qd_municipio: string;
  // Clasificación (FLD-012 a FLD-020)
  qd_asunto: string;
  qd_descripcionQueja: string;
  qd_productoSFC: string;
  qd_motivoSFC: string;
  qd_tipoSolicitud: string;
  qd_instanciaRecepcion: string;
  qd_puntoRecepcion: string;
  qd_admision: string;
  qd_enteControl: string;
  // Adjuntos (FLD-021 a FLD-022)
  qd_incluyeAnexos: string;
  qd_adjuntoNombre: string;
}
