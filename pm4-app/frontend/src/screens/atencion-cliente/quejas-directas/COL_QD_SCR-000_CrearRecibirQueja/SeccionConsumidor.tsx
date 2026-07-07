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
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de los datos del consumidor.
  const { options: cllIdType, rawMap: dicIdType } = useCollection(COLLECTION_DEFS.tipoIdentificacion);
  const { options: cllCountry } = useCollection(COLLECTION_DEFS.pais);
  const { options: cllDepartment } = useCollection(COLLECTION_DEFS.departamento);
  const { options: cllCity } = useCollection(COLLECTION_DEFS.ciudad, objWatch as unknown as Record<string, unknown>);
  const { options: cllSpecialCond } = useCollection(COLLECTION_DEFS.condicionEspecial);
  const { options: cllLgbtiq } = useCollection(COLLECTION_DEFS.lgbtiq);
  const { options: cllSex } = useCollection(COLLECTION_DEFS.sexo);
  const { options: cllPersonType } = useCollection(COLLECTION_DEFS.tipoPersona);

  // FLD-320 — sexo por defecto "No informa" (back, pendiente API SFC), resuelto desde CAT-SEXO.
  useEffect(() => {
    if (objWatch.qd_sexo || cllSex.length === 0) return;
    const objNotReported = cllSex.find((o) => /no informa/i.test(o.label));
    if (objNotReported) setValue('qd_sexo', objNotReported.label);
  }, [objWatch.qd_sexo, cllSex, setValue]);

  // FLD-321 — LGBTIQ+ oculto, por defecto "No informa" (back), resuelto desde CAT-LGBTIQ.
  useEffect(() => {
    if (objWatch.qd_lgbtiq || cllLgbtiq.length === 0) return;
    const objNotReported = cllLgbtiq.find((o) => /no informa/i.test(o.label));
    if (objNotReported) setValue('qd_lgbtiq', objNotReported.label);
  }, [objWatch.qd_lgbtiq, cllLgbtiq, setValue]);

  // FLD-322 — Condición especial oculta, por defecto "NINGUNA" (back), resuelto desde CAT-COND-ESP.
  useEffect(() => {
    if (objWatch.qd_condicionEspecial || cllSpecialCond.length === 0) return;
    const objNone = cllSpecialCond.find((o) => /ninguna/i.test(o.label));
    if (objNone) setValue('qd_condicionEspecial', objNone.label);
  }, [objWatch.qd_condicionEspecial, cllSpecialCond, setValue]);

  // RUL-000-02 / RUL-000-03 — el tipo de documento define el tipo de persona.
  // Se resuelve por el campo `codigo_tipo_persona` del registro de CAT-TIPO-ID
  // (1 = Natural, 2 = Jurídica), no por el código del documento.
  const objIdTypeRecord = dicIdType[objWatch.qd_tipoIdentificacion ?? ''] as { data?: Record<string, unknown> } | undefined;
  const strPersonTypeCode = String(objIdTypeRecord?.data?.codigo_tipo_persona ?? '');
  const blnIsLegalEntity = strPersonTypeCode === '2';

  // FLD-315 — tipo de persona computado (back), resuelto desde CAT-TIPO-PERSONA.
  useEffect(() => {
    if (!strPersonTypeCode || cllPersonType.length === 0) return;
    const objPersonType = cllPersonType.find((o) => o.value === strPersonTypeCode);
    if (objPersonType) setValue('qd_tipoPersona', objPersonType.label);
  }, [strPersonTypeCode, cllPersonType, setValue]);

  // RUL-000-09 — al cambiar el departamento se limpia y deshabilita la ciudad.
  useEffect(() => {
    setValue('qd_municipio', '');
  }, [objWatch.qd_departamento, setValue]);

  // RUL-000-10 — país por ahora en read-only y fijado en Colombia (170)
  useEffect(() => {
    if (LOCK_COUNTRY && objWatch.qd_codigoPais !== DEFAULT_COUNTRY_CODE) {
      setValue('qd_codigoPais', DEFAULT_COUNTRY_CODE);
    }
  }, [objWatch.qd_codigoPais, setValue]);

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;

  return (
    <FormSection title="Datos del Consumidor Financiero">
      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_tipoIdentificacion"
          control={control}
          label="Selecciona tu tipo de identificación"
          options={cllIdType}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_tipoIdentificacion')}
        />
        <ZdsInput
          name="qd_numeroIdentificacion"
          control={control}
          label="Número de identificación"
          autoComplete="off"
          rules={{
            required: 'Campo requerido',
            pattern: { value: /^[A-Za-z0-9]{5,15}$/, message: 'Verifica el formato según el tipo de documento (MSG-000-07)' },
          }}
          required
          error={err('qd_numeroIdentificacion')}
        />
      </div>

      {/* Persona natural (RUL-000-03) */}
      {!blnIsLegalEntity && (
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
      {blnIsLegalEntity && (
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
              name="qd_nombresContacto"
              control={control}
              label="Nombres de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err('qd_nombresContacto')}
            />
            <ZdsInput
              name="qd_apellidosContacto"
              control={control}
              label="Apellidos de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err('qd_apellidosContacto')}
            />
          </div>
        </>
      )}

      <div className="form-row cols-3">
        <ZdsInput
          name="qd_telefono"
          control={control}
          label="Celular"
          inputType="tel"
          rules={{ required: 'Campo requerido', pattern: { value: /^\d{10}$/, message: 'Debe contener exactamente 10 dígitos (MSG-000-01)' } }}
          required
          error={err('qd_telefono')}
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
          name="qd_codigoPais"
          control={control}
          label="País"
          options={cllCountry}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={LOCK_COUNTRY}
          error={err('qd_codigoPais')}
        />
        <ZdsSelect
          name="qd_departamento"
          control={control}
          label="Departamento"
          options={cllDepartment}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_departamento')}
        />
        <ZdsSelect
          name="qd_municipio"
          control={control}
          label="Ciudad"
          options={cllCity}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={!objWatch.qd_departamento}
          withSearch
          placeholder={objWatch.qd_departamento ? 'Seleccione ciudad...' : 'Seleccione primero el departamento'}
          error={err('qd_municipio')}
        />
      </div>

      {/* FLD-319 (Dirección) y FLD-320 (Sexo) — ocultos por requerimiento: son variables
          de back (Sexo se precarga "No informa" vía el effect de arriba; Dirección queda
          vacía pendiente API SFC). Igual que FLD-321 (LGBTIQ+) y FLD-322 (Condición
          especial), no se muestran en el formulario. */}
    </FormSection>
  );
}
