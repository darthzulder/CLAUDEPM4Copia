import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type ValidatorFn,
} from '@angular/forms';
import { ZdsCheckboxField } from '../../components/fields/zds-checkbox-field';
import { ZdsDate } from '../../components/fields/zds-date';
import { ZdsFileInput } from '../../components/fields/zds-file-input';
import { ZdsInput } from '../../components/fields/zds-input';
import { ZdsRadio } from '../../components/fields/zds-radio';
import { ZdsSelect } from '../../components/fields/zds-select';
import { ZdsStatusBadge } from '../../components/fields/zds-status-badge';
import { ZdsTextarea } from '../../components/fields/zds-textarea';
import { ZrAlert, ZrButton, ZrLoader } from '../../components/fields/zds-reexports';
import { FileRegistryService } from '../../core/file-registry.service';

/**
 * Obligatoriedad de un checkbox cuyo control guarda **texto**, no un booleano.
 *
 * `Validators.requiredTrue` **no sirve acá**, y el motivo no es evidente: compara con
 * `value === true` (identidad estricta contra el booleano), así que sobre un control que guarda
 * `'SI'`/`'NO'` —el contrato de texto de PM4— **nunca** se satisface. El campo quedaría inválido con
 * el checkbox tildado, o sea que el formulario no podría enviarse jamás. Salió de un spec que se puso
 * rojo; con `'NO'` siendo *truthy* en JS es el tipo de bug que "parece" andar hasta que alguien
 * intenta completar la tarea.
 *
 * `Validators.required` tampoco: `'NO'` no es vacío, así que lo daría por válido siempre.
 *
 * Se usa el mismo `errorRequired` que el resto de la fachada para que el mensaje del DS no cambie.
 */
export function requerirTildado(in_strValorTildado: string): ValidatorFn {
  return (in_objControl) => (in_objControl.value === in_strValorTildado ? null : { required: true });
}

/**
 * Pantalla de verificación del **gate 2**, no una pantalla de negocio.
 *
 * ── Por qué existe, y por qué no alcanzaba con los specs ──────────────────────────────────────
 * Los 124 specs de la fachada corren bajo **jsdom, que no hace upgrade de los custom elements de
 * Lit**: los `lib-*-z`/`za-*` quedan como elementos inertes con sus atributos puestos. O sea que
 * **ningún spec de este proyecto asevera pintado**, y hay una clase entera de fallas que no pueden
 * ver — un `[model]` que llega bien pero no se refleja en el `<input>` del shadow root, un
 * `help-text` que el DS ignora, un campo que monta invisible por CSS faltante.
 *
 * El plan de migración declara la verificación manual en Docker como **parte del gate y no un extra
 * opcional** justamente por eso. Esta pantalla es el sujeto de esa verificación: monta **los 8
 * wrappers de campo** más los re-exports con gotcha medido, en un `FormGroup` real con validadores
 * reales, para que un humano confirme en el navegador lo que jsdom no puede.
 *
 * ── Cómo se usa ───────────────────────────────────────────────────────────────────────────────
 * ```
 * docker restart pm4-app-container     # no hay HMR sobre el bind mount de Windows
 * http://localhost:4200/?screen=gate-fachada
 * ```
 *
 * El checklist de lo que hay que mirar vive en
 * [GATE2_VERIFICACION_MANUAL.md](./GATE2_VERIFICACION_MANUAL.md), al lado de este archivo: si el
 * checklist estuviera solo en el plan, se archivaría con él al cerrar la migración y la pantalla
 * quedaría sin instrucciones.
 *
 * ── Qué NO es ─────────────────────────────────────────────────────────────────────────────────
 * No se registra en `app.routes.ts` como pantalla de negocio ni entra en la guarda de inventario de
 * la Fase 4 (que compara rutas contra pantallas **con spec de RUL**, y esta no tiene RULs porque no
 * implementa ningún anexo). Tampoco se borra al cerrar la Fase 2: sigue siendo el banco de pruebas
 * de la fachada cuando se actualice `lib-zurich`, que es exactamente el escenario donde los gotchas
 * medidos pueden cambiar sin que ningún spec se ponga rojo (los specs aseveran el gotcha, no su
 * ausencia).
 *
 * ── Por qué el `FileRegistryService` se provee acá ────────────────────────────────────────────
 * Es `providedIn: null` por diseño (una instancia **por pantalla**, no un singleton global — dos
 * pantallas compartiendo el mapa de binarios se pisarían los adjuntos). Así que cada pantalla que
 * use `zds-file-input` tiene que declararlo en sus `providers`, y esta es la primera que lo hace:
 * sirve de molde para las de la Fase 5.
 */
