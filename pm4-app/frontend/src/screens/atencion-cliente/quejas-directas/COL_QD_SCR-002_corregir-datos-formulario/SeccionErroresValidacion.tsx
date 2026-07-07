import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrAlert } from '../../../../components/fields/ZdsFields';
import FormSection from '../../../../components/FormSection';
import { useCollection } from '../../../../core/useCollection';
import type { CampoConError, CorregirDatosFormData } from './variables';
import { COLLECTION_DEFS } from './variables';

interface Props {
  camposConError: CampoConError[];
  form: UseFormReturn<CorregirDatosFormData>;
  triggered: boolean;
}

const CAMPOS_CONOCIDOS = ['qd_correoElectronico', 'qd_numeroIdentificacion', 'qd_municipio'];

function esCampoCorregido(
  in_strField: string,
  in_objErrors: UseFormReturn<CorregirDatosFormData>['formState']['errors'],
  in_blnTriggered: boolean,
): boolean {
  if (!in_blnTriggered) return false;
  if (in_strField === 'qd_municipio') return !in_objErrors.qd_municipio && !in_objErrors.qd_departamento;
  return !in_objErrors[in_strField as keyof CorregirDatosFormData];
}

export default function SeccionErroresValidacion({ camposConError, form, triggered }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Observamos el departamento para filtrar los municipios.
  const strDepartment = watch('qd_departamento');

  // Cargamos los catalogos de departamento y municipio.
  const { options: cllDepartment } = useCollection(COLLECTION_DEFS.departamento);
  const { options: cllCity } = useCollection(COLLECTION_DEFS.municipio, { qd_departamento: strDepartment });

  // Al cambiar departamento, limpiar municipio si ya no pertenece a la lista nueva
  useEffect(() => {
    if (!strDepartment) return;
    const strCurrent = form.getValues('qd_municipio');
    if (!cllCity.some(objOption => objOption.value === strCurrent)) setValue('qd_municipio', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strDepartment, cllCity]);

  if (camposConError.length === 0) return null;

  return (
    <FormSection title="Campos con Error — Corrija cada uno">
      {/* z-flex col:200 → columna con gap 200 entre bloques de error */}
      <div {...({ 'z-flex': 'col:200' } as object)}>
        {camposConError.map((objField) => {
          // Determinamos si el campo ya quedó corregido.
          const blnFixed = esCampoCorregido(objField.campo, errors, triggered);
          return (
            <div key={objField.campo} {...({ 'z-flex': 'col:100' } as object)}>

              {blnFixed ? (
                <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
                  <strong>{objField.fldId} · {objField.etiqueta}</strong> — Campo corregido correctamente.
                </ZrAlert>
              ) : (
                <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                  <strong>{objField.fldId} · {objField.etiqueta}:</strong>{' '}
                  {objField.valorRechazado
                    ? <>Valor rechazado: <code>"{objField.valorRechazado}"</code> — {objField.mensajeError}</>
                    : objField.mensajeError}
                </ZrAlert>
              )}

              <div className="form-row cols-2">
                {objField.campo === 'qd_correoElectronico' && (
                  <ZdsInput
                    name="qd_correoElectronico"
                    control={control}
                    label={objField.etiqueta}
                    inputType="email"
                    rules={{
                      required: 'Campo requerido',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato inválido. Ingrese: nombre@dominio.com' },
                    }}
                    required
                    error={errors.qd_correoElectronico?.message}
                  />
                )}

                {objField.campo === 'qd_numeroIdentificacion' && (
                  <ZdsInput
                    name="qd_numeroIdentificacion"
                    control={control}
                    label={objField.etiqueta}
                    rules={{
                      required: 'Campo requerido',
                      minLength: { value: 6, message: 'Mínimo 6 dígitos' },
                      maxLength: { value: 15, message: 'Máximo 15 dígitos' },
                      pattern: { value: /^\d+$/, message: 'Solo dígitos, sin espacios ni separadores' },
                    }}
                    required
                    error={errors.qd_numeroIdentificacion?.message}
                  />
                )}

                {objField.campo === 'qd_municipio' && (
                  <>
                    <ZdsSelect
                      name="qd_departamento"
                      control={control}
                      label="Departamento"
                      options={cllDepartment}
                      rules={{ required: 'Campo requerido' }}
                      required
                      error={errors.qd_departamento?.message}
                    />
                    <ZdsSelect
                      name="qd_municipio"
                      control={control}
                      label={objField.etiqueta}
                      options={cllCity}
                      rules={{ required: 'Seleccione un municipio válido para el departamento' }}
                      required
                      error={errors.qd_municipio?.message}
                    />
                  </>
                )}

                {!CAMPOS_CONOCIDOS.includes(objField.campo) && (
                  <ZdsInput
                    name={objField.campo as keyof CorregirDatosFormData}
                    control={control}
                    label={objField.etiqueta}
                    rules={{ required: 'Campo requerido' }}
                    required
                    error={errors[objField.campo as keyof CorregirDatosFormData]?.message as string | undefined}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}
