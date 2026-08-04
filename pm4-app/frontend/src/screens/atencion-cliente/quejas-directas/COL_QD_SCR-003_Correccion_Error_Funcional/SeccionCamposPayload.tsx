import { useEffect } from 'react';
import type { FieldPath, RegisterOptions, UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import {
  ZdsInput, ZdsSelect, ZdsTextarea, ZdsRadio, ZdsStatusBadge, ZrAlert, ZrCheckbox,
} from '../../../../components/fields/ZdsFields';
import type { CollectionOption } from '../../../../core/useCollection';
import { useCollection, useSyncDesc, descOf, codeFromUiValue } from '../../../../core/useCollection';
import { useMatrizMotivos } from '../fields/useMatrizMotivos';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO, SCR003_PAYLOAD_M2_FIELDS } from '../fields/fields';
import type { CorreccionErrorFuncionalFormData, PayloadFieldDef } from '../fields/fields';

type Form = CorreccionErrorFuncionalFormData;
type Rules = RegisterOptions<Form, FieldPath<Form>>;

interface Props {
  form: UseFormReturn<Form>;
  /** Valor de cada variable tal como llegó en task.data (para revertir y comparar). */
  originales: Record<string, string>;
  /** Variables con el checkbox "Editar" marcado. */
  editables: Record<string, boolean>;
  onEditable: (in_strVariable: string, in_blnOn: boolean) => void;
  /** Body que el script alcanzó a enviar (qd_strPayloadSent parseado), si lo hay. */
  payloadEnviado: Record<string, unknown> | null;
  /** Campo señalado por la SFC (qd_strAffectedField) o el mensaje de error completo. */
  senalado: string;
}

/** Texto legible de un valor del payload enviado. */
function fmtPayload(in_gen: unknown): string {
  if (in_gen === null || in_gen === undefined || in_gen === '') return '—';
  if (typeof in_gen === 'object') return JSON.stringify(in_gen);
  return String(in_gen);
}

/**
 * ¿La SFC señaló este campo? Compara contra la clave del body, la variable y los
 * tokens de la clave (canal_cod → "canal", macro_motivo_cod → "motivo"), porque el
 * mensaje de la SFC nombra los campos en prosa/slug
 * (p.ej. "queja_entidad_motivo_producto_canal_already_exist").
 */
function esSenalado(in_strSenalado: string, in_objDef: PayloadFieldDef, in_strVar: string): boolean {
  if (!in_strSenalado) return false;
  const strHaystack = in_strSenalado.toLowerCase();
  if (strHaystack === in_strVar.toLowerCase()) return true;
  if (in_objDef.key === '—') return false;
  const strBase = in_objDef.key.toLowerCase().replace(/_cod$/, '');
  const lstTokens = [in_objDef.key.toLowerCase(), strBase, strBase.split('_').pop() ?? ''];
  return lstTokens.some((strToken) => strToken.length >= 5 && strHaystack.includes(strToken));
}

/**
 * S2 · "Campos a Corregir" — un control por cada campo del body de Momento 2
 * (SCR003_PAYLOAD_M2_FIELDS, espejo de buildBodyMomento2), ligado a la variable del
 * caso de la que el script lo lee. Cada fila solo se edita tras marcar su checkbox
 * "Editar"; al desmarcarlo se restaura el valor original.
 */
