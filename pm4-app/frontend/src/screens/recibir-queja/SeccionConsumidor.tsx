import { useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import { OPTIONS, DEPARTAMENTOS, MUNICIPIOS_POR_DPTO, RecibirQuejaFormData } from './variables';

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

export default function SeccionConsumidor({ form }: Props) {
  const { register, control, watch, setValue, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const municipios = MUNICIPIOS_POR_DPTO[w.qd_departamento] ?? [];

  // Limpiar municipio cuando cambia el departamento (RUL-001-03)
  useEffect(() => {
    setValue('qd_municipio', '');
  }, [w.qd_departamento, setValue]);

  const err = (name: keyof RecibirQuejaFormData) =>
    fe(errors, name, w[name], isSubmitted);

  return (
    <FormSection title="👤 Datos del Consumidor Financiero">
      <div className="form-row cols-2">
        <InputField
          label="Nombre o Razón Social"
          registration={register('qd_nombreConsumidor', {
            required: 'Campo requerido',
            maxLength: { value: 200, message: 'Máximo 200 caracteres' },
          })}
          required
          error={err('qd_nombreConsumidor')}
          placeholder="Nombre completo o razón social"
        />
        <SelectField
          label="Tipo de Identificación"
          name="qd_tipoIdentificacion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.tipoIdentificacion}
          required
          error={err('qd_tipoIdentificacion')}
        />
      </div>

      <div className="form-row cols-2">
        <InputField
          label="Número de Identificación"
          registration={register('qd_numeroIdentificacion', {
            required: 'Campo requerido',
            pattern: { value: /^\d{6,15}$/, message: 'Solo dígitos, mínimo 6 y máximo 15 caracteres' },
          })}
          required
          error={err('qd_numeroIdentificacion')}
          placeholder="Solo dígitos, sin separadores"
        />
        <InputField
          label="Correo Electrónico"
          registration={register('qd_correoElectronico', {
            required: 'Campo requerido',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Ingrese un correo válido (ej: nombre@dominio.com)',
            },
          })}
          type="email"
          required
          error={err('qd_correoElectronico')}
          placeholder="nombre@dominio.com"
          helper="Destino del correo de respuesta final al cliente"
        />
      </div>

      <div className="form-row cols-3">
        <SelectField
          label="Tipo de Persona"
          name="qd_tipoPersona"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.tipoPersona}
          required
          error={err('qd_tipoPersona')}
        />
        <SelectField
          label="Código País"
          name="qd_codigoPais"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.codigoPais}
          required
          error={err('qd_codigoPais')}
        />
        <div />
      </div>

      <div className="form-row cols-2">
        <SelectField
          label="Departamento"
          name="qd_departamento"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={DEPARTAMENTOS}
          required
          error={err('qd_departamento')}
        />
        <SelectField
          label="Municipio"
          name="qd_municipio"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={municipios}
          required
          disabled={!w.qd_departamento}
          placeholder={w.qd_departamento ? 'Seleccione municipio...' : 'Seleccione primero el departamento'}
          error={err('qd_municipio')}
        />
      </div>
    </FormSection>
  );
}
