import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CrearRecibirQueja from './CrearRecibirQueja';

// La pantalla pública de radicación — la más grande de Quejas Directas (641 líneas + 2
// secciones). Depende de useTask + useCollection (más de una decena de catálogos, todos
// mockeados con el mismo objeto estable) + el widget de reCAPTCHA (se estubea
// window.grecaptcha, igual que RecaptchaModal.test.tsx, para no esperar 10s por el script
// real de Google) + DocSupportUploader (react-hook-form real, sin red).
//
// NO se cubre el flujo end-to-end de envío exitoso (checkSimilarCases → recaptcha/verify →
// completeTask/process_events): react-hook-form exige ~20 campos obligatorios repartidos
// entre selects del DS que no se pueden interactuar vía fireEvent en jsdom (ver
// testing-conventions.md) y, además, el Municipio se limpia deliberadamente cada vez que
// cambia el Departamento (RUL-000-09) — incluida la precarga inicial desde task.data — así
// que ni siquiera queda satisfecho con un fixture. Se cubre lo que SÍ es determinista: el
// gate de envío (blnCanSubmit), la derivación de campos por rol, y las secciones
// condicionales.
function makeTask(objDataOverrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'ACTIVE',
    process_request_id: 10,
    data: {
      qd_blnDataAuth: false,
      qd_strFilerRole: '',
      qd_strAssigneeRole: '', qd_strAssignee: '',
      ...objDataOverrides,
    },
  };
}

const OBJ_USE_TASK: {
  task: ReturnType<typeof makeTask>;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  completeTask: ReturnType<typeof vi.fn>;
  saveDraft: ReturnType<typeof vi.fn>;
  reassignTask: ReturnType<typeof vi.fn>;
  startProcess: ReturnType<typeof vi.fn>;
  isWebEntry: boolean;
} = {
  task: makeTask(),
  loading: false,
  error: null,
  submitting: false,
  completeTask: vi.fn((_d: Record<string, unknown>) => Promise.resolve({})),
  saveDraft: vi.fn(),
  reassignTask: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  OBJ_USE_TASK.task = makeTask();
  // loading/error también se resetean acá: antes cada test que los pisaba los restauraba al
  // final de su propio cuerpo, así que si una aserción fallaba en el medio el restore no
  // corría y todo el resto del archivo renderizaba un loader o un banner de error.
  OBJ_USE_TASK.loading = false;
  OBJ_USE_TASK.error = null;
  // loadRecaptcha() resuelve de inmediato si grecaptcha.render ya existe — si no, espera el
  // script real de Google o expira a los 10s (ver RecaptchaModal.test.tsx).
  window.grecaptcha = { render: vi.fn(() => 1), reset: vi.fn() };
});

