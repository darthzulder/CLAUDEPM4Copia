import type React from 'react';
import { useForm } from 'react-hook-form';
import { ZdsSelect, ZrTable } from '../../../components/fields/ZdsFields';
import DocSupportUploader from '../../../components/DocSupportUploader';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoQuestionTable } from './SiNoGroup';

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
  const { control, watch } = form;
  const w = watch();

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
      <SiNoQuestionTable
        form={form}
        title="Perfil de cliente"
        intro="¿La compañía opera en alguno de los siguientes sectores?"
        prefix="frm_cc_perf_"
        items={SECTORES}
        colHeader="Sector"
        blockOn="SI"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── REQUISITOS ── */}
      <SiNoQuestionTable
        form={form}
        title="Requisitos"
        intro={
          <>La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la
          cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.</>
        }
        prefix="frm_cc_req_"
        items={REQUISITOS}
        blockOn="NO"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── DOCUMENTO DE SOPORTE ── */}
      <DocSupportUploader form={form} fileRegistry={fileRegistry} docKeys={docKeys} />

      {/* ── PROPUESTA ECONÓMICA ── */}
      <div className="form-subsection form-subsection--stack">
        <div className="form-subsection-title">Propuesta económica</div>
        <p className="subsection-intro">Todo y cada reclamo en el agregado anual</p>
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
        <p className="subsection-note">
          Nota: el sistema debe controlar que se ingrese al menos un valor asegurado. El deducible es automático.
        </p>
      </div>

    </div>
  );
}
