import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZrButton, ZdsSelect, ZrAlert, ZrFileInput, ZrTable } from '../../components/fields/ZdsFields';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoField, SiNoSelectAll } from './SiNoGroup';

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

export default function SeccionPI({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);

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
        <SiNoSelectAll form={form} prefix="frm_pi_req_" count={REQUISITOS.length} />
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>La sociedad y sus filiales (si aplica) afirman que:</th>
                <th style={{ width: 120 }} {...({ config: 'center' } as object)}>SÍ / NO</th>
              </tr>
            </thead>
            <tbody>
              {REQUISITOS.map((pregunta, i) => {
                const name = `frm_pi_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
                return (
                  <tr key={name}>
                    <td {...({ config: 'center' } as object)}>{i + 1}</td>
                    <td>{pregunta}</td>
                    <td {...({ config: 'center' } as object)}><SiNoField form={form} name={name} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ZrTable>
        {reqBloqueado && (
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial.
          </ZrAlert>
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
                <ZrFileInput
                  label=""
                  model={fileName || null}
                  droppable
                  onChange={(file: File | string | null) => {
                    if (file && typeof file !== 'string') {
                      setValue(docKey, file.name as never);
                      fileRegistry.current.set(docKey, file);
                    } else if (!file) {
                      setValue(docKey, '' as never);
                      fileRegistry.current.delete(docKey);
                    }
                  }}
                  {...({ accept: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] } as Record<string, unknown>)}
                />
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
            icon="plus:line"
          >
            Agregar documento
          </ZrButton>
        )}
      </div>

      {/* ── PROPUESTA ECONÓMICA ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Propuesta económica</div>
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Límite asegurado</th>
                <th>Modalidad de cobertura</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['frm_pi_prop_01_limite', 1],
                ['frm_pi_prop_02_limite', 2],
                ['frm_pi_prop_03_limite', 3],
              ] as const).map(([field, n]) => (
                <tr key={field}>
                  <td {...({ config: 'center' } as object)}>{n}</td>
                  <td>
                    <ZdsSelect
                      label=""
                      name={field}
                      control={control}
                      options={OPTIONS.limitePI}
                      placeholder="Seleccione un límite"
                    />
                  </td>
                  <td>Todo y cada reclamo en el agregado anual</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ZrTable>
        <p className="dyo-nota">
          Nota: el sistema debe controlar que se ingrese al menos un valor asegurado.
        </p>
      </div>

    </div>
  );
}
