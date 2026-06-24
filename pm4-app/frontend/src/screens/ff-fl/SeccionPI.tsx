import type React from 'react';
import { useForm } from 'react-hook-form';
import DocSupportUploader from '../../components/DocSupportUploader';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoQuestionTable } from './SiNoGroup';
import { PropuestaEconomicaTable } from './PropuestaEconomicaTable';

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
  const docKeys = [
    'frm_pi_doc_01_nombre', 'frm_pi_doc_02_nombre', 'frm_pi_doc_03_nombre',
  ] as const;

  return (
    <div>

      {/* ── SERVICIOS ELEGIBLES (informativo) ── */}
      <div className="form-subsection form-subsection--stack">
        <p className="subsection-intro">
          Servicios profesionales a los que se puede ofrecer este producto:
        </p>
        <ol className="service-list">
          {SERVICIOS_ELEGIBLES.map((servicio, i) => (
            <li key={i} className="service-item">{servicio}</li>
          ))}
        </ol>
      </div>

      {/* ── REQUISITOS ── */}
      <SiNoQuestionTable
        form={form}
        title="Requisitos"
        intro={
          <>Por favor diligenciar el siguiente cuestionario con la información proporcionada.
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar
          por este canal y se deberá comunicar con su asesor comercial.</>
        }
        prefix="frm_pi_req_"
        items={REQUISITOS}
        blockOn="NO"
        blockMsg="La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial."
      />

      {/* ── DOCUMENTO DE SOPORTE ── */}
      <DocSupportUploader form={form} fileRegistry={fileRegistry} docKeys={docKeys} />

      {/* ── PROPUESTA ECONÓMICA ── */}
      <PropuestaEconomicaTable
        form={form}
        fields={['frm_pi_prop_01_limite', 'frm_pi_prop_02_limite', 'frm_pi_prop_03_limite']}
        options={OPTIONS.limitePI}
        note="Nota: el sistema debe controlar que se ingrese al menos un valor asegurado."
      />

    </div>
  );
}
