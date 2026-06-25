import { UseFormReturn } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { RevisarQuejaAsignarFormData } from './variables';
import { ZrTextInput, ZrTextarea, ZrAlert } from '../../components/fields/ZdsFields';

interface Props {
  form: UseFormReturn<RevisarQuejaAsignarFormData>;
}

const CANALES: Record<string, string> = {
  '1': '1. Presencial', '2': '2. Correo electrónico', '3': '3. Portal Web',
  '5': '5. Centro de atención telefónica', '6': '6. Canal SFC',
  '7': '7. Defensor del Consumidor Financiero',
};

const TIPO_ID: Record<string, string> = {
  '1': 'Cédula de ciudadanía', '2': 'Cédula de extranjería',
  '3': 'NIT', '4': 'Pasaporte', '5': 'Tarjeta de identidad',
};

function ReadField({ label, value }: { label: string; value?: string }) {
  // Mismo wrapper que ZdsInput readOnly → render y ancho idénticos al resto de pantallas
  return (
    <div className="zds-field-wrap">
      <ZrTextInput label={label} model={value ?? '—'} readonly />
    </div>
  );
}

export default function SeccionResumenQueja({ form }: Props) {
  const { watch } = form;
  const w = watch();

  return (
    <>
      {/* Sección 1: Encabezado del Caso Radicado */}
      <FormSection title="Encabezado del Caso Radicado">
        <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
          Esta queja fue radicada ante SmartSupervision (SFC). Los datos mostrados son de solo lectura. Solo puede modificar la asignación y las observaciones.
        </ZrAlert>

        <div className="form-row cols-3">
          <ReadField label="N° de Caso (BPM)" value={w.qd_numeroCaso} />
          <ReadField label="Código SmartSupervision" value={w.qd_codigoSS} />
          <ReadField label="Canal de Recepción" value={w.qd_canalRecepcion ? CANALES[w.qd_canalRecepcion] ?? w.qd_canalRecepcion : '—'} />
        </div>

        <div className="form-row cols-2">
          <ReadField label="Fecha y Hora de Creación" value={w.qd_fechaHoraCreacion} />
          <ReadField label="Fecha Límite de Respuesta" value={w.qd_fechaLimiteRespuesta} />
        </div>
      </FormSection>

      {/* Sección 2: Consumidor Financiero */}
      <FormSection title="Consumidor Financiero">
        <div className="form-row cols-3">
          <div className="col-span-2">
            <ReadField label="Nombre del Consumidor" value={w.qd_nombreConsumidor} />
          </div>
          <ReadField label="Correo Electrónico" value={w.qd_correoElectronico} />
        </div>

        <div className="form-row cols-2">
          <ReadField
            label="Tipo de Identificación"
            value={w.qd_tipoIdentificacion ? TIPO_ID[w.qd_tipoIdentificacion] ?? w.qd_tipoIdentificacion : '—'}
          />
          <ReadField label="Número de Identificación" value={w.qd_numeroIdentificacion} />
        </div>
      </FormSection>

      {/* Sección 3: Detalle de la Queja */}
      <FormSection title="Detalle de la Queja">
        <div className="form-row cols-2">
          <ReadField label="Producto SFC" value={w.qd_productoSFC} />
          <ReadField label="Motivo SFC" value={w.qd_motivoSFC} />
        </div>

        <div className="form-row cols-2">
          <ReadField label="Tipo de Solicitud" value={w.qd_tipoSolicitud} />
          <div />
        </div>

        <div className="form-row cols-1">
          <ReadField label="Asunto" value={w.qd_asunto} />
        </div>

        {w.qd_descripcionQueja && (
          <ZrTextarea label="Descripción de la Queja" model={w.qd_descripcionQueja ?? ''} readonly elastic />
        )}
      </FormSection>
    </>
  );
}
