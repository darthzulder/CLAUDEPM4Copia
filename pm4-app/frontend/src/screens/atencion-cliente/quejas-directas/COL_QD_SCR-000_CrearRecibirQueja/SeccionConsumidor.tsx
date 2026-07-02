import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { COLLECTION_DEFS, CrearRecibirQuejaFormData, LOCK_COUNTRY, DEFAULT_COUNTRY_CODE } from './variables';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
}

export default function SeccionConsumidor({ form }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  const w = watch();

  const { options: tipoIdentificacionOpts } = useCollection(COLLECTION_DEFS.tipoIdentificacion);
  const { options: paisOpts } = useCollection(COLLECTION_DEFS.pais);
  const { options: departamentoOpts } = useCollection(COLLECTION_DEFS.departamento);
  const { options: ciudadOpts } = useCollection(COLLECTION_DEFS.ciudad, w as unknown as Record<string, unknown>);
  const { options: condicionEspecialOpts } = useCollection(COLLECTION_DEFS.condicionEspecial);
  const { options: sexoOpts } = useCollection(COLLECTION_DEFS.sexo);
  const { options: tipoPersonaOpts } = useCollection(COLLECTION_DEFS.tipoPersona);

  // FLD-320 — sexo por defecto "No informa" (back, pendiente API SFC), resuelto desde CAT-SEXO.
  useEffect(() => {
    if (w.qd_sexo || sexoOpts.length === 0) return;
    const noInforma = sexoOpts.find((o) => /no informa/i.test(o.label));
    if (noInforma) setValue('qd_sexo', noInforma.value);
  }, [w.qd_sexo, sexoOpts, setValue]);

  // RUL-000-02 / RUL-000-03 — el tipo de documento define el tipo de persona.
  const esJuridica = w.qd_tipoIdentificacion === 'NIT';

  // FLD-315 — tipo de persona computado (back), resuelto desde CAT-TIPO-PERSONA.
  useEffect(() => {
    if (!w.qd_tipoIdentificacion || tipoPersonaOpts.length === 0) return;
    const tipoPersona = tipoPersonaOpts.find((o) => (esJuridica ? /jur[ií]dica/i : /natural/i).test(o.label));
    if (tipoPersona) setValue('qd_tipoPersona', tipoPersona.value);
  }, [w.qd_tipoIdentificacion, esJuridica, tipoPersonaOpts, setValue]);

  // RUL-000-09 — al cambiar el departamento se limpia y deshabilita la ciudad.
  useEffect(() => {
    setValue('qd_ciudad', '');
  }, [w.qd_departamento, setValue]);

  // RUL-000-10 — país por ahora en read-only y fijado en Colombia (170)
  useEffect(() => {
    if (LOCK_COUNTRY && w.qd_pais !== DEFAULT_COUNTRY_CODE) {
      setValue('qd_pais', DEFAULT_COUNTRY_CODE);
    }
  }, [w.qd_pais, setValue]);

  const err = (name: keyof CrearRecibirQuejaFormData) => errors[name]?.message;

  return (
    <FormSection title="Datos del Consumidor Financiero">
      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_tipoIdentificacion"
          control={control}
          label="Selecciona tu tipo de identificación"
          options={tipoIdentificacionOpts}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_tipoIdentificacion')}
        />
        <ZdsInput
          name="qd_numeroIdentificacion"
          control={control}
          label="Número de identificación"
          rules={{
            required: 'Campo requerido',
            pattern: { value: /^[A-Za-z0-9]{5,15}$/, message: 'Verifica el formato según el tipo de documento (MSG-000-07)' },
          }}
          required
          error={err('qd_numeroIdentificacion')}
        />
      </div>

      {/* Persona natural (RUL-000-03) */}
      {!esJuridica && (
        <div className="form-row cols-2">
          <ZdsInput
            name="qd_nombres"
            control={control}
            label="¿Cuáles son tus nombres?"
            rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
            required
            error={err('qd_nombres')}
          />
          <ZdsInput
            name="qd_apellidos"
            control={control}
            label="¿Cuáles son tus apellidos?"
            rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
            required
            error={err('qd_apellidos')}
          />
        </div>
      )}

      {/* Persona jurídica (RUL-000-02) */}
      {esJuridica && (
        <>
          <div className="form-row cols-1">
            <ZdsInput
              name="qd_razonSocial"
              control={control}
              label="Razón social"
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_razonSocial')}
            />
          </div>
          <div className="form-row cols-2">
            <ZdsInput
              name="qd_contactoNombres"
              control={control}
              label="Nombres de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err('qd_contactoNombres')}
            />
            <ZdsInput
              name="qd_contactoApellidos"
              control={control}
              label="Apellidos de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err('qd_contactoApellidos')}
            />
          </div>
        </>
      )}

      <div className="form-row cols-3">
        <ZdsInput
          name="qd_celular"
          control={control}
          label="Celular"
          inputType="tel"
          rules={{ required: 'Campo requerido', pattern: { value: /^\d{10}$/, message: 'Debe contener exactamente 10 dígitos (MSG-000-01)' } }}
          required
          error={err('qd_celular')}
        />
        <ZdsInput
          name="qd_correoElectronico"
          control={control}
          label="Correo electrónico"
          inputType="email"
          rules={{ required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: usuario@dominio.com (MSG-000-02)' } }}
          required
          error={err('qd_correoElectronico')}
        />
        <ZdsInput
          name="qd_tipoPersona"
          control={control}
          label="Tipo de persona"
          readOnly
          helpText="Asignado automáticamente según el tipo de documento (CAT-TIPO-PERSONA)."
        />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect
          name="qd_pais"
          control={control}
          label="País"
          options={paisOpts}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={LOCK_COUNTRY}
          error={err('qd_pais')}
        />
        <ZdsSelect
          name="qd_departamento"
          control={control}
          label="Departamento"
          options={departamentoOpts}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_departamento')}
        />
        <ZdsSelect
          name="qd_ciudad"
          control={control}
          label="Ciudad"
          options={ciudadOpts}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={!w.qd_departamento}
          withSearch
          placeholder={w.qd_departamento ? 'Seleccione ciudad...' : 'Seleccione primero el departamento'}
          error={err('qd_ciudad')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsInput
          name="qd_direccion"
          control={control}
          label="Dirección"
          readOnly
          helpText="Asignada por el sistema (pendiente API SFC)."
        />
        <ZdsInput
          name="qd_sexo"
          control={control}
          label="Sexo"
          readOnly
          helpText="Asignado por el sistema (CAT-SEXO, pendiente API SFC)."
        />
        <ZdsInput
          name="qd_lgbtiq"
          control={control}
          label="LGBTIQ+"
          readOnly
          helpText="Catálogo pendiente de confirmar con TI."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_condicionEspecial"
          control={control}
          label="Condición especial"
          options={condicionEspecialOpts}
          rules={{ required: 'Campo requerido' }}
          required
          error={err('qd_condicionEspecial')}
        />
        <div />
      </div>
    </FormSection>
  );
}
