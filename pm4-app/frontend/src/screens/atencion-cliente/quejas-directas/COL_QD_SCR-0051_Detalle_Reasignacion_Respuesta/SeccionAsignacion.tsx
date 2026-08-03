import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import {
  ZdsSelect, ZdsTextarea, ZdsRadio,
  ZrButton, ZrAlert, ZrTable, ZdsStatusBadge,
} from '../../../../components/fields/ZdsFields';
import { useCollection, useSyncDesc } from '../../../../core/useCollection';
import pm4 from '../../../../api/pm4Client';
import { QD, QD_COLLECTIONS, OPTIONS_SI_NO, SCR0051_MAX_AYUDANTES as MAX_AYUDANTES } from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData } from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';

// ── Helpers de la matriz cat_matriz_motivos (id 45) ──────────────────────────
// Los datos vienen "sucios" (espacios sobrantes), por eso normalizamos antes de comparar.
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

// Resuelve los usuarios reales de un grupo PM4 por nombre (GET /groups?filter= +
// GET /groups/{id}/users). Compartido por "Área a reasignar" (S5) y "Área destino"
// (S6, solicitud de ayuda) — ambas apuntan a grupos PM4 (rolResponsable de la matriz).
async function fetchGroupUsers(in_strGroupName: string): Promise<{ value: string; label: string; id: string }[]> {
  const objGroupsResp = await pm4.get('/groups', { params: { filter: in_strGroupName, per_page: 100 } });
  const lstGroups: { id: string; name?: string }[] = objGroupsResp.data?.data ?? [];
  const objGroup = lstGroups.find((objG) => normalizar(objG.name) === normalizar(in_strGroupName)) ?? lstGroups[0];
  if (!objGroup) return [];

  const objUsersResp = await pm4.get(`/groups/${objGroup.id}/users`, { params: { per_page: 100 } });
  // OJO: pese a que el OpenAPI de este endpoint documenta la respuesta como `users` puros,
  // PM4 en la práctica devuelve registros con forma de GroupMember (pivote): `id` es el id
  // de LA FILA del pivote group_members, no el id real del usuario — ese viaja en
  // `member_id` (ver schemas groupMembers/getGroupMembersById en docs (4).json). Se prioriza
  // member_id y se cae a id solo si member_id no viene (por si alguna instancia sí devuelve
  // el user plano).
  const lstUsers: { id: number | string; member_id?: number | string; username: string; firstname?: string; lastname?: string }[]
    = objUsersResp.data?.data ?? [];
  return lstUsers
    .map((objUser) => ({
      value: objUser.username,
      label: `${objUser.firstname ?? ''} ${objUser.lastname ?? ''}`.trim() || objUser.username,
      id: String(objUser.member_id ?? objUser.id),
    }))
    .filter((objOpt) => !!objOpt.value);
}

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  err: (name: keyof DetalleReasignacionRespuestaFormData) => string | undefined;
  // ACT-0051-01 — recibe el user_id (PM4) del usuario elegido para reasignar la tarea
  // sin completarla; undefined si no se pudo resolver (p.ej. options aún cargando).
  onConfirmarReasignacion: (userId?: string) => void;
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

  // "Área a reasignar" / "Área destino" — grupos de ProcessMaker: valores únicos de la
  // columna rolResponsable de cat_matriz_motivos (id 45), no un catálogo de áreas (CAT-AREA).
  const { records: cllMatrizRows } = useCollection(QD_COLLECTIONS.matrixMotivos);
  const cllReassignGroups = opcionesUnicas(cllMatrizRows.map((objRow) => {
    const strRol = leerColumna(objRow, 'rolResponsable');
    return { value: strRol, label: strRol };
  }));

  // Usuarios reales del grupo PM4 elegido en "Área a reasignar" (S5). Se listan mientras
  // se está reasignando, para poder elegir otro miembro del mismo grupo sin perder la
  // asignación original si no se cambia nada. `id` (numérico, PM4) viaja junto a
  // value/label — lo necesita ACT-0051-01 para reasignar la tarea vía PUT /tasks/{id}
  // { user_id }, sin completarla.
  const [cllGroupUsers, setCllGroupUsers] = useState<{ value: string; label: string; id: string }[]>([]);
  // Loading real (no solo "hay opciones o no"): evita que "Confirmar Reasignación" quede
  // habilitado por tener un qd_strAssigneeUser precargado mientras cllGroupUsers todavía
  // está vacío por estar cargando (o por no encontrar coincidencia) — RUL-0051-01-bis abajo.
  const [blnGroupUsersLoading, setBlnGroupUsersLoading] = useState(false);
  const strPrevGroupRef = useRef<string | null>(null);
  useEffect(() => {
    const strGroupName = objWatch[QD.strAssigneeArea] || '';
    const strPrevGroup = strPrevGroupRef.current;
    strPrevGroupRef.current = strGroupName;
    // Autocompletar el primer usuario solo cuando el grupo cambia por una selección real
    // del usuario en modo reasignación — no al precargar el área ya asignada desde task.data.
    const blnUserChangedGroup = blnReassignMode && strPrevGroup !== null && strPrevGroup !== strGroupName;

    if (!blnReassignMode || !strGroupName) { setCllGroupUsers([]); setBlnGroupUsersLoading(false); return; }

    let blnActive = true;
    setBlnGroupUsersLoading(true);
    fetchGroupUsers(strGroupName)
      .then((cllMapped) => {
        if (!blnActive) return;
        setCllGroupUsers(cllMapped);
        // ACT-0051 (nuevo) — al elegir un grupo distinto se autocompleta con su primer usuario.
        if (blnUserChangedGroup) setValue(QD.strAssigneeUser, cllMapped[0]?.value ?? '');
      })
      .catch((excError) => {
        console.error('[SeccionAsignacion] Error al buscar usuarios del grupo PM4:', excError);
        if (blnActive) setCllGroupUsers([]);
      })
      .finally(() => { if (blnActive) setBlnGroupUsersLoading(false); });
    return () => { blnActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objWatch[QD.strAssigneeArea], blnReassignMode]);

  // Usuario elegido, ya resuelto contra cllGroupUsers (con su id real de PM4). Si viene
  // undefined (grupo aún cargando, o el username precargado no está en este grupo — p.ej.
  // dato legado de antes de este cambio) NO se puede reasignar todavía: RUL-0051-01-bis.
  const objSelectedAssigneeUser = cllGroupUsers.find((objOpt) => objOpt.value === objWatch[QD.strAssigneeUser]);

  // "Responsable" (S6, solicitud de ayuda) — usuarios reales del grupo PM4 elegido en
  // "Área destino"; misma mecánica que "Usuario responsable" en S5, salvo que
  // qd_strNewAssignee guarda el id numérico de PM4 (no el username): value = id.
  // Como "Área destino" arranca vacía en cada solicitud de ayuda (se limpia tras cada
  // "Confirmar"), se autocompleta con el primer usuario cada vez que cambia, sin
  // necesidad de rastrear el valor anterior.
  const [cllTargetGroupUsers, setCllTargetGroupUsers] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const strGroupName = objWatch[QD.strTargetArea] || '';
    if (!strGroupName) { setCllTargetGroupUsers([]); return; }

    let blnActive = true;
    fetchGroupUsers(strGroupName)
      .then((cllMapped) => {
        if (!blnActive) return;
        const cllOptions = cllMapped.map((objUser) => ({ value: objUser.id, label: objUser.label }));
        setCllTargetGroupUsers(cllOptions);
        setValue(QD.strNewAssignee, cllOptions[0]?.value ?? '');
      })
      .catch((excError) => {
        console.error('[SeccionAsignacion] Error al buscar usuarios del grupo PM4 (área destino):', excError);
        if (blnActive) setCllTargetGroupUsers([]);
      });
    return () => { blnActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objWatch[QD.strTargetArea]]);

  // Sincroniza la variable compañera <campo>_desc con la descripción del código (para PM4).
  useSyncDesc(form, QD.strAssigneeArea, cllReassignGroups);
  useSyncDesc(form, QD.strAssigneeUser, cllGroupUsers);
  useSyncDesc(form, QD.strTargetArea, cllReassignGroups);
  useSyncDesc(form, QD.strNewAssignee, cllTargetGroupUsers);

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
  // El motivo (CAT-MOTIVO-REASIG) ya no se usa/muestra — se retiró de la validación.
  const blnReassignComplete =
    !!objWatch[QD.strTargetArea] && !!objWatch[QD.strReassignRemarks]?.trim();

  // Registra la solicitud de ayuda en el historial y envía el snapshot fresco.
  const confirmarReasignacion = () => {
    if (!blnReassignComplete || blnHelpersReached) return;
    // Snapshot de esta solicitud ANTES de limpiar el mini-formulario (abajo) — así el
    // payload que se envía a PM4 conserva el área/responsable/observaciones elegidos en
    // vez de mandarlos vacíos (bug previo: se limpiaban en el form Y en el payload).
    const strTargetAreaActual = objWatch[QD.strTargetArea];
    const strNewAssigneeActual = objWatch[QD.strNewAssignee];
    const strReassignRemarksActual = objWatch[QD.strReassignRemarks];
    const objRow: AsignacionHistorial = {
      fecha: new Date().toISOString().slice(0, 10),
      de: objWatch[QD.strCurrentAssignee] || objWatch[QD.strAssigneeUser] || '—',
      // qd_strNewAssignee guarda el id (no el nombre) — se resuelve el nombre para el historial.
      para: cllTargetGroupUsers.find((objOpt) => objOpt.value === strNewAssigneeActual)?.label
        ?? strNewAssigneeActual ?? '—',
      motivo: '', // CAT-MOTIVO-REASIG retirado — el campo ya no se captura.
      observaciones: strReassignRemarksActual,
    };
    const lstNewHistory = [...lstHistory, objRow];
    // Número de esta ayuda (1-based) = posición de la fila recién agregada. Viaja con el
    // subproceso para que SCR-0052 sepa a qué ayuda responde (matchea el índice del historial).
    const intHelpNumber = lstNewHistory.length;
    setValue(QD.lstAssignHistory, lstNewHistory);
    setValue(QD.intHelpNumber, intHelpNumber);
    // limpiar el formulario de ayudante para el siguiente (solo en pantalla)
    setValue(QD.strTargetArea, '');
    setValue(QD.strNewAssignee, '');
    setValue(QD.strReassignRemarks, '');
    // Submit inmediato con el snapshot fresco: watch() (objWatch) aún no refleja los setValue
    // anteriores, por eso construimos el payload explícitamente para que PM4 persista
    // la nueva fila del historial junto con el resto de variables — conservando el
    // área/responsable/observaciones de ESTA solicitud (no las versiones ya limpiadas).
    onSolicitarAyuda({
      ...objWatch,
      [QD.lstAssignHistory]: lstNewHistory,
      [QD.intHelpNumber]: intHelpNumber,
      [QD.strTargetArea]: strTargetAreaActual,
      [QD.strNewAssignee]: strNewAssigneeActual,
      [QD.strReassignReason]: '',
      [QD.strReassignRemarks]: strReassignRemarksActual,
    });
  };

  return (
    <>
      {/* S5 y S6 se ocultan cuando el caso viene devuelto por el SAC (blnReturnedBySac). */}
      {!blnReturnedBySac && (<>
      {/* ── S5 · Asignación de Responsable (SEC-051) ── */}
      {/* Siempre visible; datos pre-calculados por el BPM. Editable solo en blnReassignMode. */}
      <FormSection title="Reasignación de Responsable">
        <div className="form-row cols-2">
          <ZdsSelect
            name={QD.strAssigneeArea} control={control} label="Área a reasignar"
            options={cllReassignGroups} withSearch disabled={!blnReassignMode}
            helpText="Grupos de ProcessMaker (rolResponsable de CAT-MATRIZ-MOTIVOS)."
          />
          <ZdsSelect
            name={QD.strAssigneeUser} control={control} label="Usuario responsable"
            options={cllGroupUsers} withSearch loading={blnGroupUsersLoading}
            disabled={!blnReassignMode || !objWatch[QD.strAssigneeArea]}
            helpText={blnGroupUsersLoading ? undefined : 'Autocompletado con el primer usuario del grupo elegido.'}
          />
        </div>
        {blnReassignMode && (
          <div className="form-row cols-1">
            <ZdsTextarea name={QD.strAssignmentRemarks} control={control}
              label="Comentario de reasignación" maxLength={2000} />
          </div>
        )}
        {/* RUL-0051-01-bis — si hay grupo elegido pero no se pudo resolver un usuario real
            de PM4 para él (ya cargó y sigue vacío), no se puede reasignar todavía. */}
        {blnReassignMode && !!objWatch[QD.strAssigneeArea] && !blnGroupUsersLoading && !objSelectedAssigneeUser && (
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            No se encontraron usuarios de ProcessMaker para el grupo <strong>{objWatch[QD.strAssigneeArea]}</strong>.
            Verifique que el grupo exista en ProcessMaker y tenga miembros, o elija otro.
          </ZrAlert>
        )}
        <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-75)' }}>
          {blnReassignMode ? (
            <>
              <ZrButton config="secondary" onClick={cancelarReasignacion} disabled={submitting}>
                Cancelar
              </ZrButton>
              <ZrButton
                config="positive" loading={submitting}
                disabled={submitting || !objSelectedAssigneeUser}
                onClick={() => onConfirmarReasignacion(objSelectedAssigneeUser?.id)}
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
                    options={cllReassignGroups} withSearch error={err(QD.strTargetArea)}
                    helpText="Grupos de ProcessMaker (rolResponsable de CAT-MATRIZ-MOTIVOS)." />
                  <ZdsSelect name={QD.strNewAssignee} control={control} label="Responsable"
                    options={cllTargetGroupUsers} withSearch
                    disabled={!objWatch[QD.strTargetArea]}
                    helpText="Autocompletado con el primer usuario del grupo elegido." />
                </div>
                {/* Motivo (CAT-MOTIVO-REASIG) retirado — ya no se usa (qd_strReassignReason
                    sigue viajando vacío en el payload por compatibilidad con SCR-0052). */}
                <div className="form-row cols-1">
                  <ZdsTextarea name={QD.strReassignRemarks} control={control}
                    label="Observaciones (justificación)" maxLength={2000}
                    helpText="Obligatorio. Queda en el historial para auditoría." />
                </div>

                {/* RUL-0051-04 — bloquea hasta completar área y observaciones. */}
                {!blnReassignComplete && (
                  <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                    El <strong>área destino</strong> y las <strong>observaciones</strong>{' '}
                    son obligatorios para registrar la asignación.
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
