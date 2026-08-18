import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import {
  ZrAlertInline,
  ZrButton,
  ZrModal,
  ZrTemplate,
} from '../../../../components/fields/zds-reexports';
import { Pm4GroupsService, type Pm4GroupUser } from '../../../../core/pm4-groups.service';
import { OPTIONS_AREA, OS } from '../fields/fields';

/**
 * ACT-003-02 "Reasignar Caso" — modal para derivar la tarea a otro usuario de Línea 2.
 *
 * Port de `frontend/src/screens/.../COL_OS_SCR-003_Bandeja_Gestion_Linea2/ReasignarCasoModal.tsx`.
 *
 * El área es el catálogo CAT-AREA del Anexo02 (07_Catalogs) y su **etiqueta** es además el nombre del
 * grupo PM4 del que se traen los usuarios reales, así que la lista se recarga cada vez que cambia el
 * área. Reasignar **NO completa la tarea**: solo cambia el responsable (ver `reasignarTarea` en
 * [`TaskService`](../../../../core/task.service.ts)), o sea que el caso sigue parado en P02-T12.
 *
 * ── Por qué el `FormGroup` entra por input y no se declara acá ─────────────────────────────────
 * Los dos campos del modal (`os_strAssigneeArea`, `os_strAssigneeUser`) son campos **del caso**: se
 * guardan en el expediente para dejar registrado a quién se reasignó, así que viven en el mismo
 * `FormGroup` de la pantalla y viajan en su payload. Es el mismo patrón que
 * [`DocSupportUploader`](../../../../components/doc-support-uploader.ts) — el form se recibe, no se
 * fabrica. Declarar un form propio acá partiría el payload en dos y obligaría a copiar los valores
 * de vuelta a mano en el submit.
 *
 * ── El modal se monta SIEMPRE y el `@if` va adentro del slot ───────────────────────────────────
 * Es la tercera regla dura del contrato de slots de `ModalZ`: su `ngAfterContentInit` corre **una
 * vez** y si el `<ng-template libZTemplate id="content">` no está presente en ese momento, guarda
 * `undefined` y no vuelve a mirar. Como la pantalla monta con el modal cerrado, esa es justamente la
 * condición inicial real. React resolvía lo contrario —`if (!isOpen) return null`, para que `ZrModal`
 * liberara backdrop y scroll-lock al desmontarse—; acá el desmontaje del host no es una opción, así
 * que el `@if(abierto())` gobierna el **contenido** y el `[open]` gobierna el modal. Ver
 * `preview-modal.ts` y el punto 3 de `zds-reexports.ts`.
 *
 * ── La carga de usuarios: `effect`, y por qué no hay `takeUntilDestroyed` ──────────────────────
 * El `useEffect` de React reaccionaba a `[isOpen, strArea]` y se protegía de la respuesta tardía con
 * un flag `blnCancelled`. Acá el equivalente es un `effect()` sobre esos dos signals, con el mismo
 * flag por generación: `intGeneracion` se incrementa en cada corrida y la respuesta solo se aplica si
 * sigue siendo la vigente. No hace falta cancelar en el destroy porque el `effect` ya se destruye con
 * el componente y lo único que la promesa tardía puede hacer es escribir signals de un componente
 * muerto — pero el chequeo de generación la ataja igual, y es lo que impide el bug real: elegir
 * "Siniestros" y después "Pagos" con la primera respuesta llegando última, que dejaría los usuarios
 * de Siniestros bajo el rótulo de Pagos.
 */