@Component({
  selector: 'gate-fachada',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ZdsInput,
    ZdsSelect,
    ZdsTextarea,
    ZdsDate,
    ZdsCheckboxField,
    ZdsRadio,
    ZdsFileInput,
    ZdsStatusBadge,
    ZrAlert,
    ZrButton,
    ZrLoader,
  ],
  providers: [FileRegistryService],
  templateUrl: './gate-fachada.html',
})
export class GateFachada {
  /**
   * Los cinco `lib-*-z` + los dos `za-*` con CVA, con validadores reales.
   *
   * `qd_strAutoriza` lleva el validador propio [`requerirTildado`](#requerirTildado) y no un
   * `Validators` de fábrica, por dos razones que se acumulan:
   *
   * 1. **`requiredTrue` no aplica a un control de texto** — compara con `=== true` y el control
   *    guarda `'SI'`/`'NO'`, así que nunca se satisface. Ver la cabecera de `requerirTildado`.
   * 2. **La obligatoriedad no puede delegarse al DS.** El `validRequired()` de `lib-checkbox-z` está
   *    **invertido** (`return this.required && this.model`, sin negación), así que marcaría
   *    `errorRequired` justo cuando el checkbox **sí** está tildado. La regla de la fachada es que la
   *    obligatoriedad del checkbox vive solo en el control, y el `[obligatorio]` del wrapper se pasa
   *    únicamente por el asterisco del label. Ver la cabecera de `zds-checkbox-field.ts`.
   */
  readonly form = new FormGroup({
    qd_strNombre: new FormControl('', [Validators.required, Validators.maxLength(40)]),
    qd_strCorreo: new FormControl('', [Validators.required, Validators.email]),
    qd_strCanal: new FormControl('', [Validators.required]),
    qd_strDepartamento: new FormControl(''),
    qd_strDetalle: new FormControl('', [Validators.required, Validators.minLength(10)]),
    qd_strFecha: new FormControl(''),
    qd_strTipoPersona: new FormControl(''),
    qd_strAutoriza: new FormControl('NO', [requerirTildado('SI')]),
    qd_strSoporte: new FormControl(''),
  });

  /** Opciones estáticas: alcanzan para el gate y no requieren que PM4 esté arriba. */
  readonly cllCanales = [
    { value: '13', text: 'Internet' },
    { value: '14', text: 'Telefónico' },
    { value: '15', text: 'Presencial' },
  ] as const;

  readonly cllDepartamentos = [
    { value: '05', text: 'Antioquia' },
    { value: '11', text: 'Bogotá D.C.' },
    { value: '76', text: 'Valle del Cauca' },
  ] as const;

  readonly cllTiposPersona = [
    { value: 'N', text: 'Natural' },
    { value: 'J', text: 'Jurídica' },
  ] as const;

  /** Prende el `[loading]` del select para ver el "Cargando opciones..." real del DS. */
  readonly blnCargando = signal(false);

  /**
   * Mensaje del `zds-file-input` cuando rechaza un archivo. Llega por `(rechazado)` y se devuelve
   * por `[error]`, que es el contrato que el wrapper documenta: el rechazo **no** se escribe en el
   * control porque `setErrors` reemplaza en vez de componer y borraría el `required`.
   */
  readonly strErrorSoporte = signal('');

  /** Error explícito de servidor, para probar que el `[error]` gana sobre el estado del control. */
  readonly strErrorServidor = signal('');

  readonly strResultado = signal('');

  /** Simula la precarga desde PM4 (`reset(task.data)` en React → `patchValue` acá). */
  precargar(): void {
    this.form.patchValue({
      qd_strNombre: 'Nelson Bravo',
      qd_strCorreo: 'nelson.bravo@zurich.com',
      qd_strCanal: '13',
      qd_strDepartamento: '11',
      qd_strDetalle: 'Detalle de prueba con largo suficiente para pasar el minLength.',
      qd_strFecha: '2026-08-14',
      qd_strTipoPersona: 'N',
      qd_strAutoriza: 'SI',
    });
  }

  /** Marca todo como tocado para que el estado de error del DS se pinte de verdad. */
  tocarTodo(): void {
    this.form.markAllAsTouched();
  }

  /** Prueba que un `[error]` explícito desplaza al `helpText` y gana sobre `invalid && touched`. */
  simularErrorServidor(): void {
    this.strErrorServidor.set(
      this.strErrorServidor() ? '' : 'El caso ya existe para este documento (error de servidor)',
    );
  }

  alternarCarga(): void {
    this.blnCargando.set(!this.blnCargando());
  }

  limpiar(): void {
    this.form.reset({ qd_strAutoriza: 'NO' });
    this.strResultado.set('');
    this.strErrorSoporte.set('');
    this.strErrorServidor.set('');
  }

  /**
   * No completa ninguna tarea: solo volca el valor del `FormGroup`, que es lo que se compara con lo
   * que se ve en pantalla. Es el punto del gate donde se confirma que lo que el DS pinta y lo que
   * Reactive Forms tiene adentro son la misma cosa.
   */
  enviar(): void {
    this.strResultado.set(JSON.stringify(this.form.getRawValue(), null, 2));
  }
}
