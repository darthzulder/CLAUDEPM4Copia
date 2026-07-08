import { useState, useMemo, useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { ZrButton, ZdsInput, ZdsDate, ZdsSelect, ZrAlert } from '../../../components/fields/ZdsFields';
import { OPTIONS, DEPARTAMENTOS, CIUDADES_POR_DEPTO, FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

// Construimos el mensaje de error visible según el estado del campo
function fe(
  in_objErr: FieldError | undefined,
  in_objValue: unknown,
  isSubmitted: boolean
): string | undefined {
  if (!in_objErr) return undefined;
  const blnEmpty = in_objValue === '' || in_objValue === null || in_objValue === undefined;
  if (in_objErr.type === 'required' && blnEmpty) return isSubmitted ? String(in_objErr.message) : undefined;
  return String(in_objErr.message);
}

const TIPOS_EMPRESA_BLOQUEADOS = new Set(['ESTATAL', 'ENTIDAD_PUBLICA', 'EXTRANJERA']);

export default function CreacionTomador({ form }: { form: Form }) {
  const [blnOpen, setBlnOpen] = useState(true);
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const objWatch = watch();

  // Detectamos si el tipo de empresa seleccionado está bloqueado para este canal
  const blnCompanyBlocked = TIPOS_EMPRESA_BLOQUEADOS.has(objWatch.frm_cre_tipo_empresa ?? '');

  // Calculamos las ciudades disponibles según el departamento elegido
  const lstCitiesCre = useMemo(
    () => CIUDADES_POR_DEPTO[objWatch.frm_cre_departamento ?? ''] ?? [],
    [objWatch.frm_cre_departamento]
  );

  // Reiniciamos la ciudad cada vez que cambia el departamento
  useEffect(() => {
    setValue('frm_cre_ciudad', '');
  }, [objWatch.frm_cre_departamento, setValue]);

  // Resolvemos el error de un campo puntual del formulario
  const err = (in_strName: keyof FfFlSolicitudFormData) =>
    fe(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  return (
    <div>
      <ZrButton
        config="secondary"
        wide
        icon="alert-triangle:line"
        onClick={() => setBlnOpen(!blnOpen)}
        style={{
          ['--z-button--bg' as any]:    'var(--zc-lemon-20)',
          ['--z-button--color' as any]: 'var(--zc-lemon-aa)',
          ['--z-button--radius' as any]: '8px',
          marginBottom: 'var(--zs-75)',
        }}
      >
        {blnOpen ? '▾' : '▸'} Creación de tomador — Persona Jurídica
        <span style={{ font: 'var(--zf-capt-12)', marginLeft: 'var(--zs-50)' }}>(completar si TIA no encontró el tomador)</span>
      </ZrButton>

      {blnOpen && (
        <div className="policyholder-create-body">
          {/* Datos básicos de la compañía */}
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

          {/* Tipo de empresa y fechas del documento */}
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

          {/* Avisamos cuando el tipo de empresa no puede cotizarse por este canal */}
          {blnCompanyBlocked && (
            <ZrAlert config="negative" style={{ marginTop: 'var(--zs-75)', marginBottom: 0 }} {...({ 'hide-close': true } as object)}>
              El tipo de empresa seleccionado no puede cotizarse por este canal, por favor verifique la información.
              La cotización deberá gestionarse con la ayuda del asesor comercial (Case Underwriting).
            </ZrAlert>
          )}

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

          {/* Datos del representante legal */}
          <div className="form-subsection-title form-subsection-title--spaced">Representante legal</div>
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

          {/* Datos de dirección del tomador */}
          <div className="form-subsection-title form-subsection-title--spaced">Dirección</div>
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
              options={lstCitiesCre}
              placeholder={objWatch.frm_cre_departamento ? 'Seleccione...' : 'Seleccione departamento primero'}
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

          {/* Campo oculto: el tercero se crea siempre en estado Activo */}
          <input type="hidden" {...register('frm_cre_estado_tercero')} defaultValue="Activo" />
        </div>
      )}
    </div>
  );
}
