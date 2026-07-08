import { useState, type MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsSelect, ZdsTextarea, ZdsInput, ZrAlert, ZrButton } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import {
  QD, QD_COLLECTIONS, SCR0051_OPTIONS_FAVOR as OPTIONS_FAVOR,
  SCR0051_ADJUNTO_KEYS as ADJUNTO_KEYS, SCR0051_MAX_SOPORTES as MAX_SOPORTES,
} from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData } from '../fields/fields';

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
  err: (name: keyof DetalleReasignacionRespuestaFormData) => string | undefined;
  onVistaPrevia: () => void;
  onSolicitarProrroga: () => void;
  slaCritico: boolean;
  submitting: boolean;
}

/** S8 Respuesta Técnica · S9 Soportes Internos · S10 Configuración de Respuesta. */
export default function SeccionRespuesta({ form, fileRegistry, err, onVistaPrevia, onSolicitarProrroga, slaCritico, submitting }: Props) {
  const { control, watch } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // RUL-0051-09 — "Acciones Tomadas" visible solo si la respuesta es a favor del Cliente.
  const blnShowActions = objWatch[QD.strReplyFavorOf] === 'CLIENTE';

  // ACT-0051-04 — flujo de prórroga en dos pasos: primero se elige el motivo, luego se envía.
  const [blnExtensionMode, setBlnExtensionMode] = useState(false);
  // Cargamos el catálogo de motivos de prórroga.
  const { options: cllExtensionReason } = useCollection(QD_COLLECTIONS.extensionReason);
  const blnCanSendExt = !!objWatch[QD.strExtensionReason];

  return (
    <>
      {/* ── S10 · Configuración de Respuesta (SEC-056) ── */}
      {/* Se ubica antes de la respuesta porque condiciona qué campos se muestran. */}
      <FormSection title="Configuración de Respuesta">
        <div className="form-row cols-2">
          <ZdsSelect
            name={QD.strReplyFavorOf} control={control} label="Respuesta a favor de"
            options={OPTIONS_FAVOR} required
            rules={{ required: 'Campo requerido' }} error={err(QD.strReplyFavorOf)}
            helpText="⚠ Pendiente catálogo (CAT-FAVOR). Indica a quién favorece la resolución."
          />
          <div />
        </div>
      </FormSection>

      {/* ── S8 · Elaboración de Respuesta Técnica (SEC-054) ── */}
      <FormSection title="Elaboración de Respuesta Técnica">
        {/* Visible solo si el Analista SAC devolvió el caso con observaciones (FLD-131, SCR-008). */}
        {!!objWatch[QD.strSacRemarks]?.trim() && (
          <div className="form-row cols-1">
            <ZdsTextarea
              name={QD.strSacRemarks} control={control} label="Observaciones SAC" readOnly
              helpText="Devuelto por el Analista SAC en la revisión de respuesta."
            />
          </div>
        )}

        <div className="form-row cols-1">
          <ZdsTextarea
            name={QD.strClientResponse} control={control} label="Respuesta al Cliente (borrador)"
            required maxLength={5000}
            rules={{ required: 'Campo requerido' }} error={err(QD.strClientResponse)}
            helpText="Este texto irá en la carta PDF de respuesta final (RUL-0051-05)."
          />
        </div>

        {blnShowActions && (
          <div className="form-row cols-1">
            <ZdsTextarea
              name={QD.strActionsTaken} control={control} label="Acciones Tomadas"
              maxLength={2000}
              helpText="Visible porque la respuesta es a favor del Cliente (RUL-0051-09)."
            />
          </div>
        )}

        <div className="form-row cols-1">
          <ZdsInput name={QD.strAcknowledgment} control={control} label="¿Reconocimiento al cliente?" readOnly
            helpText="Se calcula en el back — solo lectura." />
        </div>
      </FormSection>

      {/* ── S9 · Soportes Internos (SEC-055, FLD-113) ── */}
      <FormSection title="Soportes Internos">
        <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
          Estos adjuntos son de uso interno: <strong>no van al cliente ni a la SFC</strong>.
        </ZrAlert>
        <DocSupportUploader
          form={form}
          fileRegistry={fileRegistry}
          docKeys={ADJUNTO_KEYS}
          title="Adjuntos internos de soporte"
          intro={`Cargue los documentos de soporte del análisis. Se pueden agregar hasta ${MAX_SOPORTES} archivos.`}
          max={MAX_SOPORTES}
        />
        {/* ACT-0051-04 — al pedir prórroga se muestra el motivo (CAT-MOTIVO-PRORROGA); el
            botón Enviar aparece recién con el motivo elegido y hace submit SOLICITAR_PRORROGA. */}
        {blnExtensionMode && (
          <div className="form-row cols-1" style={{ marginTop: 'var(--zs-75)' }}>
            <ZdsSelect
              name={QD.strExtensionReason} control={control} label="Motivo de la prórroga"
              options={cllExtensionReason} withSearch required
              helpText="Catálogo CAT-MOTIVO-PRORROGA (motivo_prorr)."
            />
          </div>
        )}

        <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-75)' }}>
          <ZrButton config="secondary" onClick={onVistaPrevia}>
            Vista Previa Respuesta Final
          </ZrButton>
          {!blnExtensionMode ? (
            <ZrButton config="secondary"
              disabled={!slaCritico || submitting}
              onClick={() => setBlnExtensionMode(true)}>
              Solicitar Prórroga Regulatoria
            </ZrButton>
          ) : (
            <>
              <ZrButton config="secondary" disabled={submitting} onClick={() => setBlnExtensionMode(false)}>
                Cancelar
              </ZrButton>
              <ZrButton config="positive"
                disabled={!blnCanSendExt || submitting} loading={submitting}
                onClick={onSolicitarProrroga}>
                Enviar Prórroga ▶
              </ZrButton>
            </>
          )}
        </div>
      </FormSection>
    </>
  );
}
