import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZdsSelect } from './ZdsField';
import { OPTIONS, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SECTORES = [
  'Sector financiero (incluyendo mercado de valores, banca, entidades de seguros, casas de bolsa, cooperativas de ahorro y crédito, fondos de empleados, gestoras de fondos de inversión y/o de capital riesgo, y cualquier entidad financiera regulada por la Superintendencia Financiera de Colombia o cualquier otro ente de control).',
  'Sector farmacéutico y biotecnología.',
  'Sector de entidades públicas/estatales de capital mixto, así como concesiones con el Estado.',
  'Servicios públicos.',
  'Servicios de salud.',
  'Sector aeronáutico y aviación.',
  'Sector de energía, petróleo y gas (incluyendo refinería y explotación).',
  'Sector armamentístico.',
  'Sector de la minería.',
  'Clubes deportivos profesionales.',
  'Sector del tabaco.',
  'HealthTech (Empresas que utilizan una plataforma tecnológica en línea para proporcionar servicios médicos o asesoramiento médico a un tercero).',
  'Empresas en reorganización y/o reestructuración.',
  'Proveedores de redes sociales, plataformas y gestión de contenidos.',
  'Supermercados y grandes superficies.',
  'Call center / BPO.',
  'Empresas cuya actividad principal sea la tenencia de acciones (holdings puros).',
] as const;

const REQUISITOS = [
  '¿El importe de los ingresos consolidados es inferior y/o igual a COP 200.000.000.000?',
  '¿Son una entidad Privada, su domicilio social está ubicado en Colombia?',
  '¿Su antigüedad es como mínimo de 2 ejercicios fiscales cerrados?',
  '¿Confirma que, al día de hoy, la empresa NO tiene valores cotizados en cualquier bolsa de valores ni tienen planeado salir a bolsa en los próximos 12 meses?',
  '¿En los últimos 2 años, el patrimonio consolidado ha sido positivo?',
  '¿Confirma que, al día de hoy, la empresa y sus administradores y directivos NO tienen ningún reclamo en curso, ni conocimiento de ninguna circunstancia que pudiera dar lugar a un reclamo en el futuro en su contra?',
  '¿Confirma que en los últimos 5 años la empresa NO ha tenido reclamos, ni tiene conocimiento de alguna circunstancia que pudiera resultar en la presentación de un reclamo que afecte esta póliza?',
  '¿El accionista que posee más del 50% de las acciones se encuentra domiciliado en Colombia?',
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

export default function SeccionDyO({ form }: { form: Form }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef1, fileRef2, fileRef3];

  const perfBloqueado = SECTORES.some((_, i) => {
    const key = `frm_dyo_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'SI';
  });

  const reqBloqueado = REQUISITOS.some((_, i) => {
    const key = `frm_dyo_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const docKeys = [
    'frm_dyo_doc_01_nombre', 'frm_dyo_doc_02_nombre', 'frm_dyo_doc_03_nombre',
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
            const name = `frm_dyo_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
            <span>La sociedad y sus filiales (si aplica) afirman que:</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {REQUISITOS.map((pregunta, i) => {
            const name = `frm_dyo_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
            ['frm_dyo_prop_01_limite', 1],
            ['frm_dyo_prop_02_limite', 2],
            ['frm_dyo_prop_03_limite', 3],
          ] as const).map(([field, n]) => (
            <div key={field} className="dyo-propuesta-row">
              <span className="dyo-prop-num">{n}</span>
              <div className="dyo-prop-limite">
                <ZdsSelect
                  label=""
                  name={field}
                  control={control}
                  options={OPTIONS.limiteDyo}
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
