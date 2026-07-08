// Tipos de fila compartidos entre pantallas de Quejas Directas (P01).
// Centralizados aquí porque más de una pantalla los importa (antes vivían
// dispersos en el variables.ts de la pantalla que los definió primero).

// FLD-048 (SCR-003) — una fila del historial de intentos anteriores (solo lectura).
export interface IntentoHistorial {
  intento: number | string; // N.° de intento
  fecha: string;            // Fecha/hora del intento
  campoAfectado: string;    // Campo señalado en ese intento
  codigoError: string;      // Código de error devuelto por SmartSupervision
}

// FLD-130 (SCR-008) — un soporte interno adjunto (solo visualización).
export interface SoporteAdjunto {
  nombre: string;
}

// FLD-095 (SCR-0051) — una fila del historial de asignaciones (solo lectura).
// Los campos respondio/comentario/adjunto los completa SCR-0052 cuando el ayudante
// responde su subproceso (matcheado por qd_strHelpNumber ↔ índice de la fila).
export interface AsignacionHistorial {
  fecha: string;
  de: string;
  para: string;
  motivo: string;
  observaciones: string;
  respondio?: string;
  comentario?: string;
  adjunto?: string;       // nombre del archivo (para mostrar)
  adjuntoFileId?: number; // file_id en PM4 (para descargar) — lo setea SCR-0052
}

// SCR-0052 — respuesta de un ayudante, guardada en un array diferenciado por su
// número de ayuda. El índice del array = qd_intHelpNumber - 1 (mismo índice que
// la fila del historial en SCR-0051).
export interface RespuestaAyuda {
  numero: number;      // qd_intHelpNumber (1-based)
  fecha: string;       // ISO YYYY-MM-DD
  respondio: string;   // usuario/área que respondió
  comentario: string;  // qd_strAreaComment
  adjunto: string;     // nombre del archivo adjunto (qd_strAreaAttach), '' si no hay
  adjuntoFileId?: number; // file_id devuelto por PM4 al subir (para descarga exacta)
}

// SCR-002 — descriptor de campo con error, array inyectado por el BPM vía
// qd_strErrorsJson (validación preventiva P01-T06).
export interface CampoConError {
  campo: string;           // nombre físico del campo (uno de los valores de QD, ej. QD.strEmail)
  fldId: string;           // ID del insumo (p.ej. 'FLD-007')
  etiqueta: string;        // etiqueta visible para el gestor
  valorRechazado: string;  // valor original que fue rechazado por la validación preventiva
  mensajeError: string;    // descripción del error para el gestor
}
