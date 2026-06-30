import type { MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsSelect, ZdsTextarea, ZdsInput, ZrAlert } from '../../../../components/fields/ZdsFields';
import {
  OPTIONS, ADJUNTO_KEYS, MAX_SOPORTES,
  type DetalleReasignacionRespuestaFormData,
} from './variables';

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
  err: (name: keyof DetalleReasignacionRespuestaFormData) => string | undefined;
}

/** S8 Respuesta Técnica · S9 Soportes Internos · S10 Configuración de Respuesta. */
export default function SeccionRespuesta({ form, fileRegistry, err }: Props) {
  const { control, watch } = form;
  const w = watch();

  // RUL-0051-09 — "Acciones Tomadas" visible solo si la respuesta es a favor del Cliente.
  const mostrarAcciones = w.qd_respuestaFavorDe === 'CLIENTE';

  return (
    <>
      {/* ── S10 · Configuración de Respuesta (SEC-056) ── */}
      {/* Se ubica antes de la respuesta porque condiciona qué campos se muestran. */}
      <FormSection title="Configuración de Respuesta">
        <div className="form-row cols-2">
          <ZdsSelect
            name="qd_respuestaFavorDe" control={control} label="Respuesta a favor de"
            options={OPTIONS.favor} required
            rules={{ required: 'Campo requerido' }} error={err('qd_respuestaFavorDe')}
            helpText="⚠ Pendiente catálogo (CAT-FAVOR). Indica a quién favorece la resolución."
          />
          <div />
        </div>
      </FormSection>

      {/* ── S8 · Elaboración de Respuesta Técnica (SEC-054) ── */}
      <FormSection title="Elaboración de Respuesta Técnica">
        <div className="form-row cols-1">
          <ZdsTextarea
            name="qd_respuestaCliente" control={control} label="Respuesta al Cliente (borrador)"
            required maxLength={5000}
            rules={{ required: 'Campo requerido' }} error={err('qd_respuestaCliente')}
            helpText="Este texto irá en la carta PDF de respuesta final (RUL-0051-05)."
          />
        </div>

        {mostrarAcciones && (
          <div className="form-row cols-1">
            <ZdsTextarea
              name="qd_accionesTomadas" control={control} label="Acciones Tomadas"
              maxLength={2000}
              helpText="Visible porque la respuesta es a favor del Cliente (RUL-0051-09)."
            />
          </div>
        )}

        <div className="form-row cols-1">
          <ZdsInput name="qd_reconocimiento" control={control} label="¿Reconocimiento al cliente?" readOnly
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
      </FormSection>
    </>
  );
}
