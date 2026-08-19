import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';
import { mensajeDeError } from './http-error';
import { Pm4ContextService } from './pm4-context.service';

/** La tarea tal como la devuelve PM4. Misma forma que `TaskData` de `core/useTask.ts` en React. */
export interface DatosTarea {
  id: number;
  status: string;
  process_request_id: number;
  data: Record<string, unknown>;
  /**
   * Metadatos de la tarea que devuelve PM4 (ISO 8601, UTC). `created_at` es el instante en que el BPM
   * creó **esta** tarea, o sea cuándo llegó a la bandeja del responsable — SCR-008 lo usa como
   * respaldo de la fecha de elaboración del borrador.
   */
  created_at?: string;
  updated_at?: string;
  due_at?: string;
}

/**
 * Estado y operaciones de la tarea PM4 sobre la que corre la pantalla. Reemplaza al hook `useTask()`
 * de React (`core/useTask.ts`), conservando su superficie completa: `task`, `loading`, `error`,
 * `submitting`, `completeTask`, `saveDraft`, `reassignTask`, `startProcess` e `isWebEntry`.
 *
 * ── Signals de lectura, no `state` mutable ──────────────────────────────────────────────────────
 * Los cuatro pedazos de estado se exponen como `Signal<T>` de solo lectura y se escriben desde
 * `WritableSignal` privados. Es el equivalente directo del `useState` de React: la pantalla lee
 * `objTarea.tarea()` en el template y Angular recalcula solo lo que dependa de eso. Que sean de solo
 * lectura hacia afuera importa — con `useTask` la pantalla tampoco podía escribir el estado, y
 * exponer los `WritableSignal` invitaría a que una pantalla "arregle" un `error` seteándolo en vez de
 * corregir la causa.
 *
 * ── Los métodos devuelven promesas, a propósito ─────────────────────────────────────────────────
 * `HttpClient` devuelve `Observable`, pero acá se convierte con `firstValueFrom` porque las pantallas
 * hacen `await objTarea.completarTarea(...)` dentro de un `onSubmit` secuencial (subir archivos →
 * completar tarea → redirigir). Devolver el `Observable` obligaría a reescribir ese flujo con
 * `switchMap` sin ganancia: son peticiones únicas que no se cancelan ni se re-emiten. `firstValueFrom`
 * además desuscribe sola al primer valor, así que no deja suscripción colgada.
 *
 * ── `cargar()` es explícito, no un efecto de construcción ───────────────────────────────────────
 * En React la carga inicial vivía en un `useEffect` que corría al montar. Acá **no** se dispara desde
 * el constructor: el servicio es de root, así que se instancia la primera vez que alguien lo inyecta
 * —posiblemente un interceptor o un spec— y una petición HTTP disparada por el ciclo de vida del
 * inyector es imposible de testear sin condicionar el orden. La pantalla llama `cargar()` en su
 * `ngOnInit`, que es el punto equivalente al montaje del componente React.
 *
 * ── Los `console.log` se portan, no se limpian ──────────────────────────────────────────────────
 * Son diagnóstico en uso: imprimen `task.data` completo, que es lo primero que se mira cuando una
 * pantalla no precarga bien dentro del iframe de PM4 y no hay debugger a mano. Sacarlos sería un
 * cambio funcional encubierto en una migración de framework.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly objHttp = inject(HttpClient);
  private readonly objCtx = inject(Pm4ContextService);

  private readonly sigTarea = signal<DatosTarea | null>(null);
  private readonly sigCargando = signal(true);
  private readonly sigError = signal<string | null>(null);
  private readonly sigEnviando = signal(false);

  /** La tarea cargada, o `null` mientras no haya ninguna (incluido el caso de web entry). */
  public readonly tarea: Signal<DatosTarea | null> = this.sigTarea.asReadonly();
  /** Arranca en `true`, igual que el `useState(true)` de React: la pantalla pinta el loader de una. */
  public readonly cargando: Signal<boolean> = this.sigCargando.asReadonly();
  public readonly error: Signal<string | null> = this.sigError.asReadonly();
  /** `true` mientras hay una escritura en vuelo. Es lo que deshabilita los botones del `ActionBar`. */
  public readonly enviando: Signal<boolean> = this.sigEnviando.asReadonly();

  /**
   * `true` cuando la app se abrió **sin** `task_id` ni `case_id`, o sea como *web entry*: un
   * formulario público que **inicia** un caso en vez de continuar una tarea existente. Es lo que
   * decide si el submit va por `iniciarProceso()` o por `completarTarea()`.
   */
  public get blnEsWebEntry(): boolean {
    return !this.objCtx.taskId() && !this.objCtx.caseId();
  }

  /**
   * Carga la tarea. La pantalla la llama en su `ngOnInit`.
   *
   * Dos rutas, y el orden entre ellas es contrato: **`case_id` gana sobre `task_id`**. PM4 manda uno o
   * el otro según el nodo, y cuando manda el caso hay que resolver primero cuál es su tarea activa
   * (`GET /cases/{id}/task`) porque el `task_id` no se conoce de antemano.
   *
   * No lanza: un fallo de carga deja el mensaje en `error()` para que la pantalla lo pinte, que es lo
   * que hacía el `.catch` del hook. Una excepción acá reventaría el `ngOnInit` de la pantalla.
   */
  public async cargar(): Promise<void> {
    const strTaskId = this.objCtx.taskId();
    const strCaseId = this.objCtx.caseId();

    // Sin ninguno de los dos no hay nada que traer: es una web entry y la pantalla arranca en blanco.
    if (!strTaskId && !strCaseId) {
      this.sigCargando.set(false);
      return;
    }

    try {
      if (strCaseId) {
        console.log(`[TaskService] Resolviendo task desde case_id=${strCaseId}...`);
        const objTarea = await firstValueFrom(
          this.objHttp.get<DatosTarea>(urlApi(`/cases/${strCaseId}/task`)),
        );
        console.log(`[TaskService] case_id=${strCaseId} → task_id=${objTarea.id}`);
        console.log('[TaskService] Variables del caso (task.data):', objTarea.data);
        this.sigTarea.set(objTarea);
      } else {
        console.log(`[TaskService] Cargando task_id=${strTaskId}...`);
        const objTarea = await firstValueFrom(
          this.objHttp.get<DatosTarea>(urlApi(`/tasks/${strTaskId}`), {
            params: new HttpParams().set('include', 'data'),
          }),
        );
        console.log(`[TaskService] task_id=${strTaskId} cargado`);
        console.log('[TaskService] Variables del caso (task.data):', objTarea.data);
        this.sigTarea.set(objTarea);
      }
    } catch (in_excError: unknown) {
      this.sigError.set(mensajeDeError(in_excError));
    } finally {
      this.sigCargando.set(false);
    }
  }

  /** Completa la tarea y deriva el proceso al siguiente nodo. */
  public async completarTarea(
    in_dicDatos: Record<string, unknown>,
  ): Promise<unknown> {
    const objTarea = this.sigTarea();
    if (!objTarea?.id) throw new Error('No hay task_id resuelto');

    this.sigEnviando.set(true);
    try {
      const objPayload = { status: 'COMPLETED', data: in_dicDatos };
      console.log(`[TaskService] Enviando task_id=${objTarea.id}:`, objPayload);
      const genResp = await firstValueFrom(
        this.objHttp.put<unknown>(urlApi(`/tasks/${objTarea.id}`), objPayload),
      );
      console.log('[TaskService] Respuesta de PM4:', genResp);
      return genResp;
    } finally {
      this.sigEnviando.set(false);
    }
  }

  /**
   * Reasigna la tarea a otro usuario PM4 **sin completarla**.
   *
   * ⚠ **Contrato de DOS PUT, verificado contra la UI real de PM4** (capturado del `curl` que emite el
   * navegador). No es una decisión de estilo y no se puede colapsar en una sola petición:
   *
   * 1. El PUT que reasigna lleva **solo `{ user_id }`**. Mezclarlo con `status`/`data` en el mismo
   *    cuerpo hace que **PM4 no reasigne** — acepta la petición y la tarea se queda con el
   *    responsable anterior, sin error visible.
   * 2. Los datos del formulario se guardan **aparte**, con `PUT /requests/{id}` (el mismo mecanismo
   *    que "Guardar Borrador"), sin tocar el status de la tarea.
   *
   * El segundo PUT **se omite** si la tarea no trae `process_request_id`: sin él la URL apuntaría a
   * `/requests/undefined`. Devuelve la respuesta de la **reasignación** (el paso 1), no la del
   * guardado, porque es la que dice si la operación que le importa a la pantalla salió bien.
   */
  public async reasignarTarea(
    in_dicDatos: Record<string, unknown>,
    in_strUserId: string,
  ): Promise<unknown> {
    const objTarea = this.sigTarea();
    if (!objTarea?.id) throw new Error('No hay task_id resuelto');

    this.sigEnviando.set(true);
    try {
      console.log(`[TaskService] Reasignando task_id=${objTarea.id} a user_id=${in_strUserId}`);
      const genRespReasignar = await firstValueFrom(
        this.objHttp.put<unknown>(urlApi(`/tasks/${objTarea.id}`), { user_id: in_strUserId }),
      );
      console.log('[TaskService] Respuesta de PM4 (reasignar):', genRespReasignar);

      if (objTarea.process_request_id) {
        const genRespDatos = await firstValueFrom(
          this.objHttp.put<unknown>(urlApi(`/requests/${objTarea.process_request_id}`), {
            data: in_dicDatos,
          }),
        );
        console.log('[TaskService] Respuesta de PM4 (guardar datos):', genRespDatos);
      }
      return genRespReasignar;
    } finally {
      this.sigEnviando.set(false);
    }
  }

  /**
   * Guarda los datos del caso **sin** completar ni avanzar la tarea (el "Guardar Borrador").
   *
   * Exige `process_request_id`, no `id`: se escribe sobre el *request* (el caso), no sobre la tarea.
   * Es la diferencia con `completarTarea()` y el motivo de que el mensaje de error nombre otra cosa.
   */
  public async guardarBorrador(
    in_dicDatos: Record<string, unknown>,
  ): Promise<unknown> {
    const objTarea = this.sigTarea();
    if (!objTarea?.process_request_id) throw new Error('No hay process_request_id resuelto');

    this.sigEnviando.set(true);
    try {
      const objPayload = { data: in_dicDatos };
      console.log(
        `[TaskService] Guardando borrador request_id=${objTarea.process_request_id}:`,
        objPayload,
      );
      const genResp = await firstValueFrom(
        this.objHttp.put<unknown>(urlApi(`/requests/${objTarea.process_request_id}`), objPayload),
      );
      console.log('[TaskService] Respuesta de PM4:', genResp);
      return genResp;
    } finally {
      this.sigEnviando.set(false);
    }
  }

  /**
   * Inicia un proceso nuevo. Es la vía de la *web entry*: no hay tarea previa que completar.
   *
   * El `event_id` (el nodo BPMN de arranque) va como query param **solo si existe**; PM4 usa el evento
   * de inicio por defecto cuando no se manda. Se preserva que sin `event_id` la petición viaje con
   * params vacíos y no con `event=`, que PM4 leería como un nodo llamado cadena vacía.
   */
  public async iniciarProceso(
    in_dicDatos: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const strProcessId = this.objCtx.processId();
    if (!strProcessId) throw new Error('No hay process_id para iniciar el proceso');

    this.sigEnviando.set(true);
    try {
      const strEventId = this.objCtx.eventId();
      let objParams = new HttpParams();
      if (strEventId) objParams = objParams.set('event', strEventId);

      const genResp = await firstValueFrom(
        this.objHttp.post<Record<string, unknown>>(
          urlApi(`/process_events/${strProcessId}`),
          in_dicDatos,
          { params: objParams },
        ),
      );
      console.log('[TaskService] Proceso iniciado:', genResp);
      return genResp;
    } finally {
      this.sigEnviando.set(false);
    }
  }
}

