import {
  ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input,
  runInInjectionContext, type Signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSectionComponent } from '../../../../components/form-section';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsRadio, type OpcionZds } from '../../../../components/fields/zds-radio';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import { CatalogosService } from '../../../../core/catalogos.service';
import type { CollectionOption } from '../../../../core/collection.types';
import { resolveFileId } from '../../../../core/request-files.types';
import { sincronizarDesc } from '../../../../core/sincronizar-desc';
import { OPTIONS_SI_NO, QD, QD_COLLECTIONS } from '../fields/fields';

/**
 * S4 · "Datos de Fraude CE-019-2024" (SEC-031) y S5 · "Anexos del Formulario" (SEC-032).
 *
 * Porte de `SeccionFraudeAnexos.tsx`. Recibe el `FormGroup` de la pantalla y escribe sobre sus
 * controles, no sobre una copia — mismo contrato que `SeccionCamposPayload` de la SCR-003.
 *
 * ── Los dos catálogos de fraude los provee esta sección ─────────────────────────────────────────
 * `CatalogosService` se declara en el `providers` de **este** componente: Tipo y Modalidad de Fraude
 * son un detalle de cómo se pintan estas dos filas, no del formulario de la pantalla. Es la misma
 * decisión (y el mismo motivo) que en `seccion-campos-payload.ts`.
 *
 * ── Los dos radios de anexos van deshabilitados **por opción**, no con `control.disable()` ──────
 * React pasa `disabled` al grupo entero (`<ZdsRadio … disabled />`), que en `ZrRadioSelect` es un
 * atributo del DOM: bloquea el click pero **no toca el valor de react-hook-form**, así que los dos
 * flags siguen viajando a PM4 en el payload y siguen alimentando el gate `blnAnnexesComplete`.
 *
 * `zds-radio` deliberadamente **no** expone un `disabled` de grupo (ver su cabecera: sería un segundo
 * camino para lo que ya gobierna el control). Y `control.disable()` tampoco es el camino, aunque por un
 * motivo más angosto de lo que parece: **no bloquearía nada visible**. El estado del control viaja por
 * el `setDisabledState` del CVA nativo de `za-radio-select` y **nunca toca `[options]`**, así que sería
 * redundante con lo de acá abajo, no un sustituto. Lo que sí importa es que un control deshabilitado
 * **desaparece de `form.value`**: hoy es inofensivo porque la pantalla lee `getRawValue()` tanto para el
 * payload como para el espejo que alimenta el gate, pero la combinación `disable()` + `value` mandaría
 * los dos flags vacíos a la SFC. Todo esto está medido como mutación y anotado en la ficha (§12.5).
 *
 * La salida es el tercer camino, y es paridad exacta: el `disabled` **por opción** viaja dentro de
 * `[options]`, `cllOpcionesZa` de `zds-radio` lo preserva, y el web component de Lit lo resuelve como
 * `?disabled=${this.disabled || opt.disabled}` sobre el `<input type="radio">` (verificado en
 * `@zurich/web-components/dist/radio-select.js`). O sea: **el mismo atributo en el mismo elemento**
 * que produce el `disabled` de grupo de React, y el `FormControl` intacto.
 *
 * Por eso `CLL_SI_NO_BLOQUEADO` se calcula una sola vez a nivel de módulo y no en un `computed`: es
 * una constante, y recrear el array en cada CD haría que `za-radio-select` re-renderizara sus opciones
 * sin motivo.
 */
const CLL_SI_NO_BLOQUEADO: readonly OpcionZds[] = OPTIONS_SI_NO.map((in_objOpcion) => ({
  ...in_objOpcion,
  disabled: true,
}));

@Component({
  selector: 'app-seccion-fraude-anexos',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormSectionComponent, ZdsInput, ZdsSelect, ZdsRadio, RequestFileListComponent,
  ],
  providers: [CatalogosService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seccion-fraude-anexos.html',
})
export class SeccionFraudeAnexos {
  /** El `FormGroup` de la pantalla. */
  readonly form = input.required<FormGroup>();

  /**
   * Valores del form, reactivos, tal como los mantiene la pantalla desde `valueChanges`.
   *
   * ⚠ No se lee `form.value` directo: no es un signal, así que leerlo en un `computed()` no crea
   * dependencia y `blnEsFraude` quedaría congelado en su primer valor. Mismo motivo que en la SCR-003.
   */
  readonly sigValores = input.required<Signal<Record<string, unknown>>>();

