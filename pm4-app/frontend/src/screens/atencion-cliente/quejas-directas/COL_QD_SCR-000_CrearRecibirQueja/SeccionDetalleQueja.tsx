import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsTextarea } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO, SCR000_ADJUNTO_KEYS as ADJUNTO_KEYS } from '../campos/fields';
import type { CrearRecibirQuejaFormData } from '../campos/fields';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
}

export default function SeccionDetalleQueja({ form, fileRegistry }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de la seccion de detalle de la queja.
  const { options: cllInsurance } = useCollection(QD_COLLECTIONS.sfcProduct);
  // Shim de dependencia: la clave 'qd_productoSFC' es una convención interna que NO
  // coincide con el dependsOn:'qd_seguro' de esta colección (bug preexistente,
  // preservado — ver campos/MAPEO_qd_old_new.md #3). Solo se renombra la lectura
  // del campo real.
  const { options: cllProductDetail } = useCollection(QD_COLLECTIONS.productDetail, { qd_productoSFC: objWatch[QD.strSfcProduct] });
  const { options: cllReason } = useCollection(QD_COLLECTIONS.sfcReason);
  const { options: cllAdmission } = useCollection(QD_COLLECTIONS.admission);
  const { options: cllControlEntity } = useCollection(QD_COLLECTIONS.controlEntity);
  const { options: cllGuardianship } = useCollection(QD_COLLECTIONS.tutela);
  const { options: cllExpressComplaint } = useCollection(QD_COLLECTIONS.expressComplaint);

  // Determinamos si el rol radicador es el Defensor.
  const blnIsDefender = objWatch[QD.strFilerRole] === 'DEFENSOR';

  // FLD-327 — escalamiento al Defensor computado (back): Defensor → "Sí".
  useEffect(() => {
    setValue(QD.strOmbudsmanEscalation, blnIsDefender ? 'Sí' : 'No');
  }, [blnIsDefender, setValue]);

  // FLD-324 — detalle del producto: primer código de CAT-DETALLE-PRODUCTO para el seguro elegido.
  useEffect(() => {
    setValue(QD.strProductDetail, cllProductDetail[0]?.label ?? '');
  }, [cllProductDetail, setValue]);

  // FLD-331 — admisión por defecto "No aplica" (rol ≠ Defensor), resuelta desde CAT-ADMISION.
  useEffect(() => {
    if (blnIsDefender || objWatch[QD.strAdmission] || cllAdmission.length === 0) return;
    const objNotApplicable = cllAdmission.find((o) => /no aplica/i.test(o.label));
    if (objNotApplicable) setValue(QD.strAdmission, objNotApplicable.label);
  }, [blnIsDefender, objWatch[QD.strAdmission], cllAdmission, setValue]);

  // FLD-332 — ente de control por defecto "Otros", resuelto desde CAT-ENTE.
  useEffect(() => {
    if (objWatch[QD.strControlEntity] || cllControlEntity.length === 0) return;
    const objOthers = cllControlEntity.find((o) => /otros/i.test(o.label));
    if (objOthers) setValue(QD.strControlEntity, objOthers.label);
  }, [objWatch[QD.strControlEntity], cllControlEntity, setValue]);

  // FLD-333 — tutela por defecto "No", resuelta desde CAT-TUTELA.
  useEffect(() => {
    if (objWatch[QD.strTutela] || cllGuardianship.length === 0) return;
    const objNo = cllGuardianship.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue(QD.strTutela, objNo.label);
  }, [objWatch[QD.strTutela], cllGuardianship, setValue]);

  // FLD-334 — queja exprés por defecto "No", resuelta desde CAT-EXPRES.
  useEffect(() => {
    if (objWatch[QD.strExpressComplaint] || cllExpressComplaint.length === 0) return;
    const objNo = cllExpressComplaint.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue(QD.strExpressComplaint, objNo.label);
  }, [objWatch[QD.strExpressComplaint], cllExpressComplaint, setValue]);

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;

  return (
    <FormSection title="Detalle de la Queja">
      <div className="form-row cols-2">
        <ZdsSelect
          name={QD.strSfcProduct}
          control={control}
          label="Selecciona el seguro"
          options={cllInsurance}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err(QD.strSfcProduct)}
        />
        <ZdsInput
          name={QD.strProductDetail}
          control={control}
          label="Detalle del producto"
          readOnly
          helpText="Asignado por el sistema (CAT-DETALLE-PRODUCTO)."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsRadio
          name={QD.strReply}
          control={control}
          label="¿Ya habías radicado previamente la misma queja o es una reconsideración?"
          options={OPTIONS_SI_NO}
          rules={{ required: 'Campo requerido' }}
          required
          inline
          error={err(QD.strReply)}
        />
        <ZdsInput
          name={QD.strOmbudsmanEscalation}
          control={control}
          label="Escalamiento al Defensor del Consumidor"
          readOnly
          helpText="Asignado por el sistema según la instancia."
        />
      </div>

      {/* RUL-000-12 — argumento visible solo si réplica = Sí */}
      {objWatch[QD.strReply] === 'SI' && (
        <div className="form-row cols-1">
          <ZdsTextarea
            name={QD.strReplyArgument}
            control={control}
            label="Argumento de la réplica"
            maxLength={2000}
          />
        </div>
      )}

      <div className="form-row cols-1">
        <ZdsSelect
          name={QD.strSfcReason}
          control={control}
          label="Cuéntanos el motivo"
          options={cllReason}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err(QD.strSfcReason)}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsTextarea
          name={QD.strComplaintText}
          control={control}
          label="Ingresa el detalle"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 50, message: 'Mínimo 50 caracteres (MSG-000-03)' },
            maxLength: { value: 2000, message: 'Máximo 2000 caracteres (MSG-000-03)' },
          }}
          required
          maxLength={2000}
          error={err(QD.strComplaintText)}
        />
      </div>

      {/* FLD-330 — adjuntos múltiples (pdf, jpg, png, docx · máx 5 MB c/u) */}
      <DocSupportUploader
        form={form}
        fileRegistry={fileRegistry}
        docKeys={ADJUNTO_KEYS}
        max={5}
        title="Ingresa archivos adjuntos"
        intro="Formatos permitidos: PDF, JPG, PNG, DOCX. Máximo 5 MB por archivo. Puede agregar hasta 5 documentos."
      />

      <div className="form-row cols-2">
        {blnIsDefender ? (
          <ZdsSelect
            name={QD.strAdmission}
            control={control}
            label="Admisión"
            options={cllAdmission}
            rules={{ required: 'Campo requerido' }}
            required
            error={err(QD.strAdmission)}
          />
        ) : (
          <ZdsInput
            name={QD.strAdmission}
            control={control}
            label="Admisión"
            readOnly
            helpText="Editable solo cuando el rol es Defensor del Consumidor."
          />
        )}
        <ZdsInput
          name={QD.strControlEntity}
          control={control}
          label="Ente de control"
          readOnly
          helpText="Asignado por el sistema (CAT-ENTE, por defecto: Otros)."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          name={QD.strTutela}
          control={control}
          label="Tutela"
          readOnly
          helpText="Asignada por el sistema (CAT-TUTELA, por defecto: No)."
        />
        <ZdsInput
          name={QD.strExpressComplaint}
          control={control}
          label="Queja Exprés"
          readOnly
          helpText="Asignada por el sistema (CAT-EXPRES, por defecto: No)."
        />
      </div>
    </FormSection>
  );
}
