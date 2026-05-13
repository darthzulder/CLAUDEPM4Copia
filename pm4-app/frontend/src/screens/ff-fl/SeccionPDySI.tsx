import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZdsSelect } from './ZdsField';
import { OPTIONS, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SECTORES = [
  'Sector financiero (bancos, aseguradoras, mercado de valores, cooperativas de ahorro y crédito y cualquier entidad regulada por la Superintendencia Financiera de Colombia).',
  'Sector salud (hospitales, clínicas, IPS y EPS) que gestionen historiales clínicos de más de 100.000 pacientes.',
  'Infraestructura crítica: empresas de energía, agua potable y saneamiento, y telecomunicaciones.',
  'Sector aeronáutico y aviación.',
  'Sector armamentístico.',
  'Entidades públicas o de capital mixto con el Estado, así como concesiones estatales.',
  'Proveedores de servicios en la nube, centros de datos y servicios de hosting masivo.',
  'Proveedores de redes sociales, plataformas digitales y gestión de contenidos.',
  'Empresas de juegos de azar, apuestas deportivas en línea o loterías.',
  'Empresas en reorganización y/o reestructuración.',
] as const;

const REQUISITOS = [
  '¿Los ingresos anuales consolidados son inferiores y/o iguales a COP 200.000.000.000?',
  '¿Es una entidad privada con domicilio social en Colombia?',
  '¿La empresa tiene como mínimo 2 ejercicios fiscales cerrados?',
  '¿La empresa cuenta con un responsable de seguridad de la información o equipo de TI designado?',
  '¿La empresa realiza copias de seguridad periódicas de su información y sistemas críticos?',
  '¿La empresa utiliza autenticación de múltiples factores (MFA) para accesos remotos a sistemas críticos?',
  '¿Al día de hoy, la empresa NO tiene reclamaciones en curso ni conocimiento de ninguna circunstancia que pudiera dar lugar a un reclamo en esta póliza?',
  '¿En los últimos 3 años, la empresa NO ha sufrido un incidente de ciberseguridad significativo (ransomware, fuga de datos masiva, interrupción de sistemas, etc.)?',
] as const;

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
        {perfBloqueado && (
          <div className="dyo-warning">
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).
          </div>
        )}
      </div>

      {/* ── REQUISITOS ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Requisitos</div>
        <p className="dyo-intro-text">
          La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>La sociedad afirma que:</span>
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
        {reqBloqueado && (
          <div className="dyo-warning">
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).
          </div>
        )}
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
                  {fileName && (
                    <span className="dyo-doc-name">{fileName}</span>
                  )}
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
        <p className="dyo-intro-text">
          El deducible va en 0 por defecto.
        </p>
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
          Nota: los Gastos de Defensa son parte del límite y no en adición.
        </p>
      </div>

    </div>
  );
}
