import type React from 'react';
import { useForm } from 'react-hook-form';
import DocSupportUploader from '../../../components/DocSupportUploader';
import { OPTIONS, FfFlSolicitudFormData } from './variables';
import { SiNoQuestionTable } from './SiNoGroup';
import { PropuestaEconomicaTable } from './PropuestaEconomicaTable';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SECTORES = [
  'Pólizas para la ejecución de contratos específicos.',
  'Empresas en reorganización y/o reestructuración.',
  'Servicios Profesionales o consultoría de tipo legal, de tecnología, tributaria, de contabilidad, outsourcing y financiera.',
  'Entidades sin ánimo de lucro.',
  'Retail (comercio con venta online superiores al 30% del total de sus ingresos y sistema PoS).',
  'Compañías Aéreas y Servicios de Transporte.',
  'Instituciones Financieras y/o Servicios Financieros (Cooperativas de Ahorro y Crédito, Fondos de Empleados, Fondos Mutuos de Inversión, Compañías de Colocación de Créditos de Libranza, Fintech o Similares).',
  'Casinos / Juegos de Azar / Casas de Apuestas Online.',
  'Firmas de ingeniería y/o Diseño.',
  'Empresas de generación de energía, prestación de servicios públicos e infraestructura crítica.',
  'Entidades públicas (de propiedad del estado o de economía mixta).',
  'Compañías listadas en Bolsa.',
  'Servicios de Salud.',
  'Servicios Profesionales de Tecnología.',
  'Servicios de Logística.',
  'Telecomunicaciones.',
  'Generadores de Contenido Digital o de Medios Audiovisuales.',
  'Medios de comunicación (radio y televisión).',
  'Procesadores de Tarjetas de Pago/Crédito.',
  'Empresas Agregadores de Datos (Proveedores de Servicios en la Nube, Minería de Datos, Bodegas de Datos, Integración de Datos y servicios relacionados o similares).',
  'Proveedores de Moneda Digital y Empresas de cambio de Moneda Digital.',
  'Plataformas de Negociación de Mercados Online, Plataformas de Negociación de Títulos Valores, Plataformas de Negociación de Materias Primas y sus proveedores de servicios tecnológicos.',
  'Empresas suministradoras de contenidos para adultos.',
  'Redes Sociales.',
  'Empresas dedicadas al procesamiento y distribución de Marihuana y/o opioides.',
  'Farmacéuticas.',
  'Call Center / BPO.',
] as const;

const REQUISITOS = [
  '¿La seguridad informática/cibernética implementada contempla políticas y procedimientos centralizados?',
  '¿El importe de los ingresos consolidados es inferior y/o igual a COP100.000.000.000?',
  '¿Afirman que su domicilio social está ubicado en Colombia?',
  '¿Afirman que llevan más de 2 años desarrollando su actividad?',
  'Afirman que en los dos últimos años NO han tenido amenazas de extorsión cibernética o NO han tenido lugar interrupciones de los sistemas durante más de 12 horas.',
  '¿Afirman que en los 2 últimos años NO han tenido investigaciones, solicitudes de información, sanciones por parte de un regulador o una agencia gubernamental en relación con el manejo de la información personal identificable?',
  '¿El tomador y sus filiales (si aplica) afirma No tener conocimiento de hechos o circunstancias que pudieran dar lugar a reclamos y/o eventos de privacidad y/o de seguridad bajo esta póliza de seguro o conocimiento de hechos o circunstancias que pudieran dar lugar a investigaciones o imposición de sanciones?',
] as const;

