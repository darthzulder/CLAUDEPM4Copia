import { useForm, FieldError } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
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
  const { register, control, watch, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const err = (name: keyof RecibirQuejaFormData) =>
    fe(errors, name, w[name], isSubmitted);

  return (
    <FormSection title="📁 Clasificación y Datos de la Queja">
      <div className="form-row cols-1">
        <InputField
          label="Asunto / Resumen"
          registration={register('qd_asunto', {
            required: 'Campo requerido',
            maxLength: { value: 500, message: 'Máximo 500 caracteres' },
          })}
          required
          error={err('qd_asunto')}
          placeholder="Título descriptivo de la queja (máx. 500 caracteres)"
        />
      </div>

      <div className="form-row cols-1">
        <div className="form-group">
          <label className="form-label">
            Descripción de la Queja
          </label>
          <textarea
            {...register('qd_descripcionQueja', {
              maxLength: { value: 4000, message: 'Máximo 4000 caracteres' },
            })}
            className={`form-control textarea${errors.qd_descripcionQueja ? ' is-invalid' : ''}`}
            placeholder="Registrar de forma clara y objetiva la descripción de la queja (máx. 4000 caracteres)"
            rows={4}
          />
          {errors.qd_descripcionQueja && (
            <div className="invalid-feedback">{String(errors.qd_descripcionQueja.message)}</div>
          )}
        </div>
      </div>

      <div className="form-row cols-2">
        <SelectField
          label="Producto SFC"
          name="qd_productoSFC"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.productoSFC}
          required
          error={err('qd_productoSFC')}
        />
        <SelectField
          label="Motivo SFC"
          name="qd_motivoSFC"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.motivoSFC}
          required
          error={err('qd_motivoSFC')}
        />
      </div>

      <div className="form-row cols-2">
        <SelectField
          label="Tipo de Solicitud (Zurich)"
          name="qd_tipoSolicitud"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.tipoSolicitud}
          required
          error={err('qd_tipoSolicitud')}
        />
        <SelectField
          label="Instancia de Recepción"
          name="qd_instanciaRecepcion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.instanciaRecepcion}
          required
          error={err('qd_instanciaRecepcion')}
        />
      </div>

      <div className="form-row cols-3">
        <SelectField
          label="Punto de Recepción"
          name="qd_puntoRecepcion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.puntoRecepcion}
          required
          error={err('qd_puntoRecepcion')}
        />
        <SelectField
          label="Admisión"
          name="qd_admision"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.admision}
          required
          error={err('qd_admision')}
        />
        <SelectField
          label="Ente de Control"
          name="qd_enteControl"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.enteControl}
          required
          error={err('qd_enteControl')}
        />
      </div>
    </FormSection>
  );
}
