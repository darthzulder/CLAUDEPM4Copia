import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsTextarea } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO, SCR000_ADJUNTO_KEYS as ADJUNTO_KEYS } from '../fields/fields';
import type { CrearRecibirQuejaFormData } from '../fields/fields';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
}

// ── Helpers de la matriz cat_matriz_motivos (id 45) ──────────────────────────
// Los datos vienen "sucios" (espacios sobrantes, comparación por texto), por eso
// normalizamos antes de comparar y derivamos las opciones en cliente.
const normalizar = (in_gen: unknown) => String(in_gen ?? '').trim().toLowerCase();

// Lee una columna del registro crudo de la matriz (los campos viven bajo `data`).
function leerColumna(in_objRow: Record<string, unknown>, in_strCol: string): string {
  const dicData = (in_objRow.data ?? in_objRow) as Record<string, unknown>;
  return String(dicData?.[in_strCol] ?? '').trim();
}

// Opciones únicas por value, descartando vacíos (una columna se repite en la matriz).
function opcionesUnicas(in_cll: { value: string; label: string }[]): { value: string; label: string }[] {
  const setSeen = new Set<string>();
  const cllOut: { value: string; label: string }[] = [];
  for (const objOpt of in_cll) {
    if (!objOpt.value || setSeen.has(objOpt.value)) continue;
    setSeen.add(objOpt.value);
    cllOut.push(objOpt);
  }
  return cllOut;
}

