import { useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect } from '../../components/fields/ZdsFields';
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
  const { control, watch, setValue, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const municipios = MUNICIPIOS_POR_DPTO[w.qd_departamento] ?? [];

  // Limpiar municipio cuando cambia el departamento (RUL-001-03)
  useEffect(() => {
    setValue('qd_municipio', '');
  }, [w.qd_departamento, setValue]);

  const err = (name: keyof RecibirQuejaFormData) =>
    fe(errors, name, w[name], isSubmitted);

  return (
    <FormSection title="Datos del Consumidor Financiero">
      <div className="form-row cols-2">
        <ZdsInput
          name="qd_nombreConsumidor"
          control={control}
          label="Nombre o Razón Social"
          rules={{ required: 'Campo requerido', maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
          required
          error={err('qd_nombreConsumidor')}
        />
        <ZdsSelect
          name="qd_tipoIdentificacion"
          control={control}
          label="Tipo de Identificación"
          options={OPTIONS.tipoIdentificacion}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_tipoIdentificacion')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          name="qd_numeroIdentificacion"
          control={control}
          label="Número de Identificación"
          rules={{ required: 'Campo requerido', pattern: { value: /^\d{6,15}$/, message: 'Solo dígitos, mínimo 6 y máximo 15 caracteres' } }}
          required
          error={err('qd_numeroIdentificacion')}
        />
        <ZdsInput
          name="qd_correoElectronico"
          control={control}
          label="Correo Electrónico"
          rules={{ required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingrese un correo válido (ej: nombre@dominio.com)' } }}
          required
          error={err('qd_correoElectronico')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect
          name="qd_tipoPersona"
          control={control}
          label="Tipo de Persona"
          options={OPTIONS.tipoPersona}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_tipoPersona')}
        />
        <ZdsSelect
          name="qd_codigoPais"
          control={control}
          label="Código País"
          options={OPTIONS.codigoPais}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_codigoPais')}
        />
        <div />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_departamento"
          control={control}
          label="Departamento"
          options={DEPARTAMENTOS}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_departamento')}
        />
        <ZdsSelect
          name="qd_municipio"
          control={control}
          label="Municipio"
          options={municipios}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={!w.qd_departamento}
          placeholder={w.qd_departamento ? 'Seleccione municipio...' : 'Seleccione primero el departamento'}
          error={err('qd_municipio')}
        />
      </div>
    </FormSection>
  );
}
