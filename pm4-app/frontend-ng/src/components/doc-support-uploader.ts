import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileRegistryService } from '../core/file-registry.service';
import { ZdsFileInput } from './fields/zds-file-input';
import { ZrButton } from './fields/zds-reexports';

/** Extensiones y tope de tamaño del bloque, preservados textual de la fachada React. */
const EXTENSIONES = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'] as const;
const MAX_MB = 5;
const MSG_INVALIDO = 'Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)';

/**
 * Bloque reutilizable "Documento de soporte": filas de `label + campo de archivo`, con un botón
 * "Agregar documento" hasta `max`. Port de `components/DocSupportUploader.tsx`.
 *
 * ```html
 * <app-doc-support-uploader [form]="objForm" [docKeys]="['qd_strDoc01','qd_strDoc02','qd_strDoc03']" />
 * ```
 *
 * ── Lo que la migración le saca de encima: 4 props que eran plomería de react-hook-form ──────────
 * La versión React recibía `form: UseFormReturn<T>` **y** `fileRegistry: MutableRefObject<Map>`, y
 * adentro desestructuraba `watch`, `setValue`, `setError`, `clearErrors`, `control` y `formState`.
 * Todo eso era prop-drilling obligado por RHF, no diseño: el componente necesitaba las funciones del
 * form porque no había otra forma de alcanzarlo.
 *
 * Acá el `FormGroup` entra por un solo `input` y el registro de archivos **se inyecta**
 * ([`FileRegistryService`](../core/file-registry.service.ts), provisto por pantalla). El
 * `zds-file-input` ya escribe el nombre en su `FormControl` y el binario en el registro por su cuenta,
 * así que este bloque no toca ninguno de los dos en el camino normal — solo en el borrado, que es lo
 * que sigue.
 *
 * ── ⚠ El borrado DESPLAZA los slots, no vacía el que se borró ────────────────────────────────────
 * Es la única lógica no trivial del componente y la razón por la que existe su propio test. Los
 * documentos viven en claves fijas del formulario (`qd_strDoc01..03`) pero el usuario ve una **lista**:
 * si borra el "Documento 1" de tres, espera quedarse con dos, no con un hueco en el medio.
 *
 * Así que borrar el índice `i` copia cada slot posterior sobre el anterior (`i+1 → i`, `i+2 → i+1`, …),
 * limpia el último y baja el contador. **Y hay que desplazar las tres cosas a la vez**, porque viven en
 * lugares distintos y describen el mismo documento:
 *
 * 1. el **valor** del control (el nombre del archivo, que es lo que viaja a PM4),
 * 2. el **binario** en el registro (lo que se sube de verdad en el submit),
 * 3. el **error** del control (si el slot que sube tenía un archivo rechazado, el mensaje lo sigue).
 *
 * Desplazar solo el valor es el error silencioso a evitar: la pantalla mostraría el nombre correcto y
 * subiría **el binario del documento equivocado**. No hay forma de que el usuario lo note, y en PM4
 * queda un adjunto que no corresponde al nombre registrado. Va con caso de test dedicado.
 *
 * ── El tope real es el mínimo entre `max` y las claves disponibles ────────────────────────────────
 * `Math.min(max, docKeys.length)` se preserva de React: si una pantalla pide `max=5` pero solo declara
 * 3 claves `qd_strDoc*`, el 4º botón crearía una fila sin campo donde escribir. El tope lo pone el
 * contrato con PM4, no el parámetro.
 */