const CONTROLES_1 = [
  '¿Cuentan con una política de seguridad de la información que contenga reglas para el uso del correo electrónico e internet, clasificación de la información y confidencialidad de los datos confidenciales, de acuerdo con la ley de protección de datos?',
  '¿Se capacita anualmente a todos los empleados sobre la política de seguridad de la información, incluyendo amenazas como phishing y malware?',
  '¿Cuentan con antivirus en todas sus computadoras y firewalls en el perímetro de la red?',
  '¿Aplican parches de seguridad y actualizaciones para todos los software y sistemas operativos de forma regular?',
  '¿Se realizan copias de seguridad de datos y de sistemas críticos, al menos una vez a la semana?',
  '¿Tiene política de construcción de contraseñas complejas y de cambio regular?',
  '¿La empresa filtra el contenido del correo electrónico y los sitios de internet para bloquear el contenido malicioso, spam y phishing?',
] as const;

const CONTROLES_2 = [
  '¿Su nivel de ventas online superiores al 30% del total de ingresos y sistemas PoS?',
  '¿Exige autenticación multifactor para todos los accesos de la red corporativa y si hay excepciones se las tiene documentadas?',
] as const;

const CONTROLES_ADICIONALES = [
  '¿Disponen de planes de respuesta a incidentes, plan de continuidad del negocio y recuperación de desastres que den pruebas y actualizan al menos una vez al año?',
  'En caso de subcontratar, ¿El proveedor de servicios está obligado contractualmente a cumplir las políticas de seguridad y protecciones de datos?',
  '¿Aseguran regularmente de que las copias de seguridad de datos son completas, que se puedan restaurar lo más rápido posible y están fuera de sus predios?',
] as const;

const MSG_BLOQUEO = 'La cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).';

export default function SeccionPDySI({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const docKeys = [
    'frm_pdysi_doc_01_nombre', 'frm_pdysi_doc_02_nombre', 'frm_pdysi_doc_03_nombre',
  ] as const;

  return (
    <div>

      {/* ── PERFIL DE CLIENTE ── */}
      <SiNoQuestionTable
        form={form}
        title="Perfil de cliente"
        intro="¿La compañía opera en alguno de los siguientes sectores?"
        prefix="frm_pdysi_perf_"
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
          <>Por favor diligenciar el siguiente cuestionario con la información proporcionada.
          Si contesta NO a cualquiera de las siguientes preguntas, la cotización no puede continuar
          por este canal y deberá comunicarse con su director comercial.</>
        }
        prefix="frm_pdysi_req_"
        items={REQUISITOS}
        blockOn="NO"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── CONTROLES EN LA GESTIÓN DEL RIESGO - PARTE 1 ── */}
      <SiNoQuestionTable
        form={form}
        title="Controles en la Gestión del Riesgo - Parte 1"
        intro="Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:"
        prefix="frm_pdysi_ctrl1_"
        items={CONTROLES_1}
        blockOn="NO"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── CONTROLES EN LA GESTIÓN DEL RIESGO - PARTE 2 ── */}
      <SiNoQuestionTable
        form={form}
        title="Controles en la Gestión del Riesgo - Parte 2"
        intro="Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:"
        prefix="frm_pdysi_ctrl2_"
        items={CONTROLES_2}
        blockOn="NO"
        blockMsg={MSG_BLOQUEO}
      />

      {/* ── CONTROLES ADICIONALES ── */}
      <SiNoQuestionTable
        form={form}
        title="Controles Adicionales"
        intro="Por favor confirme con la información proporcionada que el tomador y sus filiales (si aplica) afirma que:"
        prefix="frm_pdysi_ctrlad_"
        items={CONTROLES_ADICIONALES}
      />

      {/* ── DOCUMENTO DE SOPORTE ── */}
      <DocSupportUploader form={form} fileRegistry={fileRegistry} docKeys={docKeys} />

      {/* ── PROPUESTA ECONÓMICA ── */}
      <PropuestaEconomicaTable
        form={form}
        fields={['frm_pdysi_prop_01_limite', 'frm_pdysi_prop_02_limite', 'frm_pdysi_prop_03_limite']}
        options={OPTIONS.limitePdySI}
        note="Nota: el sistema debe controlar que se ingrese al menos un valor asegurado."
      />

    </div>
  );
}
