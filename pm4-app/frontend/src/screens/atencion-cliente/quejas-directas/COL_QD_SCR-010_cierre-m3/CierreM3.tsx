import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsDate, ZdsRadio, ZdsFileInput, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { OPTIONS, COLLECTION_DEFS, REGEX_NOMENCLATURA_PDF, CierreM3FormData } from './variables';
import SeccionEstadoCierre from './SeccionEstadoCierre';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import pm4 from '../../../../api/pm4Client';

export default function CierreM3() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();
  const dicFileRegistry = useRef(new Map<string, File>());

  // Inicializamos el formulario con los valores por defecto
  const { control, watch, handleSubmit, reset, setValue, setError, clearErrors, formState: { errors, isSubmitted } } = useForm<CierreM3FormData>({
    defaultValues: {
      qd_estadoCierreM3: '', qd_intentosCierreM3: '0', qd_ultimoError: '',
      qd_codigoSFC: '', qd_estadoQueja: '', qd_fechaActualizacion: '', qd_fechaCierre: '',
      qd_favorabilidad: '', qd_aceptacion: '', qd_marcacion: '', qd_quejaExpres: '',
      qd_pdfRespuestaFinal: '', qd_validacionNomenclatura: '', qd_adjuntoRespuestaFinal: '',
      qd_relacionadaFraude: '', qd_tipoFraude: '', qd_montoReclamado: '', qd_montoReconocido: '',
    },
  });

  const objWatch = watch();

  // Cargamos los catalogos de las listas desplegables
  const { options: cllComplaintStatus } = useCollection(COLLECTION_DEFS.estadoQueja);
  const { options: cllFavorability } = useCollection(COLLECTION_DEFS.favorabilidad);
  const { options: cllAcceptance } = useCollection(COLLECTION_DEFS.aceptacion);
  const { options: cllMarking } = useCollection(COLLECTION_DEFS.marcacion);
  const { options: cllExpressComplaint } = useCollection(COLLECTION_DEFS.quejaExpres);
  const { options: cllFraudType } = useCollection(COLLECTION_DEFS.tipoFraude);

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset(task.data as Partial<CierreM3FormData>);
  }, [task, reset]);

  // RUL-010-01: fechaActualizacion debe coincidir con fechaCierre
  const blnDatesMatch = !objWatch.qd_fechaActualizacion || !objWatch.qd_fechaCierre || objWatch.qd_fechaActualizacion === objWatch.qd_fechaCierre;
  // RUL-010-02: PDF con nomenclatura correcta si se adjunta
  const blnPdfValid = !objWatch.qd_pdfRespuestaFinal || REGEX_NOMENCLATURA_PDF.test(objWatch.qd_pdfRespuestaFinal);
  // RUL-010-03: todos los obligatorios completos + reglas anteriores
  const arrRequiredFields: (keyof CierreM3FormData)[] = [
    'qd_codigoSFC', 'qd_estadoQueja', 'qd_fechaActualizacion', 'qd_fechaCierre',
    'qd_favorabilidad', 'qd_aceptacion', 'qd_marcacion', 'qd_quejaExpres', 'qd_adjuntoRespuestaFinal',
  ];
  const blnAllComplete = arrRequiredFields.every(strField => !!objWatch[strField]);
  const blnCanSubmit = blnDatesMatch && blnPdfValid && blnAllComplete;

  const blnRejected = objWatch.qd_estadoCierreM3 === 'Rechazado (400)';

  const err = (in_strField: keyof CierreM3FormData) => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  const onSubmit = async (in_objData: CierreM3FormData) => {
    if (!blnCanSubmit) return;
    try {
      // Subimos primero los archivos adjuntos al request
      const intRequestId = task?.process_request_id;
      if (intRequestId) {
        for (const [strDocKey, objFile] of dicFileRegistry.current.entries()) {
          const objFormData = new FormData();
          objFormData.append('file', objFile);
          await pm4.post(`/requests/${intRequestId}/files?data_name=${strDocKey}`, objFormData);
        }
      }
      // Completamos la tarea con los datos del formulario
      await completeTask(in_objData as unknown as Record<string, unknown>);
    } catch (excError) {
      console.error('[CierreM3] Error al enviar:', excError);
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
            estadoCierreM3={objWatch.qd_estadoCierreM3}
            intentosCierreM3={objWatch.qd_intentosCierreM3}
            ultimoError={objWatch.qd_ultimoError}
          />
          <div className="form-row cols-1">
            <ZdsInput
              name="qd_codigoSFC"
              control={control}
              label="Código SFC / Número de Radicado"
              rules={{ required: 'Campo requerido', maxLength: { value: 100, message: 'Máximo 100 caracteres' } }}
              required
              error={err('qd_codigoSFC')}
            />
          </div>
          {blnRejected && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>Envío rechazado por SFC.</strong> Revise el error indicado, corrija los datos y reenvíe.
            </ZrAlert>
          )}
        </FormSection>

        {/* Sección 2 — Datos de cierre */}
        <FormSection title="Datos de Cierre Regulatorio">
          <div className="form-row cols-1">
            <ZdsSelect
              name="qd_estadoQueja"
              control={control}
              label="Estado de la Queja"
              options={cllComplaintStatus}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_estadoQueja')}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsDate
              name="qd_fechaActualizacion"
              control={control}
              label="Fecha de Actualización"
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_fechaActualizacion')}
            />
            <ZdsDate
              name="qd_fechaCierre"
              control={control}
              label="Fecha de Cierre"
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_fechaCierre')}
            />
          </div>

          {!blnDatesMatch && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La Fecha de Actualización debe coincidir con la Fecha de Cierre (RUL-010-01).
            </ZrAlert>
          )}

          <div className="form-row cols-2">
            <ZdsSelect
              name="qd_favorabilidad"
              control={control}
              label="Favorabilidad"
              options={cllFavorability}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_favorabilidad')}
            />
            <ZdsSelect
              name="qd_aceptacion"
              control={control}
              label="Aceptación"
              options={cllAcceptance}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_aceptacion')}
            />
          </div>

          <div className="form-row cols-2">
            <ZdsSelect
              name="qd_marcacion"
              control={control}
              label="Marcación"
              options={cllMarking}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_marcacion')}
            />
            <ZdsSelect
              name="qd_quejaExpres"
              control={control}
              label="Queja Exprés"
              options={cllExpressComplaint}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_quejaExpres')}
            />
          </div>
        </FormSection>

        {/* Sección 3 — Adjunto respuesta final */}
        <FormSection title="Adjunto Respuesta Final al Consumidor">
          <div className="form-row cols-1">
            <ZdsRadio
              name="qd_adjuntoRespuestaFinal"
              control={control}
              label="¿Se adjunta PDF de respuesta final?"
              options={OPTIONS.adjuntoRespuestaFinal}
              rules={{ required: 'Campo requerido' }}
              required
              error={err('qd_adjuntoRespuestaFinal')}
            />
          </div>

          {objWatch.qd_adjuntoRespuestaFinal === 'SI' && (
            <div className="form-row cols-1">
              <ZdsFileInput
                control={control}
                name="qd_pdfRespuestaFinal"
                label="PDF Respuesta Final"
                fileRegistry={dicFileRegistry}
                setValue={setValue}
                setError={setError}
                clearErrors={clearErrors}
                allowedExtensions={['pdf']}
                maxSizeMb={5}
                errorMessage="Solo se permiten archivos PDF, máx 5 MB"
              />
              {objWatch.qd_pdfRespuestaFinal && (
                <p className={`cierre-m3--form-helper ${blnPdfValid ? 'cierre-m3--validacion-ok' : 'cierre-m3--validacion-error'}`}>
                  {blnPdfValid
                    ? `✓ Nomenclatura correcta: ${objWatch.qd_pdfRespuestaFinal}`
                    : `✗ Nomenclatura inválida. Formato esperado: ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf`}
                </p>
              )}
            </div>
          )}
        </FormSection>

        {/* Sección 4 — Datos de fraude (condicional) */}
        <FormSection title="Datos de Fraude">
          <div className="form-row cols-1">
            <ZdsRadio
              name="qd_relacionadaFraude"
              control={control}
              label="¿Queja relacionada con fraude?"
              options={OPTIONS.siNo}
              error={err('qd_relacionadaFraude')}
            />
          </div>

          {objWatch.qd_relacionadaFraude === 'SI' && (
            <>
              <div className="form-row cols-1">
                <ZdsSelect
                  name="qd_tipoFraude"
                  control={control}
                  label="Tipo de Fraude"
                  options={cllFraudType}
                  rules={{ required: 'Campo requerido' }}
                  required
                  error={err('qd_tipoFraude')}
                />
              </div>
              <div className="form-row cols-2">
                <ZdsInput
                  name="qd_montoReclamado"
                  control={control}
                  label="Monto Reclamado (COP)"
                  rules={{ required: 'Campo requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  required
                  error={err('qd_montoReclamado')}
                />
                <ZdsInput
                  name="qd_montoReconocido"
                  control={control}
                  label="Monto Reconocido (COP)"
                  rules={{ pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números (ej: 1500000)' } }}
                  error={err('qd_montoReconocido')}
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
            onClick={() => completeTask({ ...objWatch, _draft: true } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton
            config="positive"
            onClick={() => { handleSubmit(onSubmit)(); }}
            loading={submitting}
            disabled={submitting || !blnCanSubmit}
          >
            {blnRejected ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'}
          </ZrButton>
        </div>
      </form>
    </div>
  );
}
