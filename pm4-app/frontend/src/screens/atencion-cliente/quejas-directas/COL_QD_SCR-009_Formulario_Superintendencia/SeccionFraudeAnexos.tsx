import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsRadio } from '../../../../components/fields/ZdsFields';
import RequestFileList from '../../../../components/RequestFileList';
import { resolveFileId } from '../../../../core/useRequestFiles';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO } from '../fields/fields';
import type { FormularioSuperintendenciaFormData } from '../fields/fields';
import { Ro, descOpt } from './FormularioSuperintendencia';

interface Props {
  form: UseFormReturn<FormularioSuperintendenciaFormData>;
  err: (name: keyof FormularioSuperintendenciaFormData) => string | undefined;
  requestId: number | null;
}

/** S4 Datos de Fraude (solo lectura, Back) · S5 Anexos del Formulario (editables). */
export default function SeccionFraudeAnexos({ form, err, requestId }: Props) {
  const { control, watch } = form;
  const objWatch = watch();

  // Cargamos los catalogos de fraude (para resolver el label del código)
  const { options: cllFraudType } = useCollection(QD_COLLECTIONS.fraudType);
  const { options: cllFraudModality } = useCollection(QD_COLLECTIONS.fraudModality);

  // Fraude es "Back" (Excel PQRS V3.0 #57/#58/#60/#61): la relación con fraude,
  // el tipo, la modalidad y los montos los define el cierre/responsable, no el
  // Analista SAC → solo lectura.
  const blnIsFraud = objWatch[QD.strFraudRelated] === 'SI';

  // FLD-165 — el payload trae el id de PM4 del PDF (no un nombre fijo: el
  // nombrado del PDF es decisión de negocio y puede cambiar), p.ej.
  // { output_slip_final: 1713 } → qd_strFinalReplyPdf.
  const intFinalReplyFileId = resolveFileId(objWatch[QD.strFinalReplyPdf]);

  return (
    <>
      {/* ── S4 · Datos de Fraude CE-019-2024 (SEC-031, solo lectura) ── */}
      <FormSection title="Datos de Fraude CE-019-2024">
        <div className="form-row cols-1">
          <Ro label="¿Relacionada con Fraude?" value={blnIsFraud ? 'Sí' : 'No'} />
        </div>

        {blnIsFraud && (
          <>
            <div className="form-row cols-2">
              <Ro label="Tipo de Fraude" value={descOpt(cllFraudType, objWatch[QD.strFraudType])} />
              <Ro label="Modalidad de Fraude" value={descOpt(cllFraudModality, objWatch[QD.strFraudModality])} />
            </div>
            <div className="form-row cols-2">
              <Ro label="Monto Reclamado (COP)" value={objWatch[QD.strClaimedAmount] || '—'} />
              <Ro label="Monto Reconocido (COP)" value={objWatch[QD.strAcknowledgedAmount] || '—'} />
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
        <RequestFileList
          requestId={requestId}
          fileIds={[intFinalReplyFileId]}
          label="PDF Respuesta Final (generado)"
          emptyText="Aún no se ha generado el PDF de respuesta final."
          loadingText="Buscando el PDF de respuesta final…"
        />
        {/* Prórroga (días) — "Back", automático (Excel PQRS V3.0 #55). */}
        <div className="form-row cols-2">
          <Ro label="Prórroga (días, si aplica)" value={objWatch[QD.strExtensionDays] || '0'} />
          <div />
        </div>
      </FormSection>
    </>
  );
}
