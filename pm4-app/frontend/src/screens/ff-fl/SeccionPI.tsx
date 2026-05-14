import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZdsSelect } from './ZdsField';
import { OPTIONS, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SERVICIOS_ELEGIBLES = [
  'Servicios legales - Firmas de Abogados',
  'Servicios de Contabilidad - Firmas de Contadores',
  'Firmas de Administración de Propiedad Horizontal',
] as const;

const REQUISITOS = [
  '¿El importe de los ingresos consolidados es inferior y/o igual a COP20.000.000.000?',
  '¿Es una entidad Privada, su domicilio social está ubicado en Colombia?',
  '¿Presta servicios exclusivamente en Colombia?',
  '¿Tiene una experiencia superior a 3 años en la prestación de los servicios profesionales?',
  '¿Tiene todos los permisos legales y autorizaciones para ejercer su actividad profesional en Colombia?',
  '¿Confirma que NO presta servicios adicionales a los seleccionados en la presente propuesta?',
  '¿En los últimos 2 años, el patrimonio consolidado ha sido positivo?',
  '¿Confirma que NO presta servicios a entidades financieras?',
  '¿El accionista que posee más del 50% de las acciones, se encuentra domiciliado en Colombia?',
  '¿Confirma que NO presta servicios de fusiones y adquisiciones y/o valoración de activos?',
  '¿Confirma que NO presta servicios como liquidador de sociedades?',
  '¿Confirma que, al día de hoy, la empresa y sus administradores y directivos NO tienen ningún reclamo en curso, ni conocimiento de ninguna circunstancia que pudiera dar lugar a un reclamo en el futuro en su contra?',
  '¿Confirma que en los últimos 5 años la empresa NO ha tenido reclamos, ni tiene conocimiento de alguna circunstancia que pudiera resultar en la presentación de un reclamo que afecte esta póliza?',
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

export default function SeccionPI({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef1, fileRef2, fileRef3];

  const reqBloqueado = REQUISITOS.some((_, i) => {
    const key = `frm_pi_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
    return w[key] === 'NO';
  });

  const docKeys = [
    'frm_pi_doc_01_nombre', 'frm_pi_doc_02_nombre', 'frm_pi_doc_03_nombre',
  ] as const;

  return (
    <div>

      {/* ── SERVICIOS ELEGIBLES (informativo) ── */}
      <div className="form-subsection dyo-subsection">
        <p className="dyo-intro-text">
          Servicios profesionales a los que se puede ofrecer este producto:
        </p>
        <ol className="dyo-servicios-list">
          {SERVICIOS_ELEGIBLES.map((servicio, i) => (
            <li key={i} className="dyo-servicios-item">{servicio}</li>
          ))}
        </ol>
      </div>

      {/* ── REQUISITOS ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Requisitos</div>
        <p className="dyo-intro-text">
          Por favor diligenciar el siguiente cuestionario con la información proporcionada.
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar
          por este canal y se deberá comunicar con su asesor comercial.
        </p>
        <div className="dyo-si-no-table">
          <div className="dyo-si-no-header">
            <span>REQUISITOS / La sociedad y sus filiales (si aplica) afirman que:</span>
            <span>SI&nbsp;/&nbsp;NO</span>
          </div>
          {REQUISITOS.map((pregunta, i) => {
            const name = `frm_pi_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial.
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
                      if (file) {
                        setValue(docKey, file.name as never);
                        fileRegistry.current.set(docKey, file);
                      }
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
            ['frm_pi_prop_01_limite', 1],
            ['frm_pi_prop_02_limite', 2],
            ['frm_pi_prop_03_limite', 3],
          ] as const).map(([field, n]) => (
            <div key={field} className="dyo-propuesta-row">
              <span className="dyo-prop-num">{n}</span>
              <div className="dyo-prop-limite">
                <ZdsSelect
                  label=""
                  name={field}
                  control={control}
                  options={OPTIONS.limitePI}
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