export default function SeccionCamposPayload({
  form, originales, editables, onEditable, payloadEnviado, senalado,
}: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  const objWatch = watch();
  const val = (in_strField: string): string => String((objWatch as Record<string, unknown>)[in_strField] ?? '');

  // ── Catálogos ──────────────────────────────────────────────────────────────
  // Un useCollection por colección del mapa, en posiciones FIJAS (nunca dentro de
  // un .map() sobre el descriptor: rompería las rules-of-hooks).
  const { options: cllCountry } = useCollection(QD_COLLECTIONS.countryCode);
  const { options: cllDepartment } = useCollection(QD_COLLECTIONS.department);
  const { options: cllCity } = useCollection(QD_COLLECTIONS.city, { [QD.strDepartment]: val(QD.strDepartment) });
  const { options: cllChannel } = useCollection(QD_COLLECTIONS.channel);
  const { options: cllIdType } = useCollection(QD_COLLECTIONS.idType);
  const { options: cllPersonType } = useCollection(QD_COLLECTIONS.personType);
  const { options: cllReceptionInstance } = useCollection(QD_COLLECTIONS.receptionInstance);
  const { options: cllReceptionPoint } = useCollection(QD_COLLECTIONS.receptionPoint);
  const { options: cllAdmission } = useCollection(QD_COLLECTIONS.admission);
  const { options: cllControlEntity } = useCollection(QD_COLLECTIONS.controlEntity);

  // Producto SFC + cascada del motivo (producto → momento → servicio → motivo).
  const matriz = useMatrizMotivos(form);

  // Variables compañeras <campo>_desc (convención del proyecto). El _desc del motivo
  // lo sincroniza el hook; el del producto va en onPickerChange (códigos duplicados
  // en la colección 16).
  useSyncDesc(form, QD.strCountryCode, cllCountry);
  useSyncDesc(form, QD.strDepartment, cllDepartment);
  useSyncDesc(form, QD.strCity, cllCity);
  useSyncDesc(form, QD.strChannel, cllChannel);
  useSyncDesc(form, QD.strIdType, cllIdType);
  useSyncDesc(form, QD.strPersonType, cllPersonType);
  useSyncDesc(form, QD.strReceptionInstance, cllReceptionInstance);
  useSyncDesc(form, QD.strReceptionPoint, cllReceptionPoint);
  useSyncDesc(form, QD.strAdmission, cllAdmission);
  useSyncDesc(form, QD.strControlEntity, cllControlEntity);

  const dicOptions: Record<string, CollectionOption[]> = {
    countryCode: cllCountry, department: cllDepartment, city: cllCity, channel: cllChannel,
    idType: cllIdType, personType: cllPersonType, receptionInstance: cllReceptionInstance,
    receptionPoint: cllReceptionPoint, admission: cllAdmission, controlEntity: cllControlEntity,
  };

  // ── Guardas de dependencia ────────────────────────────────────────────────
  // Solo actúan si el gestor ya marcó el campo de arriba como editable: así no se
  // vacía un valor precargado mientras el catálogo aún está cargando.
  const blnDeptTocado = !!editables[QD.strDepartment];
  const blnProductoTocado = !!editables[QD.strSfcProduct];
  const blnCascadaTocada = blnProductoTocado || !!editables[QD.strInteraction]
    || !!editables[QD.strServiceProvided];

  const limpiarSiFuera = (
    in_strField: string, in_cllOptions: CollectionOption[], in_blnActivo: boolean,
  ) => {
    if (!in_blnActivo || in_cllOptions.length === 0) return;
    const strValue = val(in_strField);
    if (!strValue || in_cllOptions.some((o) => o.value === strValue)) return;
    setValue(in_strField as FieldPath<Form>, '' as never);
    onEditable(in_strField, true); // hay que re-elegirlo: se deja editable
  };

  useEffect(() => {
    limpiarSiFuera(QD.strCity, cllCity, blnDeptTocado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cllCity, blnDeptTocado]);

  useEffect(() => {
    limpiarSiFuera(QD.strInteraction, matriz.cllInteraction, blnProductoTocado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matriz.cllInteraction, blnProductoTocado]);

  useEffect(() => {
    if (!blnCascadaTocada) return;
    // Fuera de "Asistencias" el servicio no aplica.
    if (!matriz.blnIsAsistencias) {
      if (val(QD.strServiceProvided)) setValue(QD.strServiceProvided, '' as never);
      return;
    }
    limpiarSiFuera(QD.strServiceProvided, matriz.cllService, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matriz.cllService, matriz.blnIsAsistencias, blnCascadaTocada]);

  useEffect(() => {
    limpiarSiFuera(QD.strSfcReason, matriz.cllReason, blnCascadaTocada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matriz.cllReason, blnCascadaTocada]);

  // ── Render de una fila ────────────────────────────────────────────────────
  const err = (in_strField: string): string | undefined =>
    (errors as Record<string, { message?: string } | undefined>)[in_strField]?.message;

  const renderControl = (in_objDef: PayloadFieldDef) => {
    const strVar = in_objDef.variable as string;
    const strName = strVar as FieldPath<Form>;
    const blnEdit = !!editables[strVar];

    // Producto SFC: la colección 16 repite códigos, así que el picker usa values de
    // UI desambiguados y el form sigue guardando el código puro.
    if (in_objDef.variable === QD.strSfcProduct) {
      return (
        <ZdsSelect
          name={strName} control={control} label={in_objDef.label}
          options={matriz.cllInsuranceUi} disabled={!blnEdit} withSearch error={err(strVar)}
          toPickerValue={() => matriz.strInsuranceUiValue}
          fromPickerValue={codeFromUiValue}
          onPickerChange={matriz.syncProductDesc}
        />
      );
    }

    if (in_objDef.control === 'select') {
      const cllOpts = in_objDef.cascade
        ? (in_objDef.variable === QD.strInteraction ? matriz.cllInteraction
          : in_objDef.variable === QD.strServiceProvided ? matriz.cllService
            : matriz.cllReason)
        : (dicOptions[in_objDef.collection ?? ''] ?? []);
      return (
        <ZdsSelect
          name={strName} control={control} label={in_objDef.label}
          options={cllOpts} disabled={!blnEdit} withSearch error={err(strVar)}
        />
      );
    }

    if (in_objDef.control === 'sino') {
      return (
        <ZdsRadio
          name={strName} control={control} label={in_objDef.label}
          options={OPTIONS_SI_NO} inline disabled={!blnEdit} error={err(strVar)}
        />
      );
    }

    if (in_objDef.control === 'textarea') {
      return (
        <ZdsTextarea
          name={strName} control={control} label={in_objDef.label}
          readOnly={!blnEdit} maxLength={4000} error={err(strVar)}
        />
      );
    }

    // text | digits | date — validación tolerante con vacío (ningún campo del
    // payload es obligatorio en esta pantalla; el bloqueo es del script/SFC).
    const dicRules: Rules | undefined = in_objDef.control === 'digits'
      ? { validate: (in_gen: unknown) => !in_gen || /^\d+$/.test(String(in_gen)) || 'Solo dígitos, sin espacios ni separadores' }
      : in_objDef.control === 'date'
        ? { validate: (in_gen: unknown) => !in_gen || /^\d{2}\/\d{2}\/\d{4}$/.test(String(in_gen)) || 'Formato esperado: DD/MM/AAAA' }
        : undefined;
    return (
      <ZdsInput
        name={strName} control={control} label={in_objDef.label}
        readOnly={!blnEdit} error={err(strVar)} rules={dicRules}
      />
    );
  };

  // Descripción legible del valor actual (para el resumen de la fila).
  const descActual = (in_objDef: PayloadFieldDef): string => {
    const strCode = val(in_objDef.variable as string);
    if (in_objDef.variable === QD.strSfcProduct) return descOf(matriz.cllInsurance, strCode);
    if (in_objDef.cascade) {
      // Momento y servicio guardan el TEXTO de la matriz, no un código.
      return in_objDef.variable === QD.strSfcReason ? descOf(matriz.cllReason, strCode) : (strCode || '—');
    }
    if (in_objDef.control === 'select') return descOf(dicOptions[in_objDef.collection ?? ''] ?? [], strCode);
    return strCode || '—';
  };

  return (
    <FormSection title="Campos a Corregir">
      <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
        Marque <strong>Editar</strong> en el campo que quiere corregir. Cada fila muestra la clave
        del body de la SFC y la <strong>variable del caso</strong> de la que el script la lee; al
        reenviar, el body se <strong>regenera</strong> con los valores nuevos.
      </ZrAlert>

      <div {...({ 'z-flex': 'col:150' } as object)}>
        {SCR003_PAYLOAD_M2_FIELDS.map((objDef, intIdx) => {
          const strVar = objDef.variable as string | null;

          // Constantes del CORE / valores derivados: solo lectura, sin checkbox.
          if (!strVar) {
            return (
              <div key={`${objDef.key}-${intIdx}`} className="zds-field-wrap">
                <span className="info-bar-label">{objDef.label}</span>
                <div className="info-bar-value">{fmtPayload(payloadEnviado?.[objDef.key])}</div>
                <span className="field-hint">{objDef.key} · {objDef.note}</span>
              </div>
            );
          }

          const strOriginal = originales[strVar] ?? '';
          const blnChanged = val(strVar) !== strOriginal;

          return (
            <div key={`${objDef.key}-${strVar}`} {...({ 'z-flex': 'col:50' } as object)}>
              <div className="form-row cols-2 row-align-bottom">
                {renderControl(objDef)}
                <div {...({ 'z-flex': '75', 'z-align': 'left:center' } as object)}>
                  <ZrCheckbox
                    id={`edit-${strVar}`}
                    name={`edit-${strVar}`}
                    model={!!editables[strVar]}
                    label="Editar"
                    onChange={(in_genOn: boolean | null) => {
                      const blnOn = !!in_genOn;
                      onEditable(strVar, blnOn);
                      // Desmarcar restaura el valor original: "sin marcar" = "sin tocar".
                      if (!blnOn) setValue(strVar as FieldPath<Form>, strOriginal as never);
                      // Al marcar, las filas aguas abajo también quedan editables (cambiar
                      // producto o departamento invalida la selección que dependía de él).
                      if (blnOn) (objDef.unlocks ?? []).forEach((strDown) => onEditable(strDown, true));
                    }}
                  />
                  {blnChanged && <ZdsStatusBadge variant="info">Modificado</ZdsStatusBadge>}
                  {esSenalado(senalado, objDef, strVar) && (
                    <ZdsStatusBadge variant="danger">Señalado por la SFC</ZdsStatusBadge>
                  )}
                </div>
              </div>
              <span className="field-hint">
                {objDef.aux ? 'auxiliar (no viaja en el body)' : objDef.key} · <code>{strVar}</code>
                {' '}· valor actual: {descActual(objDef)}
                {blnChanged && <> · original: {strOriginal || '(vacío)'}</>}
                {objDef.note && <> — {objDef.note}</>}
              </span>
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}
