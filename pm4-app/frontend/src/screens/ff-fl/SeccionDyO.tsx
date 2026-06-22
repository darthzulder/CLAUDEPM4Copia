import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZrButton, ZdsSelect, ZrAlert, ZrFileInput, ZrTable } from '../../components/fields/ZdsFields';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoField, SiNoSelectAll } from './SiNoGroup';
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

export default function SeccionDyO({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);

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
        <SiNoSelectAll form={form} prefix="frm_dyo_perf_" count={SECTORES.length} />
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Sector</th>
                <th style={{ width: 120 }} {...({ config: 'center' } as object)}>SÍ / NO</th>
              </tr>
            </thead>
            <tbody>
              {SECTORES.map((sector, i) => {
                const name = `frm_dyo_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
                return (
                  <tr key={name}>
                    <td {...({ config: 'center' } as object)}>{i + 1}</td>
                    <td>{sector}</td>
                    <td {...({ config: 'center' } as object)}><SiNoField form={form} name={name} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ZrTable>
        {perfBloqueado && (
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).
          </ZrAlert>
        )}
      </div>

      {/* ── REQUISITOS ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Requisitos</div>
        <p className="dyo-intro-text">
          La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.
        </p>
        <SiNoSelectAll form={form} prefix="frm_dyo_req_" count={REQUISITOS.length} />
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
                const name = `frm_dyo_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
            La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).
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
        <p className="dyo-intro-text">
          El deducible va en 0 por defecto.
        </p>
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
                ['frm_dyo_prop_01_limite', 1],
                ['frm_dyo_prop_02_limite', 2],
                ['frm_dyo_prop_03_limite', 3],
              ] as const).map(([field, n]) => (
                <tr key={field}>
                  <td {...({ config: 'center' } as object)}>{n}</td>
                  <td>
                    <ZdsSelect
                      label=""
                      name={field}
                      control={control}
                      options={OPTIONS.limiteDyo}
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
          Nota: los Gastos de Defensa son parte del límite y no en adición.
        </p>
      </div>

    </div>
  );
}