@Component({
  selector: 'app-reasignar-caso-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ZdsSelect,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrModal,
    ZrTemplate,
  ],
  template: `
    <lib-modal-z [open]="abierto()" tamanio="m" (close)="cerrar.emit()">
      <ng-template libZTemplate id="content">
        @if (abierto()) {
          <div z-flex="col:150" [formGroup]="form()">
            <h3 class="modal-titulo">Reasignar caso</h3>
            <p class="subsection-note">
              Elija el área y el usuario de Línea 2 que continuará con el análisis del caso.
            </p>

            <zds-select
              formControlName="os_strAssigneeArea"
              name="os_strAssigneeArea"
              label="Área especializada"
              [options]="cllAreas"
              placeholder="Seleccione…"
            />

            <!-- El lib-input-select-z no puede deshabilitarse: su input "disable" está MUERTO (ver el
                 gotcha 2 de zds-select.ts), así que el "elija primero un área" es solo el helpText,
                 igual que la limitación que la fachada ya documenta para el estado de carga. React
                 pasaba un "disabled" que el DS tampoco aplicaba: la paridad se mantiene.
                 (Sin backticks: este comentario vive dentro de un template literal.) -->
            <zds-select
              formControlName="os_strAssigneeUser"
              name="os_strAssigneeUser"
              label="Usuario de Línea 2"
              [options]="cllUsuarios()"
              placeholder="Seleccione…"
              [loading]="blnCargando()"
              [helpText]="strAreaElegida() ? '' : 'Elija primero un área.'"
            />

            @if (strErrorCarga()) {
              <za-alert config="negative" [hide-close]="true">{{ strErrorCarga() }}</za-alert>
            }

            <!-- Área elegida pero sin usuarios: el grupo PM4 no existe o está vacío. Es un aviso
                 distinto del error de red, y por eso son dos alertas y no una: acá la petición salió
                 bien y la respuesta vino vacía, o sea que el problema está en OPTIONS_AREA o en el
                 catálogo de grupos de PM4, no en la conexión. -->
            @if (blnAreaSinUsuarios()) {
              <za-alert config="info" [hide-close]="true">
                No se encontraron usuarios de ProcessMaker para el área seleccionada.
              </za-alert>
            }

            <div z-flex="75" z-align="right:center">
              <lib-button-z
                label="Cancelar"
                [type]="'secondary'"
                [disabled]="false"
                (eventClick)="cerrar.emit()"
              />
              <lib-button-z
                label="Confirmar reasignación"
                [type]="'positive'"
                [disabled]="!strUserId() || enviando()"
                [loading]="enviando()"
                (eventClick)="confirmar()"
              />
            </div>
          </div>
        }
      </ng-template>
    </lib-modal-z>
  `,
})
export class ReasignarCasoModal {
  private readonly objGrupos = inject(Pm4GroupsService);

  readonly abierto = input.required<boolean>();
  readonly form = input.required<FormGroup>();
  readonly enviando = input(false);

  readonly cerrar = output<void>();

  /**
   * Emite el **user_id de PM4** del usuario elegido, no su username: es lo que `reasignarTarea`
   * manda en el PUT. La pantalla hace la llamada; este componente solo resuelve el destinatario.
   */
  readonly confirmado = output<string>();

  readonly cllAreas = OPTIONS_AREA;

  readonly cllUsuarios = signal<readonly Pm4GroupUser[]>([]);
  readonly blnCargando = signal(false);
  readonly strErrorCarga = signal('');

  /** Espejo en signal del área elegida, alimentado por la suscripción del constructor. */
  private readonly sigArea = signal('');

  /** Espejo del usuario elegido. Junto con `cllUsuarios` resuelve el `user_id`. */
  private readonly sigUsuario = signal('');

  /** Ver el bloque de la cabecera: descarta la respuesta de una carga que ya no es la vigente. */
  private intGeneracion = 0;

  readonly strAreaElegida = this.sigArea.asReadonly();

  /**
   * El select guarda el **username**; PM4 reasigna por **user_id**, que viene en la misma opción.
   * Sin usuario resuelto el botón de confirmar queda deshabilitado — es la dependencia declarada en
   * §9 de la ficha de la pantalla.
   */
  readonly strUserId = computed(
    () => this.cllUsuarios().find((in_objU) => in_objU.value === this.sigUsuario())?.id ?? '',
  );

