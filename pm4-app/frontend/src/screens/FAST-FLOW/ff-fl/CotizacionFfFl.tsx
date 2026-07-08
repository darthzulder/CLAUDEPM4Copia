import { useState, useEffect, Fragment } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton, ZrForm, ZdsInput, ZdsSelect, ZdsTextarea, ZrAlert, ZrTabs, ZrSegmentedControl, ZdsFileInput, ZrTable, ZrIcon, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import InfoBar from '../../../components/InfoBar';
import { useTask } from '../../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../../core/useRequestFiles';
import PdfViewer from '../../../components/PdfViewer';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CotizFfFlFormData {
  cot_dyo_opcion?:      string;
  cot_dyo_enviar_nc?:   boolean;
  cot_cc_opcion?:       string;
  cot_cc_enviar_nc?:    boolean;
  cot_pdysi_opcion?:    string;
  cot_pdysi_enviar_nc?: boolean;
  cot_pi_opcion?:       string;
  cot_pi_enviar_nc?:    boolean;
  cot_decision?:        string;
  cot_motivo_rechazo?:  string;
  cot_comentarios?:     string;
  cot_personalizacion?: string;
  cot_correo_facturacion?: string;
  cot_orden_firme_nombre?: string;
  cot_comision?:        number;
}

type Form = ReturnType<typeof useForm<CotizFfFlFormData>>;

// ─── Opciones estáticas ───────────────────────────────────────────────────────

const OPCIONES_DECISION = [
  { value: 'NUEVA_VERSION',   label: 'Generar nueva versión' },
  { value: 'RECHAZADA',       label: 'Cotización rechazada' },
  { value: 'PERSONALIZACION', label: 'Requiere Personalización / Excepción' },
  { value: 'APROBADA',        label: 'Cotización aprobada' },
];

const MOTIVOS_RECHAZO = [
  { value: 'NINGUNO',     label: 'Ninguno' },
  { value: 'CONDICIONES', label: 'Condiciones' },
  { value: 'TASA_PRECIO', label: 'Tasa / Precio' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Formateamos un valor como moneda colombiana
function cop(in_objValue: unknown): string {
  const dblNum = parseFloat(String(in_objValue));
  if (!in_objValue || isNaN(dblNum)) return '—';
  return `$${new Intl.NumberFormat('es-CO').format(dblNum)}`;
}

// Devolvemos el valor del dato solo si no viene vacío
function td(in_objData: Record<string, unknown>, in_strKey: string): unknown {
  const objVal = in_objData[in_strKey];
  return objVal !== null && objVal !== undefined && objVal !== '' ? objVal : null;
}

// ─── Radio de selección de opción ─────────────────────────────────────────────

function OpcionRadio({ form, name, value }: { form: Form; name: keyof CotizFfFlFormData; value: string }) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <input
          type="radio"
          name={field.name}
          value={value}
          checked={field.value === value}
          onChange={() => field.onChange(value)}
          aria-label={`Seleccionar opción ${value}`}
        />
      )}
    />
  );
}

// ─── Toggle SI/NO para enviar nota de cobertura ───────────────────────────────

function NcToggle({ form, name }: { form: Form; name: keyof CotizFfFlFormData }) {
  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue={false}
      render={({ field }) => (
        <ZrSegmentedControl
          name={field.name}
          model={field.value ? 'SI' : 'NO'}
          onChange={(val: string | null) => field.onChange(val === 'SI')}
          onBlur={field.onBlur}
          {...({ options: [{ value: 'SI', text: 'SÍ' }, { value: 'NO', text: 'NO' }] } as Record<string, unknown>)}
        />
      )}
    />
  );
}

// ─── Footer de tarjeta (Slip + NC toggle) ─────────────────────────────────────

function CardFooter({ form, ncField }: { form: Form; ncField: keyof CotizFfFlFormData }) {
  return (
    <div className="card-footer">
      <div className="cover-note-toggle">
        <span className="cover-note-label">¿Enviar nota de cobertura?</span>
        <NcToggle form={form} name={ncField} />
      </div>
    </div>
  );
}

// ─── Tarjeta D&O ──────────────────────────────────────────────────────────────

