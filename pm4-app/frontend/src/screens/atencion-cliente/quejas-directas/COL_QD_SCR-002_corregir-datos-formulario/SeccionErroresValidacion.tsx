import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrAlert } from '../../../../components/fields/ZdsFields';
import FormSection from '../../../../components/FormSection';
import { useCollection } from '../../../../core/useCollection';
import type { CampoConError } from '../campos/types';
import type { CorregirDatosFormData } from '../campos/fields';
import { QD, QD_COLLECTIONS } from '../campos/fields';

interface Props {
  camposConError: CampoConError[];
  form: UseFormReturn<CorregirDatosFormData>;
  triggered: boolean;
}

const CAMPOS_CONOCIDOS: string[] = [QD.strEmail, QD.strIdNumber, QD.strCity];

function esCampoCorregido(
  in_strField: string,
  in_objErrors: UseFormReturn<CorregirDatosFormData>['formState']['errors'],
  in_blnTriggered: boolean,
): boolean {
  if (!in_blnTriggered) return false;
  if (in_strField === QD.strCity) return !in_objErrors[QD.strCity] && !in_objErrors[QD.strDepartment];
  return !in_objErrors[in_strField as keyof CorregirDatosFormData];
}

export default function SeccionErroresValidacion({ camposConError, form, triggered }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Observamos el departamento para filtrar los municipios.
  const strDepartment = watch(QD.strDepartment);

  // Cargamos los catalogos de departamento y municipio.
  const { options: cllDepartment } = useCollection(QD_COLLECTIONS.department);
  const { options: cllCity } = useCollection(QD_COLLECTIONS.city, { [QD.strDepartment]: strDepartment });

  // Al cambiar departamento, limpiar municipio si ya no pertenece a la lista nueva
  useEffect(() => {
    if (!strDepartment) return;
    const strCurrent = form.getValues(QD.strCity);
    if (!cllCity.some(objOption => objOption.value === strCurrent)) setValue(QD.strCity, '');
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
                {objField.campo === QD.strEmail && (
                  <ZdsInput
                    name={QD.strEmail}
                    control={control}
                    label={objField.etiqueta}
                    inputType="email"
                    rules={{
                      required: 'Campo requerido',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato inválido. Ingrese: nombre@dominio.com' },
                    }}
                    required
                    error={errors[QD.strEmail]?.message}
                  />
                )}

                {objField.campo === QD.strIdNumber && (
                  <ZdsInput
                    name={QD.strIdNumber}
                    control={control}
                    label={objField.etiqueta}
                    rules={{
                      required: 'Campo requerido',
                      minLength: { value: 6, message: 'Mínimo 6 dígitos' },
                      maxLength: { value: 15, message: 'Máximo 15 dígitos' },
                      pattern: { value: /^\d+$/, message: 'Solo dígitos, sin espacios ni separadores' },
                    }}
                    required
                    error={errors[QD.strIdNumber]?.message}
                  />
                )}

                {objField.campo === QD.strCity && (
                  <>
                    <ZdsSelect
                      name={QD.strDepartment}
                      control={control}
                      label="Departamento"
                      options={cllDepartment}
                      rules={{ required: 'Campo requerido' }}
                      required
                      error={errors[QD.strDepartment]?.message}
                    />
                    <ZdsSelect
                      name={QD.strCity}
                      control={control}
                      label={objField.etiqueta}
                      options={cllCity}
                      rules={{ required: 'Seleccione un municipio válido para el departamento' }}
                      required
                      error={errors[QD.strCity]?.message}
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
