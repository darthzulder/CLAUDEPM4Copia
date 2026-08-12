import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ZdsSelect, ZrButton, ZrModal, ZrAlert } from '../../../../components/fields/ZdsFields';
import { fetchGroupUsers, type Pm4GroupUser } from '../../../../core/pm4Groups';
import { OS, OPTIONS_AREA } from '../fields/fields';
import type { GestionLinea2FormData } from '../fields/fields';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<GestionLinea2FormData>;
  /** Recibe el user_id (PM4) del usuario elegido; la pantalla hace el PUT de reasignación. */
  onConfirm: (userId: string) => void;
  submitting: boolean;
}

/**
 * ACT-003-02 "Reasignar Caso" — modal para derivar la tarea a otro usuario de Línea 2.
 *
 * El área es el catálogo CAT-AREA del Anexo02 (07_Catalogs) y su etiqueta es además el
 * nombre del grupo PM4 del que se traen los usuarios reales; por eso la lista de usuarios
 * se recarga cada vez que cambia el área. Reasignar NO completa la tarea: solo cambia el
 * responsable (ver `reassignTask` en core/useTask.ts), así que el caso sigue en P02-T12.
 */
export default function ReasignarCasoModal({ isOpen, onClose, form, onConfirm, submitting }: Props) {
  const { control, watch, setValue } = form;
  const objWatch = watch();
  const [cllUsers, setCllUsers] = useState<Pm4GroupUser[]>([]);
  const [blnLoading, setBlnLoading] = useState(false);
  const [strError, setStrError] = useState<string | null>(null);

  const strArea = objWatch[OS.strAssigneeArea] ?? '';

  // Al elegir un área traemos sus usuarios del grupo PM4 homónimo y preseleccionamos el
  // primero, para que el modal nunca quede con un área elegida y ningún destinatario.
  useEffect(() => {
    if (!isOpen || !strArea) { setCllUsers([]); return; }
    const strGroupName = OPTIONS_AREA.find((objOpt) => objOpt.value === strArea)?.label ?? strArea;
    let blnCancelled = false;
    setBlnLoading(true);
    setStrError(null);
    fetchGroupUsers(strGroupName)
      .then((cllFound) => {
        if (blnCancelled) return;
        setCllUsers(cllFound);
        setValue(OS.strAssigneeUser, cllFound[0]?.value ?? '');
      })
      .catch((exc) => {
        if (blnCancelled) return;
        console.error('[ReasignarCasoModal] Error al buscar usuarios del grupo PM4:', exc);
        setCllUsers([]);
        setStrError('No se pudieron cargar los usuarios del área seleccionada.');
      })
      .finally(() => { if (!blnCancelled) setBlnLoading(false); });
    return () => { blnCancelled = true; };
  }, [isOpen, strArea, setValue]);

  // El select guarda el username; PM4 reasigna por user_id, que viene en la misma opción.
  const strUserId = cllUsers.find((objUser) => objUser.value === objWatch[OS.strAssigneeUser])?.id;

  // Solo montamos el modal cuando está abierto: al cerrarlo se desmonta y ZrModal
  // libera su backdrop/scroll-lock (mismo criterio que PreviewModal).
  if (!isOpen) return null;

  return (
    <ZrModal
      model={isOpen}
      onChange={(in_blnOpen: boolean) => { if (!in_blnOpen) onClose(); }}
    >
      <div z-flex="col:150">
        <h3 style={{ margin: 0, font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
          Reasignar caso
        </h3>
        <p className="subsection-note" style={{ margin: 0 }}>
          Elija el área y el usuario de Línea 2 que continuará con el análisis del caso.
        </p>

        <ZdsSelect
          name={OS.strAssigneeArea} control={control} label="Área especializada"
          options={OPTIONS_AREA} placeholder="Seleccione…"
        />

        <ZdsSelect
          name={OS.strAssigneeUser} control={control} label="Usuario de Línea 2"
          options={cllUsers} placeholder="Seleccione…"
          disabled={!strArea || blnLoading} loading={blnLoading}
          helpText={strArea ? undefined : 'Elija primero un área.'}
        />

        {strError && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            {strError}
          </ZrAlert>
        )}

        {/* Área elegida pero sin usuarios: el grupo PM4 no existe o está vacío. */}
        {!!strArea && !blnLoading && !strError && cllUsers.length === 0 && (
          <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
            No se encontraron usuarios de ProcessMaker para el área seleccionada.
          </ZrAlert>
        )}

        <div z-flex="75" z-align="right:center">
          <ZrButton config="secondary" onClick={onClose}>Cancelar</ZrButton>
          <ZrButton
            config="positive"
            disabled={!strUserId || submitting}
            loading={submitting}
            onClick={() => { if (strUserId) onConfirm(strUserId); }}
          >
            Confirmar reasignación
          </ZrButton>
        </div>
      </div>
    </ZrModal>
  );
}
