import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsInput, ZdsSelect, ZdsCheckboxField, ZdsTextarea, ZrCheckbox } from '../../../../components/fields/ZdsFields';
import { useCollection, useSyncDesc, toUiOptions, uiValueFromCode, codeFromUiValue, labelFromUiValue } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, SCR000_ADJUNTO_KEYS as ADJUNTO_KEYS } from '../fields/fields';
import type { CrearRecibirQuejaFormData } from '../fields/fields';
import { PqrSection } from './PqrPage';

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
  // Shim de dependencia: la clave 'qd_strProductFilter' es una convención interna que
  // NO coincide con el dependsOn:'qd_strLegacyInsurance' de esta colección (bug
  // preexistente, preservado — ver fields/MAPEO_qd_old_new.md #3). Solo se renombra
  // la lectura del campo real.
  const { options: cllProductDetail } = useCollection(QD_COLLECTIONS.productDetail, { qd_strProductFilter: objWatch[QD.strSfcProduct] });
  // Catálogo de tipo de solicitud: su selector vive en S1 (CrearRecibirQueja.tsx, primer
  // campo del formulario); aquí solo se usa para resolver el LABEL con el que la matriz
  // filtra por texto.
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
  // resolver la instancia de recepción). Solo ese rol elige la admisión.
  const blnIsDefender = String(objWatch[QD.strFilerRole]) === '4';

  // FLD-323 — Selecciona el seguro: el catálogo (colección 16) repite el mismo código
  // (codigo_producto_sfc) en más de un registro — p.ej. "Garantía extendida" y
  // "Copropiedades" comparten el código 104. El picker no puede distinguir cuál de los
  // dos se clickeó si comparten `value`, así que se le pasan opciones con un value de UI
  // desambiguado (código + etiqueta, ver toUiOptions); el value real que guarda el form
  // y se envía a PM4 sigue siendo el código puro (ver ZdsSelect toPickerValue/fromPickerValue
  // más abajo). El companion `_desc` se sincroniza a mano con la etiqueta elegida —
  // useSyncDesc no podría distinguir el duplicado (ambos resuelven al mismo código).
  const cllInsuranceUi = toUiOptions(cllInsurance);
  const strSfcProductDescField = `${QD.strSfcProduct}_desc` as FieldPath<CrearRecibirQuejaFormData>;
  const strSfcProductDesc = (objWatch as Record<string, unknown>)[strSfcProductDescField] as string | undefined;
  const strInsuranceUiValue = uiValueFromCode(cllInsurance, objWatch[QD.strSfcProduct], strSfcProductDesc);

  // Placa: solo aplica cuando el producto seleccionado es "Autos" (Anexo02 #25).
  const blnIsAutos = /autos/i.test(labelFromUiValue(strInsuranceUiValue));

  // Servicio: solo aplica cuando el momento (interacción) es "Asistencias" (Anexo02 #31).
  const blnIsAsistencias = /asistencias/i.test(objWatch[QD.strInteraction] ?? '');

  // ── Cascada cat_matriz_motivos derivada en cliente ─────────────────────────
  // La matriz filtra por el LABEL de tipo de solicitud y producto (guarda texto,
  // no código); resolvemos esos labels desde sus catálogos.
  const strRequestTypeLabel = cllRequestType.find((o) => o.value === objWatch[QD.strRequestType])?.label ?? '';
  const strProductLabel = labelFromUiValue(strInsuranceUiValue);

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

  // La cascada arranca en tipo de solicitud + seguro: hasta tenerlos, la matriz no
  // puede ofrecer momentos (el diseño ubica el tipo de solicitud junto al motivo).
  const blnCascadeReady = !!objWatch[QD.strRequestType] && !!objWatch[QD.strSfcProduct];

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
    setValue(QD.strFraudRelated, 'NO');
  }, [objWatch[QD.strRequestType], objWatch[QD.strSfcProduct], objWatch[QD.strInteraction], objWatch[QD.strServiceProvided], setValue]);

  // qd_strResponsableRole / qd_strOmbudsmanEscalation / qd_strCompensation / qd_strSlaAssigned /
  // qd_strFraudRelated se extraen de la fila de cat_matriz_motivos que corresponde a la selección
  // completa del form (tipo solicitud + producto + momento + [servicio] + motivo), columnas
  // rolResponsable / escalamientoAdministrador / resarcimientoAdministrador / sla / relacionFraude.
  // relacionFraude (SI/NO) marca los motivos relacionados con fraude (p.ej. 104/114/144) → gatilla
  // los campos de fraude en SCR-009/010; se normaliza a 'SI'/'NO' porque la matriz trae texto sucio.
  useEffect(() => {
    if (!objSelectedReasonRow) return;
    setValue(QD.strResponsableRole, leerColumna(objSelectedReasonRow, 'rolResponsable'));
    setValue(QD.strOmbudsmanEscalation, leerColumna(objSelectedReasonRow, 'escalamientoAdministrador'));
    setValue(QD.strCompensation, leerColumna(objSelectedReasonRow, 'resarcimientoAdministrador'));
    setValue(QD.strSlaAssigned, leerColumna(objSelectedReasonRow, 'sla'));
    setValue(QD.strFraudRelated, normalizar(leerColumna(objSelectedReasonRow, 'relacionFraude')) === 'si' ? 'SI' : 'NO');
  }, [objSelectedReasonRow, setValue]);

  // Placa fuera de "Autos" no debe conservar valor.
  useEffect(() => {
    if (!blnIsAutos && objWatch[QD.strPlate]) setValue(QD.strPlate, '');
  }, [blnIsAutos, objWatch[QD.strPlate], setValue]);

  // FLD-324 — detalle del producto: primer código de CAT-DETALLE-PRODUCTO para el seguro elegido.
  // Se almacena el CÓDIGO (.value); la descripción se muestra vía qd_strProductDetail_desc.
  useEffect(() => {
    setValue(QD.strProductDetail, cllProductDetail[0]?.value ?? '');
  }, [cllProductDetail, setValue]);

  // FLD-331 — admisión: visible (select) solo cuando el rol es Defensor; en los demás
  // roles se oculta y se fija en "No aplica" (código 9, CAT-ADMISION). Se guarda el CÓDIGO.
  useEffect(() => {
    if (blnIsDefender || cllAdmission.length === 0) return;
    const objNotApplicable = cllAdmission.find((o) => o.value === '9')
      ?? cllAdmission.find((o) => /no aplica/i.test(o.label));
    if (objNotApplicable && objWatch[QD.strAdmission] !== objNotApplicable.value) {
      setValue(QD.strAdmission, objNotApplicable.value);
    }
  }, [blnIsDefender, objWatch[QD.strAdmission], cllAdmission, setValue]);

  // FLD-332 — ente de control por defecto "Otros", resuelto desde CAT-ENTE. Se guarda el CÓDIGO.
  useEffect(() => {
    if (objWatch[QD.strControlEntity] || cllControlEntity.length === 0) return;
    const objOthers = cllControlEntity.find((o) => /otros/i.test(o.label));
    if (objOthers) setValue(QD.strControlEntity, objOthers.value);
  }, [objWatch[QD.strControlEntity], cllControlEntity, setValue]);

  // FLD-333 — tutela por defecto "No", resuelta desde CAT-TUTELA. Se guarda el CÓDIGO.
  useEffect(() => {
    if (objWatch[QD.strTutela] || cllGuardianship.length === 0) return;
    const objNo = cllGuardianship.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue(QD.strTutela, objNo.value);
  }, [objWatch[QD.strTutela], cllGuardianship, setValue]);

  // FLD-334 — queja exprés por defecto "No", resuelta desde CAT-EXPRES. Se guarda el CÓDIGO.
  useEffect(() => {
    if (objWatch[QD.strExpressComplaint] || cllExpressComplaint.length === 0) return;
    const objNo = cllExpressComplaint.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue(QD.strExpressComplaint, objNo.value);
  }, [objWatch[QD.strExpressComplaint], cllExpressComplaint, setValue]);

  // Sincroniza cada variable compañera <campo>_desc con la descripción del código guardado.
  // (strInteraction / strServiceProvided se difieren: guardan texto de la matriz, sin código.)
  // qd_strSfcProduct_desc NO usa useSyncDesc (ver más arriba) — se sincroniza a mano en el
  // onChange del picker, porque el código no alcanza para distinguir el duplicado.
  useSyncDesc(form, QD.strProductDetail, cllProductDetail);
  useSyncDesc(form, QD.strSfcReason, cllReason);
  useSyncDesc(form, QD.strAdmission, cllAdmission);
  useSyncDesc(form, QD.strControlEntity, cllControlEntity);
  useSyncDesc(form, QD.strTutela, cllGuardianship);
  useSyncDesc(form, QD.strExpressComplaint, cllExpressComplaint);

  // ── Anexos (switch "¿Incluye anexos a la queja?") ──────────────────────────
  // El cargador de documentos solo aparece si el radicador declara que adjunta
  // archivos. Al apagarlo se descartan los archivos ya seleccionados para que no
  // viajen a PM4. No es una variable del caso: es estado de UI.
  const blnHasAnyAttachment = ADJUNTO_KEYS.some((strKey) => !!objWatch[strKey]);
  const [blnShowAttachments, setBlnShowAttachments] = useState(false);

  // Si el caso llega con adjuntos precargados (apertura como tarea), el switch parte encendido.
  useEffect(() => {
    if (blnHasAnyAttachment) setBlnShowAttachments(true);
  }, [blnHasAnyAttachment]);

  const toggleAttachments = (in_blnOn: boolean) => {
    setBlnShowAttachments(in_blnOn);
    if (!in_blnOn) {
      fileRegistry.current.clear();
      ADJUNTO_KEYS.forEach((strKey) => setValue(strKey, ''));
    }
  };

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;

  return (
    <PqrSection title="Detalle de la queja">
      <div className="form-row cols-2">
        <ZdsSelect
          name={QD.strSfcProduct}
          control={control}
          label="Producto"
          options={cllInsuranceUi}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err(QD.strSfcProduct)}
          toPickerValue={() => strInsuranceUiValue}
          fromPickerValue={codeFromUiValue}
          onPickerChange={(strUiValue) => setValue(strSfcProductDescField, labelFromUiValue(strUiValue) as never)}
        />
        {/* Escalamiento al Defensor del Consumidor (qd_strOmbudsmanEscalation): variable
            de back, oculta por requerimiento. La deriva cat_matriz_motivos (columna
            escalamientoAdministrador) al elegir el motivo. */}
        <div />
      </div>

      {/* Anexo02 #25 — placa: solo si el producto seleccionado es "Autos".
          Formato: 3 letras + espacio + 3 números (sin guiones), p.ej. "ABC 123". */}
      {blnIsAutos && (
        <div className="form-row cols-2">
          <ZdsInput
            name={QD.strPlate}
            control={control}
            label="Ingrese la placa"
            placeholder="Ej. ABC 123"
            rules={{
              required: 'Campo requerido',
              pattern: { value: /^[A-Za-z]{3} ?[0-9]{3}$/, message: 'Formato esperado: 3 letras y 3 números, p.ej. ABC 123' },
            }}
            required
            error={err(QD.strPlate)}
          />
          <div />
        </div>
      )}

      {/* Réplica / reconsideración: el modelo de datos tiene una sola variable
          (qd_strReply) para las dos preguntas del diseño. Checkbox — guarda el mismo
          contrato de texto 'SI'/'NO' que antes (CONTRATO con PM4), solo cambia el
          control visual de radio a checkbox. */}
      <div className="form-row cols-1">
        <ZdsCheckboxField
          name={QD.strReply}
          control={control}
          label="¿Ya habías radicado previamente la misma queja o es una reconsideración?"
          checkedValue="SI"
          uncheckedValue="NO"
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

      {/* Anexo02 #30/#31 — cascada cat_matriz_motivos: momento y (si aplica) servicio,
          antesala del motivo. El servicio solo aparece cuando el momento es "Asistencias". */}
      <div className="form-row cols-2">
        <ZdsSelect
          name={QD.strInteraction}
          control={control}
          label="Momento"
          options={cllInteraction}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          disabled={!blnCascadeReady}
          placeholder={blnCascadeReady ? 'Seleccione el momento...' : 'Seleccione primero el tipo de solicitud y el producto'}
          error={err(QD.strInteraction)}
        />
        {blnIsAsistencias ? (
          <ZdsSelect
            name={QD.strServiceProvided}
            control={control}
            label="Servicio"
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

      {/* Tipo de solicitud (primer eslabón de la cascada de la matriz) se muestra en
          S1, como primer campo del formulario — no se repite el selector aquí. */}
      <div className="form-row cols-1">
        <ZdsSelect
          name={QD.strSfcReason}
          control={control}
          label="Motivo de la queja"
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
          placeholder="Por favor ingresa el detalle de la queja"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 50, message: 'Mínimo 50 caracteres' },
            maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
          }}
          required
          maxLength={2000}
          error={err(QD.strComplaintText)}
        />
      </div>

      {/* FLD-331 — Admisión: solo la elige el Defensor del Consumidor; en los demás
          roles no se muestra y queda fija en "No aplica" (código 9). Ente de control
          (FLD-332), Tutela (FLD-333) y Queja exprés (FLD-334) son variables de back
          sin campo visible: viajan con su default (ver los effects de arriba). */}
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

      {/* FLD-330 — adjuntos múltiples (pdf, jpg, png, docx · máx 5 MB c/u), tras el
          switch del diseño. */}
      <div className="pqr-toggle-row">
        <ZrCheckbox
          id="pqr-has-attachments"
          name="pqr-has-attachments"
          label="¿Incluye anexos a la queja?"
          onChange={(in_blnValue: boolean | null) => toggleAttachments(!!in_blnValue)}
          {...({
            // ⚠ Mismo bug del vendor que en ZdsCheckboxField (ver ZdsFields.tsx):
            // useCustomElement() descarta cualquier prop `=== false`, así que
            // `model={false}` nunca llega al custom element y desmarcar requiere un
            // clic extra. Workaround: `0` en vez de `false` (falsy mismo, pero
            // `0 === false` es `false` en JS → sobrevive el filtro).
            model: blnShowAttachments ? true : 0,
          } as Record<string, unknown>)}
        />
      </div>
      {blnShowAttachments && (
        <DocSupportUploader
          form={form}
          fileRegistry={fileRegistry}
          docKeys={ADJUNTO_KEYS}
          max={5}
          title="Ingresa archivos adjuntos"
          intro="Formatos permitidos: PDF, JPG, PNG, DOCX. Máximo 5 MB por archivo. Puede agregar hasta 5 documentos."
        />
      )}
    </PqrSection>
  );
}