function TarjetaDyO({ form, data, mostrarAnexo }: { form: Form; data: Record<string, unknown>; mostrarAnexo: boolean }) {
  const objWatch = form.watch();

  return (
    <FormSection
      title="Seguro de Directores y Administradores"
      footer={<CardFooter form={form} ncField="cot_dyo_enviar_nc" />}
    >
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Límite asegurado</th>
                <th>Modalidad</th>
                <th>Cobertura</th>
                <th>Deducible</th>
                <th>Prima bruta anual</th>
                <th style={{ width: 56 }} {...({ config: 'center' } as object)}>Sel.</th>
              </tr>
            </thead>
            <tbody>
              {/* Pintamos las tres opciones, cada una con sus coberturas A y B */}
              {(['1','2','3'] as const).map((n) => (
                <Fragment key={n}>
                  <tr>
                    <td rowSpan={2} {...({ config: 'center' } as object)}>{n}</td>
                    <td rowSpan={2}>{cop(td(data, `frm_dyo_prop_0${n}_limite`))}</td>
                    <td rowSpan={2}>Todo y cada reclamo en el agregado anual</td>
                    <td>Cobertura 1.1 "A"</td>
                    <td rowSpan={2}>{cop(td(data, `cot_dyo_opt${n}_deducible`))}</td>
                    <td>{cop(td(data, `cot_dyo_opt${n}_prima_a`))}</td>
                    <td rowSpan={2} {...({ config: 'center' } as object)}><OpcionRadio form={form} name="cot_dyo_opcion" value={n} /></td>
                  </tr>
                  <tr>
                    <td>Cobertura 1.2 "B"</td>
                    <td>{cop(td(data, `cot_dyo_opt${n}_prima_b`))}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </ZrTable>

        {/* Anexo de cobertura a la entidad (solo para el sector "Otros") */}
        {mostrarAnexo && (
          <div style={{ marginTop: 'var(--zs-100)' }}>
            <div className="subsection-title">Anexo de cobertura a la entidad</div>
            <p className="subsection-intro" style={{ font: 'var(--zf-capt-12)', marginTop: 0 }}>
              La selección de la opción es automática según la cobertura principal seleccionada.
            </p>
            <ZrTable>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                    <th>Límite asegurado</th>
                    <th>Modalidad</th>
                    <th>Deducible</th>
                    <th style={{ width: 56 }} {...({ config: 'center' } as object)}>Sel.</th>
                  </tr>
                </thead>
                <tbody>
                  {(['1','2','3'] as const).map((n) => {
                    // Resaltamos la fila que coincide con la opción principal elegida
                    const blnIsAuto = objWatch.cot_dyo_opcion === n;
                    return (
                      <tr key={n} style={blnIsAuto ? { background: 'var(--zc-blue-sky-10)' } : undefined}>
                        <td {...({ config: 'center' } as object)}>{n}</td>
                        <td>{cop(td(data, `cot_dyo_ent${n}_limite`))}</td>
                        <td>Todo y cada reclamo en el agregado anual</td>
                        <td>{cop(td(data, `cot_dyo_ent${n}_deducible`))}</td>
                        <td {...({ config: 'center' } as object)}>
                          <input type="radio" checked={blnIsAuto} disabled readOnly aria-label="Opción seleccionada automáticamente" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ZrTable>
          </div>
        )}

    </FormSection>
  );
}

// ─── Tarjeta CC ───────────────────────────────────────────────────────────────

function TarjetaCC({ form, data }: { form: Form; data: Record<string, unknown> }) {
  return (
    <FormSection
      title="Seguro de Crimen Comercial"
      footer={<CardFooter form={form} ncField="cot_cc_enviar_nc" />}
    >
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Límite por evento</th>
                <th>Límite por agregado</th>
                <th>Deducible</th>
                <th>Prima bruta anual</th>
                <th style={{ width: 56 }} {...({ config: 'center' } as object)}>Sel.</th>
              </tr>
            </thead>
            <tbody>
              {/* Pintamos una fila por cada opción de cotización */}
              {(['1','2','3'] as const).map((n) => (
                <tr key={n}>
                  <td {...({ config: 'center' } as object)}>{n}</td>
                  <td>{cop(td(data, `cot_cc_opt${n}_lim_evt`))}</td>
                  <td>{cop(td(data, `cot_cc_opt${n}_lim_agr`))}</td>
                  <td>{cop(td(data, `cot_cc_opt${n}_deducible`))}</td>
                  <td>{cop(td(data, `cot_cc_opt${n}_prima`))}</td>
                  <td {...({ config: 'center' } as object)}><OpcionRadio form={form} name="cot_cc_opcion" value={n} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ZrTable>
    </FormSection>
  );
}

// ─── Tarjeta genérica (PDySI / PI) ────────────────────────────────────────────

function TarjetaGenerica({
  form, data, titulo, prefix, opcionField, ncField,
}: {
  form: Form;
  data: Record<string, unknown>;
  titulo: string;
  prefix: string;
  opcionField: keyof CotizFfFlFormData;
  ncField: keyof CotizFfFlFormData;
}) {
  return (
    <FormSection
      title={titulo}
      footer={<CardFooter form={form} ncField={ncField} />}
    >
        <ZrTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
                <th>Límite asegurado</th>
                <th>Modalidad</th>
                <th>Deducible</th>
                <th>Prima bruta anual</th>
                <th style={{ width: 56 }} {...({ config: 'center' } as object)}>Sel.</th>
              </tr>
            </thead>
            <tbody>
              {/* Pintamos una fila por cada opción de cotización */}
              {(['1','2','3'] as const).map((n) => (
                <tr key={n}>
                  <td {...({ config: 'center' } as object)}>{n}</td>
                  <td>{cop(td(data, `frm_${prefix}_prop_0${n}_limite`))}</td>
                  <td>Todo y cada reclamo en el agregado anual</td>
                  <td>{cop(td(data, `cot_${prefix}_opt${n}_deducible`))}</td>
                  <td>{cop(td(data, `cot_${prefix}_opt${n}_prima`))}</td>
                  <td {...({ config: 'center' } as object)}><OpcionRadio form={form} name={opcionField} value={n} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ZrTable>
    </FormSection>
  );
}

// ─── Sección Decisión ─────────────────────────────────────────────────────────

function SeccionDecision({
  form, onEnviar, submitError, submitting,
}: {
  form: Form;
  onEnviar: () => void;
  submitError: string;
  submitting: boolean;
}) {
  const { control, watch, setValue, setError, clearErrors, formState: { errors } } = form;
  const objWatch = watch();
  const strDecision = objWatch.cot_decision;

  return (
    <FormSection
      title="Decisión"
      footer={
        <>
          {submitError && (
            <ZrAlert config="negative" style={{ marginTop: 'var(--zs-100)' }} {...({ 'hide-close': true } as object)}>{submitError}</ZrAlert>
          )}
          <ActionBar>
            <ZrButton
              config="primary:l"
              icon="arrow-long-right:line"
              disabled={submitting || !strDecision}
              loading={submitting}
              onClick={onEnviar}
            >
              {submitting ? 'Enviando...' : strDecision === 'PERSONALIZACION' ? 'CONFIRMAR' : 'ENVIAR'}
            </ZrButton>
          </ActionBar>
        </>
      }
    >
        <ZrForm style={{ ['--z-form--gap' as any]: 'var(--zs-150)' }}>
          <>
          <div className="form-row cols-2">
            <ZdsSelect
              label="Decisión"
              name="cot_decision"
              control={control}
              options={OPCIONES_DECISION}
              rules={{ required: 'Campo requerido' }}
              required
            />
          </div>

          {/* Campos extra cuando la cotización es rechazada */}
          {strDecision === 'RECHAZADA' && (
            <>
              <div className="form-row cols-2">
                <ZdsSelect
                  label="Motivo del rechazo"
                  name="cot_motivo_rechazo"
                  control={control}
                  options={MOTIVOS_RECHAZO}
                  rules={{ required: 'Campo requerido' }}
                  required
                />
              </div>
              <div className="form-row cols-1">
                <ZdsTextarea
                  control={control}
                  name="cot_comentarios"
                  label="Comentarios"
                  required
                  maxLength={500}
                  placeholder="Ingrese los comentarios del rechazo..."
                />
              </div>
            </>
          )}

          {/* Campo extra cuando se requiere personalización o excepción */}
          {strDecision === 'PERSONALIZACION' && (
            <div className="form-row cols-1">
              <ZdsTextarea
                control={control}
                name="cot_personalizacion"
                label="Personalización / Excepción requerida"
                required
                maxLength={500}
                placeholder="Describa la personalización o excepción requerida..."
              />
            </div>
          )}

          {/* Campos extra cuando la cotización es aprobada */}
          {strDecision === 'APROBADA' && (
            <>
              <div className="form-row cols-2">
                <ZdsInput
                  control={control}
                  name="cot_correo_facturacion"
                  label="Correo para facturación"
                  inputType="email"
                  rules={{
                    required: 'Campo requerido',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                    maxLength: { value: 254, message: 'Máximo 254 caracteres' },
                  }}
                  required
                />
              </div>
              <div className="field-wrap">
                <label className="form-label">Orden en firme * <span className="field-hint">(PDF o correo)</span></label>
                <ZdsFileInput
                  control={control}
                  name="cot_orden_firme_nombre"
                  setValue={setValue}
                  setError={setError}
                  clearErrors={clearErrors}
                  error={errors.cot_orden_firme_nombre?.message}
                  allowedExtensions={['pdf', 'eml', 'msg']}
                  maxSizeMb={5}
                />
              </div>
              <div className="form-row cols-2">
                <ZdsInput
                  control={control}
                  name="cot_comision"
                  label="Comisión (%)"
                  readOnly
                  helpText="Se ajusta al 21% si se aprueban 2 o más productos"
                />
              </div>
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                En caso de existir una orden en firme para dos o más productos, la comisión aplicable será del 21% para cada uno de los productos incluidos.
              </ZrAlert>
            </>
          )}
          </>
        </ZrForm>
    </FormSection>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CotizacionFfFl() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [strSubmitError, setStrSubmitError] = useState('');
  const [blnSent, setBlnSent] = useState(false);
  const [blnCustomConfirmed, setBlnCustomConfirmed] = useState(false);

  const dicTaskData = (task?.data ?? {}) as Record<string, any>;

  const [strSlipTab, setStrSlipTab] = useState('');

  const intRequestId = task?.process_request_id ?? null;
  const { files } = useRequestFiles(intRequestId);

  // Detectamos qué productos vienen en el caso
  const blnHasDyo      = Boolean(dicTaskData.frm_gen_prod_dyo);
  const blnHasCc       = Boolean(dicTaskData.frm_gen_prod_cc);
  const blnHasPdysi    = Boolean(dicTaskData.frm_gen_prod_pdysi);
  const blnHasPi       = Boolean(dicTaskData.frm_gen_prod_pi);
  const blnShowAnexo = blnHasDyo && dicTaskData.frm_tom_sector === 'OTROS';

  // Armamos las líneas del slip solo con los productos presentes
  const lstSlipLines = [
    blnHasDyo   ? { key: 'dyo',   label: 'D&O',                     field: 'output_slipCotizacion_dyo'   } : null,
    blnHasCc    ? { key: 'cc',    label: 'Crimen Comercial',          field: 'output_slipCotizacion_cc'    } : null,
    blnHasPdysi ? { key: 'pdysi', label: 'Protección de Datos y SI',  field: 'output_slipCotizacion_pdysi' } : null,
    blnHasPi    ? { key: 'pi',    label: 'Seg. Profesional',          field: 'output_slipCotizacion_pi'    } : null,
  ].filter((objLine): objLine is NonNullable<typeof objLine> => objLine !== null);

  // Si la pestaña activa del slip ya no existe, saltamos a la primera
  useEffect(() => {
    if (lstSlipLines.length > 0 && !lstSlipLines.find((objLine) => objLine.key === strSlipTab)) {
      setStrSlipTab(lstSlipLines[0].key);
    }
  }, [lstSlipLines.map((objLine) => objLine.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const objCurrentSlipLine = lstSlipLines.find((objLine) => objLine.key === strSlipTab);
  // Resolvemos el id del archivo de slip a mostrar
  const intEffectiveSlipId = (() => {
    if (!objCurrentSlipLine) return null;
    const intFromVar = resolveFileId(dicTaskData[objCurrentSlipLine.field]);
    if (intFromVar) return intFromVar;
    // Fallback: buscar por nombre de archivo en el File Manager
    const objMatch = files.find((objFile) =>
      objFile.file_name.toLowerCase().includes('slipcotizacion_' + objCurrentSlipLine.key)
    );
    return objMatch?.id ?? null;
  })();

  const form = useForm<CotizFfFlFormData>({
    mode: 'onChange',
    defaultValues: {
      cot_dyo_enviar_nc:   false,
      cot_cc_enviar_nc:    false,
      cot_pdysi_enviar_nc: false,
      cot_pi_enviar_nc:    false,
    },
  });

  const objWatch = form.watch();

  // Pre-fill correo facturación y comisión desde la solicitud
  useEffect(() => {
    if (!task) return;
    const strCorreo = String(dicTaskData.frm_tom_correo_facturacion ?? dicTaskData.frm_cre_correo_facturacion ?? '');
    if (strCorreo) form.setValue('cot_correo_facturacion', strCorreo);
    form.setValue('cot_comision', Number(dicTaskData.frm_cot_comision ?? 20));
  }, [task]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Regla 21%: 2+ notas de cobertura + orden en firme cargada
  useEffect(() => {
    if (objWatch.cot_decision !== 'APROBADA') return;
    const intNcCount = [objWatch.cot_dyo_enviar_nc, objWatch.cot_cc_enviar_nc, objWatch.cot_pdysi_enviar_nc, objWatch.cot_pi_enviar_nc].filter(Boolean).length;
    const dblBase = Number(dicTaskData.frm_cot_comision ?? 20);
    form.setValue('cot_comision', intNcCount >= 2 && objWatch.cot_orden_firme_nombre ? 21 : dblBase);
  }, [objWatch.cot_dyo_enviar_nc, objWatch.cot_cc_enviar_nc, objWatch.cot_pdysi_enviar_nc, objWatch.cot_pi_enviar_nc, objWatch.cot_orden_firme_nombre, objWatch.cot_decision]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async () => {
    setStrSubmitError('');
    const objData = form.getValues();
    const strDecision = objData.cot_decision;

    if (!strDecision) { setStrSubmitError('Seleccione una decisión para continuar.'); return; }

    if (strDecision === 'PERSONALIZACION') {
      setBlnCustomConfirmed(true);
      return;
    }

    // Validamos la selección de opción y los datos obligatorios cuando se aprueba
    if (strDecision === 'APROBADA') {
      if (blnHasDyo   && !objData.cot_dyo_opcion)   { setStrSubmitError('D&O: Debe seleccionar una opción de cotización.'); return; }
      if (blnHasCc    && !objData.cot_cc_opcion)    { setStrSubmitError('Crimen Comercial: Debe seleccionar una opción de cotización.'); return; }
      if (blnHasPdysi && !objData.cot_pdysi_opcion) { setStrSubmitError('Protección de Datos y SI: Debe seleccionar una opción de cotización.'); return; }
      if (blnHasPi    && !objData.cot_pi_opcion)    { setStrSubmitError('Seg. Profesional: Debe seleccionar una opción de cotización.'); return; }
      if (!objData.cot_correo_facturacion)        { setStrSubmitError('Ingrese el correo para facturación.'); return; }
      if (!objData.cot_orden_firme_nombre)        { setStrSubmitError('Cargue la orden en firme.'); return; }
    }

    // Validamos motivo y comentarios cuando se rechaza
    if (strDecision === 'RECHAZADA') {
      if (!objData.cot_motivo_rechazo)           { setStrSubmitError('Seleccione el motivo del rechazo.'); return; }
      if (!objData.cot_comentarios?.trim())       { setStrSubmitError('Ingrese los comentarios del rechazo.'); return; }
    }

    try {
      await completeTask({ ...dicTaskData, ...objData });
      setBlnSent(true);
    } catch (excError) {
      setStrSubmitError((excError as Error).message ?? 'Error desconocido al enviar');
    }
  };

  // ── Pantalla: cargando / error ──────────────────────────────────────────────
  if (loading) return <div className="screen-loading"><ZrLoader /></div>;
  if (error)   return <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error cargando la tarea: {error}</ZrAlert>;

  // ── Pantalla: Personalización confirmada ────────────────────────────────────
  if (blnCustomConfirmed) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Cotizador Fast Flow — Líneas Financieras" subtitle={[`Cotización # ${String(dicTaskData.frm_gen_num_cotizacion ?? '—')}`]} />
        <div className="screen-content">
          <ResultCard variant="warning" title="Requiere Personalización / Excepción">
            <p>
              Hasta contar con el Case Underwriting Process en el BPM, por favor genere la solicitud en JIRA.<br />
              <br />El proceso ha finalizado.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  // ── Pantalla: Enviado ───────────────────────────────────────────────────────
  if (blnSent) {
    const strDec = objWatch.cot_decision;
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="Cotizador Fast Flow — Líneas Financieras" subtitle={[`Cotización # ${String(dicTaskData.frm_gen_num_cotizacion ?? '—')}`]} />
        <div className="screen-content">
          <ResultCard
            variant="success"
            title={
              strDec === 'NUEVA_VERSION' ? 'Generando nueva versión…' :
              strDec === 'RECHAZADA'     ? 'Cotización rechazada' :
              'Cotización procesada'
            }
          >
            <p>
              {strDec === 'NUEVA_VERSION'
                ? 'La cotización volverá al Cotizador FF para ser modificada.'
                : strDec === 'RECHAZADA'
                ? 'Se ha registrado el rechazo. El proceso continúa automáticamente.'
                : 'Las notas de cobertura serán enviadas al intermediario. Un momento…'}
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  // ── Pantalla principal ──────────────────────────────────────────────────────
  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Cotizador Fast Flow — Líneas Financieras"
        subtitle={[`Cotización # ${String(dicTaskData.frm_gen_num_cotizacion ?? '—')}`]}
      />
      <div className="screen-content">

        {/* Barra de info del tomador */}
        <InfoBar
          items={[
            { label: 'Tomador', value: dicTaskData.frm_tom_tomador },
            { label: 'NIT', value: dicTaskData.frm_tom_nit },
            { label: 'Intermediario', value: dicTaskData.frm_gen_intermediario },
            {
              label: 'Vigencia',
              value: dicTaskData.frm_cot_inicio_vigencia || dicTaskData.frm_cot_fin_vigencia
                ? `${dicTaskData.frm_cot_inicio_vigencia ?? '—'} — ${dicTaskData.frm_cot_fin_vigencia ?? '—'}`
                : null
            }
          ]}
        />

        {/* Slip de Cotización */}
        <div className="section-title">Slip de Cotización</div>
        <FormSection title="Slip de Cotización">
            {lstSlipLines.length > 1 && (
              <div className="slip-tabs">
                <ZrTabs
                  model={Math.max(1, lstSlipLines.findIndex((objLine) => objLine.key === strSlipTab) + 1)}
                  onChange={(in_intIdx: number) => { const objLine = lstSlipLines[in_intIdx - 1]; if (objLine) setStrSlipTab(objLine.key); }}
                  {...({ tabs: lstSlipLines.map((objLine) => ({ name: objLine.label })) } as Record<string, unknown>)}
                />
              </div>
            )}
            {intEffectiveSlipId ? (
              <PdfViewer
                fileId={intEffectiveSlipId}
                label={objCurrentSlipLine ? `Slip — ${objCurrentSlipLine.label}` : 'Slip de Cotización'}
                height={700}
              />
            ) : (
              <div className="no-slip">
                <ZrIcon icon="file-blank:line" config="l" />
                <span>El slip de cotización no está disponible aún.</span>
              </div>
            )}
        </FormSection>

        <div className="section-title">Resumen de Cotizaciones</div>

        {/* Mostramos la tarjeta de cada producto presente en el caso */}
        {blnHasDyo   && <TarjetaDyO form={form} data={dicTaskData} mostrarAnexo={blnShowAnexo} />}
        {blnHasCc    && <TarjetaCC  form={form} data={dicTaskData} />}
        {blnHasPdysi && (
          <TarjetaGenerica
            form={form} data={dicTaskData}
            titulo="Seguro de Protección de Datos y Seguridad Informática"
            prefix="pdysi"
            opcionField="cot_pdysi_opcion"
            ncField="cot_pdysi_enviar_nc"
          />
        )}
        {blnHasPi && (
          <TarjetaGenerica
            form={form} data={dicTaskData}
            titulo="Seguro de Responsabilidad Civil Profesional"
            prefix="pi"
            opcionField="cot_pi_opcion"
            ncField="cot_pi_enviar_nc"
          />
        )}

        <SeccionDecision
          form={form}
          onEnviar={handleEnviar}
          submitError={strSubmitError}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
