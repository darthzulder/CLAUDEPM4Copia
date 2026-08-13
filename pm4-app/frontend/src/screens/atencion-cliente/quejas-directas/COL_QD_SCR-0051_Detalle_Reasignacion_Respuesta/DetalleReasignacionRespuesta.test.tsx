import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DetalleReasignacionRespuesta from './DetalleReasignacionRespuesta';

// La pantalla más grande de Quejas Directas: useTask + useCollection (email templates +
// useHolidaySet, que delega en useCollection) + core/useRequestFiles (RequestFileList real
// en 3 puntos: SeccionDetalleCaso/DocumentosRadicador, SeccionRespuesta y
// ExpedienteCompletoModal). Referencias ESTABLES entre renders — ver las 4 trampas de
// testing-conventions.md.
//
// OJO con SeccionAsignacion: llama a pm4.get('/groups'...) directo (fetchGroupUsers) pero
// SOLO si qd_strAssigneeArea/qd_strTargetArea vienen no-vacíos Y (para el área a reasignar)
// blnReassignMode está activo. Se mantienen vacíos en el fixture para no requerir mockear
// pm4Client — ningún test de este archivo entra en modo reasignación con un área precargada.

// Fecha de hoy en formato PM4 (DD/MM/YYYY) — para el caso "sin SLA crítico" (sla enorme
// relativo a hoy, para que sobren días hábiles sin importar la fecha real de ejecución).
const strHoyDDMMYYYY = (() => {
  const dt = new Date();
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
})();

function makeTask(objDataOverrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'ACTIVE',
    process_request_id: 10,
    data: {
      qd_strBpmCaseId: '2026-31-100',
      qd_strFilingDate: strHoyDDMMYYYY,
      qd_strSlaAssigned: '500', // deadline muy lejano ⇒ nunca crítico por defecto
      qd_strSfcCode: '',
      qd_strFirstName: 'Ana', qd_strLastName: 'Pérez', qd_strIdType: '1', qd_strIdNumber: '123',
      qd_strClientResponse: '', qd_strFavorability: '',
      qd_strSacRemarks: '', qd_strNeedsOtherAreas: 'NO', qd_lstAssignHistory: [],
      qd_strAssigneeArea: '', qd_strAssigneeUser: '', qd_strTargetArea: '',
      ...objDataOverrides,
    },
  };
}

const OBJ_USE_TASK = {
  task: makeTask(),
  loading: false,
  error: null,
  submitting: false,
  // completeTask()/saveDraft() encadenan .catch()/await en la pantalla — deben devolver
  // una promesa, no undefined.
  completeTask: vi.fn((_d: Record<string, unknown>) => Promise.resolve({})),
  saveDraft: vi.fn((_d: Record<string, unknown>) => Promise.resolve({})),
  reassignTask: vi.fn((_d: Record<string, unknown>, _u: string) => Promise.resolve({})),
  startProcess: vi.fn(),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

const CLL_VACIO: never[] = [];
const OBJ_RAW_MAP_VACIO: Record<string, Record<string, unknown>> = {};
const CLL_RECORDS_VACIO: Record<string, unknown>[] = [];
const OBJ_USE_COLLECTION = {
  options: CLL_VACIO, loading: false, rawMap: OBJ_RAW_MAP_VACIO, records: CLL_RECORDS_VACIO,
};

vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => OBJ_USE_COLLECTION };
});

vi.mock('../../../../core/useRequestFiles', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useRequestFiles')>();
  return { ...objActual, useRequestFiles: () => ({ files: [], loading: false, error: null }) };
});

beforeEach(() => {
  // El historial de llamadas NO se limpia solo entre tests (sin clearMocks global).
  vi.clearAllMocks();
  OBJ_USE_TASK.task = makeTask();
});

