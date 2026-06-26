// SCR-002 · PAN-02 — Corrección de Datos del Formulario
// Proceso: P01-T07 | Rol: Gestor de Experiencia | Gestión de Quejas Directas

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

export const COLLECTION_DEFS = {
  departamento: GLOBAL_COLLECTIONS.qd_departamento,
  municipio: GLOBAL_COLLECTIONS.qd_ciudad,
};

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