@Component({
  selector: 'app-doc-support-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-subsection form-subsection--stack">
      <div class="form-subsection-title">{{ title() }}</div>
      <p class="subsection-intro">{{ intro() }}</p>

      <div z-flex="col:75" [formGroup]="form()">
        @for (strDocKey of clavesVisibles(); track strDocKey) {
          <div class="doc-row">
            <span class="doc-row-label">Documento {{ $index + 1 }}</span>
            <zds-file-input
              [formControlName]="strDocKey"
              [name]="strDocKey"
              [allowedExtensions]="extensiones"
              [maxSizeMb]="maxMb"
              [errorMessage]="msgInvalido"
            />
            <!-- El botón de borrar aparece solo con más de una fila: con una sola, "eliminar" dejaría
                 al usuario sin campo donde cargar. Es la condición de React. -->
            @if (intNumDocs() > 1) {
              <!-- Botón solo-ícono: su nombre accesible va en title/aria-label, atributos HTML sobre
                   el host, porque NI lib-button-z NI za-button tienen un input de texto accesible
                   (verificado en sus metadatos: el label de ButtonZ se PROYECTA como contenido
                   visible, y ponerlo acá pintaría "Eliminar documento" al lado del ícono). React
                   hacía lo mismo, casteando title porque tampoco era una prop. -->
              <lib-button-z
                type="secondary:s"
                icon="trash:line"
                title="Eliminar documento"
                aria-label="Eliminar documento"
                [disabled]="false"
                (eventClick)="quitarSlot($index)"
              />
            }
          </div>
        }
      </div>

      @if (intNumDocs() < intTope()) {
        <lib-button-z
          type="secondary"
          label="Agregar documento"
          icon="plus:line"
          [disabled]="false"
          (eventClick)="agregarSlot()"
        />
      }
    </div>
  `,
  imports: [ReactiveFormsModule, ZdsFileInput, ZrButton],
})
export class DocSupportUploaderComponent {
  private readonly objRegistro = inject(FileRegistryService);

  public readonly form = input.required<FormGroup>();

  /**
   * Claves de formulario de los documentos, en orden.
   *
   * Son nombres `qd_*` reales: son contrato con PM4 y las declara la pantalla, no este bloque.
   */
  public readonly docKeys = input.required<readonly string[]>();

  public readonly title = input<string>('Documento de soporte de las confirmaciones');
  public readonly intro = input<string>(
    'Por favor cargue aquí el documento de respaldo proporcionado por el intermediario. Se pueden agregar hasta 3 documentos.',
  );
  public readonly max = input<number>(3);

  /** Cuántas filas se ven. Empieza en 1: siempre hay un slot para cargar. */
  protected readonly intNumDocs = signal(1);

  protected readonly extensiones = EXTENSIONES;
  protected readonly maxMb = MAX_MB;
  protected readonly msgInvalido = MSG_INVALIDO;

  /** Tope real de documentos. Ver el docstring: lo acota la cantidad de claves declaradas. */
  protected intTope(): number {
    return Math.min(this.max(), this.docKeys().length);
  }

  protected clavesVisibles(): readonly string[] {
    return this.docKeys().slice(0, this.intNumDocs());
  }

  protected agregarSlot(): void {
    this.intNumDocs.update((in_int) => Math.min(in_int + 1, this.intTope()));
  }

  /**
   * Borra el slot `in_intIdx` desplazando hacia arriba los posteriores.
   *
   * Ver el ⚠ del componente: desplaza **valor, binario y error** juntos, porque los tres describen el
   * mismo documento y viven en lugares distintos. Desplazar solo el valor haría que la pantalla suba
   * el binario del documento equivocado sin que nadie lo note.
   */
  protected quitarSlot(in_intIdx: number): void {
    const objForm = this.form();
    const lstClaves = this.docKeys();
    const intVisibles = this.intNumDocs();

    for (let intI = in_intIdx; intI < intVisibles - 1; intI++) {
      const strActual = lstClaves[intI]!;
      const strSiguiente = lstClaves[intI + 1]!;

      // 1 · el valor (el nombre del archivo, que es el dato que viaja a PM4).
      objForm.get(strActual)?.setValue(objForm.get(strSiguiente)?.value ?? '');

      // 2 · el binario. Si el siguiente no tiene archivo, hay que BORRAR el del actual y no dejarlo:
      // si no, el slot mostraría el nombre desplazado y subiría el binario viejo.
      const objArchivo = this.objRegistro.obtener(strSiguiente);
      if (objArchivo) {
        this.objRegistro.registrar(strActual, objArchivo);
      } else {
        this.objRegistro.quitar(strActual);
      }

      // 3 · el error, para que el mensaje siga al documento que ahora ocupa la fila.
      objForm.get(strActual)?.setErrors(objForm.get(strSiguiente)?.errors ?? null);
    }

    // El último slot queda libre: se limpia entero, en los tres lugares.
    const strUltima = lstClaves[intVisibles - 1]!;
    objForm.get(strUltima)?.setValue('');
    objForm.get(strUltima)?.setErrors(null);
    this.objRegistro.quitar(strUltima);

    this.intNumDocs.update((in_int) => Math.max(1, in_int - 1));
  }
}
