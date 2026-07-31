import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsRadio, ZdsSelect, ZdsInput } from '../../../../components/fields/ZdsFields';
import RequestFileList from '../../../../components/RequestFileList';
import { resolveFileId } from '../../../../core/useRequestFiles';
import { useCollection, useSyncDesc } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO } from '../fields/fields';
import type { FormularioSuperintendenciaFormData } from '../fields/fields';
import { Ro } from './FormularioSuperintendencia';

interface Props {
  form: UseFormReturn<FormularioSuperintendenciaFormData>;
  err: (name: keyof FormularioSuperintendenciaFormData) => string | undefined;
  requestId: number | null;
}

/** S4 Datos de Fraude (tipo/modalidad/montos editables) · S5 Anexos del Formulario (editables). */
export default function SeccionFraudeAnexos({ form, err, requestId }: Props) {
  const { control, watch } = form;
  const objWatch = watch();

  // Cargamos los catalogos de fraude (Tipo/Modalidad son selects respaldados por colección)
  const { options: cllFraudType } = useCollection(QD_COLLECTIONS.fraudType);
  const { options: cllFraudModality } = useCollection(QD_COLLECTIONS.fraudModality);

  // Sincroniza la variable compañera <campo>_desc con la descripción del código (para PM4).
  useSyncDesc(form, QD.strFraudType, cllFraudType);
  useSyncDesc(form, QD.strFraudModality, cllFraudModality);

  // ¿Relacionada con Fraude? sigue siendo "Back" (Excel PQRS V3.0 #60): la fija
  // el cierre/responsable → solo lectura. Tipo, modalidad y montos SÍ son
  // editables por el Analista SAC (Excel #57/#58/#61) y obligatorios cuando
  // aplica (RUL-009-01 / MSG-009-01).
  const blnIsFraud = objWatch[QD.strFraudRelated] === 'SI';
  const objFraudReq = blnIsFraud ? { required: 'Campo requerido' } : undefined;

  // FLD-165 — el payload trae el id de PM4 del PDF (no un nombre fijo: el
  // nombrado del PDF es decisión de negocio y puede cambiar), p.ej.
  // { output_slip_final: 1713 } → qd_strFinalReplyPdf.
  const intFinalReplyFileId = resolveFileId(objWatch[QD.strFinalReplyPdf]);

  return (
    <>
      {/* ── S4 · Datos de Fraude CE-019-2024 (SEC-031) ── */}
      <FormSection title="Datos de Fraude CE-019-2024">
        <div className="form-row cols-1">
          <Ro label="¿Relacionada con Fraude?" value={blnIsFraud ? 'Sí' : 'No'} />
        </div>

        {blnIsFraud && (
          <>
            <div className="form-row cols-2">
              <ZdsSelect name={QD.strFraudType} control={control} label="Tipo de Fraude"
                options={cllFraudType} required rules={objFraudReq} error={err(QD.strFraudType)} />
              <ZdsSelect name={QD.strFraudModality} control={control} label="Modalidad de Fraude"
                options={cllFraudModality} required rules={objFraudReq} error={err(QD.strFraudModality)} />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name={QD.strClaimedAmount} control={control} label="Monto Reclamado (COP)"
                required rules={objFraudReq} error={err(QD.strClaimedAmount)} />
              <ZdsInput name={QD.strAcknowledgedAmount} control={control} label="Monto Reconocido (COP)"
                required rules={objFraudReq} error={err(QD.strAcknowledgedAmount)} />
            </div>
          </>
        )}
      </FormSection>

      {/* ── S5 · Anexos del Formulario (SEC-032) ── */}
      <FormSection title="Anexos del Formulario">
        <div className="form-row cols-2">
          {/* FLD-163/164 — siempre "Sí" (Excel #163/164): se muestran fijos y de solo lectura. */}
          <ZdsRadio name={QD.strIncludesComplaintAnnex} control={control} label="¿Incluye Anexos a la Queja?"
            options={OPTIONS_SI_NO} inline required disabled
            rules={{ required: 'Campo requerido' }} error={err(QD.strIncludesComplaintAnnex)} />
          <ZdsRadio name={QD.strIncludesReplyAttach} control={control} label="¿Incluye Adjunto Respuesta Final?"
            options={OPTIONS_SI_NO} inline required disabled
            rules={{ required: 'Campo requerido' }} error={err(QD.strIncludesReplyAttach)} />
        </div>
        <RequestFileList
          requestId={requestId}
          fileIds={[intFinalReplyFileId]}
          label="PDF Respuesta Final (generado)"
          emptyText="Aún no se ha generado el PDF de respuesta final."
          loadingText="Buscando el PDF de respuesta final…"
        />
        {/* Prórroga (código) — "Back", automático (Excel PQRS V3.0 #55). */}
        <div className="form-row cols-2">
          <Ro label="Prórroga (días, si aplica)" value={objWatch[QD.strExtensionDays] || '1'} />
          <div />
        </div>
      </FormSection>
    </>
  );
}
