import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RespuestaAreaResponsable from './RespuestaAreaResponsable';

// Smoke test de pantalla (patrón de docs/guides/testing-conventions.md): aísla la pantalla
// de la red mockeando los dos hooks que pegan al backend — useTask (task.data) y
// useCollection (catálogos PM4). Verifica que renderiza y que precarga task.data en el
// formulario; el flujo real contra PM4 se sigue validando a mano en Docker.
// ⚠️ El objeto devuelto (y sobre todo `task`) DEBE ser una referencia estable entre
// renders. Las pantallas hacen `useEffect(..., [task, reset])` para precargar con
// reset(task.data): si el mock devuelve un objeto literal nuevo en cada llamada, `task`
// cambia de identidad en cada render, el efecto se vuelve a disparar, y el ciclo
// render→reset→render no termina — el test muere con "JavaScript heap out of memory".
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    qd_strFirstName: 'Ana',
    qd_strLastName: 'Pérez',
    qd_strComplaintText: 'Texto de la queja de ejemplo',
  },
};

const OBJ_USE_TASK = {
  task: OBJ_TASK,
  loading: false,
  error: null,
  submitting: false,
  completeTask: vi.fn(),
  saveDraft: vi.fn(),
  reassignTask: vi.fn(),
  startProcess: vi.fn(),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

// ⚠️ La referencia devuelta por useCollection DEBE ser estable entre renders. Si se
// devuelve un `[]` literal nuevo cada llamada, useSyncDesc lo ve como cambio de
// dependencia, vuelve a setear el campo, provoca otro render, y el ciclo no termina:
// el test se cuelga y muere con "JavaScript heap out of memory".
const CLL_VACIO: never[] = [];

vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  // descOf/useSyncDesc son lógica pura ya cubierta por useCollection.test.ts — se conservan
  // reales y solo se stubea useCollection, que es el que dispara la petición HTTP.
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => ({ options: CLL_VACIO, loading: false, error: null }) };
});

describe('RespuestaAreaResponsable (SCR-0052)', () => {
  it('renderiza la pantalla con sus secciones', () => {
    render(<RespuestaAreaResponsable />);

    expect(screen.getByText('Respuesta del Área Responsable')).toBeInTheDocument();
    expect(screen.getByText('Comentario y Adjunto')).toBeInTheDocument();
  });

  it('precarga en el formulario los valores que llegan en task.data', () => {
    render(<RespuestaAreaResponsable />);

    // Los controles del DS son custom elements sin <textarea>/<input> nativo dentro, así
    // que el valor NO se lee con getByDisplayValue — vive en la propiedad `model` del
    // elemento (ver docs/guides/testing-conventions.md).
    const objTextarea = document.querySelector('z-textarea#field-qd_strComplaintText');
    expect((objTextarea as unknown as { model?: string })?.model).toBe('Texto de la queja de ejemplo');
  });

  it('deshabilita el botón Enviar mientras no haya comentario (RUL-0052-01)', () => {
    // task.data no trae qd_strAreaComment, así que blnCanSubmit arranca en false.
    render(<RespuestaAreaResponsable />);

    // React 19 asigna `disabled` como PROPIEDAD del custom element, no como atributo →
    // hasAttribute('disabled') devuelve false aunque el botón sí esté deshabilitado.
    const objSubmit = screen.getByText(/Enviar comentario/).closest('z-button');
    expect(objSubmit).not.toBeNull();
    expect((objSubmit as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });
});
