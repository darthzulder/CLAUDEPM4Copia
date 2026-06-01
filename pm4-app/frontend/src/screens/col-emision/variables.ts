export interface DocSarlaftData {
  frm_titulo?: string;
  frm_caso?: string | number;
  frm_num_cotizacion?: string | number;
  frm_gen_num_cotizacion?: string | number;
  frm_sarlaft_perfil?: SarlaftPerfil;
  [key: string]: unknown;
}

export type SarlaftPerfil = 'SIMPLIFICADO' | 'ESTANDAR' | 'INTENSIFICADO';

export interface SarlaftDocDef {
  key: string;
  descripcion: string;
  vigencia?: string;
}

export const DOCS_POR_PERFIL: Record<SarlaftPerfil, SarlaftDocDef[]> = {
  SIMPLIFICADO: [
    {
      key: 'doc_autorizacion_datos',
      descripcion: 'Autorización de tratamiento de datos personales y de contacto',
    },
    {
      key: 'doc_camara_comercio',
      descripcion: 'Certificado de la Cámara de Comercio',
      vigencia: 'máx. 1 mes de vigencia',
    },
  ],
  ESTANDAR: [
    {
      key: 'doc_autorizacion_datos',
      descripcion: 'Autorización de tratamiento de datos personales y de contacto',
    },
    {
      key: 'doc_camara_comercio',
      descripcion: 'Certificado de la Cámara de Comercio',
      vigencia: 'máx. 3 meses de vigencia',
    },
    {
      key: 'doc_conocimiento_cliente',
      descripcion: 'Formulario de conocimiento del cliente',
    },
  ],
  INTENSIFICADO: [
    {
      key: 'doc_autorizacion_datos',
      descripcion: 'Autorización de tratamiento de datos personales y de contacto',
    },
    {
      key: 'doc_camara_comercio',
      descripcion: 'Certificado de la Cámara de Comercio',
      vigencia: 'máx. 1 mes de vigencia',
    },
    {
      key: 'doc_conocimiento_cliente',
      descripcion: 'Formulario de conocimiento del cliente',
    },
    {
      key: 'doc_estados_financieros',
      descripcion: 'Estados financieros',
    },
  ],
};

// ─────────────────────────────────────────────────────
// SolDocEmi — documentos de emisión por producto
// ─────────────────────────────────────────────────────
export interface SolDocEmiData {
  frm_titulo?: string;
  frm_caso?: string | number;
  frm_num_cotizacion?: string | number;
  frm_gen_num_cotizacion?: string | number;
  frm_gen_prod_dyo?: boolean;
  frm_gen_prod_cc?: boolean;
  frm_gen_prod_pdysi?: boolean;
  frm_gen_prod_pi?: boolean;
  [key: string]: unknown;
}

export interface ProductoDocDef {
  key: string;
  productoKey: keyof SolDocEmiData;
  producto: string;
  descripcion: string;
}

export const PRODUCTO_DOC_DEFS: ProductoDocDef[] = [
  {
    key: 'doc_nc_dyo',
    productoKey: 'frm_gen_prod_dyo',
    producto: 'Directores y Administradores',
    descripcion: 'Nota de cobertura de Directores y Administradores',
  },
  {
    key: 'doc_nc_cc',
    productoKey: 'frm_gen_prod_cc',
    producto: 'Crimen Comercial',
    descripcion: 'Nota de cobertura de Crimen Comercial',
  },
  {
    key: 'doc_nc_pdysi',
    productoKey: 'frm_gen_prod_pdysi',
    producto: 'Protección de Datos y Seguridad Informática',
    descripcion: 'Nota de cobertura de Protección de Datos y Seguridad Informática',
  },
  {
    key: 'doc_nc_pi',
    productoKey: 'frm_gen_prod_pi',
    producto: 'Seguro Profesional',
    descripcion: 'Nota de cobertura de Seguro Profesional',
  },
];

// ─────────────────────────────────────────────────────
// VerDocEmi — verificación de documentos de emisión
// ─────────────────────────────────────────────────────
export type ValidacionDoc = 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';
export type DecisionEmi   = 'COMPLETO'   | 'INCOMPLETO';

export const DECISIONES_EMI = [
  { value: 'COMPLETO',   text: 'Documentos completos, emitir póliza.' },
  { value: 'INCOMPLETO', text: 'Documentos incompletos, no emitir y solicitar nuevos documentos.' },
] as const;

// ─────────────────────────────────────────────────────
// DocSARLAFT / RevSARLAFT — directrices por perfil
// ─────────────────────────────────────────────────────
export const DIRECTRICES: Array<{ perfil: SarlaftPerfil; label: string; docs: string[] }> = [
  {
    perfil: 'SIMPLIFICADO',
    label: 'Simplificado',
    docs: [
      'Autorización de tratamiento de datos personales y de contacto',
      'Certificado de la Cámara de Comercio',
    ],
  },
  {
    perfil: 'ESTANDAR',
    label: 'Estándar',
    docs: [
      'Autorización de tratamiento de datos personales y de contacto',
      'Certificado de la Cámara de Comercio (máx. 3 meses)',
      'Formulario de conocimiento del cliente',
    ],
  },
  {
    perfil: 'INTENSIFICADO',
    label: 'Intensificado',
    docs: [
      'Autorización de tratamiento de datos personales y de contacto',
      'Certificado de la Cámara de Comercio (máx. 1 mes)',
      'Formulario de conocimiento del cliente',
      'Estados financieros',
    ],
  },
];
