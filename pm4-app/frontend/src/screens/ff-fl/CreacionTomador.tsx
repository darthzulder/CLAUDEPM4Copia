import { useState, useMemo, useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { ZdsInput, ZdsDate, ZdsSelect } from './ZdsField';
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

export default function CreacionTomador({ form, forceOpen }: { form: Form; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  // forceOpen se activa cuando TIA confirma que el NIT no existe.
  // El botón toggle solo funciona después de haber consultado TIA (forceOpen !== undefined).
  const isOpen = open || !!forceOpen;
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const w = watch();

  const ciudadesCre = useMemo(
    () => CIUDADES_POR_DEPTO[w.frm_cre_departamento ?? ''] ?? [],
    [w.frm_cre_departamento]
  );

  useEffect(() => {
    setValue('frm_cre_ciudad', '');
  }, [w.frm_cre_departamento, setValue]);

  const err = (name: keyof FfFlSolicitudFormData) =>
    fe(errors[name] as FieldError | undefined, w[name], isSubmitted);

  return (
    <div>
      <button
        type="button"
        className="creacion-tomador-toggle"
        disabled={forceOpen === undefined}
        onClick={() => setOpen(!isOpen)}
      >
        ⚠ {isOpen ? '▾' : '▸'} Creación de tomador — Persona Jurídica
        {forceOpen === undefined
          ? <span className="creacion-tomador-hint">(consulte el NIT primero)</span>
          : <span className="creacion-tomador-hint">(se activa automáticamente si TIA no encuentra el NIT)</span>
        }
      </button>

      {isOpen && (
        <div className="creacion-tomador-body">
          <div className="form-row cols-3">
            <ZdsInput
              control={control}
              name="frm_cre_nombre_compania"
              label="Nombre de compañía"
              rules={{
                required: 'Campo requerido',
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/, message: 'Sin caracteres especiales' },
              }}
              required
              error={err('frm_cre_nombre_compania')}
            />
            <ZdsSelect
              label="Tipo de documento"
              name="frm_cre_tipo_doc"
              control={control}
              options={OPTIONS.tipoDocCre}
              disabled
            />
            <ZdsInput
              control={control}
              name="frm_cre_nro_doc"
              label="Nro. de documento (NIT)"
              rules={{
                required: 'Campo requerido',
                minLength: { value: 7, message: 'Mínimo 7 dígitos' },
                maxLength: { value: 10, message: 'Máximo 10 dígitos' },
                pattern: { value: /^\d+$/, message: 'Solo dígitos (sin separador)' },
              }}
              required
              error={err('frm_cre_nro_doc')}
              helpText="9 dígitos + dígito verificador, sin separador"
            />
          </div>

          <div className="form-row cols-3">
            <ZdsSelect
              label="Tipo de empresa"
              name="frm_cre_tipo_empresa"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={OPTIONS.tipoEmpresa}
              required
              error={err('frm_cre_tipo_empresa')}
            />
            <ZdsDate control={control} name="frm_cre_fecha_constitucion" label="Fecha de constitución" />
            <ZdsDate control={control} name="frm_cre_fecha_expedicion" label="Fecha de expedición del documento" />
          </div>

          <div className="form-row cols-1">
            <ZdsInput
              control={control}
              name="frm_cre_actividad_comercial"
              label="Actividad comercial"
              rules={{
                required: 'Campo requerido',
                maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/, message: 'Sin caracteres especiales' },
              }}
              required
              error={err('frm_cre_actividad_comercial')}
            />
          </div>

          <div className="form-subsection-title" style={{ marginTop: 12 }}>Representante legal</div>
          <div className="form-row cols-3">
            <ZdsInput
              control={control}
              name="frm_cre_nombre_rep_legal"
              label="Nombre del representante legal"
              rules={{
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Sin caracteres especiales' },
              }}
              error={err('frm_cre_nombre_rep_legal')}
            />
            <ZdsSelect
              label="Tipo de documento"
              name="frm_cre_tipo_doc_rep_legal"
              control={control}
              options={OPTIONS.tipoDocRepLegal}
            />
            <ZdsInput
              control={control}
              name="frm_cre_nro_doc_rep_legal"
              label="Nro. de documento"
              helpText="CC: 5-10 dígitos | CE: 1-10 dígitos | PAS: 1-10 alfanumérico"
              error={err('frm_cre_nro_doc_rep_legal')}
            />
          </div>

          <div className="form-subsection-title" style={{ marginTop: 12 }}>Dirección</div>
          <div className="form-row cols-1">
            <ZdsInput
              control={control}
              name="frm_cre_direccion"
              label="Dirección"
              rules={{
                required: 'Campo requerido',
                maxLength: { value: 150, message: 'Máximo 150 caracteres' },
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s#\-,.]+$/, message: 'Sin caracteres especiales' },
              }}
              required
              error={err('frm_cre_direccion')}
            />
          </div>
          <div className="form-row cols-3">
            <ZdsSelect
              label="Departamento"
              name="frm_cre_departamento"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={[...DEPARTAMENTOS]}
              required
              error={err('frm_cre_departamento')}
            />
            <ZdsSelect
              label="Ciudad"
              name="frm_cre_ciudad"
              control={control}
              rules={{ required: 'Campo requerido' }}
              options={ciudadesCre}
              placeholder={w.frm_cre_departamento ? 'Seleccione...' : 'Seleccione departamento primero'}
              required
              error={err('frm_cre_ciudad')}
            />
            <ZdsInput
              control={control}
              name="frm_cre_correo_facturacion"
              label="Correo para facturación"
              rules={{
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                maxLength: { value: 254, message: 'Máximo 254 caracteres' },
              }}
              inputType="email"
              error={err('frm_cre_correo_facturacion')}
            />
          </div>

          <input type="hidden" {...register('frm_cre_estado_tercero')} defaultValue="Activo" />
        </div>
      )}
    </div>
  );
}
