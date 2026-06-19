import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea } from '../../components/fields/ZdsFields';
import { OPTIONS, RevisarErrorTecnicoFormData } from './variables';

type FormInstance = ReturnType<typeof useForm<RevisarErrorTecnicoFormData>>;

interface Props {
  form: FormInstance;
}

export default function SeccionDetalleError({ form }: Props) {
  const { control } = form;

  return (
    <>
      {/* Sección 1: Detalle del Error */}
      <FormSection title="Detalle del Error de Integración" color="#B44444">
        <div className="form-row cols-3">
          <ZdsInput name="et_numeroCaso" control={control} label="Número de Caso (ID BPM)" readOnly />
          <ZdsInput name="et_fechaHoraError" control={control} label="Fecha y Hora del Error" readOnly />
          <ZdsInput name="et_codigoError" control={control} label="Código de Error" readOnly />
        </div>

        <div className="form-row cols-2">
          <ZdsSelect
            label="Tipo de Error"
            name="et_tipoError"
            control={control}
            options={OPTIONS.tipoError}
            placeholder="Seleccione tipo..."
          />
          <ZdsSelect
            label="Sistema Afectado"
            name="et_sistemaAfectado"
            control={control}
            options={OPTIONS.sistemaAfectado}
            placeholder="Seleccione sistema..."
          />
        </div>

        <div className="form-row cols-1">
          <ZdsTextarea
            name="et_mensajeError"
            control={control}
            label="Mensaje del Error (log del sistema)"
            readOnly
          />
          <span className="form-helper">Campo de solo lectura — generado automáticamente por el sistema</span>
        </div>
      </FormSection>

      {/* Sección 2: Queja Afectada */}
      <FormSection title="Queja Afectada (Solo Lectura)">
        <div className="info-banner">
          Los datos del consumidor y la queja son de solo lectura. Fueron registrados en el paso anterior del proceso (P01-T01).
        </div>

        <div className="form-row cols-3">
          <ZdsInput name="et_nombreConsumidor" control={control} label="Nombre del Consumidor" readOnly />
          <ZdsInput name="et_numeroIdentificacion" control={control} label="Número de Identificación" readOnly />
          <ZdsInput name="et_tipoSolicitud" control={control} label="Tipo de Solicitud" readOnly />
        </div>

        <div className="form-row cols-2">
          <ZdsInput name="et_productoSFC" control={control} label="Producto SFC" readOnly />
          <ZdsInput name="et_motivoSFC" control={control} label="Motivo SFC" readOnly />
        </div>
      </FormSection>
    </>
  );
}
