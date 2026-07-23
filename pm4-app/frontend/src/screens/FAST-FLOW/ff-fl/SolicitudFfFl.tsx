import { useEffect, useState, useMemo, useRef } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useForm, FieldError } from 'react-hook-form';
import { useTask } from '../../../core/useTask';
import { scrollToFirstError } from '../../../core/scrollToFirstError';
import pm4 from '../../../api/pm4Client';
import { useCollection } from '../../../core/useCollection';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import CreacionTomador from './CreacionTomador';
import SeccionProductos from './SeccionProductos';
import SeccionResumenCotizacion from './SeccionResumenCotizacion';
import { useQuoter, quoterResultToPayload, type QuoterInputs } from '../../../core/useCotizador';
import { ZdsInput, ZdsDate, ZdsCheckboxField, ZdsSelect, ZrButton, ZrAlert, ZrTable, ZrFieldset, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import {
  OPTIONS, COLLECTION_DEFS, DEPARTAMENTOS, CIUDADES_POR_DEPTO,
  FfFlSolicitudFormData, CONSULTAR_CLIENTE_SCRIPT_ID, parseClienteTia,
} from './variables';

// Construimos el mensaje de error visible según el estado del campo
function fieldError(
  in_objErr: FieldError | undefined,
  in_objValue: unknown,
  isSubmitted: boolean
): string | undefined {
  if (!in_objErr) return undefined;
  const blnEmpty = in_objValue === '' || in_objValue === null || in_objValue === undefined;
  if (in_objErr.type === 'required' && blnEmpty) return isSubmitted ? String(in_objErr.message) : undefined;
  return String(in_objErr.message);
}

// ---------------------------------------------------------------------------
// Sección: Información general
// ---------------------------------------------------------------------------
function InfoGeneral({
  form,
  productError,
}: {
  form: ReturnType<typeof useForm<FfFlSolicitudFormData>>;
  productError: string;
}) {
  const { control, formState: { errors, isSubmitted }, watch } = form;
  const objWatch = watch();
  const { options: cllIntermediarios, loading: blnLoadingInt } = useCollection(COLLECTION_DEFS.intermediarios);
  const fe = (in_strName: keyof FfFlSolicitudFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);
  // Marcamos si la operación es una renovación
  const blnIsRenewal = objWatch.frm_gen_nueva_renovacion === 'RENOVACION';
  // Detectamos si solo se eligió Crimen Comercial (no cotizable en solitario)
  const blnOnlyCC = objWatch.frm_gen_prod_cc && !objWatch.frm_gen_prod_dyo && !objWatch.frm_gen_prod_pdysi && !objWatch.frm_gen_prod_pi;

  const PRODUCTOS = [
    ['frm_gen_prod_dyo', 'Directores y Administradores (D&O)'],
    ['frm_gen_prod_cc', 'Crimen Comercial'],
    ['frm_gen_prod_pdysi', 'Protección de Datos y Seguridad Informática'],
    ['frm_gen_prod_pi', 'Seguro de Responsabilidad Civil Profesional'],
  ] as const;

  return (
    <FormSection title="Información General">

      <div className="form-row cols-3">
        <ZdsSelect
          label="Sucursal"
          name="frm_gen_sucursal"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.sucursal}
          required
          error={fe('frm_gen_sucursal')}
        />
        <ZdsDate control={control} name="frm_gen_fecha_solicitud" label="Fecha de solicitud" readOnly />
        <ZdsInput control={control} name="frm_gen_usuario" label="Usuario" readOnly />
      </div>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_gen_segmento" label="Segmento" readOnly />
        <ZdsInput control={control} name="frm_gen_linea_negocio" label="Línea de negocio" readOnly />
        <ZdsInput control={control} name="frm_gen_tipo_produccion" label="Tipo de producción" readOnly />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          control={control}
          name="frm_gen_canal_comercial"
          label="Canal comercial"
          readOnly
          helpText="Se asigna automáticamente según el intermediario"
        />
        <ZdsInput
          control={control}
          name="frm_gen_comercial"
          label="Comercial"
          rules={{ required: 'Campo requerido' }}
          required
          error={fe('frm_gen_comercial')}
        />
      </div>

      {/* Productos a cotizar */}
      <ZrFieldset>
        <span slot="legend"><span className="required-star">* </span>Producto(s) a cotizar</span>
        <div>
          {/* Pintamos un checkbox por cada producto disponible */}
          <div className="checkbox-grid">
            {PRODUCTOS.map(([strFieldName, strLabel]) => (
              <ZdsCheckboxField key={strFieldName} control={control} name={strFieldName} label={strLabel} />
            ))}
          </div>
          {productError && <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>{productError}</ZrAlert>}
          {blnOnlyCC && !productError && (
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              El seguro de Crimen Comercial solo puede cotizarse junto con otro producto. Si solo requiere este producto, la cotización no puede continuar por este canal y deberá gestionarse con la ayuda del asesor comercial.
            </ZrAlert>
          )}
        </div>
      </ZrFieldset>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_gen_tipo_negocio" label="Tipo de negocio" readOnly />
        <ZdsSelect
          label="Nueva / Renovación"
          name="frm_gen_nueva_renovacion"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={OPTIONS.nuevaRenovacion}
          required
          error={fe('frm_gen_nueva_renovacion')}
        />
        <ZdsInput
          control={control}
          name="frm_gen_nro_poliza"
          label="Nro. de póliza actual"
          rules={{
            required: blnIsRenewal ? 'Campo requerido para renovaciones' : false,
            minLength: { value: 4, message: 'Mínimo 4 caracteres' },
            maxLength: { value: 16, message: 'Máximo 16 caracteres' },
            pattern: { value: /^[a-zA-Z0-9\-]+$/, message: 'Solo letras, números y guiones' },
          }}
          required={blnIsRenewal}
          error={fe('frm_gen_nro_poliza')}
        />
      </div>

      <div className="form-row cols-2">
        <ZdsSelect
          label="Intermediario"
          name="frm_gen_intermediario"
          control={control}
          options={cllIntermediarios}
          loading={blnLoadingInt}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={fe('frm_gen_intermediario')}
        />
        <ZdsInput
          control={control}
          name="frm_gen_correo_intermediario"
          label="Correo del intermediario"
          rules={{
            required: 'Campo requerido',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
            maxLength: { value: 254, message: 'Máximo 254 caracteres' },
          }}
          inputType="email"
          required
          error={fe('frm_gen_correo_intermediario')}
        />
      </div>

      <div className="additional-emails">
        <div className="additional-emails-header">Correos adicionales (máximo 3)</div>
        <div className="form-row cols-3">
          {/* Pintamos los tres campos de correo adicional */}
          {(['frm_gen_correo_adicional_1', 'frm_gen_correo_adicional_2', 'frm_gen_correo_adicional_3'] as const).map((strName, i) => (
            <ZdsInput
              key={strName}
              control={control}
              name={strName}
              label={`Correo adicional ${i + 1}`}
              rules={{
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                maxLength: { value: 254, message: 'Máximo 254 caracteres' },
              }}
              inputType="email"
              error={fe(strName)}
            />
          ))}
        </div>
      </div>

    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Información del tomador + Actividades aseguradas
// ---------------------------------------------------------------------------
function InfoTomador({
  form,
  onConsultarNIT,
  nitLoading,
  nitNotFound,
  nitConfirmCreate,
  onConfirmCreate,
  onCancelCreate,
  tiaFilledFields,
}: {
  form: ReturnType<typeof useForm<FfFlSolicitudFormData>>;
  onConsultarNIT: () => void;
  nitLoading: boolean;
  nitNotFound: boolean;
  nitConfirmCreate: boolean;
  onConfirmCreate: () => void;
  onCancelCreate: () => void;
  tiaFilledFields: Set<string>;
}) {
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const objWatch = watch();
  const fe = (in_strName: keyof FfFlSolicitudFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);
  const fromTia = (in_strField: keyof FfFlSolicitudFormData) => tiaFilledFields.has(in_strField);

  // Calculamos las ciudades disponibles según el departamento del tomador
  const lstCities = useMemo(() => CIUDADES_POR_DEPTO[objWatch.frm_tom_departamento ?? ''] ?? [], [objWatch.frm_tom_departamento]);
  // Reiniciamos la ciudad cada vez que cambia el departamento
  useEffect(() => { setValue('frm_tom_ciudad', ''); }, [objWatch.frm_tom_departamento, setValue]);

  // Cargamos los catálogos de actividades CIIU solo de los productos seleccionados
  const { options: cllActDyo,   loading: blnLoadDyo,   rawMap: dicRawDyo   } = useCollection(objWatch.frm_gen_prod_dyo   ? COLLECTION_DEFS.actividadesCIIU_dyo   : null);
  const { options: cllActCc,    loading: blnLoadCc,    rawMap: dicRawCc    } = useCollection(objWatch.frm_gen_prod_cc    ? COLLECTION_DEFS.actividadesCIIU_cc    : null);
  const { options: cllActPdysi, loading: blnLoadPdysi, rawMap: dicRawPdysi } = useCollection(objWatch.frm_gen_prod_pdysi ? COLLECTION_DEFS.actividadesCIIU_pdysi : null);
  const { options: cllActPi,    loading: blnLoadPi,    rawMap: dicRawPi    } = useCollection(objWatch.frm_gen_prod_pi    ? COLLECTION_DEFS.actividadesCIIU_pi    : null);

  // Auto-rellena CIIU y NAIC cuando el usuario elige una actividad
  useEffect(() => {
    const lstPairs = [
      { act: objWatch.frm_act_dyo_actividad,   ciu: 'frm_act_dyo_cod_ciiu'   as const, naic: 'frm_act_dyo_cod_naic'   as const, rawMap: dicRawDyo   },
      { act: objWatch.frm_act_cc_actividad,    ciu: 'frm_act_cc_cod_ciiu'    as const, naic: 'frm_act_cc_cod_naic'    as const, rawMap: dicRawCc    },
      { act: objWatch.frm_act_pdysi_actividad, ciu: 'frm_act_pdysi_cod_ciiu' as const, naic: 'frm_act_pdysi_cod_naic' as const, rawMap: dicRawPdysi },
      { act: objWatch.frm_act_pi_actividad,    ciu: 'frm_act_pi_cod_ciiu'    as const, naic: 'frm_act_pi_cod_naic'    as const, rawMap: dicRawPi    },
    ];
    for (const { act, ciu, naic, rawMap } of lstPairs) {
      if (!act) continue;
      const objRec = rawMap[act] as { data?: Record<string, unknown> } | undefined;
      if (!objRec) continue;
      const objData = objRec.data ?? {};
      setValue(ciu,  String(objData.frm_ciiu  ?? objData.frm_codigo_ciiu  ?? objData.frm_codigo ?? ''));
      setValue(naic, String(objData.frm_naic  ?? objData.frm_codigo_naic  ?? objData.frm_codigo ?? ''));
    }
  }, [
    objWatch.frm_act_dyo_actividad, objWatch.frm_act_cc_actividad,
    objWatch.frm_act_pdysi_actividad, objWatch.frm_act_pi_actividad,
    dicRawDyo, dicRawCc, dicRawPdysi, dicRawPi, setValue,
  ]);

  // Armamos las filas de actividades aseguradas por producto activo
  const lstActRows = [
    objWatch.frm_gen_prod_dyo   ? { prod: 'D&O',             actField: 'frm_act_dyo_actividad'   as const, ciuField: 'frm_act_dyo_cod_ciiu'   as const, naicField: 'frm_act_dyo_cod_naic'   as const, options: cllActDyo,   loading: blnLoadDyo   } : null,
    objWatch.frm_gen_prod_cc    ? { prod: 'Crimen Comercial', actField: 'frm_act_cc_actividad'    as const, ciuField: 'frm_act_cc_cod_ciiu'    as const, naicField: 'frm_act_cc_cod_naic'    as const, options: cllActCc,    loading: blnLoadCc    } : null,
    objWatch.frm_gen_prod_pdysi ? { prod: 'PDySI',            actField: 'frm_act_pdysi_actividad' as const, ciuField: 'frm_act_pdysi_cod_ciiu' as const, naicField: 'frm_act_pdysi_cod_naic' as const, options: cllActPdysi, loading: blnLoadPdysi } : null,
    objWatch.frm_gen_prod_pi    ? { prod: 'Seg. Profesional', actField: 'frm_act_pi_actividad'    as const, ciuField: 'frm_act_pi_cod_ciiu'    as const, naicField: 'frm_act_pi_cod_naic'    as const, options: cllActPi,    loading: blnLoadPi    } : null,
  ].filter((objRow): objRow is NonNullable<typeof objRow> => objRow !== null);

  return (
    <FormSection title="Información del Tomador">

      <div className="form-row cols-3">
        <ZdsInput
          control={control}
          name="frm_tom_nit"
          label="NIT"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 7, message: 'Mínimo 7 dígitos' },
            maxLength: { value: 10, message: 'Máximo 10 dígitos' },
            pattern: { value: /^\d+$/, message: 'Solo dígitos, sin separador' },
          }}
          required
          error={fe('frm_tom_nit')}
          helpText="9 dígitos + dígito verificador"
        />
        <ZdsInput control={control} name="frm_tom_tomador" label="Tomador" readOnly={fromTia('frm_tom_tomador')} helpText={fromTia('frm_tom_tomador') ? 'Dato de TIA' : undefined} />
        <div className="zds-field-wrap">
          <ZrButton
            config="secondary"
            icon="search:line"
            disabled={nitLoading}
            loading={nitLoading}
            onClick={onConsultarNIT}
          >
            {nitLoading ? 'Consultando…' : 'Consultar TIA'}
          </ZrButton>
        </div>
      </div>

      <div className="form-row cols-3">
        <ZdsInput control={control} name="frm_tom_direccion" label="Dirección" readOnly={fromTia('frm_tom_direccion')} helpText={fromTia('frm_tom_direccion') ? 'Dato de TIA' : undefined} />
        <ZdsSelect
          label="Departamento"
          name="frm_tom_departamento"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={[...DEPARTAMENTOS]}
          required
          error={fe('frm_tom_departamento')}
        />
        <ZdsSelect
          label="Ciudad"
          name="frm_tom_ciudad"
          control={control}
          rules={{ required: 'Campo requerido' }}
          options={lstCities}
          placeholder={objWatch.frm_tom_departamento ? 'Seleccione...' : 'Seleccione departamento primero'}
          required
          error={fe('frm_tom_ciudad')}
        />
      </div>

      <div className="form-row cols-3">
        <ZdsInput
          control={control}
          name="frm_tom_correo_facturacion"
          label="Correo para facturación"
          rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } }}
          inputType="email"
          helpText="Dato de TIA (editable)"
          error={fe('frm_tom_correo_facturacion')}
        />
        {objWatch.frm_gen_prod_dyo && (
          <ZdsSelect
            label="Sector"
            name="frm_tom_sector"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.sector}
            required
            error={fe('frm_tom_sector')}
          />
        )}
        <ZdsInput
          control={control}
          name="frm_tom_detalle_actividad"
          label="Detalle actividad empresarial"
          rules={{
            required: 'Campo requerido',
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          }}
          required
          error={fe('frm_tom_detalle_actividad')}
        />
      </div>

      {/* Mostramos la tabla de actividades aseguradas si hay productos activos */}
      {lstActRows.length > 0 && (
        <div className="form-subsection">
          <div className="form-subsection-title">Actividades aseguradas</div>
          <ZrTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Producto</th>
                  <th>Actividad asegurada</th>
                  <th style={{ width: 140 }}>Cód. CIIU</th>
                </tr>
              </thead>
              <tbody>
                {lstActRows.map(({ prod, actField, ciuField, naicField, options, loading }) => (
                  <tr key={prod}>
                    <td className="activities-product-label">{prod}</td>
                    <td>
                      <ZdsSelect
                        label=""
                        name={actField}
                        control={control}
                        rules={{ required: 'Requerido' }}
                        options={options}
                        loading={loading}
                        withSearch
                        error={fe(actField)}
                      />
                      <input type="hidden" {...register(naicField)} />
                    </td>
                    <td>
                      <ZdsInput control={control} name={ciuField} label="" readOnly />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ZrTable>
        </div>
      )}

      {/* Pedimos confirmación para crear el tomador cuando el NIT no está en TIA */}
      {nitConfirmCreate && (
        <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
          El NIT ingresado no fue encontrado en TIA. ¿Desea crear un nuevo cliente con los datos que va a ingresar?
          <div {...({ 'z-flex': '75' } as object)} style={{ flexWrap: 'wrap', marginTop: 'var(--zs-75)' }}>
            <ZrButton config="primary" icon="check:line" onClick={onConfirmCreate}>
              Sí, crear nuevo cliente
            </ZrButton>
            <ZrButton config="secondary" onClick={onCancelCreate}>
              Cancelar
            </ZrButton>
          </div>
        </ZrAlert>
      )}

      {nitNotFound && (
        <>
          <div className="section-spacer" />
          <CreacionTomador form={form} />
        </>
      )}

    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Datos de la cotización
// ---------------------------------------------------------------------------
function DatosCotizacion({ form }: { form: ReturnType<typeof useForm<FfFlSolicitudFormData>> }) {
  const { register, control, formState: { errors, isSubmitted }, watch, setValue } = form;
  const objWatch = watch();
  const fe = (in_strName: keyof FfFlSolicitudFormData) =>
    fieldError(errors[in_strName] as FieldError | undefined, objWatch[in_strName], isSubmitted);

  // Al elegir inicio de vigencia calculamos fin de vigencia y días automáticamente
  useEffect(() => {
    if (!objWatch.frm_cot_inicio_vigencia) return;
    const datStart = new Date(objWatch.frm_cot_inicio_vigencia);
    datStart.setFullYear(datStart.getFullYear() + 1);
    datStart.setDate(datStart.getDate() - 1);
    setValue('frm_cot_fin_vigencia', datStart.toISOString().split('T')[0]);
    setValue('frm_cot_dias', 365);
  }, [objWatch.frm_cot_inicio_vigencia, setValue]);

  // Fijamos la modalidad de cobertura por defecto de cada producto seleccionado
  useEffect(() => {
    if (objWatch.frm_gen_prod_dyo) setValue('frm_cot_modalidad_dyo', 'Por reclamación (claims made)');
    if (objWatch.frm_gen_prod_cc) setValue('frm_cot_modalidad_cc', 'Descubrimiento');
    if (objWatch.frm_gen_prod_pdysi) setValue('frm_cot_modalidad_pdysi', 'Por reclamación (claims made)');
    if (objWatch.frm_gen_prod_pi) setValue('frm_cot_modalidad_pi', 'Por reclamación (claims made)');
  }, [objWatch.frm_gen_prod_dyo, objWatch.frm_gen_prod_cc, objWatch.frm_gen_prod_pdysi, objWatch.frm_gen_prod_pi, setValue]);

  const blnHasProducts = objWatch.frm_gen_prod_dyo || objWatch.frm_gen_prod_cc || objWatch.frm_gen_prod_pdysi || objWatch.frm_gen_prod_pi;

  return (
    <FormSection title="Datos de la Cotización">

      <div className="form-row cols-4">
        <ZdsDate
          control={control}
          name="frm_cot_inicio_vigencia"
          label="Inicio de vigencia"
          rules={{ required: 'Campo requerido' }}
          required
          helpText="a las 00:00 horas"
          error={fe('frm_cot_inicio_vigencia')}
        />
        <ZdsDate control={control} name="frm_cot_fin_vigencia" label="Fin de vigencia" readOnly helpText="a las 24:00 horas" />
        <ZdsInput control={control} name="frm_cot_dias" label="Días" readOnly />
        <ZdsInput control={control} name="frm_cot_moneda" label="Moneda" readOnly />
      </div>

      <div className="form-row cols-2">
        <ZdsInput control={control} name="frm_cot_comision" label="Comisión (%)" readOnly helpText="20% por defecto" />
        <ZdsInput control={control} name="frm_cot_soporte_ofrecido" label="Soporte ofrecido (%)" readOnly helpText="100% por defecto" />
      </div>

      {/* Campos ocultos con la modalidad de cada producto */}
      <input type="hidden" {...register('frm_cot_modalidad_dyo')} />
      <input type="hidden" {...register('frm_cot_modalidad_cc')} />
      <input type="hidden" {...register('frm_cot_modalidad_pdysi')} />
      <input type="hidden" {...register('frm_cot_modalidad_pi')} />

      {objWatch.frm_gen_prod_cc && (
        <div className="form-row cols-2" style={{ padding: '0 var(--zs-200) var(--zs-100)' }}>
          <ZdsSelect
            label="Número de empleados"
            name="frm_cot_num_empleados"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.numEmpleados}
            required
            error={fe('frm_cot_num_empleados')}
          />
          <ZdsSelect
            label="Número de predios"
            name="frm_cot_num_predios"
            control={control}
            rules={{ required: 'Campo requerido' }}
            options={OPTIONS.numPredios}
            required
            error={fe('frm_cot_num_predios')}
          />
        </div>
      )}

      {/* Facturación anual: un selector por cada producto seleccionado */}
      {blnHasProducts && (
        <div className="form-group form-group--billing">
          <div className="form-label"><span className="required-star">* </span>Facturación total anual (COP)</div>
          <div className="billing-grid">
            {objWatch.frm_gen_prod_dyo && (
              <div className="billing-block">
                <div className="billing-block-label">Directores y Administradores</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_dyo" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionDyO} error={fe('frm_cot_fact_anual_dyo')} />
              </div>
            )}
            {objWatch.frm_gen_prod_cc && (
              <div className="billing-block">
                <div className="billing-block-label">Crimen Comercial</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_cc" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionCC} error={fe('frm_cot_fact_anual_cc')} />
              </div>
            )}
            {objWatch.frm_gen_prod_pdysi && (
              <div className="billing-block">
                <div className="billing-block-label">Protección de Datos y SI</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_pdysi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPDySI} error={fe('frm_cot_fact_anual_pdysi')} />
              </div>
            )}
            {objWatch.frm_gen_prod_pi && (
              <div className="billing-block">
                <div className="billing-block-label">Seguro Profesional</div>
                <ZdsSelect label="" name="frm_cot_fact_anual_pi" control={control} rules={{ required: 'Campo requerido' }} options={OPTIONS.facturacionPI} error={fe('frm_cot_fact_anual_pi')} />
              </div>
            )}
          </div>
        </div>
      )}

    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Sección: Plan de pago
// ---------------------------------------------------------------------------
function PlanPago({ form }: { form: ReturnType<typeof useForm<FfFlSolicitudFormData>> }) {
  const { control } = form;
  return (
    <FormSection title="Plan de Pago">

      <div className="form-row cols-2">
        <ZdsSelect label="Plan de pago" name="frm_plan_plan_pago" control={control} options={OPTIONS.planPago} />
        <ZdsInput control={control} name="frm_plan_num_cuotas" label="Número de cuotas" readOnly helpText="1 cuota por defecto" />
      </div>
      <div className="form-row cols-2">
        <ZdsSelect label="Medio de pago" name="frm_plan_medio_pago" control={control} options={OPTIONS.medioPago} />
        <ZdsInput control={control} name="frm_plan_frecuencia_cobro" label="Frecuencia de cobro" readOnly helpText="Anual por defecto" />
      </div>

    </FormSection>
  );
}

const MSG_CASE_UW =
  'Esta oportunidad no puede cotizarse con este flujo y deberá ser revisada por el área de Suscripción. ' +
  'Por favor genera la solicitud correspondiente en JIRA, proporcionando el cuestionario de seguro ' +
  'debidamente diligenciado, fechado, firmado y acompañado de los Estados Financieros auditados para ' +
  'los dos últimos periodos contables con sus respectivas notas.';

const TIPOS_EMPRESA_BLOQUEADOS = new Set(['ESTATAL', 'ENTIDAD_PUBLICA', 'EXTRANJERA']);

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SolicitudFfFl() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [strProductError, setStrProductError] = useState('');
  const [strSubmitError, setStrSubmitError] = useState('');
  const [blnSent, setBlnSent] = useState(false);
  const [blnNitLoading, setBlnNitLoading] = useState(false);
  const [blnNitNotFound, setBlnNitNotFound] = useState(false);
  const [blnNitConfirmCreate, setBlnNitConfirmCreate] = useState(false);
  const [objTiaFields, setObjTiaFields] = useState<Set<string>>(new Set());
  const dicFileRegistry = useRef(new Map<string, File>());

  const form = useForm<FfFlSolicitudFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      frm_gen_fecha_solicitud: new Date().toISOString().split('T')[0],
      frm_gen_segmento: 'Middle Market',
      frm_gen_linea_negocio: 'Líneas Financieras',
      frm_gen_tipo_produccion: 'Fast Flow',
      frm_gen_tipo_negocio: 'Directo',
      frm_gen_prod_dyo: false,
      frm_gen_prod_cc: false,
      frm_gen_prod_pdysi: false,
      frm_gen_prod_pi: false,
      frm_cot_dias: 365,
      frm_cot_moneda: 'COP',
      frm_cot_comision: 20,
      frm_cot_soporte_ofrecido: 100,
      frm_plan_plan_pago: '102',
      frm_plan_num_cuotas: '1 cuota',
      frm_plan_medio_pago: 'TRANSFERENCIA_PESOS',
      frm_plan_frecuencia_cobro: 'Anual',
      frm_cre_tipo_doc: 'NIT',
      frm_cre_estado_tercero: 'Activo',
    },
  });

  // Pre-poblamos el formulario con los datos que llegan de PM4
  useEffect(() => {
    if (!task?.data) return;
    const objData = task.data as Partial<FfFlSolicitudFormData>;
    Object.entries(objData).forEach(([strKey, objVal]) => {
      if (objVal !== null && objVal !== undefined) {
        form.setValue(strKey as keyof FfFlSolicitudFormData, objVal as never);
      }
    });
  }, [task, form]);

  const objWatch = form.watch();

  // Construimos las entradas para el cotizador según los productos y valores elegidos
  const objQuoterInputs = useMemo((): QuoterInputs | null => {
    const blnHasDyo   = Boolean(objWatch.frm_gen_prod_dyo);
    const blnHasCc    = Boolean(objWatch.frm_gen_prod_cc);
    const blnHasPdysi = Boolean(objWatch.frm_gen_prod_pdysi);
    const blnHasPi    = Boolean(objWatch.frm_gen_prod_pi);
    if (!blnHasDyo && !blnHasCc && !blnHasPdysi && !blnHasPi) return null;

    const objInputs: QuoterInputs = {};

    if (blnHasDyo && objWatch.frm_cot_fact_anual_dyo) {
      objInputs.dyo = {
        facturacion: objWatch.frm_cot_fact_anual_dyo,
        limite1:     objWatch.frm_dyo_prop_01_limite ?? 0,
        limite2:     objWatch.frm_dyo_prop_02_limite ?? 0,
        limite3:     objWatch.frm_dyo_prop_03_limite ?? 0,
        anexo:       objWatch.frm_tom_sector === 'OTROS',
        sector:      objWatch.frm_tom_sector ?? 'OTROS',
      };
    }

    if (blnHasCc && objWatch.frm_cot_fact_anual_cc) {
      objInputs.cc = {
        facturacion:       objWatch.frm_cot_fact_anual_cc,
        limite1_evento:    objWatch.frm_cc_prop_01_evento   ?? 0,
        limite2_evento:    objWatch.frm_cc_prop_02_evento   ?? 0,
        limite3_evento:    objWatch.frm_cc_prop_03_evento   ?? 0,
        limite1_agregado:  objWatch.frm_cc_prop_01_agregado ?? 0,
        limite2_agregado:  objWatch.frm_cc_prop_02_agregado ?? 0,
        limite3_agregado:  objWatch.frm_cc_prop_03_agregado ?? 0,
        empleados:         objWatch.frm_cot_num_empleados   ?? '1-100',
      };
    }

    if (blnHasPdysi && objWatch.frm_cot_fact_anual_pdysi) {
      objInputs.pdysi = {
        facturacion: objWatch.frm_cot_fact_anual_pdysi,
        limite1:     objWatch.frm_pdysi_prop_01_limite ?? 0,
        limite2:     objWatch.frm_pdysi_prop_02_limite ?? 0,
        limite3:     objWatch.frm_pdysi_prop_03_limite ?? 0,
      };
    }

    if (blnHasPi && objWatch.frm_cot_fact_anual_pi) {
      objInputs.pi = {
        facturacion: objWatch.frm_cot_fact_anual_pi,
        limite1:     objWatch.frm_pi_prop_01_limite ?? 0,
        limite2:     objWatch.frm_pi_prop_02_limite ?? 0,
        limite3:     objWatch.frm_pi_prop_03_limite ?? 0,
        actividad:   objWatch.frm_act_pi_actividad  ?? '',
      };
    }

    return objInputs;
  }, [
    objWatch.frm_gen_prod_dyo, objWatch.frm_gen_prod_cc, objWatch.frm_gen_prod_pdysi, objWatch.frm_gen_prod_pi,
    objWatch.frm_cot_fact_anual_dyo, objWatch.frm_dyo_prop_01_limite, objWatch.frm_dyo_prop_02_limite, objWatch.frm_dyo_prop_03_limite,
    objWatch.frm_tom_sector,
    objWatch.frm_cot_fact_anual_cc, objWatch.frm_cc_prop_01_evento, objWatch.frm_cc_prop_02_evento, objWatch.frm_cc_prop_03_evento,
    objWatch.frm_cc_prop_01_agregado, objWatch.frm_cc_prop_02_agregado, objWatch.frm_cc_prop_03_agregado, objWatch.frm_cot_num_empleados,
    objWatch.frm_cot_fact_anual_pdysi, objWatch.frm_pdysi_prop_01_limite, objWatch.frm_pdysi_prop_02_limite, objWatch.frm_pdysi_prop_03_limite,
    objWatch.frm_cot_fact_anual_pi, objWatch.frm_pi_prop_01_limite, objWatch.frm_act_pi_actividad,
  ]);

  const { result: objQuoteResult, loading: blnQuoteLoading, error: strQuoteError, warmingUp: blnQuoteWarming } = useQuoter(objQuoterInputs);

  const onSubmit = async (in_objData: FfFlSolicitudFormData) => {
    // Validamos que haya al menos un producto y que CC no vaya solo
    const lstProds = [in_objData.frm_gen_prod_dyo, in_objData.frm_gen_prod_cc, in_objData.frm_gen_prod_pdysi, in_objData.frm_gen_prod_pi];
    const intCount = lstProds.filter(Boolean).length;
    if (intCount === 0) { setStrProductError('Seleccione al menos un producto'); return; }
    if (in_objData.frm_gen_prod_cc && intCount === 1) { setStrProductError('El seguro de Crimen Comercial solo puede cotizarse junto con otro producto'); return; }
    setStrProductError('');
    setStrSubmitError('');

    const dicData = in_objData as Record<string, unknown>;
    let strWarning = '';

    // Bloqueamos si el tipo de empresa creada no es cotizable por este canal
    if (blnNitNotFound && TIPOS_EMPRESA_BLOQUEADOS.has(in_objData.frm_cre_tipo_empresa ?? '')) {
      strWarning = MSG_CASE_UW;
    }

    // D&O: revisamos perfil, requisitos y que exista al menos un límite
    if (!strWarning && in_objData.frm_gen_prod_dyo) {
      const blnPerfBlocked = Array.from({ length: 17 }, (_, i) => `frm_dyo_perf_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'SI');
      const blnReqBlocked  = Array.from({ length: 8  }, (_, i) => `frm_dyo_req_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'NO');
      if (blnPerfBlocked || blnReqBlocked) {
        strWarning = `D&O: ${MSG_CASE_UW}`;
      } else {
        const blnHasLimit = in_objData.frm_dyo_prop_01_limite || in_objData.frm_dyo_prop_02_limite || in_objData.frm_dyo_prop_03_limite;
        if (!blnHasLimit) { setStrSubmitError('D&O: Debe ingresar al menos un límite asegurado en la Propuesta Económica.'); return; }
      }
    }

    // Crimen Comercial: revisamos perfil, requisitos y límite por evento
    if (!strWarning && in_objData.frm_gen_prod_cc) {
      const blnPerfBlocked = Array.from({ length: 8 }, (_, i) => `frm_cc_perf_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'SI');
      const blnReqBlocked  = Array.from({ length: 8 }, (_, i) => `frm_cc_req_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'NO');
      if (blnPerfBlocked || blnReqBlocked) {
        strWarning = `Crimen Comercial: ${MSG_CASE_UW}`;
      } else {
        const blnHasLimit = in_objData.frm_cc_prop_01_evento || in_objData.frm_cc_prop_02_evento || in_objData.frm_cc_prop_03_evento;
        if (!blnHasLimit) { setStrSubmitError('Crimen Comercial: Debe ingresar al menos un límite asegurado en la Propuesta Económica.'); return; }
      }
    }

    // Protección de Datos y SI: revisamos perfil, requisitos y límite
    if (!strWarning && in_objData.frm_gen_prod_pdysi) {
      const blnPerfBlocked = Array.from({ length: 10 }, (_, i) => `frm_pdysi_perf_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'SI');
      const blnReqBlocked  = Array.from({ length: 8  }, (_, i) => `frm_pdysi_req_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'NO');
      if (blnPerfBlocked || blnReqBlocked) {
        strWarning = `Protección de Datos y SI: ${MSG_CASE_UW}`;
      } else {
        const blnHasLimit = in_objData.frm_pdysi_prop_01_limite || in_objData.frm_pdysi_prop_02_limite || in_objData.frm_pdysi_prop_03_limite;
        if (!blnHasLimit) { setStrSubmitError('Protección de Datos y SI: Debe ingresar al menos un límite asegurado en la Propuesta Económica.'); return; }
      }
    }

    // Seg. Profesional: revisamos perfil, requisitos y límite
    if (!strWarning && in_objData.frm_gen_prod_pi) {
      const blnPerfBlocked = Array.from({ length: 8 }, (_, i) => `frm_pi_perf_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'SI');
      const blnReqBlocked  = Array.from({ length: 8 }, (_, i) => `frm_pi_req_${String(i + 1).padStart(2, '0')}`).some(strKey => dicData[strKey] === 'NO');
      if (blnPerfBlocked || blnReqBlocked) {
        strWarning = `Seg. Profesional: ${MSG_CASE_UW}`;
      } else {
        const blnHasLimit = in_objData.frm_pi_prop_01_limite || in_objData.frm_pi_prop_02_limite || in_objData.frm_pi_prop_03_limite;
        if (!blnHasLimit) { setStrSubmitError('Seg. Profesional: Debe ingresar al menos un límite asegurado en la Propuesta Económica.'); return; }
      }
    }

    if (strWarning) setStrSubmitError(strWarning);

    try {
      // ── Subir archivos ──────────────────────────────────────────────────────
      const intRequestId = task?.process_request_id;
      if (dicFileRegistry.current.size > 0 && intRequestId) {
        for (const [strDocKey, objFile] of dicFileRegistry.current.entries()) {
          const objFormData = new FormData();
          objFormData.append('file', objFile);
          try {
            await pm4.post(`/requests/${intRequestId}/files?data_name=${strDocKey}`, objFormData);
          } catch (excUpload: unknown) {
            const objErr = excUpload as { response?: { data: unknown }; message: string };
            throw new Error(`Error subiendo "${objFile.name}": ${JSON.stringify(objErr.response?.data ?? objErr.message)}`);
          }
        }
      }

      // ── Completar task ──────────────────────────────────────────────────────
      const { _user: _u, _request: _r, ...dicTaskData } = (task?.data ?? {}) as Record<string, unknown>;
      const dicPayload: Record<string, unknown> = {
        ...dicTaskData,
        ...(in_objData as unknown as Record<string, unknown>),
        ...(objQuoteResult && objQuoterInputs ? quoterResultToPayload(objQuoteResult, objQuoterInputs) : {}),
      };
      await completeTask(dicPayload);
      setBlnSent(true);
    } catch (excError) {
      setStrSubmitError((excError as Error).message ?? 'Error desconocido al enviar');
    }
  };

  const handleConsultarNIT = async () => {
    const strNit = form.getValues('frm_tom_nit');
    if (!strNit) { setStrSubmitError('Ingrese el NIT primero.'); return; }

    setBlnNitLoading(true);
    setStrSubmitError('');
    console.log(`[TIA] NIT: ${strNit}`);

    try {
      // PM4 espera data y config como strings JSON, más sync:true
      const objRequestBody = {
        data:   JSON.stringify({ frm_tomador_tipoDoc: 'NIT', frm_tomador_numDoc: strNit }),
        config: JSON.stringify({}),
        sync:   true,
      };
      console.log(`[TIA] POST /scripts/${CONSULTAR_CLIENTE_SCRIPT_ID}/execute`, JSON.stringify(objRequestBody, null, 2));

      const objRes = await pm4.post(`/scripts/${CONSULTAR_CLIENTE_SCRIPT_ID}/execute`, objRequestBody);
      console.log(`[TIA] HTTP ${objRes.status} — body completo:`, JSON.stringify(objRes.data, null, 2));

      const objOutput = objRes.data?.response ?? objRes.data?.output ?? objRes.data ?? {};
      console.log(`[TIA] Output extraído:`, JSON.stringify(objOutput, null, 2));

      // Si output es string con "No party found" → cliente no existe en TIA
      if (typeof objOutput === 'string' && (objOutput.includes('No party found') || objOutput.includes('HTTP 400'))) {
        console.warn('[TIA] No party found — solicitando confirmación para crear tomador');
        setBlnNitConfirmCreate(true);
        return;
      }

      // Mapear campos TIA → form (lógica centralizada en variables.ts)
      const objTia = (objOutput as Record<string, unknown>)['value'] ?? objOutput;
      const objMapped = parseClienteTia(objTia);
      const lstKeys = Object.keys(objMapped);
      console.log(`[TIA] FIN — ${lstKeys.length} campos mapeados:`, objMapped);

      for (const [strDest, strVal] of Object.entries(objMapped) as Array<[keyof FfFlSolicitudFormData, string]>) {
        form.setValue(strDest, strVal as never, { shouldDirty: true });
      }
      setObjTiaFields(new Set(lstKeys));

      if (lstKeys.length > 0) {
        setBlnNitNotFound(false);
      } else {
        setStrSubmitError('TIA respondió pero sin campos reconocibles. Ver consola.');
      }

    } catch (excErr: unknown) {
      const objErr = excErr as { response?: { status: number; data: unknown }; message: string };
      console.error(`[TIA] ERROR — status:`, objErr.response?.status ?? 'sin respuesta');
      console.error(`[TIA] Body:`, JSON.stringify(objErr.response?.data ?? objErr.message, null, 2));
      setStrSubmitError(`Error consultando TIA (${objErr.response?.status ?? 'red'}): ${JSON.stringify(objErr.response?.data ?? objErr.message)}`);
    } finally {
      setBlnNitLoading(false);
    }
  };

  if (loading) return <div className="screen-loading"><ZrLoader /></div>;
  if (error) return <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error cargando la tarea: {error}</ZrAlert>;

  // Pantalla de confirmación tras enviar la solicitud
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Cotizador Fast Flow — Líneas Financieras" />
        <div className="screen-content">
          <ResultCard variant="success" title="Solicitud enviada">
            <p>
              La cotización fue procesada correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
              Un momento, por favor...
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Cotizador Fast Flow — Líneas Financieras"
        subtitle={`Cotización # ${form.watch('frm_gen_num_cotizacion') || '—'}`}
      />

      <div className="screen-content">
        <div>
          <InfoGeneral form={form} productError={strProductError} />
          <InfoTomador
            form={form}
            onConsultarNIT={handleConsultarNIT}
            nitLoading={blnNitLoading}
            nitNotFound={blnNitNotFound}
            nitConfirmCreate={blnNitConfirmCreate}
            onConfirmCreate={() => { setBlnNitConfirmCreate(false); setBlnNitNotFound(true); }}
            onCancelCreate={() => setBlnNitConfirmCreate(false)}
            tiaFilledFields={objTiaFields}
          />
          <SeccionProductos form={form} fileRegistry={dicFileRegistry} />
          <DatosCotizacion form={form} />
          <PlanPago form={form} />

          <SeccionResumenCotizacion
            result={objQuoteResult}
            loading={blnQuoteLoading}
            warmingUp={blnQuoteWarming}
            error={strQuoteError}
            inputs={objQuoterInputs ?? {}}
            hasDyo={Boolean(objWatch.frm_gen_prod_dyo)}
            hasCc={Boolean(objWatch.frm_gen_prod_cc)}
            hasPdysi={Boolean(objWatch.frm_gen_prod_pdysi)}
            hasPi={Boolean(objWatch.frm_gen_prod_pi)}
          />

          {strSubmitError && <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>{strSubmitError}</ZrAlert>}

          <ActionBar>
            <ZrButton
              config="primary:l"
              icon="arrow-long-right:line"
              disabled={submitting}
              loading={submitting}
              onClick={() => form.handleSubmit(onSubmit, scrollToFirstError)()}
            >
              {submitting ? 'Enviando...' : 'CONTINUAR'}
            </ZrButton>
          </ActionBar>
        </div>
      </div>
    </div>
  );
}