describe('CrearRecibirQueja (SCR-000)', () => {
  it('renderiza el banner público y las secciones del formulario', () => {
    render(<CrearRecibirQueja />);

    expect(screen.getByText('Radicación PQRs')).toBeInTheDocument();
    expect(screen.getByText('Tipo de solicitud y rol')).toBeInTheDocument();
    expect(screen.getByText('Datos del Consumidor Financiero')).toBeInTheDocument();
    expect(screen.getByText('Autorización y envío')).toBeInTheDocument();
  });

  it('"Enviar PQR" arranca deshabilitado sin autorización de datos ni captcha', () => {
    render(<CrearRecibirQueja />);

    const objBtn = screen.getByText('Enviar PQR').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('con autorización de datos pero SIN captcha resuelto, sigue deshabilitado', async () => {
    OBJ_USE_TASK.task = makeTask({ qd_blnDataAuth: true });
    render(<CrearRecibirQueja />);
    await waitFor(() => expect(window.grecaptcha!.render).toHaveBeenCalled());

    const objBtn = screen.getByText('Enviar PQR').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('con autorización de datos Y captcha resuelto, se habilita', async () => {
    OBJ_USE_TASK.task = makeTask({ qd_blnDataAuth: true });
    render(<CrearRecibirQueja />);
    await waitFor(() => expect(window.grecaptcha!.render).toHaveBeenCalledTimes(1));

    // Se asserta la TRANSICIÓN, no el valor final: `?.disabled` queda en `undefined` cuando
    // el botón está habilitado, así que `not.toBe(true)` por sí solo también lo cumpliría un
    // botón inexistente. Verificar que ANTES era `true` y DESPUÉS ya no, prueba que el
    // captcha efectivamente desbloqueó el envío.
    const leerDisabled = () => (screen.getByText('Enviar PQR')
      .closest('z-button') as unknown as { disabled?: boolean } | null)?.disabled;
    expect(leerDisabled()).toBe(true);

    // Simulamos que Google resolvió el checkbox: toma el callback pasado a render().
    const objRenderArgs = (window.grecaptcha!.render as ReturnType<typeof vi.fn>).mock.calls[0][1];
    objRenderArgs.callback('token-de-prueba');

    await waitFor(() => expect(leerDisabled()).not.toBe(true));
  });

  // Separado en dos tests: antes se hacían DOS render() en el mismo it() sin desmontar el
  // primero, así que ambas instancias quedaban en document.body y el getByText buscaba
  // entre las dos (pasaba solo porque el string era único de la segunda).
  it('sin rol "Empleado Zurich" el campo Alianza está oculto (RUL-000-01)', () => {
    render(<CrearRecibirQueja />);
    expect(screen.queryByText('Alianza')).not.toBeInTheDocument();
  });

  it('rol "Empleado Zurich" (código 3) revela el campo Alianza (RUL-000-01)', () => {
    OBJ_USE_TASK.task = makeTask({ qd_strFilerRole: '3' });
    render(<CrearRecibirQueja />);
    expect(screen.getByText('Alianza')).toBeInTheDocument();
  });

  it('sin responsable asignado no muestra la sección "Responsable asignado"', () => {
    render(<CrearRecibirQueja />);
    expect(screen.queryByText('Responsable asignado')).not.toBeInTheDocument();
  });

  it('con responsable ya asignado (post-radicación), muestra la sección de solo lectura', () => {
    OBJ_USE_TASK.task = makeTask({ qd_strAssigneeRole: 'Siniestros Autos', qd_strAssignee: 'ana.perez' });
    render(<CrearRecibirQueja />);

    expect(screen.getByText('Responsable asignado')).toBeInTheDocument();
    const objRole = document.querySelector('z-text-input#field-qd_strAssigneeRole');
    expect((objRole as unknown as { model?: string })?.model).toBe('Siniestros Autos');
  });

  it('el estado de carga (useTask.loading) muestra el loader dentro del banner público', () => {
    OBJ_USE_TASK.loading = true;
    const { container } = render(<CrearRecibirQueja />);

    expect(screen.getByText('Radicación PQRs')).toBeInTheDocument();
    expect(container.querySelector('.screen-loading')).not.toBeNull();
  });

  it('el estado de error (useTask.error) muestra el mensaje sin lanzar', () => {
    OBJ_USE_TASK.error = 'Network Error';
    render(<CrearRecibirQueja />);

    expect(screen.getByText(/Error al cargar el formulario: Network Error/)).toBeInTheDocument();
  });

  it('"Limpiar queja" vacía los campos del formulario', () => {
    // Antes este test solo verificaba que el click "no lanzara", lo que pasaba igual si
    // limpiarFormulario() fuera un no-op. Ahora se asserta el efecto observable: un campo
    // que venía precargado desde task.data queda vacío después del reset.
    OBJ_USE_TASK.task = makeTask({ qd_strComplaintText: 'Texto que debe borrarse' });
    render(<CrearRecibirQueja />);

    const objTextarea = document.querySelector('z-textarea#field-qd_strComplaintText');
    expect((objTextarea as unknown as { model?: string })?.model).toBe('Texto que debe borrarse');

    fireEvent.click(screen.getByText('Limpiar queja'));

    expect((objTextarea as unknown as { model?: string })?.model).toBe('');
  });
});
