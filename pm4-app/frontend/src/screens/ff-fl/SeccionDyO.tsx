import type React from 'react';
import { useForm } from 'react-hook-form';
import DocSupportUploader from '../../components/DocSupportUploader';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoQuestionTable } from './SiNoGroup';
import { PropuestaEconomicaTable } from './PropuestaEconomicaTable';
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

const MSG_BLOQUEO = 'La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).';

export default function SeccionDyO({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const docKeys = [
    'frm_dyo_doc_01_nombre', 'frm_dyo_doc_02_nombre', 'frm_dyo_doc_03_nombre',
  ] as const;

  return (
    <div>

      {/* ── PERFIL DE CLIENTE ── */}
      <SiNoQuestionTable
        form={form}
        title="Perfil de cliente"
        intro="¿La compañía opera en alguno de los siguientes sectores?"
        prefix="frm_dyo_perf_"
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
          <>La compañía solicitante debe cumplir todos los requisitos siguientes para acceder a la cobertura de seguro propuesta.<br />
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar.</>
        }
        prefix="frm_dyo_req_"
        items={REQUISITOS}
        blockOn="NO"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── DOCUMENTO DE SOPORTE ── */}
      <DocSupportUploader form={form} fileRegistry={fileRegistry} docKeys={docKeys} />

      {/* ── PROPUESTA ECONÓMICA ── */}
      <PropuestaEconomicaTable
        form={form}
        fields={['frm_dyo_prop_01_limite', 'frm_dyo_prop_02_limite', 'frm_dyo_prop_03_limite']}
        options={OPTIONS.limiteDyo}
        intro="El deducible va en 0 por defecto."
        note="Nota: los Gastos de Defensa son parte del límite y no en adición."
      />

    </div>
  );
}
