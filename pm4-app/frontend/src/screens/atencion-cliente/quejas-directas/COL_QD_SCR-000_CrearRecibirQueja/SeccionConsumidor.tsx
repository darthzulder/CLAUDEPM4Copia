import { useEffect } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect } from '../../../../components/fields/ZdsFields';
import { useCollection, useSyncDesc } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, LOCK_COUNTRY, DEFAULT_COUNTRY_CODE } from '../fields/fields';
import type { CrearRecibirQuejaFormData } from '../fields/fields';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
}

export default function SeccionConsumidor({ form }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de los datos del consumidor.
  const { options: cllIdType, rawMap: dicIdType } = useCollection(QD_COLLECTIONS.idType);
  const { options: cllCountry } = useCollection(QD_COLLECTIONS.countryCode);
  const { options: cllDepartment } = useCollection(QD_COLLECTIONS.department);
  const { options: cllCity } = useCollection(QD_COLLECTIONS.city, objWatch as unknown as Record<string, unknown>);
  const { options: cllSpecialCond } = useCollection(QD_COLLECTIONS.specialCondition);
  const { options: cllLgbtiq } = useCollection(QD_COLLECTIONS.lgbtiq);
  const { options: cllSex } = useCollection(QD_COLLECTIONS.sex);
  const { options: cllPersonType } = useCollection(QD_COLLECTIONS.personType);

  // Sincroniza la variable compañera <campo>_desc con la descripción del código guardado.
  // El campo base guarda el CÓDIGO (numérico, catálogos PM4 actualizados); _desc viaja a PM4.
  useSyncDesc(form, QD.strIdType, cllIdType);
  useSyncDesc(form, QD.strCountryCode, cllCountry);
  useSyncDesc(form, QD.strDepartment, cllDepartment);
  useSyncDesc(form, QD.strCity, cllCity);
  useSyncDesc(form, QD.strSex, cllSex);
  useSyncDesc(form, QD.strLgbtiq, cllLgbtiq);
  useSyncDesc(form, QD.strSpecialCondition, cllSpecialCond);
  useSyncDesc(form, QD.strPersonType, cllPersonType);

  // Nombre de la variable compañera de descripción para el input read-only de tipo de persona
  // (el campo base guarda el código; se muestra el _desc legible).
  const strPersonTypeDesc = `${QD.strPersonType}_desc` as FieldPath<CrearRecibirQuejaFormData>;

  // FLD-320 — Sexo oculto (back); default "No Aplica", resuelto desde CAT-SEXO.
  // La variable compañera qd_strSex_desc se sincroniza sola vía useSyncDesc de arriba.
  useEffect(() => {
    if (objWatch[QD.strSex] || cllSex.length === 0) return;
    const objDefault = cllSex.find((o) => /no aplica/i.test(o.label));
    if (objDefault) setValue(QD.strSex, objDefault.value);
  }, [objWatch[QD.strSex], cllSex, setValue]);

  // FLD-321 — LGBTIQ+ oculto (back); default "No", resuelto desde CAT-LGBTIQ.
  useEffect(() => {
    if (objWatch[QD.strLgbtiq] || cllLgbtiq.length === 0) return;
    const objDefault = cllLgbtiq.find((o) => /^no$/i.test(o.label));
    if (objDefault) setValue(QD.strLgbtiq, objDefault.value);
  }, [objWatch[QD.strLgbtiq], cllLgbtiq, setValue]);

  // FLD-322 — Condición especial oculta, por defecto "No aplica" (back), resuelto desde CAT-COND-ESP.
  // CATALOGOS v2: el catálogo confirmado (código 98) ya no trae "Ninguna" como opción.
  useEffect(() => {
    if (objWatch[QD.strSpecialCondition] || cllSpecialCond.length === 0) return;
    const objNone = cllSpecialCond.find((o) => /no aplica/i.test(o.label));
    if (objNone) setValue(QD.strSpecialCondition, objNone.value);
  }, [objWatch[QD.strSpecialCondition], cllSpecialCond, setValue]);

  // RUL-000-02 / RUL-000-03 — el tipo de documento define el tipo de persona.
  // Se resuelve por el campo `codigo_tipo_persona` del registro de CAT-TIPO-ID
  // (1 = Natural, 2 = Jurídica), no por el código del documento.
  const objIdTypeRecord = dicIdType[objWatch[QD.strIdType] ?? ''] as { data?: Record<string, unknown> } | undefined;
  const strPersonTypeCode = String(objIdTypeRecord?.data?.codigo_tipo_persona ?? '');
  const blnIsLegalEntity = strPersonTypeCode === '2';

  // FLD-315 — tipo de persona computado (back), resuelto desde CAT-TIPO-PERSONA.
  // Se almacena el CÓDIGO (.value); la descripción se muestra vía qd_strPersonType_desc.
  useEffect(() => {
    if (!strPersonTypeCode || cllPersonType.length === 0) return;
    const objPersonType = cllPersonType.find((o) => o.value === strPersonTypeCode);
    if (objPersonType) setValue(QD.strPersonType, objPersonType.value);
  }, [strPersonTypeCode, cllPersonType, setValue]);

  // RUL-000-09 — al cambiar el departamento se limpia y deshabilita la ciudad.
  useEffect(() => {
    setValue(QD.strCity, '');
  }, [objWatch[QD.strDepartment], setValue]);

  // RUL-000-10 — país por ahora en read-only y fijado en Colombia (170)
  useEffect(() => {
    if (LOCK_COUNTRY && objWatch[QD.strCountryCode] !== DEFAULT_COUNTRY_CODE) {
      setValue(QD.strCountryCode, DEFAULT_COUNTRY_CODE);
    }
  }, [objWatch[QD.strCountryCode], setValue]);

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;

  return (
    <FormSection title="Datos del Consumidor Financiero">
      <div className="form-row cols-2">
        <ZdsSelect
          name={QD.strIdType}
          control={control}
          label="Selecciona tu tipo de identificación"
          options={cllIdType}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err(QD.strIdType)}
        />
        <ZdsInput
          name={QD.strIdNumber}
          control={control}
          label="Número de identificación"
          autoComplete="off"
          rules={{
            required: 'Campo requerido',
            pattern: { value: /^[A-Za-z0-9]{5,15}$/, message: 'Verifica el formato según el tipo de documento (MSG-000-07)' },
          }}
          required
          error={err(QD.strIdNumber)}
        />
      </div>

      {/* Persona natural (RUL-000-03) */}
      {!blnIsLegalEntity && (
        <div className="form-row cols-2">
          <ZdsInput
            name={QD.strFirstName}
            control={control}
            label="¿Cuáles son tus nombres?"
            rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
            required
            error={err(QD.strFirstName)}
          />
          <ZdsInput
            name={QD.strLastName}
            control={control}
            label="¿Cuáles son tus apellidos?"
            rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
            required
            error={err(QD.strLastName)}
          />
        </div>
      )}

      {/* Persona jurídica (RUL-000-02) */}
      {blnIsLegalEntity && (
        <>
          <div className="form-row cols-1">
            <ZdsInput
              name={QD.strCompanyName}
              control={control}
              label="Razón social"
              rules={{ required: 'Campo requerido' }}
              required
              error={err(QD.strCompanyName)}
            />
          </div>
          <div className="form-row cols-2">
            <ZdsInput
              name={QD.strContactFirstName}
              control={control}
              label="Nombres de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err(QD.strContactFirstName)}
            />
            <ZdsInput
              name={QD.strContactLastName}
              control={control}
              label="Apellidos de la persona de contacto"
              rules={{ required: 'Campo requerido', pattern: { value: /^[A-Za-zÀ-ÿ\s]+$/, message: 'Solo letras' } }}
              required
              error={err(QD.strContactLastName)}
            />
          </div>
        </>
      )}

      <div className="form-row cols-3">
        <ZdsInput
          name={QD.strPhone}
          control={control}
          label="Celular"
          inputType="tel"
          rules={{ required: 'Campo requerido', pattern: { value: /^\d{10}$/, message: 'Debe contener exactamente 10 dígitos (MSG-000-01)' } }}
          required
          error={err(QD.strPhone)}
        />
        <ZdsInput
          name={QD.strEmail}
          control={control}
          label="Correo electrónico"
          inputType="email"
          rules={{ required: 'Campo requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: usuario@dominio.com (MSG-000-02)' } }}
          required
          error={err(QD.strEmail)}
        />
        <ZdsInput
          name={strPersonTypeDesc}
          control={control}
          label="Tipo de persona"
          readOnly
          helpText="Asignado automáticamente según el tipo de documento (CAT-TIPO-PERSONA)."
        />
      </div>

      <div className="form-row cols-3">
        <ZdsSelect
          name={QD.strCountryCode}
          control={control}
          label="País"
          options={cllCountry}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={LOCK_COUNTRY}
          error={err(QD.strCountryCode)}
        />
        <ZdsSelect
          name={QD.strDepartment}
          control={control}
          label="Departamento"
          options={cllDepartment}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err(QD.strDepartment)}
        />
        <ZdsSelect
          name={QD.strCity}
          control={control}
          label="Ciudad"
          options={cllCity}
          rules={{ required: 'Campo requerido' }}
          required
          disabled={!objWatch[QD.strDepartment]}
          withSearch
          placeholder={objWatch[QD.strDepartment] ? 'Seleccione ciudad...' : 'Seleccione primero el departamento'}
          error={err(QD.strCity)}
        />
      </div>

      {/* FLD-319 (Dirección), FLD-320 (Sexo), FLD-321 (LGBTIQ+) y FLD-322
          (Condición especial) — ocultos por requerimiento: son variables de
          back (Dirección queda vacía pendiente API SFC; Sexo/LGBTIQ+/Condición
          especial se precargan con su default vía los effects de arriba), no
          se muestran en el formulario. */}
    </FormSection>
  );
}
