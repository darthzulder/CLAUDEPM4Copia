// SCR-SP1-T06 — Revisar y corregir error técnico de integración
// Proceso: SP1-T06 | Rol: Técnico de Integración

export const OPTIONS = {
  tipoError: [
    { value: 'CONEXION',              label: 'Error de conexión' },
    { value: 'AUTENTICACION',         label: 'Error de autenticación' },
    { value: 'VALIDACION',            label: 'Error de validación de datos' },
    { value: 'TIMEOUT',               label: 'Timeout / tiempo de espera agotado' },
    { value: 'FORMATO',               label: 'Error de formato de mensaje' },
    { value: 'SISTEMA_NO_DISPONIBLE', label: 'Sistema no disponible' },
    { value: 'OTRO',                  label: 'Otro' },
  ],
  sistemaAfectado: [
    { value: 'SMART_SUPERVISION', label: 'SmartSupervision (SFC)' },
    { value: 'PORTAL_SFC',        label: 'Portal SFC' },
    { value: 'API_ZURICH',        label: 'API Zurich Backend' },
    { value: 'PROCESSMAKER',      label: 'ProcessMaker BPM' },
    { value: 'CORREO',            label: 'Servicio de correo' },
    { value: 'OTRO',              label: 'Otro sistema' },
  ],
  causaRaiz: [
    { value: 'CONFIGURACION',    label: 'Configuración incorrecta' },
    { value: 'DATOS_INVALIDOS',  label: 'Datos inválidos o incompletos' },
    { value: 'TOKEN_EXPIRADO',   label: 'Token de autenticación expirado' },
    { value: 'SERVICIO_CAIDO',   label: 'Servicio externo no disponible' },
    { value: 'ERROR_RED',        label: 'Error de red / firewall' },
    { value: 'LIMITE_EXCEDIDO',  label: 'Límite de reintentos excedido' },
    { value: 'OTRO',             label: 'Otro' },
  ],
  accionCorrectiva: [
    { value: 'CORREGIR_REINTENTAR',    label: 'Corregir datos y reintentar' },
    { value: 'REINTENTAR_SIN_CAMBIOS', label: 'Reintentar sin cambios' },
    { value: 'ESCALAR_SOPORTE',        label: 'Escalar a soporte técnico nivel 2' },
    { value: 'PROCESAMIENTO_MANUAL',   label: 'Procesamiento manual alternativo' },
    { value: 'CERRAR_ERROR',           label: 'Cerrar como error permanente' },
  ],
  resolucion: [
    { value: 'REINTENTAR',   label: 'Reintentar integración' },
    { value: 'ESCALAR',      label: 'Escalar a soporte' },
    { value: 'CERRAR_ERROR', label: 'Cerrar con error' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-SP1-T06
// ---------------------------------------------------------------------------
export interface RevisarErrorTecnicoFormData {
  // Detalle del error (FLD-001 a FLD-006)
  et_numeroCaso:       string;
  et_fechaHoraError:   string;
  et_codigoError:      string;
  et_mensajeError:     string;
  et_tipoError:        string;
  et_sistemaAfectado:  string;
  // Queja afectada — solo lectura (FLD-007 a FLD-011)
  et_nombreConsumidor:    string;
  et_numeroIdentificacion: string;
  et_tipoSolicitud:       string;
  et_productoSFC:         string;
  et_motivoSFC:           string;
  // Análisis y corrección (FLD-012 a FLD-015)
  et_causaRaiz:             string;
  et_descripcionCausa:      string;
  et_accionCorrectiva:      string;
  et_descripcionCorreccion: string;
  // Resolución (FLD-016 a FLD-018)
  et_resolucion:              string;
  et_observacionesTecnicas:   string;
  et_responsableTecnico:      string;
}
