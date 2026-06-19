import { useForm, FieldError } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea } from '../../components/fields/ZdsFields';
import { OPTIONS, RecibirQuejaFormData } from './variables';

type FormInstance = ReturnType<typeof useForm<RecibirQuejaFormData>>;

interface Props {
  form: FormInstance;
}

function fe(
  errors: FormInstance['formState']['errors'],
  name: keyof RecibirQuejaFormData,
  value: unknown,
  isSubmitted: boolean
): string | undefined {
  const err = errors[name] as FieldError | undefined;
  if (!err) return undefined;
  const empty = value === '' || value === null || value === undefined;
  if (err.type === 'required' && empty && !isSubmitted) return undefined;
  return String(err.message);
}

export default function SeccionClasificacion({ form }: Props) {
  const { control, watch, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const err = (name: keyof RecibirQuejaFormData) =>
    fe(errors, name, w[name], isSubmitted);

  return (
    <FormSection title="Clasificación y Datos de la Queja">
      <div className="form-row cols-1">
        <ZdsInput
          name="qd_asunto"
          control={control}
          label="Asunto / Resumen"
          rules={{ required: 'Campo requerido', maxLength: { value: 500, message: 'Máximo 500 caracteres' } }}
          required
          error={err('qd_asunto')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsTextarea
          name="qd_descripcionQueja"
          control={control}
          label="Descripción de la Queja"
          rules={{ maxLength: { value: 4000, message: 'Máximo 4000 caracteres' } }}
          maxLength={4000}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_productoSFC"
          control={control}
          label="Producto SFC"
          options={OPTIONS.productoSFC}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_productoSFC')}
        />
        <ZdsSelect
          name="qd_motivoSFC"
          control={control}
          label="Motivo SFC"
          options={OPTIONS.motivoSFC}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_motivoSFC')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_tipoSolicitud"
          control={control}
          label="Tipo de Solicitud (Zurich)"
          options={OPTIONS.tipoSolicitud}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_tipoSolicitud')}
        />
        <ZdsSelect
          name="qd_instanciaRecepcion"
          control={control}
          label="Instancia de Recepción"
          options={OPTIONS.instanciaRecepcion}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_instanciaRecepcion')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect
          name="qd_puntoRecepcion"
          control={control}
          label="Punto de Recepción"
          options={OPTIONS.puntoRecepcion}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_puntoRecepcion')}
        />
        <ZdsSelect
          name="qd_admision"
          control={control}
          label="Admisión"
          options={OPTIONS.admision}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_admision')}
        />
        <ZdsSelect
          name="qd_enteControl"
          control={control}
          label="Ente de Control"
          options={OPTIONS.enteControl}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_enteControl')}
        />
      </div>
    </FormSection>
  );
}
