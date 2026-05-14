import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZdsSelect } from './ZdsField';
import { OPTIONS, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SECTORES = [
  'Pólizas para la ejecución de contratos específicos.',
  'Empresas en reorganización y/o reestructuración.',
  'Servicios Profesionales o consultoría de tipo legal, de tecnología, tributaria, de contabilidad, outsourcing y financiera.',
  'Entidades sin ánimo de lucro.',
  'Retail (comercio con venta online superiores al 30% del total de sus ingresos y sistema PoS).',
  'Compañías Aéreas y Servicios de Transporte.',
  'Instituciones Financieras y/o Servicios Financieros (Cooperativas de Ahorro y Crédito, Fondos de Empleados, Fondos Mutuos de Inversión, Compañías de Colocación de Créditos de Libranza, Fintech o Similares).',
  'Casinos / Juegos de Azar / Casas de Apuestas Online.',
  'Firmas de ingeniería y/o Diseño.',
  'Empresas de generación de energía, prestación de servicios públicos e infraestructura crítica.',
  'Entidades públicas (de propiedad del estado o de economía mixta).',
  'Compañías listadas en Bolsa.',
  'Servicios de Salud.',
  'Servicios Profesionales de Tecnología.',
  'Servicios de Logística.',
  'Telecomunicaciones.',
  'Generadores de Contenido Digital o de Medios Audiovisuales.',
  'Medios de comunicación (radio y televisión).',
  'Procesadores de Tarjetas de Pago/Crédito.',
  'Empresas Agregadores de Datos (Proveedores de Servicios en la Nube, Minería de Datos, Bodegas de Datos, Integración de Datos y servicios relacionados o similares).',
  'Proveedores de Moneda Digital y Empresas de cambio de Moneda Digital.',
  'Plataformas de Negociación de Mercados Online, Plataformas de Negociación de Títulos Valores, Plataformas de Negociación de Materias Primas y sus proveedores de servicios tecnológicos.',
  'Empresas suministradoras de contenidos para adultos.',
  'Redes Sociales.',
  'Empresas dedicadas al procesamiento y distribución de Marihuana y/o opioides.',
  'Farmacéuticas.',
  'Call Center / BPO.',
] as const;

const REQUISITOS = [
  '¿La seguridad informática/cibernética implementada contempla políticas y procedimientos centralizados?',
  '¿El importe de los ingresos consolidados es inferior y/o igual a COP100.000.000.000?',
  '¿Afirman que su domicilio social está ubicado en Colombia?',
  '¿Afirman que llevan más de 2 años desarrollando su actividad?',
  'Afirman que en los dos últimos años NO han tenido amenazas de extorsión cibernética o NO han tenido lugar interrupciones de los sistemas durante más de 12 horas.',
  '¿Afirman que en los 2 últimos años NO han tenido investigaciones, solicitudes de información, sanciones por parte de un regulador o una agencia gubernamental en relación con el manejo de la información personal identificable?',
  '¿El tomador y sus filiales (si aplica) afirma No tener conocimiento de hechos o circunstancias que pudieran dar lugar a reclamos y/o eventos de privacidad y/o de seguridad bajo esta póliza de seguro o conocimiento de hechos o circunstancias que pudieran dar lugar a investigaciones o imposición de sanciones?',
] as const;

const CONTROLES_1 = [
  '¿Cuentan con una política de seguridad de la información que contenga reglas para el uso del correo electrónico e internet, clasificación de la información y confidencialidad de los datos confidenciales, de acuerdo con la ley de protección de datos?',
  '¿Se capacita anualmente a todos los empleados sobre la política de seguridad de la información, incluyendo amenazas como phishing y malware?',
  '¿Cuentan con antivirus en todas sus computadoras y firewalls en el perímetro de la red?',
  '¿Aplican parches de seguridad y actualizaciones para todos los software y sistemas operativos de forma regular?',
  '¿Se realizan copias de seguridad de datos y de sistemas críticos, al menos una vez a la semana?',
  '¿Tiene política de construcción de contraseñas complejas y de cambio regular?',
  '¿La empresa filtra el contenido del correo electrónico y los sitios de internet para bloquear el contenido malicioso, spam y phishing?',
] as const;

const CONTROLES_2 = [
  '¿Su nivel de ventas online superiores al 30% del total de ingresos y sistemas PoS?',
  '¿Exige autenticación multifactor para todos los accesos de la red corporativa y si hay excepciones se las tiene documentadas?',
] as const;

const CONTROLES_ADICIONALES = [
  '¿Disponen de planes de respuesta a incidentes, plan de continuidad del negocio y recuperación de desastres que den pruebas y actualizan al menos una vez al año?',
  'En caso de subcontratar, ¿El proveedor de servicios está obligado contractualmente a cumplir las políticas de seguridad y protecciones de datos?',
  '¿Aseguran regularmente de que las copias de seguridad de datos son completas, que se puedan restaurar lo más rápido posible y están fuera de sus predios?',
] as const;

const MSG_BLOQUEO = 'La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).';

function SiNoField({ form, name }: { form: Form; name: keyof FfFlSolicitudFormData }) {
  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue="NO"
      render={({ field }) => (
        <div className="si-no-btns">
          <button
            type="button"
            className={`si-no-btn si-no-btn--si${field.value === 'SI' ? ' si-no-btn--active' : ''}`}
            onClick={() => field.onChange('SI')}
          >SI</button>
          <button
            type="button"
            className={`si-no-btn si-no-btn--no${field.value === 'NO' ? ' si-no-btn--active' : ''}`}
            onClick={() => field.onChange('NO')}
          >NO</button>
        </div>
      )}
    />
  );
}

