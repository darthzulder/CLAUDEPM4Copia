// SCR-002 · PAN-02 — Corrección de Datos del Formulario
// Proceso: P01-T07 | Rol: Gestor de Experiencia | Gestión de Quejas Directas

/** Descriptor de campo con error — array inyectado por el BPM vía qd_errores_json */
export interface CampoConError {
  campo: string;           // nombre del campo RHF (p.ej. 'qd_correoElectronico')
  fldId: string;           // ID del insumo (p.ej. 'FLD-007')
  etiqueta: string;        // etiqueta visible para el gestor
  valorRechazado: string;  // valor original que fue rechazado por la validación preventiva
  mensajeError: string;    // descripción del error para el gestor
}

export interface CorregirDatosFormData {
  // Encabezado (solo lectura — FLD-030..032)
  qd_numeroCaso: string;
  qd_canalRecepcion: string;
  qd_slaRestante: string;
  // Datos del consumidor corregibles
  qd_nombreConsumidor: string;
  qd_tipoIdentificacion: string;
  qd_numeroIdentificacion: string;
  qd_correoElectronico: string;
  qd_tipoPersona: string;
  qd_codigoPais: string;
  qd_departamento: string;
  qd_municipio: string;
  // Clasificación corregible
  qd_productoSFC: string;
  qd_motivoSFC: string;
  qd_tipoSolicitud: string;
  qd_instanciaRecepcion: string;
  qd_puntoRecepcion: string;
  qd_admision: string;
  qd_enteControl: string;
  qd_asunto: string;
  qd_descripcionQueja: string;
  // Metadata de errores inyectada por el BPM — JSON serializado: CampoConError[]
  qd_errores_json: string;
}

// Fallback de desarrollo (se usa cuando task.data no tiene qd_errores_json)
export const ERRORES_EJEMPLO: CampoConError[] = [
  {
    campo: 'qd_correoElectronico',
    fldId: 'FLD-007',
    etiqueta: 'Correo Electrónico',
    valorRechazado: 'juan.perez@',
    mensajeError: 'El correo no tiene formato válido (RFC 5321). Formato esperado: usuario@dominio.com',
  },
  {
    campo: 'qd_numeroIdentificacion',
    fldId: 'FLD-006',
    etiqueta: 'Número de Identificación',
    valorRechazado: '12 34 56',
    mensajeError: 'Contiene espacios. Solo se aceptan dígitos sin separadores. Mín. 6, máx. 15 caracteres.',
  },
  {
    campo: 'qd_municipio',
    fldId: 'FLD-011',
    etiqueta: 'Municipio',
    valorRechazado: '',
    mensajeError: 'El municipio seleccionado no pertenece al departamento configurado. Seleccione un municipio de la lista habilitada.',
  },
];

export const DEPARTAMENTOS = [
  { value: 'ANTIOQUIA',    label: 'Antioquia' },
  { value: 'ATLANTICO',   label: 'Atlántico' },
  { value: 'BOGOTA',      label: 'Bogotá D.C.' },
  { value: 'BOLIVAR',     label: 'Bolívar' },
  { value: 'CUNDINAMARCA',label: 'Cundinamarca' },
  { value: 'MAGDALENA',   label: 'Magdalena' },
  { value: 'RISARALDA',   label: 'Risaralda' },
  { value: 'SANTANDER',   label: 'Santander' },
  { value: 'VALLE',       label: 'Valle del Cauca' },
] as const;

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