  /**
   * El aviso de "0 usuarios" solo aplica cuando ya se eligió un área, la carga terminó y no hubo
   * error: los otros tres estados tienen su propia afordancia (el helpText, el spinner, la alerta
   * negativa) y superponerlos mostraría dos mensajes contradictorios a la vez.
   */
  readonly blnAreaSinUsuarios = computed(
    () =>
      !!this.sigArea() &&
      !this.blnCargando() &&
      !this.strErrorCarga() &&
      this.cllUsuarios().length === 0,
  );

  constructor() {
    // Los dos espejos se alimentan del form recibido. Va en el constructor porque `form()` es un
    // input requerido y su valor ya está disponible acá (Angular lo asigna antes del primer render),
    // y porque la suscripción necesita el contexto de inyección para morir con el componente.
    // El parámetro del `effect` NO es un objeto con `.onCleanup()`: es la función registradora en sí
    // (`EffectCleanupRegisterFn`), así que se la invoca directo. Se desuscribe cuando el efecto vuelve
    // a correr —el form cambió de identidad— y cuando el componente muere.
    effect((in_fnAlLimpiar) => {
      const objForm = this.form();
      this.leerDelForm(objForm);
      const objSus = objForm.valueChanges.subscribe(() => this.leerDelForm(objForm));
      in_fnAlLimpiar(() => objSus.unsubscribe());
    });

    // Al elegir un área traemos los usuarios del grupo PM4 homónimo y preseleccionamos el primero,
    // para que el modal nunca quede con un área elegida y ningún destinatario.
    effect(() => {
      const blnAbierto = this.abierto();
      const strArea = this.sigArea();
      if (!blnAbierto || !strArea) {
        this.cllUsuarios.set([]);
        return;
      }
      void this.cargarUsuarios(strArea);
    });
  }

  private leerDelForm(in_objForm: FormGroup): void {
    this.sigArea.set(String(in_objForm.get(OS.strAssigneeArea)?.value ?? ''));
    this.sigUsuario.set(String(in_objForm.get(OS.strAssigneeUser)?.value ?? ''));
  }

  private async cargarUsuarios(in_strArea: string): Promise<void> {
    // La ETIQUETA del área es el nombre del grupo PM4 (suposición 5 de la ficha). El fallback al
    // `value` cubre un área que llegue en `task.data` y ya no exista en el catálogo.
    const strGrupo =
      OPTIONS_AREA.find((in_objOpt) => in_objOpt.value === in_strArea)?.label ?? in_strArea;

    const intMio = ++this.intGeneracion;
    this.blnCargando.set(true);
    this.strErrorCarga.set('');

    try {
      const cllEncontrados = await this.objGrupos.usuariosDeGrupo(strGrupo);
      if (intMio !== this.intGeneracion) return;
      this.cllUsuarios.set(cllEncontrados);
      this.form()
        .get(OS.strAssigneeUser)
        ?.setValue(cllEncontrados[0]?.value ?? '');
    } catch (excError) {
      if (intMio !== this.intGeneracion) return;
      console.error('[ReasignarCasoModal] Error al buscar usuarios del grupo PM4:', excError);
      this.cllUsuarios.set([]);
      this.strErrorCarga.set('No se pudieron cargar los usuarios del área seleccionada.');
    } finally {
      if (intMio === this.intGeneracion) this.blnCargando.set(false);
    }
  }

  /**
   * La guarda del `if (strUserId)` de React se conserva y **no es redundante** con el `[disabled]`:
   * un botón deshabilitado del DS igual dispara su handler bajo jsdom (trampa 1 de
   * `testing-conventions.md`), así que el corte real vive acá.
   */
  confirmar(): void {
    const strId = this.strUserId();
    if (strId) this.confirmado.emit(strId);
  }
}
