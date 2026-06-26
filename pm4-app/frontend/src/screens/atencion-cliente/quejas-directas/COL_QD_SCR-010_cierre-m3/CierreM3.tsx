import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsDate, ZdsRadio, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { OPTIONS, COLLECTION_DEFS, REGEX_NOMENCLATURA_PDF, CierreM3FormData } from './variables';
import SeccionEstadoCierre from './SeccionEstadoCierre';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import pm4 from '../../../../api/pm4Client';

export default function CierreM3() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());

  const { control, watch, handleSubmit, reset, register, setValue, formState: { errors, isSubmitted } } = useForm<CierreM3FormData>({
    defaultValues: {
      estadoCierreM3: '', intentosCierreM3: '0', ultimoError: '',
      codigoSFC: '', estadoQueja: '', fechaActualizacion: '', fechaCierre: '',
      favorabilidad: '', aceptacion: '', marcacion: '', quejaExpres: '',
      pdfRespuestaFinal: '', adjuntoRespuestaFinal: '',
      relacionadaFraude: '', tipoFraude: '', montoReclamado: '', montoReconocido: '',
    },
  });

  const w = watch();

  const { options: estadoQuejaOpts } = useCollection(COLLECTION_DEFS.estadoQueja);
  const { options: favorabilidadOpts } = useCollection(COLLECTION_DEFS.favorabilidad);
  const { options: aceptacionOpts } = useCollection(COLLECTION_DEFS.aceptacion);
  const { options: marcacionOpts } = useCollection(COLLECTION_DEFS.marcacion);
  const { options: quejaExpresOpts } = useCollection(COLLECTION_DEFS.quejaExpres);
  const { options: tipoFraudeOpts } = useCollection(COLLECTION_DEFS.tipoFraude);

  useEffect(() => {
    if (task?.data) reset(task.data as Partial<CierreM3FormData>);
  }, [task, reset]);

  // RUL-010-01: fechaActualizacion debe coincidir con fechaCierre
  const fechasCoinciden = !w.fechaActualizacion || !w.fechaCierre || w.fechaActualizacion === w.fechaCierre;
  // RUL-010-02: PDF con nomenclatura correcta si se adjunta
  const pdfValido = !w.pdfRespuestaFinal || REGEX_NOMENCLATURA_PDF.test(w.pdfRespuestaFinal);
  // RUL-010-03: todos los obligatorios completos + reglas anteriores
  const camposObligatorios: (keyof CierreM3FormData)[] = [
    'codigoSFC', 'estadoQueja', 'fechaActualizacion', 'fechaCierre',
    'favorabilidad', 'aceptacion', 'marcacion', 'quejaExpres', 'adjuntoRespuestaFinal',
  ];
  const todosCompletos = camposObligatorios.every(c => !!w[c]);
  const puedeEnviar = fechasCoinciden && pdfValido && todosCompletos;

  const esRechazado = w.estadoCierreM3 === 'Rechazado (400)';

  const err = (name: keyof CierreM3FormData) => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  const onSubmit = async (data: CierreM3FormData) => {
    if (!puedeEnviar) return;
    try {
      const requestId = task?.process_request_id;
      if (requestId) {
        for (const [docKey, file] of fileRegistry.current.entries()) {
          const fd = new FormData();
          fd.append('file', file);
          await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
        }
      }
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[CierreM3] Error al enviar:', e);
    }
  };

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">Error al cargar el formulario: {error}</div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      <div className="screen-header">
        <div className="title-block">
          <h1>Cierre Regulatorio Momento 3</h1>
          <div className="subtitle">
            <span>SP3-T01 / SP3-T04 / SP3-T08</span>
            <span>Gestión de Quejas Directas</span>
            <span>Rol: Gestor de Experiencia / Backoffice SFC</span>
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Sección 1 — Estado del envío a SFC */}
        <FormSection title="Estado del Envío a SmartSupervision (SFC)">
          <SeccionEstadoCierre
            estadoCierreM3={w.estadoCierreM3}
            intentosCierreM3={w.intentosCierreM3}
            ultimoError={w.ultimoError}
          />
          <div className="form-row cols-1">
            <ZdsInput
              name="codigoSFC"
              control={control}
              label="Código SFC / Número de Radicado"
              rules={{ required: 'Campo requerido', maxLength: { value: 100, message: 'Máximo 100 caracteres' } }}
              required
              error={err('codigoSFC')}
            />
          </div>
          {esRechazado && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>Envío rechazado por SFC.</strong> Revise el error indicado, corrija los datos y reenvíe.
            </ZrAlert>
          )}
        </FormSection>

        {/* Sección 2 — Datos de cierre */}
        <FormSection title="Datos de Cierre Regulatorio">
          <div className="form-row cols-1">
            <ZdsSelect
              name="estadoQueja"
              control={control}
              label="Estado de la Queja"
              options={estadoQuejaOpts}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('estadoQueja')}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsDate
              name="fechaActualizacion"
              control={control}
              label="Fecha de Actualización"
              rules={{ required: 'Campo requerido' }}
              required
              error={err('fechaActualizacion')}
            />
            <ZdsDate
              name="fechaCierre"
              control={control}
              label="Fecha de Cierre"
              rules={{ required: 'Campo requerido' }}
              required
              error={err('fechaCierre')}
            />
          </div>

          {!fechasCoinciden && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La Fecha de Actualización debe coincidir con la Fecha de Cierre (RUL-010-01).
            </ZrAlert>
          )}

          <div className="form-row cols-2">
            <ZdsSelect
              name="favorabilidad"
              control={control}
              label="Favorabilidad"
              options={favorabilidadOpts}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('favorabilidad')}
            />
            <ZdsSelect
              name="aceptacion"
              control={control}
              label="Aceptación"
              options={aceptacionOpts}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('aceptacion')}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsSelect
              name="marcacion"
              control={control}
              label="Marcación"
              options={marcacionOpts}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('marcacion')}
            />
            <ZdsSelect
              name="quejaExpres"
              control={control}
              label="Queja Exprés"
              options={quejaExpresOpts}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('quejaExpres')}
            />
          </div>
        </FormSection>

        {/* Sección 3 — Adjunto respuesta final */}
        <FormSection title="Adjunto Respuesta Final al Consumidor">
          <div className="form-row cols-1">
            <ZdsRadio
              name="adjuntoRespuestaFinal"
              control={control}
              label="¿Se adjunta PDF de respuesta final?"
              options={OPTIONS.adjuntoRespuestaFinal}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('adjuntoRespuestaFinal')}
            />
          </div>

          {w.adjuntoRespuestaFinal === 'SI' && (
            <div className="form-row cols-1">
              <div className="form-group">
                <label className="form-label">
                  PDF Respuesta Final <span className="required-star">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  className="cierre-m3--file-input"
                  {...register('pdfRespuestaFinal')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue('pdfRespuestaFinal', file.name);
                      fileRegistry.current.set('pdfRespuestaFinal', file);
                    }
                  }}
                />
                {w.pdfRespuestaFinal && (
                  <p className={`cierre-m3--form-helper ${pdfValido ? 'cierre-m3--validacion-ok' : 'cierre-m3--validacion-error'}`}>
                    {pdfValido
                      ? `✓ Nomenclatura correcta: ${w.pdfRespuestaFinal}`
                      : `✗ Nomenclatura inválida. Formato esperado: ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf`}
                  </p>
                )}
              </div>
            </div>
          )}
        </FormSection>

        {/* Sección 4 — Datos de fraude (condicional) */}
        <FormSection title="Datos de Fraude">
          <div className="form-row cols-1">
            <ZdsRadio
              name="relacionadaFraude"
              control={control}
              label="¿Queja relacionada con fraude?"
              options={OPTIONS.siNo}
              error={err('relacionadaFraude')}
            />
          </div>

          {w.relacionadaFraude === 'SI' && (
            <>
              <div className="form-row cols-1">
                <ZdsSelect
                  name="tipoFraude"
                  control={control}
                  label="Tipo de Fraude"
                  options={tipoFraudeOpts}
                  rules={{ required: 'Campo requerido' }}
                  required
                  error={err('tipoFraude')}
                />
              </div>
              <div className="form-row cols-2">
                <ZdsInput
                  name="montoReclamado"
                  control={control}
                  label="Monto Reclamado (COP)"
                  rules={{ required: 'Campo requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  required
                  error={err('montoReclamado')}
                />
                <ZdsInput
                  name="montoReconocido"
                  control={control}
                  label="Monto Reconocido (COP)"
                  rules={{ pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  error={err('montoReconocido')}
                />
              </div>
            </>
          )}
        </FormSection>

        {/* Barra de acciones */}
        <div className="actions-bar">
          <ZrButton config="secondary" onClick={() => window.history.back()}>Cancelar</ZrButton>
          <ZrButton
            config="secondary"
            disabled={submitting}
            onClick={() => completeTask({ ...w, _draft: true } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton
            config="positive"
            onClick={() => { handleSubmit(onSubmit)(); }}
            loading={submitting}
            disabled={submitting || !puedeEnviar}
          >
            {esRechazado ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'}
          </ZrButton>
        </div>
      </form>
    </div>
  );
}
