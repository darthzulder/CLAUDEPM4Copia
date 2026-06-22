import { useState, useEffect, Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrButton, ZrForm, ZdsInput, ZdsSelect, ZdsTextarea, ZrAlert, ZrTabs, ZrSegmentedControl, ZrFileInput, ZrTable } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

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

function cop(v: unknown): string {
  const n = parseFloat(String(v));
  if (!v || isNaN(n)) return '—';
  return `$${new Intl.NumberFormat('es-CO').format(n)}`;
}

function td(data: Record<string, unknown>, key: string): unknown {
  const v = data[key];
  return v !== null && v !== undefined && v !== '' ? v : null;
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
    <div className="co-card-footer">
      <div className="co-nc-toggle">
        <span className="co-nc-label">¿Enviar nota de cobertura?</span>
        <NcToggle form={form} name={ncField} />
      </div>
    </div>
  );
}

// ─── Tarjeta D&O ──────────────────────────────────────────────────────────────

function TarjetaDyO({ form, data, mostrarAnexo }: { form: Form; data: Record<string, unknown>; mostrarAnexo: boolean }) {
  const w = form.watch();

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

        {mostrarAnexo && (
          <div style={{ marginTop: 'var(--zs-100)' }}>
            <div className="co-subsection-title">Anexo de cobertura a la entidad</div>
            <p className="dyo-intro-text" style={{ font: 'var(--zf-capt-12)', marginTop: 0 }}>
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
                    const isAuto = w.cot_dyo_opcion === n;
                    return (
                      <tr key={n} style={isAuto ? { background: 'var(--zc-blue-sky-10)' } : undefined}>
                        <td {...({ config: 'center' } as object)}>{n}</td>
                        <td>{cop(td(data, `cot_dyo_ent${n}_limite`))}</td>
                        <td>Todo y cada reclamo en el agregado anual</td>
                        <td>{cop(td(data, `cot_dyo_ent${n}_deducible`))}</td>
                        <td {...({ config: 'center' } as object)}>
                          <input type="radio" checked={isAuto} disabled readOnly aria-label="Opción seleccionada automáticamente" />
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
  const { control, watch, setValue, register } = form;
  const w = watch();
  const decision = w.cot_decision;

  return (
    <FormSection
      title="Decisión"
      footer={
        <>
          {submitError && (
            <ZrAlert config="negative" style={{ marginTop: 'var(--zs-100)' }} {...({ 'hide-close': true } as object)}>{submitError}</ZrAlert>
          )}
          <div className="submit-bar">
            <ZrButton
              config="primary:l"
              icon="arrow-long-right:line"
              disabled={submitting || !decision}
              loading={submitting}
              onClick={onEnviar}
            >
              {submitting ? 'Enviando...' : decision === 'PERSONALIZACION' ? 'CONFIRMAR' : 'ENVIAR'}
            </ZrButton>
          </div>
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

          {decision === 'RECHAZADA' && (
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

          {decision === 'PERSONALIZACION' && (
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

          {decision === 'APROBADA' && (
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
              <div className="co-field-wrap">
                <label className="form-label">Orden en firme * <span className="co-field-hint">(PDF o correo)</span></label>
                <ZrFileInput
                  label=""
                  model={w.cot_orden_firme_nombre || null}
                  droppable
                  onChange={(file: File | string | null) => {
                    if (file && typeof file !== 'string') setValue('cot_orden_firme_nombre', file.name);
                    else if (!file) setValue('cot_orden_firme_nombre', '');
                  }}
                  {...({ accept: ['.pdf', '.eml', '.msg'] } as Record<string, unknown>)}
                />
                <input type="hidden" {...register('cot_orden_firme_nombre')} />
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
  const [submitError, setSubmitError] = useState('');
  const [sent, setSent] = useState(false);
  const [personalizacionConfirmada, setPersonalizacionConfirmada] = useState(false);

  const taskData = (task?.data ?? {}) as Record<string, unknown>;

  const [slipTab, setSlipTab] = useState('');

  const requestId = task?.process_request_id ?? null;
  const { files } = useRequestFiles(requestId);

  const hasDyo      = Boolean(taskData.frm_gen_prod_dyo);
  const hasCc       = Boolean(taskData.frm_gen_prod_cc);
  const hasPdysi    = Boolean(taskData.frm_gen_prod_pdysi);
  const hasPi       = Boolean(taskData.frm_gen_prod_pi);
  const mostrarAnexo = hasDyo && taskData.frm_tom_sector === 'OTROS';

  const slipLineas = [
    hasDyo   ? { key: 'dyo',   label: 'D&O',                     field: 'output_slipCotizacion_dyo'   } : null,
    hasCc    ? { key: 'cc',    label: 'Crimen Comercial',          field: 'output_slipCotizacion_cc'    } : null,
    hasPdysi ? { key: 'pdysi', label: 'Protección de Datos y SI',  field: 'output_slipCotizacion_pdysi' } : null,
    hasPi    ? { key: 'pi',    label: 'Seg. Profesional',          field: 'output_slipCotizacion_pi'    } : null,
  ].filter((l): l is NonNullable<typeof l> => l !== null);

  useEffect(() => {
    if (slipLineas.length > 0 && !slipLineas.find((l) => l.key === slipTab)) {
      setSlipTab(slipLineas[0].key);
    }
  }, [slipLineas.map((l) => l.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSlipLinea = slipLineas.find((l) => l.key === slipTab);
  const effectiveSlipId = (() => {
    if (!currentSlipLinea) return null;
    const fromVar = resolveFileId(taskData[currentSlipLinea.field]);
    if (fromVar) return fromVar;
    // Fallback: buscar por nombre de archivo en el File Manager
    const match = files.find((f) =>
      f.file_name.toLowerCase().includes('slipcotizacion_' + currentSlipLinea.key)
    );
    return match?.id ?? null;
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

  const w = form.watch();

  // Pre-fill correo facturación y comisión desde la solicitud
  useEffect(() => {
    if (!task) return;
    const correo = String(taskData.frm_tom_correo_facturacion ?? taskData.frm_cre_correo_facturacion ?? '');
    if (correo) form.setValue('cot_correo_facturacion', correo);
    form.setValue('cot_comision', Number(taskData.frm_cot_comision ?? 20));
  }, [task]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Regla 21%: 2+ notas de cobertura + orden en firme cargada
  useEffect(() => {
    if (w.cot_decision !== 'APROBADA') return;
    const ncCount = [w.cot_dyo_enviar_nc, w.cot_cc_enviar_nc, w.cot_pdysi_enviar_nc, w.cot_pi_enviar_nc].filter(Boolean).length;
    const base = Number(taskData.frm_cot_comision ?? 20);
    form.setValue('cot_comision', ncCount >= 2 && w.cot_orden_firme_nombre ? 21 : base);
  }, [w.cot_dyo_enviar_nc, w.cot_cc_enviar_nc, w.cot_pdysi_enviar_nc, w.cot_pi_enviar_nc, w.cot_orden_firme_nombre, w.cot_decision]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async () => {
    setSubmitError('');
    const data = form.getValues();
    const decision = data.cot_decision;

    if (!decision) { setSubmitError('Seleccione una decisión para continuar.'); return; }

    if (decision === 'PERSONALIZACION') {
      setPersonalizacionConfirmada(true);
      return;
    }

    if (decision === 'APROBADA') {
      if (hasDyo   && !data.cot_dyo_opcion)   { setSubmitError('D&O: Debe seleccionar una opción de cotización.'); return; }
      if (hasCc    && !data.cot_cc_opcion)    { setSubmitError('Crimen Comercial: Debe seleccionar una opción de cotización.'); return; }
      if (hasPdysi && !data.cot_pdysi_opcion) { setSubmitError('Protección de Datos y SI: Debe seleccionar una opción de cotización.'); return; }
      if (hasPi    && !data.cot_pi_opcion)    { setSubmitError('Seg. Profesional: Debe seleccionar una opción de cotización.'); return; }
      if (!data.cot_correo_facturacion)        { setSubmitError('Ingrese el correo para facturación.'); return; }
      if (!data.cot_orden_firme_nombre)        { setSubmitError('Cargue la orden en firme.'); return; }
    }

    if (decision === 'RECHAZADA') {
      if (!data.cot_motivo_rechazo)           { setSubmitError('Seleccione el motivo del rechazo.'); return; }
      if (!data.cot_comentarios?.trim())       { setSubmitError('Ingrese los comentarios del rechazo.'); return; }
    }

    try {
      await completeTask({ ...taskData, ...data });
      setSent(true);
    } catch (e) {
      setSubmitError((e as Error).message ?? 'Error desconocido al enviar');
    }
  };

  // ── Pantalla: cargando / error ──────────────────────────────────────────────
  if (loading) return <div className="screen-loading"><div className="spinner" /></div>;
  if (error)   return <div className="screen-error">⚠ Error cargando la tarea: {error}</div>;

  // ── Pantalla: Personalización confirmada ────────────────────────────────────
  if (personalizacionConfirmada) {
    return (
      <div className="screen-wrapper">
        <Header taskData={taskData} />
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
  if (sent) {
    const dec = w.cot_decision;
    return (
      <div className="screen-wrapper">
        <Header taskData={taskData} />
        <div className="screen-content">
          <ResultCard
            variant="success"
            title={
              dec === 'NUEVA_VERSION' ? 'Generando nueva versión…' :
              dec === 'RECHAZADA'     ? 'Cotización rechazada' :
              'Cotización procesada'
            }
          >
            <p>
              {dec === 'NUEVA_VERSION'
                ? 'La cotización volverá al Cotizador FF para ser modificada.'
                : dec === 'RECHAZADA'
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
      <Header taskData={taskData} />
      <div className="screen-content">

        {/* Barra de info del tomador */}
        <div className="co-info-bar">
          <div className="co-info-item">
            <span className="co-info-label">Tomador</span>
            <span className="co-info-value">{String(taskData.frm_tom_tomador ?? '—')}</span>
          </div>
          <div className="co-info-item">
            <span className="co-info-label">NIT</span>
            <span className="co-info-value">{String(taskData.frm_tom_nit ?? '—')}</span>
          </div>
          <div className="co-info-item">
            <span className="co-info-label">Intermediario</span>
            <span className="co-info-value">{String(taskData.frm_gen_intermediario ?? '—')}</span>
          </div>
          <div className="co-info-item">
            <span className="co-info-label">Vigencia</span>
            <span className="co-info-value">
              {String(taskData.frm_cot_inicio_vigencia ?? '—')} — {String(taskData.frm_cot_fin_vigencia ?? '—')}
            </span>
          </div>
        </div>

        {/* Slip de Cotización */}
        <div className="co-section-title">Slip de Cotización</div>
        <FormSection title="Slip de Cotización">
            {slipLineas.length > 1 && (
              <div className="co-slip-tabs">
                <ZrTabs
                  model={Math.max(0, slipLineas.findIndex((l) => l.key === slipTab))}
                  onChange={(idx: number) => setSlipTab(slipLineas[idx].key)}
                  {...({ tabs: slipLineas.map((l) => ({ name: l.label })) } as Record<string, unknown>)}
                />
              </div>
            )}
            {effectiveSlipId ? (
              <PdfViewer
                fileId={effectiveSlipId}
                label={currentSlipLinea ? `Slip — ${currentSlipLinea.label}` : 'Slip de Cotización'}
                height={700}
              />
            ) : (
              <div className="co-no-slip">
                <span>📄</span>
                <span>El slip de cotización no está disponible aún.</span>
              </div>
            )}
        </FormSection>

        <div className="co-section-title">Resumen de Cotizaciones</div>

        {hasDyo   && <TarjetaDyO form={form} data={taskData} mostrarAnexo={mostrarAnexo} />}
        {hasCc    && <TarjetaCC  form={form} data={taskData} />}
        {hasPdysi && (
          <TarjetaGenerica
            form={form} data={taskData}
            titulo="Seguro de Protección de Datos y Seguridad Informática"
            prefix="pdysi"
            opcionField="cot_pdysi_opcion"
            ncField="cot_pdysi_enviar_nc"
          />
        )}
        {hasPi && (
          <TarjetaGenerica
            form={form} data={taskData}
            titulo="Seguro de Responsabilidad Civil Profesional"
            prefix="pi"
            opcionField="cot_pi_opcion"
            ncField="cot_pi_enviar_nc"
          />
        )}

        <SeccionDecision
          form={form}
          onEnviar={handleEnviar}
          submitError={submitError}
          submitting={submitting}
        />
      </div>
    </div>
  );
}

// ─── Header reutilizable ──────────────────────────────────────────────────────

function Header({ taskData }: { taskData: Record<string, unknown> }) {
  return (
    <div className="screen-header">
      <div className="title-block">
        <h1>Cotizador Fast Flow — Líneas Financieras</h1>
        <div className="subtitle">
          <span>Cotización # {String(taskData.frm_gen_num_cotizacion ?? '—')}</span>
        </div>
      </div>
      <img src={zurichLogo} alt="Zurich" className="header-logo" />
    </div>
  );
}