  /** `process_request_id` del caso, para que `RequestFileList` pueda listar el PDF generado. */
  readonly requestId = input<number | null>(null);

  private readonly objCatalogos = inject(CatalogosService);
  private readonly objInjector = inject(Injector);

  constructor() {
    // El cableado necesita el `form`, que no tiene valor todavía en el constructor porque llega por
    // `input()`. Va en un `effect()` con guarda de una sola vez.
    //
    // ⚠ El cuerpo de un `effect()` no es contexto de inyección: `sincronizarDesc()` hace
    // `inject(DestroyRef)` y tiraría NG0203 en runtime (invisible al compilar). De ahí el
    // `runInInjectionContext` con el `Injector` capturado acá. Ver el detalle en
    // `seccion-campos-payload.ts`, que documenta el mismo pozo.
    effect(() => {
      const objForm = this.form();
      if (this.blnVinculado) return;
      this.blnVinculado = true;
      runInInjectionContext(this.objInjector, () => this.vincular(objForm));
    });
  }

  /** Guarda del efecto: `vincular()` es idempotente pero cargar dos catálogos no. */
  private blnVinculado = false;

  /** Engancha los `_desc` de los dos selects de fraude y arranca sus catálogos. */
  private vincular(in_objForm: FormGroup): void {
    for (const strClave of ['fraudType', 'fraudModality'] as const) {
      // Tercer argumento como **función**: pasar el array capturaría el `[]` del primer instante
      // (antes de que responda el GET) y el `_desc` nunca se escribiría.
      const strCampo = strClave === 'fraudType' ? QD.strFraudType : QD.strFraudModality;
      sincronizarDesc(in_objForm, strCampo, () => this.cllOpcionesDe(strClave));
      void this.objCatalogos.cargar(strClave, QD_COLLECTIONS[strClave], in_objForm.getRawValue());
    }
  }

  /**
   * Opciones de un catálogo ya cargado.
   *
   * Se llama desde la plantilla, así que **no puede disparar red**: `CatalogosService.de()` separa
   * obtener de cargar justo para esto.
   */
  protected cllOpcionesDe(in_strClave: string): readonly CollectionOption[] {
    return this.objCatalogos.de(in_strClave).options();
  }

  protected readonly cllTipoFraude = computed(() => this.cllOpcionesDe('fraudType'));
  protected readonly cllModalidadFraude = computed(() => this.cllOpcionesDe('fraudModality'));

  /**
   * FLD-158 · "¿Relacionada con Fraude?" sigue siendo campo "Back" (Excel PQRS V3.0 #60): la fija el
   * cierre/responsable, así que acá es de solo lectura. Tipo, modalidad y montos (FLD-159..162) SÍ son
   * editables por el Analista SAC (Excel #57/#58/#61) y obligatorios cuando aplica (RUL-009-01 /
   * MSG-009-01).
   */
  protected readonly blnEsFraude = computed(() => this.leer(QD.strFraudRelated) === 'SI');

  /**
   * FLD-165 · El payload trae el **id de PM4** del PDF de respuesta final, no un nombre fijo (el
   * nombrado del PDF es decisión de negocio y puede cambiar), p.ej. `{ output_slip_final: 1713 }`.
   */
  protected readonly intPdfRespuestaFinal = computed(() =>
    resolveFileId(this.sigValores()()[QD.strFinalReplyPdf]),
  );

  /**
   * FLD-166 · Prórroga, campo "Back" y automático (Excel PQRS V3.0 #55).
   *
   * ⚠ **Dos divergencias con el anexo, portadas de React y anotadas en la ficha.** El anexo rotula el
   * campo *"Prórroga (días, si aplica)"* con valor por defecto `0`, o sea una cantidad de días; React
   * lo rotula *"Prórroga (Código)"* y su default es `'1'`, o sea un **código** de catálogo. Son dos
   * contratos distintos —`0 días` y el código `1` no significan lo mismo para la SFC— y decidir cuál
   * vale es del negocio, no de una migración de framework. Se porta el de React.
   */
  protected readonly strProrroga = computed(() => this.leer(QD.strSlaDaysProlognated) || '1');

  /** Lee un campo del form del padre a través del signal, para que los `computed()` dependan de él. */
  private leer(in_strCampo: string): string {
    return String(this.sigValores()()[in_strCampo] ?? '');
  }

  protected readonly CLL_SI_NO_BLOQUEADO = CLL_SI_NO_BLOQUEADO;
  protected readonly QD = QD;
}
