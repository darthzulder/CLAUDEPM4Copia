import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsSelect, ZdsInput, ZdsRadio, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { OPTIONS, COLLECTION_DEFS, type FormularioSuperintendenciaFormData } from './variables';

interface Props {
  form: UseFormReturn<FormularioSuperintendenciaFormData>;
  err: (name: keyof FormularioSuperintendenciaFormData) => string | undefined;
}

// COP como texto numérico (el DS no expone inputType="number"; ver DOCUMENTACION §10).
const soloMonto = { pattern: { value: /^\d+$/, message: 'Solo dígitos (COP)' } };

/** S4 Datos de Fraude (condicional) · S5 Anexos del Formulario. */
export default function SeccionFraudeAnexos({ form, err }: Props) {
  const { control, watch } = form;
  const w = watch();

  const { options: tipoFraudeOpts } = useCollection(COLLECTION_DEFS.tipoFraude);
  const { options: modalidadFraudeOpts } = useCollection(COLLECTION_DEFS.modalidadFraude);

  // RUL-009-01 — campos de fraude visibles y obligatorios si relacionadaFraude = Sí.
  const esFraude = w.qd_relacionadaFraude === 'SI';
  const reqFraude = esFraude ? { required: 'Campo requerido' } : {};

  return (
    <>
      {/* ── S4 · Datos de Fraude CE-019-2024 (SEC-031, condicional) ── */}
      <FormSection title="Datos de Fraude CE-019-2024">
        <div className="form-row cols-1">
          <ZdsRadio
            name="qd_relacionadaFraude" control={control} label="¿Relacionada con Fraude?"
            options={OPTIONS.sino} inline required
            rules={{ required: 'Campo requerido' }} error={err('qd_relacionadaFraude')}
          />
        </div>

        {esFraude && (
          <>
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              La queja está relacionada con fraude. Complete los campos requeridos por
              <strong> CE 019/2024</strong>: Tipo, Modalidad y Montos. {/* MSG-009-01 */}
            </ZrAlert>
            <div className="form-row cols-2">
              <ZdsSelect name="qd_tipoFraude" control={control} label="Tipo de Fraude"
                options={tipoFraudeOpts} required rules={reqFraude} error={err('qd_tipoFraude')}
                helpText="CAT-TIPO-FRAUDE (CE 019/2024)." />
              <ZdsSelect name="qd_modalidadFraude" control={control} label="Modalidad de Fraude"
                options={modalidadFraudeOpts} required rules={reqFraude} error={err('qd_modalidadFraude')}
                helpText="CAT-MOD-FRAUDE (CE 019/2024)." />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_montoReclamado" control={control} label="Monto Reclamado (COP)"
                required rules={{ ...reqFraude, ...soloMonto }} error={err('qd_montoReclamado')} />
              <ZdsInput name="qd_montoReconocido" control={control} label="Monto Reconocido (COP)"
                required rules={{ ...reqFraude, ...soloMonto }} error={err('qd_montoReconocido')} />
            </div>
          </>
        )}
      </FormSection>

      {/* ── S5 · Anexos del Formulario (SEC-032) ── */}
      <FormSection title="Anexos del Formulario">
        <div className="form-row cols-2">
          <ZdsRadio name="qd_incluyeAnexosQueja" control={control} label="¿Incluye Anexos a la Queja?"
            options={OPTIONS.sino} inline required
            rules={{ required: 'Campo requerido' }} error={err('qd_incluyeAnexosQueja')} />
          <ZdsRadio name="qd_incluyeAdjuntoRespuesta" control={control} label="¿Incluye Adjunto Respuesta Final?"
            options={OPTIONS.sino} inline required
            rules={{ required: 'Campo requerido' }} error={err('qd_incluyeAdjuntoRespuesta')} />
        </div>
        <div className="form-row cols-2 row-align-bottom">
          <ZdsInput name="qd_pdfRespuestaFinal" control={control} label="PDF Respuesta Final (generado)" readOnly
            helpText="Generado por SP2-T06. Solo descarga." />
          <div className="field-wrap">
            <ZrButton config="secondary" icon="download:line"
              disabled={!w.qd_pdfRespuestaFinal}
              onClick={() => { if (w.qd_pdfRespuestaFinal) window.open(w.qd_pdfRespuestaFinal, '_blank'); }}>
              Descargar PDF
            </ZrButton>
          </div>
        </div>
        <div className="form-row cols-2">
          <ZdsInput name="qd_diasProrroga" control={control} label="Prórroga (días, si aplica)"
            rules={soloMonto} error={err('qd_diasProrroga')}
            helpText="Solo cuando el caso viene de SP4." />
          <div />
        </div>
      </FormSection>
    </>
  );
}
