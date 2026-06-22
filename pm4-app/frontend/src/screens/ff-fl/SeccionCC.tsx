import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZrButton, ZdsSelect, ZrAlert, ZrFileInput, ZrTable } from '../../components/fields/ZdsFields';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoField, SiNoSelectAll } from './SiNoGroup';

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

export default function SeccionCC({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const { control, watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);

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
        <SiNoSelectAll form={form} prefix="frm_cc_perf_" count={SECTORES.length} />
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
                const name = `frm_cc_perf_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
        {perfBloqueado && <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>{MSG_BLOQUEO}</ZrAlert>}
      </div>

      {/* ── REQUISITOS ── */}
      <div className="form-subsection dyo-subsection">
        <div className="form-subsection-title">Requisitos</div>
        <p className="dyo-intro-text">
          La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la
          cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.
        </p>
        <SiNoSelectAll form={form} prefix="frm_cc_req_" count={REQUISITOS.length} />
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
                const name = `frm_cc_req_${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
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
        {reqBloqueado && <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>{MSG_BLOQUEO}</ZrAlert>}
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
        <p className="dyo-intro-text">Todo y cada reclamo en el agregado anual</p>
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Límite por evento</th>
                <th>Límite por agregado</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['frm_cc_prop_01_evento', 'frm_cc_prop_01_agregado', 1],
                ['frm_cc_prop_02_evento', 'frm_cc_prop_02_agregado', 2],
                ['frm_cc_prop_03_evento', 'frm_cc_prop_03_agregado', 3],
              ] as const).map(([eventoField, agregadoField, n]) => (
                <tr key={eventoField}>
                  <td {...({ config: 'center' } as object)}>{n}</td>
                  <td>
                    <ZdsSelect
                      label=""
                      name={eventoField}
                      control={control}
                      options={OPTIONS.limiteCC}
                      placeholder="Seleccione"
                    />
                  </td>
                  <td>
                    <ZdsSelect
                      label=""
                      name={agregadoField}
                      control={control}
                      options={opcionesAgregado(eventoField)}
                      placeholder="Seleccione"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ZrTable>
        <p className="dyo-nota">
          Nota: el sistema debe controlar que se ingrese al menos un valor asegurado. El deducible es automático.
        </p>
      </div>

    </div>
  );
}
