import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrAlert } from '../../../../components/fields/ZdsFields';
import FormSection from '../../../../components/FormSection';
import type { CampoConError, CorregirDatosFormData } from './variables';
import { DEPARTAMENTOS, MUNICIPIOS_POR_DPTO } from './variables';

interface Props {
  camposConError: CampoConError[];
  form: UseFormReturn<CorregirDatosFormData>;
  triggered: boolean;
}

const CAMPOS_CONOCIDOS = ['qd_correoElectronico', 'qd_numeroIdentificacion', 'qd_municipio'];

function esCampoCorregido(
  campo: string,
  errors: UseFormReturn<CorregirDatosFormData>['formState']['errors'],
  triggered: boolean,
): boolean {
  if (!triggered) return false;
  if (campo === 'qd_municipio') return !errors.qd_municipio && !errors.qd_departamento;
  return !errors[campo as keyof CorregirDatosFormData];
}

export default function SeccionErroresValidacion({ camposConError, form, triggered }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  const dpto = watch('qd_departamento');
  const municipioOpciones = MUNICIPIOS_POR_DPTO[dpto] ?? [];

  // Al cambiar departamento, limpiar municipio si ya no pertenece a la lista nueva
  useEffect(() => {
    if (!dpto) return;
    const current = form.getValues('qd_municipio');
    if (!municipioOpciones.some(m => m.value === current)) setValue('qd_municipio', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpto]);

  if (camposConError.length === 0) return null;

  return (
    <FormSection title="Campos con Error — Corrija cada uno">
      {/* z-flex col:200 → columna con gap 200 entre bloques de error */}
      <div {...({ 'z-flex': 'col:200' } as object)}>
        {camposConError.map((campo) => {
          const corregido = esCampoCorregido(campo.campo, errors, triggered);
          return (
            <div key={campo.campo} {...({ 'z-flex': 'col:100' } as object)}>

              {corregido ? (
                <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
                  <strong>{campo.fldId} · {campo.etiqueta}</strong> — Campo corregido correctamente.
                </ZrAlert>
              ) : (
                <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                  <strong>{campo.fldId} · {campo.etiqueta}:</strong>{' '}
                  {campo.valorRechazado
                    ? <>Valor rechazado: <code>"{campo.valorRechazado}"</code> — {campo.mensajeError}</>
                    : campo.mensajeError}
                </ZrAlert>
              )}

              <div className="form-row cols-2">
                {campo.campo === 'qd_correoElectronico' && (
                  <ZdsInput
                    name="qd_correoElectronico"
                    control={control}
                    label={campo.etiqueta}
                    inputType="email"
                    rules={{
                      required: 'Campo requerido',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato inválido. Ingrese: nombre@dominio.com' },
                    }}
                    required
                    error={errors.qd_correoElectronico?.message}
                  />
                )}

                {campo.campo === 'qd_numeroIdentificacion' && (
                  <ZdsInput
                    name="qd_numeroIdentificacion"
                    control={control}
                    label={campo.etiqueta}
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

                {campo.campo === 'qd_municipio' && (
                  <>
                    <ZdsSelect
                      name="qd_departamento"
                      control={control}
                      label="Departamento"
                      options={DEPARTAMENTOS}
                      rules={{ required: 'Campo requerido' }}
                      required
                      error={errors.qd_departamento?.message}
                    />
                    <ZdsSelect
                      name="qd_municipio"
                      control={control}
                      label={campo.etiqueta}
                      options={municipioOpciones}
                      rules={{ required: 'Seleccione un municipio válido para el departamento' }}
                      required
                      error={errors.qd_municipio?.message}
                    />
                  </>
                )}

                {!CAMPOS_CONOCIDOS.includes(campo.campo) && (
                  <ZdsInput
                    name={campo.campo as keyof CorregirDatosFormData}
                    control={control}
                    label={campo.etiqueta}
                    rules={{ required: 'Campo requerido' }}
                    required
                    error={errors[campo.campo as keyof CorregirDatosFormData]?.message as string | undefined}
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
