// SCR-000 — Formulario de Radicación PQRS (Autoservicio) | TO-BE v3.0
// Proceso: P01 — Gestión de Quejas Directas | Tarea: P01-T00
// Rol: Consumidor Financiero (Cliente / Intermediario / Empleado / Defensor)
//
// Fuente: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx → pestaña SCR-000.
// Catálogos: pestaña 07_Catalogs (valores de ejemplo; varios "Pendiente TI").

// ---------------------------------------------------------------------------
// Opciones estáticas (selects / radios)
// ---------------------------------------------------------------------------
export const OPTIONS = {
  // CAT-TIPO-SOLIC-PQRS — Lista #2 del formulario PQRS (Zurich)
  tipoSolicitud: [
    { value: 'SOLICITUD', label: 'Solicitud' },
    { value: 'FELICITACION', label: 'Felicitación' },
    { value: 'QUEJA', label: 'Queja' },
    { value: 'SUGERENCIA', label: 'Sugerencia' },
    { value: 'DERECHO_PETICION', label: 'Derecho de petición' },
  ],
  // CAT-ROL-RADICADOR (Zurich) — determina instancia y punto de recepción
  rol: [
    { value: 'CLIENTE', label: 'Cliente' },
    { value: 'INTERMEDIARIO', label: 'Intermediario' },
    { value: 'EMPLEADO', label: 'Empleado Zurich' },
    { value: 'DEFENSOR', label: 'Defensor del Consumidor' },
  ],
  // CAT-TIPO-ID (SFC) — Lista #3. Define el tipo de persona.
  tipoIdentificacion: [
    { value: 'RC', label: 'RC — Registro civil' },
    { value: 'TI', label: 'TI — Tarjeta de identidad' },
    { value: 'CC', label: 'CC — Cédula de ciudadanía' },
    { value: 'CE', label: 'CE — Cédula de extranjería' },
    { value: 'PA', label: 'PA — Pasaporte' },
    { value: 'PPT', label: 'PPT — Permiso por protección temporal' },
    { value: 'NIT', label: 'NIT — Persona jurídica' },
  ],
  // CAT-COND-ESP (SFC) — pendiente confirmar lista con TI/SFC
  condicionEspecial: [
    { value: 'NINGUNA', label: 'Ninguna' },
    { value: 'ADULTO_MAYOR', label: 'Adulto mayor' },
    { value: 'DISCAPACIDAD_FISICA', label: 'Discapacidad física' },
    { value: 'DISCAPACIDAD_COGNITIVA', label: 'Discapacidad cognitiva' },
    { value: 'VULNERABLE', label: 'Población vulnerable' },
  ],
  // CAT-PRODUCTO-SFC (SFC) — homologar Front ↔ SFC
  seguro: [
    { value: '101', label: '101. Seguro de automóviles' },
    { value: '102', label: '102. Seguro de vida' },
    { value: '103', label: '103. Seguro de hogar' },
    { value: '104', label: '104. Seguro colectivo de vida' },
    { value: '109', label: '109. Otros seguros generales' },
  ],
  // CAT-MOTIVO-SFC (SFC) — campo crítico (condiciona campos de fraude en M3)
  motivo: [
    { value: '301', label: '301. No pago de siniestro' },
    { value: '302', label: '302. Demora en el pago de siniestro' },
    { value: '303', label: '303. Terminación unilateral del contrato' },
    { value: '304', label: '304. Cobro de prima o descuento' },
    { value: '305', label: '305. Incumplimiento en cobertura' },
    { value: '399', label: '399. Otro motivo' },
  ],
  // CAT-PAIS (SFC) — por defecto 170 — Colombia
  pais: [
    { value: '170', label: '170 — Colombia' },
  ],
  // Réplica SFC (FLD-325)
  replica: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Catálogos geográficos Colombia (placeholder — pendiente integración Divipola/SFC)
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
// Claves de adjuntos (FLD-330 — multi-archivo, máx 5)
// ---------------------------------------------------------------------------
export const ADJUNTO_KEYS = [
  'qd_adjunto_01', 'qd_adjunto_02', 'qd_adjunto_03', 'qd_adjunto_04', 'qd_adjunto_05',
] as const;

// ---------------------------------------------------------------------------
// Valores por defecto del back / reglas de precarga
// ---------------------------------------------------------------------------
export const DEFAULTS = {
  qd_pais: '170',              // RUL-000-10
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