export default function SeccionDetalleQueja({ form, fileRegistry }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de la seccion de detalle de la queja.
  const { options: cllInsurance } = useCollection(QD_COLLECTIONS.sfcProduct);
  // Shim de dependencia: la clave 'qd_productoSFC' es una convención interna que NO
  // coincide con el dependsOn:'qd_seguro' de esta colección (bug preexistente,
  // preservado — ver fields/MAPEO_qd_old_new.md #3). Solo se renombra la lectura
  // del campo real.
  const { options: cllProductDetail } = useCollection(QD_COLLECTIONS.productDetail, { qd_productoSFC: objWatch[QD.strSfcProduct] });
  // Catálogo de tipo de solicitud: lo necesitamos para resolver el LABEL seleccionado
  // (la matriz filtra por texto "Queja"/"Vida", no por el código que guarda el form).
  const { options: cllRequestType } = useCollection(QD_COLLECTIONS.requestType);
  // Matriz cat_matriz_motivos (id 45) COMPLETA. La cascada momento → servicio → motivo
  // se deriva en cliente (abajo) por columnas de texto con espacios sobrantes.
  const { records: cllMatrizRows } = useCollection(QD_COLLECTIONS.matrixMotivos);
  const { options: cllAdmission } = useCollection(QD_COLLECTIONS.admission);
  const { options: cllControlEntity } = useCollection(QD_COLLECTIONS.controlEntity);
  const { options: cllGuardianship } = useCollection(QD_COLLECTIONS.tutela);
  const { options: cllExpressComplaint } = useCollection(QD_COLLECTIONS.expressComplaint);

  // Determinamos si el rol radicador es el Defensor del Consumidor (CAT-ROL-RADICADOR
  // código '4' — mismo código que usa la RUL-000-01 en CrearRecibirQueja.tsx para
  // resolver la instancia de recepción).
  const blnIsDefender = String(objWatch[QD.strFilerRole]) === '4';

  // Placa: solo aplica cuando el producto seleccionado es "Autos" (Anexo02 #25).
  // El seguro se guarda por código, así que resolvemos el nombre desde el catálogo.
  const objSelectedInsurance = cllInsurance.find((o) => o.value === objWatch[QD.strSfcProduct]);
  const blnIsAutos = /autos/i.test(objSelectedInsurance?.label ?? '');

  // Servicio: solo aplica cuando el momento (interacción) es "Asistencias" (Anexo02 #31).
  const blnIsAsistencias = /asistencias/i.test(objWatch[QD.strInteraction] ?? '');

  // ── Cascada cat_matriz_motivos derivada en cliente ─────────────────────────
  // La matriz filtra por el LABEL de tipo de solicitud y producto (guarda texto,
  // no código); resolvemos esos labels desde sus catálogos.
  const strRequestTypeLabel = cllRequestType.find((o) => o.value === objWatch[QD.strRequestType])?.label ?? '';
  const strProductLabel = objSelectedInsurance?.label ?? '';

  // Filas de la matriz que corresponden al tipo de solicitud + producto elegidos.
  const cllRowsForProduct = cllMatrizRows.filter((r) =>
    normalizar(leerColumna(r, 'tipoSolicitud')) === normalizar(strRequestTypeLabel) &&
    normalizar(leerColumna(r, 'productoZurich')) === normalizar(strProductLabel));

  // Momento (interacción) — opciones únicas de la columna `interaccion`.
  const cllInteraction = opcionesUnicas(cllRowsForProduct.map((r) => {
    const strVal = leerColumna(r, 'interaccion');
    return { value: strVal, label: strVal };
  }));

  // Filas del momento elegido.
  const cllRowsForInteraction = cllRowsForProduct.filter((r) =>
    normalizar(leerColumna(r, 'interaccion')) === normalizar(objWatch[QD.strInteraction]));

  // Servicio (`servicioPrestado`) — solo se muestra cuando el momento es "Asistencias".
  const cllService = opcionesUnicas(cllRowsForInteraction.map((r) => {
    const strVal = leerColumna(r, 'servicioPrestado');
    return { value: strVal, label: strVal };
  }));

  // Motivo — value = codigoMotivoSFC (código real), label = motivoSFC. Se filtra por
  // servicio solo cuando aplica (Asistencias); en otros momentos basta con el momento.
  const cllRowsForReason = blnIsAsistencias
    ? cllRowsForInteraction.filter((r) =>
        normalizar(leerColumna(r, 'servicioPrestado')) === normalizar(objWatch[QD.strServiceProvided]))
    : cllRowsForInteraction;
  const cllReason = opcionesUnicas(cllRowsForReason.map((r) => ({
    value: leerColumna(r, 'codigoMotivoSFC'),
    label: leerColumna(r, 'motivoSFC'),
  })));

  // Fila exacta de la matriz para el motivo elegido — de ella se extraen las
  // variables de ruteo/negocio que se envían al radicar (ver useEffect abajo).
  const objSelectedReasonRow = cllRowsForReason.find((r) =>
    normalizar(leerColumna(r, 'codigoMotivoSFC')) === normalizar(objWatch[QD.strSfcReason]));

  // RUL cascada — al cambiar un eslabón aguas arriba se limpia lo de aguas abajo para
  // forzar la reselección coherente (mismo patrón que ciudad↔departamento en S2).
  // Producto → momento.
  useEffect(() => {
    setValue(QD.strInteraction, '');
  }, [objWatch[QD.strRequestType], objWatch[QD.strSfcProduct], setValue]);

  // Momento → servicio.
  useEffect(() => {
    setValue(QD.strServiceProvided, '');
  }, [objWatch[QD.strInteraction], setValue]);

  // Cualquier eslabón de la cadena → motivo (y las variables derivadas de su fila,
  // que se recalculan en el efecto siguiente cuando se vuelva a elegir un motivo).
  useEffect(() => {
    setValue(QD.strSfcReason, '');
    setValue(QD.strResponsableRole, '');
    setValue(QD.strOmbudsmanEscalation, '');
    setValue(QD.strCompensation, '');
    setValue(QD.strSlaAssigned, '');
  }, [objWatch[QD.strRequestType], objWatch[QD.strSfcProduct], objWatch[QD.strInteraction], objWatch[QD.strServiceProvided], setValue]);

  // qd_strResponsableRole / qd_strOmbudsmanEscalation / qd_strCompensation / qd_strSlaAssigned
  // se extraen de la fila de cat_matriz_motivos que corresponde a la selección completa
  // del form (tipo solicitud + producto + momento + [servicio] + motivo), columnas
  // rolResponsable / escalamientoAdministrador / resarcimientoAdministrador / sla.
  useEffect(() => {
    if (!objSelectedReasonRow) return;
    setValue(QD.strResponsableRole, leerColumna(objSelectedReasonRow, 'rolResponsable'));
    setValue(QD.strOmbudsmanEscalation, leerColumna(objSelectedReasonRow, 'escalamientoAdministrador'));
    setValue(QD.strCompensation, leerColumna(objSelectedReasonRow, 'resarcimientoAdministrador'));
    setValue(QD.strSlaAssigned, leerColumna(objSelectedReasonRow, 'sla'));
  }, [objSelectedReasonRow, setValue]);

  // Placa fuera de "Autos" no debe conservar valor.
  useEffect(() => {
    if (!blnIsAutos && objWatch[QD.strPlate]) setValue(QD.strPlate, '');
  }, [blnIsAutos, objWatch[QD.strPlate], setValue]);

  // FLD-324 — detalle del producto: primer código de CAT-DETALLE-PRODUCTO para el seguro elegido.
  useEffect(() => {
    setValue(QD.strProductDetail, cllProductDetail[0]?.label ?? '');
  }, [cllProductDetail, setValue]);

  // FLD-331 — admisión: visible (select) solo cuando el rol es Defensor; en los demás
  // roles se oculta y se fija en "No aplica" (código 9, CAT-ADMISION).
  useEffect(() => {
    if (blnIsDefender || cllAdmission.length === 0) return;
    const objNotApplicable = cllAdmission.find((o) => o.value === '9')
      ?? cllAdmission.find((o) => /no aplica/i.test(o.label));
    if (objNotApplicable && objWatch[QD.strAdmission] !== objNotApplicable.label) {
      setValue(QD.strAdmission, objNotApplicable.label);
    }
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

      {/* Anexo02 #25 — placa: solo si el producto seleccionado es "Autos" */}
      {blnIsAutos && (
        <div className="form-row cols-2">
          <ZdsInput
            name={QD.strPlate}
            control={control}
            label="Ingrese la placa"
            rules={{ required: 'Campo requerido' }}
            required
            error={err(QD.strPlate)}
          />
          <div />
        </div>
      )}

      {/* Anexo02 #30/#31 — cascada cat_matriz_motivos: momento y (si aplica) servicio.
          El servicio solo aparece cuando el momento es "Asistencias". */}
      <div className="form-row cols-2">
        <ZdsSelect
          name={QD.strInteraction}
          control={control}
          label="Selecciona el momento"
          options={cllInteraction}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          disabled={!objWatch[QD.strSfcProduct]}
          placeholder={objWatch[QD.strSfcProduct] ? 'Seleccione el momento...' : 'Seleccione primero el seguro'}
          error={err(QD.strInteraction)}
        />
        {blnIsAsistencias ? (
          <ZdsSelect
            name={QD.strServiceProvided}
            control={control}
            label="Selecciona el servicio"
            options={cllService}
            rules={{ required: 'Campo requerido' }}
            required
            withSearch
            error={err(QD.strServiceProvided)}
          />
        ) : (
          <div />
        )}
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
          helpText="Asignado por el sistema (cat_matriz_motivos.escalamientoAdministrador, según el motivo elegido)."
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
          disabled={!objWatch[QD.strInteraction] || (blnIsAsistencias && !objWatch[QD.strServiceProvided])}
          placeholder={objWatch[QD.strInteraction] ? 'Seleccione el motivo...' : 'Complete primero el momento'}
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

      {/* Admisión: visible solo cuando el rol es Defensor; en los demás roles se oculta
          y queda fija en "No aplica" (código 9). Ente de control, Tutela y Queja Exprés
          son variables de back (se calculan y envían sin campo visible). */}
      {blnIsDefender && (
        <div className="form-row cols-2">
          <ZdsSelect
            name={QD.strAdmission}
            control={control}
            label="Admisión"
            options={cllAdmission}
            rules={{ required: 'Campo requerido' }}
            required
            error={err(QD.strAdmission)}
          />
          <div />
        </div>
      )}
    </FormSection>
  );
}
