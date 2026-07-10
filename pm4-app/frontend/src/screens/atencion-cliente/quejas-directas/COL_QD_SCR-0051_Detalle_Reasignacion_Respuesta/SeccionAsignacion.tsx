import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import {
  ZdsSelect, ZdsTextarea, ZdsRadio,
  ZrButton, ZrAlert, ZrTable, ZdsStatusBadge,
} from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import pm4 from '../../../../api/pm4Client';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO, SCR0051_MAX_AYUDANTES as MAX_AYUDANTES } from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData } from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  err: (name: keyof DetalleReasignacionRespuestaFormData) => string | undefined;
  onConfirmarReasignacion: () => void;
  onSolicitarAyuda: (data?: DetalleReasignacionRespuestaFormData) => void;
  submitting: boolean;
}

/** S5 Asignación · S6 Reasignación (PAN-06) · S7 Historial de Asignaciones. */
export default function SeccionAsignacion({ form, err, onConfirmarReasignacion, onSolicitarAyuda, submitting }: Props) {
  const { control, watch, setValue } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();
  const [blnReassignMode, setBlnReassignMode] = useState(false);
  const [objSnapshot, setObjSnapshot] = useState({ area: '', usuario: '', obs: '' });

  // RUL-0051-07 — bloque de reasignación visible si "¿Necesitas de otras áreas?" = Sí.
  const blnShowReassign = objWatch[QD.strNeedsOtherAreas] === 'SI';

  // Si el caso llega devuelto por el Analista SAC (con observaciones, FLD-131 de SCR-008),
  // el área solo ajusta la respuesta: se ocultan la asignación (S5) y la solicitud de
  // ayuda a otras áreas (S6). El historial (S7) se conserva para contexto/auditoría.
  const blnReturnedBySac = !!objWatch[QD.strSacRemarks]?.trim();

  // RUL-0051-08 — máx. 4 ayudantes.
  const lstHistory: AsignacionHistorial[] = Array.isArray(objWatch[QD.lstAssignHistory]) ? objWatch[QD.lstAssignHistory] : [];
  const blnHelpersReached = lstHistory.length >= MAX_AYUDANTES;

  // Descarga el adjunto de un ayudante por su file_id (guardado por SCR-0052 al responder).
  const descargarAdjunto = async (in_intFileId: number, in_strFileName: string) => {
    const objResponse = await pm4.get(`/files/${in_intFileId}/contents`, { responseType: 'blob' });
    const strUrl = URL.createObjectURL(objResponse.data as Blob);
    const objAnchor = document.createElement('a');
    objAnchor.href = strUrl;
    objAnchor.download = in_strFileName;
    objAnchor.click();
    URL.revokeObjectURL(strUrl);
  };

  // Cargamos los catalogos de área y motivo de reasignación.
  const { options: cllArea } = useCollection(QD_COLLECTIONS.area);
  const { options: cllReassignReason } = useCollection(QD_COLLECTIONS.reassignReason);

  // RUL-0051-02 — usuarios filtrados por área seleccionada (asignación inicial).
  // Shim de dependencia: 'qd_area' es una convención interna (no un campo PM4 real,
  // ver fields/MAPEO_qd_old_new.md #2) — coincide con el dependsOn sin cambios.
  const { options: cllAreaUsers } = useCollection(QD_COLLECTIONS.areaUsers, { qd_area: objWatch[QD.strAssigneeArea] });

  // FLD-092 — responsables del área destino de reasignación (autocompletado).
  const { options: cllTargetAreaUsers } = useCollection(QD_COLLECTIONS.areaUsers, { qd_area: objWatch[QD.strTargetArea] });
  useEffect(() => {
    setValue(QD.strNewAssignee, cllTargetAreaUsers[0]?.label ?? '');
  }, [cllTargetAreaUsers, setValue]);

  // Guarda un snapshot de la asignación actual y entra en modo reasignación.
  const iniciarReasignacion = () => {
    setObjSnapshot({
      area: objWatch[QD.strAssigneeArea] || '',
      usuario: objWatch[QD.strAssigneeUser] || '',
      obs: objWatch[QD.strAssignmentRemarks] || '',
    });
    setBlnReassignMode(true);
  };

  // Restaura el snapshot y sale del modo reasignación.
  const cancelarReasignacion = () => {
    setValue(QD.strAssigneeArea, objSnapshot.area);
    setValue(QD.strAssigneeUser, objSnapshot.usuario);
    setValue(QD.strAssignmentRemarks, objSnapshot.obs);
    setBlnReassignMode(false);
  };

  // ACT-0051-03 — añade el ayudante al historial (RUL-0051-04 valida campos obligatorios).
  const blnReassignComplete =
    !!objWatch[QD.strTargetArea] && !!objWatch[QD.strReassignReason] && !!objWatch[QD.strReassignRemarks]?.trim();

  // Registra la solicitud de ayuda en el historial y envía el snapshot fresco.
  const confirmarReasignacion = () => {
    if (!blnReassignComplete || blnHelpersReached) return;
    const objRow: AsignacionHistorial = {
      fecha: new Date().toISOString().slice(0, 10),
      de: objWatch[QD.strCurrentAssignee] || objWatch[QD.strAssigneeUser] || '—',
      para: objWatch[QD.strNewAssignee] || '—',
      motivo: cllReassignReason.find((objOption) => objOption.value === objWatch[QD.strReassignReason])?.label ?? objWatch[QD.strReassignReason],
      observaciones: objWatch[QD.strReassignRemarks],
    };
    const lstNewHistory = [...lstHistory, objRow];
    // Número de esta ayuda (1-based) = posición de la fila recién agregada. Viaja con el
    // subproceso para que SCR-0052 sepa a qué ayuda responde (matchea el índice del historial).
    const intHelpNumber = lstNewHistory.length;
    setValue(QD.lstAssignHistory, lstNewHistory);
    setValue(QD.intHelpNumber, intHelpNumber);
    // limpiar el formulario de ayudante para el siguiente
    setValue(QD.strTargetArea, '');
    setValue(QD.strNewAssignee, '');
    setValue(QD.strReassignReason, '');
    setValue(QD.strReassignRemarks, '');
    // Submit inmediato con el snapshot fresco: watch() (objWatch) aún no refleja los setValue
    // anteriores, por eso construimos el payload explícitamente para que PM4 persista
    // la nueva fila del historial junto con el resto de variables.
    onSolicitarAyuda({
      ...objWatch,
      [QD.lstAssignHistory]: lstNewHistory,
      [QD.intHelpNumber]: intHelpNumber,
      [QD.strTargetArea]: '',
      [QD.strNewAssignee]: '',
      [QD.strReassignReason]: '',
      [QD.strReassignRemarks]: '',
    });
  };

  return (
    <>
      {/* S5 y S6 se ocultan cuando el caso viene devuelto por el SAC (blnReturnedBySac). */}
      {!blnReturnedBySac && (<>
      {/* ── S5 · Asignación de Responsable (SEC-051) ── */}
      {/* Siempre visible; datos pre-calculados por el BPM. Editable solo en blnReassignMode. */}
      <FormSection title="Asignación de Responsable">
        <div className="form-row cols-2">
          <ZdsSelect
            name={QD.strAssigneeArea} control={control} label="Área responsable"
            options={cllArea} withSearch disabled={!blnReassignMode}
            helpText="Áreas habilitadas para quejas (CAT-AREA)."
          />
          <ZdsSelect
            name={QD.strAssigneeUser} control={control} label="Usuario responsable"
            options={cllAreaUsers} withSearch
            disabled={!blnReassignMode || !objWatch[QD.strAssigneeArea]}
            helpText="Solo usuarios autorizados del área (RUL-0051-02)."
          />
        </div>
        {blnReassignMode && (
          <div className="form-row cols-1">
            <ZdsTextarea name={QD.strAssignmentRemarks} control={control}
              label="Comentario de reasignación" maxLength={2000} />
          </div>
        )}
        <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-75)' }}>
          {blnReassignMode ? (
            <>
              <ZrButton config="secondary" onClick={cancelarReasignacion} disabled={submitting}>
                Cancelar
              </ZrButton>
              <ZrButton
                config="positive" loading={submitting}
                disabled={submitting || !objWatch[QD.strAssigneeUser]}
                onClick={onConfirmarReasignacion}
              >
                Confirmar Reasignación
              </ZrButton>
            </>
          ) : (
            <ZrButton config="secondary" onClick={iniciarReasignacion}>
              Reasignar Queja
            </ZrButton>
          )}
        </div>
      </FormSection>

      {/* ── S6 · Reasignación / Solicitud de ayuda (SEC-052, RUL-0051-07) ── */}
      <FormSection title="">
        <div className="form-row cols-1">
          <ZdsRadio
            name={QD.strNeedsOtherAreas} control={control}
            label="¿Necesitas de otras áreas para dar respuesta completa?"
            options={OPTIONS_SI_NO} inline
          />
        </div>

        {blnShowReassign && (
          <>
            {blnHelpersReached ? (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Ha alcanzado el máximo de <strong>{MAX_AYUDANTES} ayudantes</strong> para este caso.
                No puede añadir más. {/* MSG-0051-06 */}
              </ZrAlert>
            ) : (
              <>
                <p className="subsection-note">
                  A quién quieres solicitar ayuda — puede añadir hasta {MAX_AYUDANTES} ayudantes
                  ({lstHistory.length}/{MAX_AYUDANTES}).
                </p>
                <div className="form-row cols-2">
                  <ZdsSelect name={QD.strTargetArea} control={control} label="Área destino"
                    options={cllArea} withSearch error={err(QD.strTargetArea)}
                    helpText="CAT-AREA." />
                  <ZdsSelect name={QD.strNewAssignee} control={control} label="Responsable"
                    options={objWatch[QD.strNewAssignee] ? [{ value: objWatch[QD.strNewAssignee], label: objWatch[QD.strNewAssignee] }] : []}
                    disabled
                    helpText="Autocompletado según el área destino (CAT-USUARIOS-ROLE)." />
                </div>
                <div className="form-row cols-1">
                  <ZdsSelect name={QD.strReassignReason} control={control} label="Motivo"
                    options={cllReassignReason} error={err(QD.strReassignReason)}
                    helpText="CAT-MOTIVO-REASIG." />
                </div>
                <div className="form-row cols-1">
                  <ZdsTextarea name={QD.strReassignRemarks} control={control}
                    label="Observaciones (justificación)" maxLength={2000}
                    helpText="Obligatorio (RUL-0051-04). Queda en el historial para auditoría." />
                </div>

                {/* RUL-0051-04 — bloquea hasta completar área, motivo y observaciones. */}
                {!blnReassignComplete && (
                  <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                    El <strong>área destino</strong>, el <strong>motivo</strong> y las{' '}
                    <strong>observaciones</strong> son obligatorios para registrar la asignación.
                    {/* MSG-0051-03 */}
                  </ZrAlert>
                )}

                <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-75)' }}>
                  <ZrButton config="secondary"
                    disabled={!blnReassignComplete || submitting} loading={submitting}
                    onClick={confirmarReasignacion}>
                    Confirmar
                  </ZrButton>
                </div>
              </>
            )}
          </>
        )}
      </FormSection>
      </>)}

      {/* ── S7 · Historial de Asignaciones (SEC-053) ── */}
      {/* Visible si se está reasignando o si ya hay filas: así no desaparece al llegar al
          máximo de ayudantes (RUL-0051-08) ni al cerrar el bloque de solicitud. */}
      {(blnShowReassign || lstHistory.length > 0) && (
        <FormSection title="Historial de Asignaciones">
          <ZrTable zebra>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>De</th><th>Para</th><th>Motivo</th>
                  <th>Observaciones</th><th>Respondió</th><th>Comentario</th><th>Adjunto</th>
                </tr>
              </thead>
              <tbody>
                {lstHistory.length === 0 ? (
                  <tr><td colSpan={8} className="record-empty">Sin asignaciones previas registradas</td></tr>
                ) : (
                  lstHistory.map((objRow, intIndex) => (
                    <tr key={intIndex}>
                      <td>{objRow.fecha}</td>
                      <td>{objRow.de}</td>
                      <td>{objRow.para}</td>
                      <td>{objRow.motivo}</td>
                      <td>{objRow.observaciones}</td>
                      <td>
                        {objRow.respondio === 'si'
                          ? <ZdsStatusBadge variant="success">✓</ZdsStatusBadge>
                          : '—'}
                      </td>
                      <td>{objRow.comentario ?? '—'}</td>
                      <td>
                        {objRow.adjunto && objRow.adjuntoFileId
                          ? <ZrButton config="link:s" icon="download:line"
                              onClick={() => descargarAdjunto(objRow.adjuntoFileId as number, objRow.adjunto as string)}>
                              {objRow.adjunto}
                            </ZrButton>
                          : (objRow.adjunto || '—')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ZrTable>
        </FormSection>
      )}
    </>
  );
}