export default function SeccionPDySI({ form }: { form: Form }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef1, fileRef2, fileRef3];

  const perfBloqueado = SECTORES.some((_, i) => {
    const key = `frm_pdysi_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'SI';
  });

  const reqBloqueado = REQUISITOS.some((_, i) => {
    const key = `frm_pdysi_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const ctrl1Bloqueado = CONTROLES_1.some((_, i) => {
    const key = `frm_pdysi_ctrl1_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const ctrl2Bloqueado = CONTROLES_2.some((_, i) => {
    const key = `frm_pdysi_ctrl2_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const docKeys = [
    'frm_pdysi_doc_01_nombre', 'frm_pdysi_doc_02_nombre', 'frm_pdysi_doc_03_nombre',
  ] as const;

  return (
    <div>

      {/* ── PERFIL DE CLIENTE ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Perfil de cliente</div>
        <p className="dyo-intro-text">
          ¿La compañía opera en alguno de los siguientes sectores?
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>Sector</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {SECTORES.map((sector, i) => {
            const name = `frm_pdysi_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
            return (
              <div key={name} className="dyo-si-no-row">
                <span className="dyo-si-no-num">{i + 1}.</span>
                <span className="dyo-si-no-text">{sector}</span>
                <SiNoField form={form} name={name} />
              </div>
            );
          })}
        </div>
        {perfBloqueado && <div className="dyo-warning">{MSG_BLOQUEO}</div>}
      </div>

      {/* ── REQUISITOS ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Requisitos</div>
        <p className="dyo-intro-text">
          Por favor diligenciar el siguiente cuestionario con la información proporcionada.
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar
          por este canal y deberá comunicarse con su director comercial.
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>REQUISITOS / La sociedad y sus filiales (si aplica) afirman que:</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {REQUISITOS.map((pregunta, i) => {
            const name = `frm_pdysi_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
            return (
              <div key={name} className="dyo-si-no-row">
                <span className="dyo-si-no-num">{i + 1}.</span>
                <span className="dyo-si-no-text">{pregunta}</span>
                <SiNoField form={form} name={name} />
              </div>
            );
          })}
        </div>
        {reqBloqueado && <div className="dyo-warning">{MSG_BLOQUEO}</div>}
      </div>

      {/* ── CONTROLES EN LA GESTIÓN DEL RIESGO - PARTE 1 ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Controles en la Gestión del Riesgo - Parte 1</div>
        <p className="dyo-intro-text">
          Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>REQUISITOS / La sociedad y sus filiales (si aplica) afirman que:</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {CONTROLES_1.map((pregunta, i) => {
            const name = `frm_pdysi_ctrl1_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
            return (
              <div key={name} className="dyo-si-no-row">
                <span className="dyo-si-no-num">{i + 1}.</span>
                <span className="dyo-si-no-text">{pregunta}</span>
                <SiNoField form={form} name={name} />
              </div>
            );
          })}
        </div>
        {ctrl1Bloqueado && <div className="dyo-warning">{MSG_BLOQUEO}</div>}
      </div>

      {/* ── CONTROLES EN LA GESTIÓN DEL RIESGO - PARTE 2 ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Controles en la Gestión del Riesgo - Parte 2</div>
        <p className="dyo-intro-text">
          Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span></span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {CONTROLES_2.map((pregunta, i) => {
            const name = `frm_pdysi_ctrl2_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
            return (
              <div key={name} className="dyo-si-no-row">
                <span className="dyo-si-no-num">{i + 1}.</span>
                <span className="dyo-si-no-text">{pregunta}</span>
                <SiNoField form={form} name={name} />
              </div>
            );
          })}
        </div>
        {ctrl2Bloqueado && <div className="dyo-warning">{MSG_BLOQUEO}</div>}
      </div>

      {/* ── CONTROLES ADICIONALES ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Controles Adicionales</div>
        <p className="dyo-intro-text">
          Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span></span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {CONTROLES_ADICIONALES.map((pregunta, i) => {
            const name = `frm_pdysi_ctrlad_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
            return (
              <div key={name} className="dyo-si-no-row">
                <span className="dyo-si-no-num">{i + 1}.</span>
                <span className="dyo-si-no-text">{pregunta}</span>
                <SiNoField form={form} name={name} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DOCUMENTO DE SOPORTE ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Documento de soporte de las confirmaciones</div>
        <p className="dyo-intro-text">
          Por favor cargue aquí el documento de respaldo proporcionado por el intermediario.
          Se pueden agregar hasta 3 documentos.
        </p>
        <div className="dyo-docs-list">
          {docKeys.slice(0, numDocs).map((docKey, i) => {
            const fileName = w[docKey] as string | undefined;
            return (
              <div key={docKey} className="dyo-doc-row">
                <span className="dyo-doc-label">Documento {i + 1}</span>
                <div className="dyo-doc-actions">
                  <input
                    ref={fileRefs[i]}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setValue(docKey, file.name as never);
                    }}
                  />
                  <ZrButton
                    config="secondary"
                    onClick={() => fileRefs[i].current?.click()}
                  >
                    {fileName ? fileName : 'Cargar archivo'}
                  </ZrButton>
                  {fileName && <span className="dyo-doc-name">{fileName}</span>}
                </div>
                <input type="hidden" {...register(docKey)} />
              </div>
            );
          })}
        </div>
        {numDocs < 3 && (
          <ZrButton
            config="secondary"
            onClick={() => setNumDocs((n) => n + 1)}
            style={{ marginTop: 'var(--zs-75)' }}
          >
            + Agregar documento
          </ZrButton>
        )}
      </div>

      {/* ── PROPUESTA ECONÓMICA ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Propuesta económica</div>
        <div className="dyo-propuesta-table">
          <div className="dyo-propuesta-header">
            <span>#</span>
            <span>Límite asegurado</span>
            <span>Modalidad de cobertura</span>
          </div>
          {([
            ['frm_pdysi_prop_01_limite', 1],
            ['frm_pdysi_prop_02_limite', 2],
            ['frm_pdysi_prop_03_limite', 3],
          ] as const).map(([field, n]) => (
            <div key={field} className="dyo-propuesta-row">
              <span className="dyo-prop-num">{n}</span>
              <div className="dyo-prop-limite">
                <ZdsSelect
                  label=""
                  name={field}
                  control={control}
                  options={OPTIONS.limitePdySI}
                  placeholder="Seleccione un límite"
                />
              </div>
              <span className="dyo-prop-tipo">
                Todo y cada reclamo en el agregado anual
              </span>
            </div>
          ))}
        </div>
        <p className="dyo-nota">
          Nota: el sistema debe controlar que se ingrese al menos un valor asegurado.
        </p>
      </div>

    </div>
  );
}
