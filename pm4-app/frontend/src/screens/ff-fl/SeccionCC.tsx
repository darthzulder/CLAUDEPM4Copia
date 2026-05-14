import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZdsSelect } from './ZdsField';
import { OPTIONS, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SECTORES = [
  'Sector financiero (incluyendo, pero no limitado a mercado de valores, banca, entidades de seguros, casas de bolsa, cooperativas de ahorro y crédito, fondo de empleados, gestoras de fondos de inversión y/o de fondos de capital riesgo y cualquier entidad financiera que sea regulada por la Superintendencia Financiera de Colombia, y/o por cualquier otro ente de control).',
  'Sector farmacéutico y biotecnología.',
  'Sector de las entidades públicas/estatales de capital mixto, así como concesiones con el Estado.',
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
  'Proveedores de redes sociales, plataformas y gestión de contenidos.',
] as const;

const REQUISITOS = [
  '¿El importe de los ingresos consolidados es inferior y/o igual a COP100.000.000.000?',
  '¿Son una entidad privada, su domicilio social está ubicado en Colombia y no tienen empresas filiales y ningún activo fuera de Colombia?',
  '¿Su antigüedad es como mínimo de 2 ejercicios fiscales cerrados?',
  '¿Tienen implementado un ciclo de auditoría que garantiza que todas las áreas de la compañía son evaluadas en un período máximo de un año?',
  '¿El número total de predios no excede los 10?',
  '¿No tienen valores cotizados en cualquier bolsa de valores y no tienen planeado salir a bolsa en los próximos 12 meses?',
  '¿En los últimos 2 años, el patrimonio consolidado ha sido positivo?',
  '¿No han tenido despidos masivos durante los últimos 12 meses y no tiene previsto hacerlo en los próximos 12 meses?',
  '¿Afirman que no tiene reclamos en los últimos 5 años, ni conocimiento de circunstancia alguna que pudiera resultar en la presentación de un reclamo que afecte esta póliza?',
  '¿El accionista que posee más del 50% de las acciones de la compañía se encuentra domiciliado en Colombia?',
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

export default function SeccionCC({ form }: { form: Form }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef1, fileRef2, fileRef3];

  const perfBloqueado = SECTORES.some((_, i) => {
    const key = `frm_cc_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'SI';
  });

  const reqBloqueado = REQUISITOS.some((_, i) => {
    const key = `frm_cc_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const docKeys = [
    'frm_cc_doc_01_nombre', 'frm_cc_doc_02_nombre', 'frm_cc_doc_03_nombre',
  ] as const;

  // Opciones de agregado filtradas: solo valores >= límite por evento seleccionado
  function opcionesAgregado(eventoField: keyof FfFlSolicitudFormData) {
    const eventoVal = w[eventoField] as string | undefined;
    if (!eventoVal) return OPTIONS.limiteCC;
    return OPTIONS.limiteCC.filter((o) => Number(o.value) >= Number(eventoVal));
  }

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
            const name = `frm_cc_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
          La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la
          cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>REQUISITOS / La sociedad y sus filiales (si aplica) afirman que:</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {REQUISITOS.map((pregunta, i) => {
            const name = `frm_cc_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
        <p className="dyo-intro-text">Todo y cada reclamo en el agregado anual</p>
        <div className="dyo-propuesta-table cc-propuesta-table">
          <div className="dyo-propuesta-header cc-propuesta-header">
            <span>#</span>
            <span>Límite por evento</span>
            <span>Límite por agregado</span>
          </div>
          {([
            ['frm_cc_prop_01_evento', 'frm_cc_prop_01_agregado', 1],
            ['frm_cc_prop_02_evento', 'frm_cc_prop_02_agregado', 2],
            ['frm_cc_prop_03_evento', 'frm_cc_prop_03_agregado', 3],
          ] as const).map(([eventoField, agregadoField, n]) => (
            <div key={eventoField} className="dyo-propuesta-row cc-propuesta-row">
              <span className="dyo-prop-num">{n}</span>
              <div className="dyo-prop-limite">
                <ZdsSelect
                  label=""
                  name={eventoField}
                  control={control}
                  options={OPTIONS.limiteCC}
                  placeholder="Seleccione"
                />
              </div>
              <div className="dyo-prop-limite">
                <ZdsSelect
                  label=""
                  name={agregadoField}
                  control={control}
                  options={opcionesAgregado(eventoField)}
                  placeholder="Seleccione"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="dyo-nota">
          Nota: el sistema debe controlar que se ingrese al menos un valor asegurado. El deducible es automático.
        </p>
      </div>

    </div>
  );
}
