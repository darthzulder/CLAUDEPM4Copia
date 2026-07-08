import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsSelect, ZdsInput, ZdsRadio, ZrButton, ZrAlert } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO } from '../fields/fields';
import type { FormularioSuperintendenciaFormData } from '../fields/fields';

interface Props {
  form: UseFormReturn<FormularioSuperintendenciaFormData>;
  err: (name: keyof FormularioSuperintendenciaFormData) => string | undefined;
}

// COP como texto numérico (el DS no expone inputType="number"; ver DOCUMENTACION §10).
const objAmountOnly = { pattern: { value: /^\d+$/, message: 'Solo dígitos (COP)' } };

/** S4 Datos de Fraude (condicional) · S5 Anexos del Formulario. */
export default function SeccionFraudeAnexos({ form, err }: Props) {
  const { control, watch } = form;
  const objWatch = watch();

  // Cargamos los catalogos de fraude
  const { options: cllFraudType } = useCollection(QD_COLLECTIONS.fraudType);
  const { options: cllFraudModality } = useCollection(QD_COLLECTIONS.fraudModality);

  // RUL-009-01 — campos de fraude visibles y obligatorios si relacionadaFraude = Sí.
  const blnIsFraud = objWatch[QD.strFraudRelated] === 'SI';
  const objFraudReq = blnIsFraud ? { required: 'Campo requerido' } : {};

  return (
    <>
      {/* ── S4 · Datos de Fraude CE-019-2024 (SEC-031, condicional) ── */}
      <FormSection title="Datos de Fraude CE-019-2024">
        <div className="form-row cols-1">
          <ZdsRadio
            name={QD.strFraudRelated} control={control} label="¿Relacionada con Fraude?"
            options={OPTIONS_SI_NO} inline required
            rules={{ required: 'Campo requerido' }} error={err(QD.strFraudRelated)}
          />
        </div>

        {blnIsFraud && (
          <>
            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              La queja está relacionada con fraude. Complete los campos requeridos por
              <strong> CE 019/2024</strong>: Tipo, Modalidad y Montos. {/* MSG-009-01 */}
            </ZrAlert>
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strFraudType} control={control} label="Tipo de Fraude"
                options={cllFraudType} required rules={objFraudReq} error={err(QD.strFraudType)}
                helpText="CAT-TIPO-FRAUDE (CE 019/2024)." />
              <ZdsSelect name={QD.strFraudModality} control={control} label="Modalidad de Fraude"
                options={cllFraudModality} required rules={objFraudReq} error={err(QD.strFraudModality)}
                helpText="CAT-MOD-FRAUDE (CE 019/2024)." />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={QD.strClaimedAmount} control={control} label="Monto Reclamado (COP)"
                required rules={{ ...objFraudReq, ...objAmountOnly }} error={err(QD.strClaimedAmount)} />
              <ZdsInput name={QD.strAcknowledgedAmount} control={control} label="Monto Reconocido (COP)"
                required rules={{ ...objFraudReq, ...objAmountOnly }} error={err(QD.strAcknowledgedAmount)} />
            </div>
          </>
        )}
      </FormSection>

      {/* ── S5 · Anexos del Formulario (SEC-032) ── */}
      <FormSection title="Anexos del Formulario">
        <div className="form-row cols-2">
          <ZdsRadio name={QD.strIncludesComplaintAnnex} control={control} label="¿Incluye Anexos a la Queja?"
            options={OPTIONS_SI_NO} inline required
            rules={{ required: 'Campo requerido' }} error={err(QD.strIncludesComplaintAnnex)} />
          <ZdsRadio name={QD.strIncludesReplyAttach} control={control} label="¿Incluye Adjunto Respuesta Final?"
            options={OPTIONS_SI_NO} inline required
            rules={{ required: 'Campo requerido' }} error={err(QD.strIncludesReplyAttach)} />
        </div>
        <div className="form-row cols-2 row-align-bottom">
          <ZdsInput name={QD.strFinalReplyPdf} control={control} label="PDF Respuesta Final (generado)" readOnly
            helpText="Generado por SP2-T06. Solo descarga." />
          <div className="field-wrap">
            <ZrButton config="secondary" icon="download:line"
              disabled={!objWatch[QD.strFinalReplyPdf]}
              onClick={() => { if (objWatch[QD.strFinalReplyPdf]) window.open(objWatch[QD.strFinalReplyPdf], '_blank'); }}>
              Descargar PDF
            </ZrButton>
          </div>
        </div>
        <div className="form-row cols-2">
          <ZdsInput name={QD.strExtensionDays} control={control} label="Prórroga (días, si aplica)"
            rules={objAmountOnly} error={err(QD.strExtensionDays)}
            helpText="Solo cuando el caso viene de SP4." />
          <div />
        </div>
      </FormSection>
    </>
  );
}
