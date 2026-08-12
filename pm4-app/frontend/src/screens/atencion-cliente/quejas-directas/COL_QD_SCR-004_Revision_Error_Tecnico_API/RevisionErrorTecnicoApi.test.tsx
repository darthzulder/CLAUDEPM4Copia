import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RevisionErrorTecnicoApi from './RevisionErrorTecnicoApi';

// Smoke test de pantalla (patrón de docs/guides/testing-conventions.md): solo depende de
// useTask (no consume useCollection), así que alcanza con mockear ese hook. La referencia
// devuelta DEBE ser estable entre renders (ver las 4 trampas documentadas) porque la
// pantalla hace `useEffect(..., [task, reset])` para precargar con `reset(task.data)`.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    qd_strHttpCode: '400',
    qd_strErrorType: 'ESTRUCTURA_PAYLOAD',
    qd_strAttemptNum: '2',
    qd_strEndpointCalled: 'POST /api/queja/',
    qd_strApiTechMessage: 'El código ya existe',
    qd_strCompleteLogAPI: 'Log completo del intento fallido',
    qd_strPayloadSent: '',
    qd_strPayloadAdjustNeeded: 'NO',
    qd_strRootCause: '',
    qd_strCorrectionApplied: '',
  },
};

/** Fixture fresco por test, para poder pisar campos sin contaminar los siguientes. */
const makeTask = (in_dicOverrides: Record<string, unknown> = {}) => ({
  ...OBJ_TASK,
  data: { ...OBJ_TASK.data, ...in_dicOverrides },
});

const OBJ_USE_TASK = {
  task: makeTask(),
  loading: false,
  error: null,
  submitting: false,
  // DEBE devolver una promesa: la pantalla encadena `.catch()` sobre el resultado
  // (`onAutorizar`), así que con `vi.fn()` a secas cualquier test de la acción principal
  // reventaría con "cannot read .catch of undefined".
  completeTask: vi.fn((_dicData: Record<string, unknown>) => Promise.resolve({})),
  saveDraft: vi.fn(),
  reassignTask: vi.fn(),
  startProcess: vi.fn(),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

beforeEach(() => {
  OBJ_USE_TASK.task = makeTask();
});

describe('RevisionErrorTecnicoApi (SCR-004)', () => {
  it('renderiza la pantalla y precarga el detalle del error técnico', () => {
    render(<RevisionErrorTecnicoApi />);

    expect(screen.getByText('Revisión Error Técnico API')).toBeInTheDocument();
    const objHttpCode = document.querySelector('z-text-input#field-qd_strHttpCode');
    expect((objHttpCode as unknown as { model?: string })?.model).toBe('400');
  });

  it('el botón "Autorizar Reenvío" arranca deshabilitado (RUL-004-01: faltan causa raíz/corrección)', () => {
    render(<RevisionErrorTecnicoApi />);

    const objBtn = screen.getByText(/Autorizar Reenvío/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<RevisionErrorTecnicoApi />);

    expect(screen.queryByText('Log completo del error técnico')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del error técnico')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del intento fallido');
  });

  it('con causa raíz y corrección, "Autorizar Reenvío" completa con AUTORIZAR_REENVIO', async () => {
    // La acción principal de la pantalla, que antes no tenía ningún test.
    OBJ_USE_TASK.task = makeTask({
      qd_strRootCause: 'El código de producto no existía en SFC',
      qd_strCorrectionApplied: 'Se creó el producto y se reintentó',
    });
    render(<RevisionErrorTecnicoApi />);

    fireEvent.click(screen.getByText(/Autorizar Reenvío/));

    // onAutorizar pasa por handleSubmit (async) → hay que esperar al flush.
    await vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({ qd_strAction: 'AUTORIZAR_REENVIO' }),
      );
    });
  });
});

// El script de Momento 3 descarta el payload editado si no es un objeto JSON válido y
// reconstruye el body desde los campos del caso. La pantalla valida antes para que el
// analista no crea que su edición viajó — sin estos tests, `blnPayloadJsonOk` y su alerta
// estaban muertos (el fixture nunca marcaba el ajuste como necesario).
describe('RevisionErrorTecnicoApi — validación del payload editado (blnPayloadJsonOk)', () => {
  const withPayload = (in_strPayload: string) => makeTask({
    qd_strRootCause: 'causa',
    qd_strCorrectionApplied: 'corrección',
    qd_strPayloadAdjustNeeded: 'SI',
    qd_strPayloadSent: in_strPayload,
  });

  it('con ajuste marcado y JSON válido, autoriza', async () => {
    OBJ_USE_TASK.task = withPayload('{"campo":"valor"}');
    render(<RevisionErrorTecnicoApi />);

    fireEvent.click(screen.getByText(/Autorizar Reenvío/));

    await vi.waitFor(() => expect(OBJ_USE_TASK.completeTask).toHaveBeenCalled());
  });

  // ⚠️ Para "NO autoriza" se asserta el BLOQUEO (propiedad `disabled` + alerta MSG-004-01),
  // no la ausencia de llamada tras un click: en jsdom un `z-button` deshabilitado NO es un
  // <button> nativo, así que `fireEvent.click` dispara igual su `onClick`. Verificado.
  const expectBloqueado = () => {
    const objBtn = screen.getByText(/Autorizar Reenvío/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    expect(screen.getByText(/antes de autorizar el reenvío/)).toBeInTheDocument();
  };

  it('con ajuste marcado y JSON inválido, el botón queda bloqueado', () => {
    OBJ_USE_TASK.task = withPayload('{esto no es json');
    render(<RevisionErrorTecnicoApi />);
    expectBloqueado();
  });

  it('un JSON válido pero que NO es objeto (array o escalar) también bloquea', () => {
    // El script espera un OBJETO: '[1,2]' y '"texto"' parsean bien pero no sirven como body.
    for (const strPayload of ['[1,2]', '"solo texto"']) {
      OBJ_USE_TASK.task = withPayload(strPayload);
      const { unmount } = render(<RevisionErrorTecnicoApi />);
      expectBloqueado();
      unmount();
    }
  });
});