describe('DetalleReasignacionRespuesta (SCR-0051)', () => {
  it('renderiza la pantalla y el InfoBar con el caso precargado', () => {
    render(<DetalleReasignacionRespuesta />);

    expect(screen.getByText('Detalle / Reasignación / Respuesta')).toBeInTheDocument();
    expect(screen.getByText('2026-31-100')).toBeInTheDocument();
  });

  it('sin SLA crítico no muestra el banner de prioridad', () => {
    render(<DetalleReasignacionRespuesta />);
    expect(screen.queryByText(/Priorice la gestión/)).not.toBeInTheDocument();
  });

  it('con el SLA vencido (RUL-0051-03) muestra el banner crítico y el estado "Vencida"', () => {
    // Radicado hace mucho con un SLA corto ⇒ deadline muy en el pasado, sin importar
    // cuándo corra el test (siempre da días restantes muy negativos).
    OBJ_USE_TASK.task = makeTask({ qd_strFilingDate: '01/01/2020', qd_strSlaAssigned: '5' });
    render(<DetalleReasignacionRespuesta />);

    expect(screen.getByText(/Priorice la gestión/)).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
  });

  it('"Enviar" arranca deshabilitado sin Respuesta al Cliente ni Favorabilidad (RUL-0051-05)', () => {
    render(<DetalleReasignacionRespuesta />);

    const objBtn = screen.getByText('Enviar ▶').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    // El mensaje está partido en nodos de texto por el <strong> intermedio ("El campo
    // <strong>Respuesta al Cliente</strong> es obligatorio…") — RTL matchea texto por nodo,
    // no por el textContent agregado del elemento, así que se ancla al fragmento que SÍ
    // vive en un único nodo (el que sigue al cierre del <strong>).
    expect(screen.getByText(/obligatorio para enviar/)).toBeInTheDocument();
  });

  it('con Respuesta al Cliente y Favorabilidad completas, "Enviar" completa la tarea con ENVIAR', async () => {
    // La Clasificación Regulatoria (S2, re-editable en M3) también es requerida por
    // react-hook-form — sin estos tres campos, la validación falla y el submit nunca llega
    // a completeTask (queda en el handler de error, scrollToFirstError).
    OBJ_USE_TASK.task = makeTask({
      qd_strClientResponse: 'Se resolvió el caso', qd_strFavorability: '1',
      qd_strSfcProduct: '1', qd_strInteraction: '1', qd_strSfcReason: '1',
    });
    render(<DetalleReasignacionRespuesta />);

    // No se asserta `?.disabled).not.toBe(true)`: lo satisfacen `false`, `undefined` Y que
    // `closest()` devuelva null. Que el click complete la tarea (abajo) ya prueba que el
    // botón estaba habilitado, y lo prueba de verdad.
    //
    // onEnviar es handleSubmit(...) de react-hook-form: valida de forma ASÍNCRONA antes de
    // llamar al callback — el registro de la llamada no es sincrónico con el click.
    fireEvent.click(screen.getByText('Enviar ▶'));

    await waitFor(() => expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'ENVIAR' }),
    ));
  });

  it('"Guardar Borrador" guarda sin completar la tarea, con la acción GUARDAR_BORRADOR', () => {
    render(<DetalleReasignacionRespuesta />);

    fireEvent.click(screen.getByText('Guardar Borrador'));

    expect(OBJ_USE_TASK.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'GUARDAR_BORRADOR' }),
    );
    expect(OBJ_USE_TASK.completeTask).not.toHaveBeenCalled();
  });

  it('"Ver Expediente Completo" abre el modal con los datos del caso', () => {
    render(<DetalleReasignacionRespuesta />);

    // "Ana Pérez" ya se ve en la pantalla base (SeccionDetalleCaso) — se verifica contra el
    // encabezado propio del modal, no contra un dato que también vive fuera de él.
    expect(screen.queryByText('Expediente del Caso')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver Expediente Completo'));

    expect(screen.getByText('Expediente del Caso')).toBeInTheDocument();
  });

  it('"Reasignar Queja" entra en modo edición (Cancelar/Confirmar Reasignación)', () => {
    render(<DetalleReasignacionRespuesta />);

    fireEvent.click(screen.getByText('Reasignar Queja'));

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Reasignación')).toBeInTheDocument();
  });

  it('sin historial de asignaciones previas, la tabla de historial no se muestra (RUL-0051-07: nadie solicitó ayuda)', () => {
    render(<DetalleReasignacionRespuesta />);
    expect(screen.queryByText('Historial de Asignaciones')).not.toBeInTheDocument();
  });

  it('con historial ya registrado, muestra la tabla de Historial de Asignaciones', () => {
    OBJ_USE_TASK.task = makeTask({
      qd_lstAssignHistory: [{ fecha: '2026-08-01', de: 'ana', para: 'luis', motivo: '', observaciones: 'Ayuda con anexos' }],
    });
    render(<DetalleReasignacionRespuesta />);

    expect(screen.getByText('Historial de Asignaciones')).toBeInTheDocument();
    expect(screen.getByText('Ayuda con anexos')).toBeInTheDocument();
  });

  it('un caso devuelto por el SAC (con observaciones) oculta la reasignación y la solicitud de ayuda', () => {
    OBJ_USE_TASK.task = makeTask({ qd_strSacRemarks: 'Falta corregir el monto' });
    render(<DetalleReasignacionRespuesta />);

    expect(screen.queryByText('Reasignar Queja')).not.toBeInTheDocument();
    expect(screen.queryByText(/Necesitas de otras áreas/)).not.toBeInTheDocument();
  });
});
