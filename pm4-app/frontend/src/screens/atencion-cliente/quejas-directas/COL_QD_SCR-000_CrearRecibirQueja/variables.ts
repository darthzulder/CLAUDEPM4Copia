// SCR-000 — Formulario de Radicación PQRS (Autoservicio) | TO-BE v3.0
// Proceso: P01 — Gestión de Quejas Directas | Tarea: P01-T00
// Rol: Consumidor Financiero (Cliente / Intermediario / Empleado / Defensor)
//
// Fuente: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx → pestaña SCR-000.
// Catálogos: pestaña 07_Catalogs (valores de ejemplo; varios "Pendiente TI").

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

export const COLLECTION_DEFS = {
  tipoSolicitud: GLOBAL_COLLECTIONS.qd_tipoSolicitud,
  rol: GLOBAL_COLLECTIONS.qd_rol,
  tipoIdentificacion: GLOBAL_COLLECTIONS.qd_tipoIdentificacion,
  pais: GLOBAL_COLLECTIONS.qd_pais,
  departamento: GLOBAL_COLLECTIONS.qd_departamento,
  ciudad: GLOBAL_COLLECTIONS.qd_ciudad,
  condicionEspecial: GLOBAL_COLLECTIONS.qd_condicionEspecial,
  seguro: GLOBAL_COLLECTIONS.qd_seguro,
  motivo: GLOBAL_COLLECTIONS.qd_motivo,
  admision: GLOBAL_COLLECTIONS.qd_admision,
};

// ---------------------------------------------------------------------------
// Configuración de país (Feature Flags / Valores por defecto)
// ---------------------------------------------------------------------------
export const DEFAULT_COUNTRY_CODE = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '170';
export const LOCK_COUNTRY = import.meta.env.VITE_LOCK_COUNTRY !== 'false';

// ---------------------------------------------------------------------------
// Web Entry — proceso e inicio del evento en PM4
// ---------------------------------------------------------------------------
export const WEB_ENTRY_PROCESS_ID = Number(import.meta.env.WEB_ENTRY_PROCESS_ID || 31);
export const WEB_ENTRY_EVENT_ID = import.meta.env.WEB_ENTRY_EVENT_ID || 'node_661';

// ---------------------------------------------------------------------------
// Opciones estáticas (selects / radios)
// ---------------------------------------------------------------------------
export const OPTIONS = {
  // Réplica SFC (FLD-325)
  replica: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Claves de adjuntos (FLD-330 — multi-archivo, máx 5)
// ---------------------------------------------------------------------------
export const ADJUNTO_KEYS = [
  'qd_adjunto_01', 'qd_adjunto_02', 'qd_adjunto_03', 'qd_adjunto_04', 'qd_adjunto_05',
] as const;

// ---------------------------------------------------------------------------
// Valores por defecto del back / reglas de precarga
// ---------------------------------------------------------------------------
export const DEFAULTS = {
  qd_pais: DEFAULT_COUNTRY_CODE,              // RUL-000-10
  qd_replica: 'NO',
  qd_direccion: '',            // FLD-319 — Back, default vacío (pendiente API SFC)
  qd_sexo: 'No aplica',        // FLD-320 — Back, default (pendiente API SFC)
  qd_lgbtiq: 'No aplica',      // FLD-321 — Back, catálogo pendiente confirmar con TI
  qd_admision: 'No aplica',    // FLD-331 — Back, default si rol ≠ Defensor
  qd_enteControl: 'Otros',     // FLD-332 — Back, default "Otros"
  qd_tutela: 'No',             // FLD-333 — Back, default "No"
  qd_quejaExpres: 'No',        // FLD-334 — Back, revisar con SFC
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-000
// ---------------------------------------------------------------------------
export interface CrearRecibirQuejaFormData {
  // S1 — Tipo de Solicitud y Rol
  qd_numeroCaso: string;            // FLD-300 readonly (BPM)
  qd_fechaHoraCreacion: string;     // FLD-301 readonly (BPM)
  qd_tipoSolicitud: string;         // FLD-302
  qd_rol: string;                   // FLD-303
  qd_puntoRecepcion: string;        // FLD-304 readonly (back)
  qd_instanciaRecepcion: string;    // FLD-305 readonly (computado de rol)

  // S2 — Datos del Consumidor Financiero
  qd_tipoIdentificacion: string;    // FLD-306
  qd_numeroIdentificacion: string;  // FLD-307
  qd_nombres: string;               // FLD-308 (persona natural)
  qd_apellidos: string;             // FLD-309 (persona natural)
  qd_razonSocial: string;           // FLD-310 (persona jurídica)
  qd_contactoNombres: string;       // FLD-311 (persona jurídica)
  qd_contactoApellidos: string;     // FLD-312 (persona jurídica)
  qd_celular: string;               // FLD-313
  qd_correoElectronico: string;     // FLD-314
  qd_tipoPersona: string;           // FLD-315 readonly (computado de tipo doc)
  qd_pais: string;                  // FLD-316
  qd_departamento: string;          // FLD-317
  qd_ciudad: string;                // FLD-318
  qd_direccion: string;             // FLD-319 readonly (back)
  qd_sexo: string;                  // FLD-320 readonly (back)
  qd_lgbtiq: string;                // FLD-321 readonly (back)
  qd_condicionEspecial: string;     // FLD-322

  // S3 — Detalle de la Queja
  qd_seguro: string;                // FLD-323
  qd_detalleProducto: string;       // FLD-324 readonly (back)
  qd_replica: string;               // FLD-325
  qd_argumentoReplica: string;      // FLD-326 (visible si réplica = Sí)
  qd_escalamientoDefensor: string;  // FLD-327 readonly (computado de instancia)
  qd_motivo: string;                // FLD-328
  qd_detalle: string;               // FLD-329 (50–2000 caracteres)
  qd_adjunto_01: string;            // FLD-330 (nombres de archivo)
  qd_adjunto_02: string;
  qd_adjunto_03: string;
  qd_adjunto_04: string;
  qd_adjunto_05: string;
  qd_admision: string;              // FLD-331 readonly (editable si rol = Defensor)
  qd_enteControl: string;           // FLD-332 readonly (back)
  qd_tutela: string;                // FLD-333 readonly (back)
  qd_quejaExpres: string;           // FLD-334 readonly (back)

  // S4 — Autorización y Envío
  qd_autorizacionDatos: boolean;    // FLD-335
  qd_captcha: boolean;              // FLD-336 (validación de seguridad)
  qd_correoCopia: string;           // FLD-337 (opcional)

  // S5 — Estado ante la SFC (post-radicación, readonly)
  qd_estadoSmartSupervision: string;// FLD-338 (semáforo)
  qd_fechaRadicacionSFC: string;    // FLD-339 readonly

  // S6 — Responsable Asignado (post-radicación, readonly)
  qd_rolGrupo: string;              // FLD-340 readonly
  qd_responsable: string;           // FLD-341 readonly
}
