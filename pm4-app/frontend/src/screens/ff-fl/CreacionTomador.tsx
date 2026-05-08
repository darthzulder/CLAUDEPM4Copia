import { useState, useMemo, useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import InputField from '../../components/fields/InputField';
import SelectField from '../../components/fields/SelectField';
import DateField from '../../components/fields/DateField';
import { OPTIONS, DEPARTAMENTOS, CIUDADES_POR_DEPTO, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

function fe(
  err: FieldError | undefined,
  value: unknown,
  isSubmitted: boolean
): string | undefined {
  if (!err) return undefined;
  const empty = value === '' || value === null || value === undefined;
  if (err.type === 'required' && empty) return isSubmitted ? String(err.message) : undefined;
  return String(err.message);
}

export default function CreacionTomador({ form }: { form: Form }) {
  const [open, setOpen] = useState(false);
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();

  const ciudadesCre = useMemo(
    () => CIUDADES_POR_DEPTO[w.frm_cre_departamento] ?? [],
    [w.frm_cre_departamento]
  );

  useEffect(() => {
    setValue('frm_cre_ciudad', '');
  }, [w.frm_cre_departamento, setValue]);

  const err = (name: keyof FfFlSolicitudFormData) =>
    fe(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <div>
      <button type="button" className="creacion-tomador-toggle" onClick={() => setOpen(!open)}>
        ⚠ {open ? '▾' : '▸'} Creación de tomador — Persona Jurídica
        <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
          (completar solo si TIA no retornó datos del tomador)
        </span>
      </button>

      {open && (
        <div className="creacion-tomador-body">
          <div className="form-row cols-3">
            <InputField
              label="Nombre de compañía"
              registration={register('frm_cre_nombre_compania', {
                required: 'Campo requerido',
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/, message: 'Sin caracteres especiales' },
              })}
              required
              error={err('frm_cre_nombre_compania')}
            />
            <SelectField
              label="Tipo de documento"
              name="frm_cre_tipo_doc"
              control={control}
              options={OPTIONS.tipoDocCre}
              disabled
            />
            <InputField
              label="Nro. de documento (NIT)"
              registration={register('frm_cre_nro_doc', {
                required: 'Campo requerido',
                minLength: { value: 7, message: 'Mínimo 7 dígitos' },
                maxLength: { value: 10, message: 'Máximo 10 dígitos' },
                pattern: { value: /^\d+$/, message: 'Solo dígitos (sin separador)' },
              })}
              required
              error={err('frm_cre_nro_doc')}
              helper="9 dígitos + dígito verificador, sin separador"
            />
          </div>

          <div className="form-row cols-3">
            <SelectField
              label="Tipo de empresa"
              name="frm_cre_tipo_empresa"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoEmpresa}
              required
              error={err('frm_cre_tipo_empresa')}
            />
            <DateField
              label="Fecha de constitución"
              registration={register('frm_cre_fecha_constitucion')}
            />
            <DateField
              label="Fecha de expedición del documento"
              registration={register('frm_cre_fecha_expedicion')}
            />
          </div>

          <div className="form-row cols-1">
            <InputField
              label="Actividad comercial"
              registration={register('frm_cre_actividad_comercial', {
                required: 'Campo requerido',
                maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/, message: 'Sin caracteres especiales' },
              })}
              required
              error={err('frm_cre_actividad_comercial')}
            />
          </div>

          <div className="form-subsection-title" style={{ marginTop: 12 }}>Representante legal</div>
          <div className="form-row cols-3">
            <InputField
              label="Nombre del representante legal"
              registration={register('frm_cre_nombre_rep_legal', {
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Sin caracteres especiales' },
              })}
              error={err('frm_cre_nombre_rep_legal')}
            />
            <SelectField
              label="Tipo de documento"
              name="frm_cre_tipo_doc_rep_legal"
              control={control}
              options={OPTIONS.tipoDocRepLegal}
            />
            <InputField
              label="Nro. de documento"
              registration={register('frm_cre_nro_doc_rep_legal')}
              helper="CC: 5-10 dígitos | CE: 1-10 dígitos | PAS: 1-10 alfanumérico"
              error={err('frm_cre_nro_doc_rep_legal')}
            />
          </div>

          <div className="form-subsection-title" style={{ marginTop: 12 }}>Dirección</div>
          <div className="form-row cols-1">
            <InputField
              label="Dirección"
              registration={register('frm_cre_direccion', {
                required: 'Campo requerido',
                maxLength: { value: 150, message: 'Máximo 150 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s#\-,.]+$/, message: 'Sin caracteres especiales' },
              })}
              required
              error={err('frm_cre_direccion')}
            />
          </div>
          <div className="form-row cols-3">
            <SelectField
              label="Departamento"
              name="frm_cre_departamento"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={[...DEPARTAMENTOS]}
              required
              error={err('frm_cre_departamento')}
            />
            <SelectField
              label="Ciudad"
              name="frm_cre_ciudad"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={ciudadesCre}
              placeholder={w.frm_cre_departamento ? 'Seleccione...' : 'Seleccione departamento primero'}
              required
              error={err('frm_cre_ciudad')}
            />
            <InputField
              label="Correo para facturación"
              registration={register('frm_cre_correo_facturacion', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                maxLength: { value: 254, message: 'Máximo 254 caracteres' },
              })}
              type="email"
              error={err('frm_cre_correo_facturacion')}
            />
          </div>

          <input type="hidden" {...register('frm_cre_estado_tercero')} defaultValue="Activo" />
        </div>
      )}
    </div>
  );
}
