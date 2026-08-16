import { Component, computed, effect, inject, input, output, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ZaFileInput } from '@zurich/angular-components';
import { findDuplicateAttachment } from '../../core/file-hash';
import { FileRegistryService } from '../../core/file-registry.service';
import { CampoZaBase, proveerAccessorDePaso } from './campo-za-base';

/**
 * Elemento `<z-file-input>` de Lit, en lo poco que este wrapper necesita tocarle. No se importa el
 * tipo real de `@zurich/web-components` a propósito: sería un import de `@zurich/*` de un paquete que
 * la fachada no consume (solo `angular-components`), y hace falta exactamente un método y un getter.
 *
 * `reset()` y `_fileName` están **documentados en el `.d.ts`** del componente
 * (`web-components/dist/file-input.d.ts`: `reset(): void`, `_fileName: string | null`), así que no es
 * API privada adivinada — es la superficie pública del custom element.
 */
interface ElementoFileInput extends HTMLElement {
  reset?: () => void;
  _fileName?: string | null;
}

/**
 * Campo de adjunto. Envuelve `za-file-input` y preserva el contrato de `ZdsFileInput` de la fachada
 * React: el **nombre** del archivo va al `FormControl` (es lo que viaja a PM4 como dato del caso) y
 * el **binario** al [`FileRegistryService`](../../core/file-registry.service.ts) para subirlo en el
 * submit.
 *
 * ```html
 * <zds-file-input formControlName="qd_strSoporte" name="qd_strSoporte" label="Documento de soporte"
 *                 [allowedExtensions]="['pdf','jpg']" [maxSizeMb]="5" />
 * ```
 *
 * Extiende [`CampoZaBase`](./campo-za-base.ts): el CVA es el nativo de `ZaFileInput` y este wrapper
 * solo le presta el `FormControl`. Ver esa cabecera para el porqué de no aportar un segundo accessor.
 *
 * ── Las dos cosas no obvias que hay que portar, y por qué (medidas en el `.js` del DS) ─────────
 *
 * **1. El evento `change` NO trae un `File`: trae un `Blob` sin nombre.** Es el hallazgo que hace
 * falta entender para no romper la subida a PM4, y ahora está medido en la fuente en vez de inferido
 * del código React. `ZFileInput.onFileInput()` lee el archivo con un `FileReader`, y con el
 * `ArrayBuffer` resultante **construye un `Blob` nuevo** (`arrayBufferToBlob()` →
 * `new Blob([arrayBuffer], { type })`) que es lo que emite:
 *
 * ```js
 * const blob = this.arrayBufferToBlob(arrayBuffer, this._fileType || 'txt');
 * this._blobURL = URL.createObjectURL(blob);
 * ...
 * this._emitEvent('change', loadedEvent, blob);   // ← el detail es un Blob, no el File original
 * ```
 *
 * O sea que la identidad del `File` (su `.name`) se **descarta** en el camino. Si ese `Blob` se sube
 * tal cual, `FormData` lo manda como `"blob"` y **PM4 no puede resolver la extensión**, así que
 * rechaza o guarda un media sin tipo. Por eso hay que reconstruirlo:
 * `new File([objBlob], strNombre, { type })`.
 *
 * El nombre real se saca de `_fileName` del elemento, que es donde el componente lo dejó
 * (`this._fileName = file.name || this.fileName || '-'`). La fachada React leía
 * `event.target.fileName` —el getter, que parsea el `value` del `<input>` nativo—; se usa `_fileName`
 * porque es el valor ya normalizado por el componente y está declarado en su `.d.ts`.
 *
 * **2. El duplicado se detecta por CONTENIDO, no por nombre.** Smart Supervision rechaza subir un
 * binario que ya existe en el request **aunque el archivo tenga otro nombre**, así que la
 * comparación es por hash SHA-256 contra el resto del registro
 * ([`findDuplicateAttachment`](../../core/file-hash.ts)). Un chequeo por nombre dejaría pasar
 * exactamente el caso que PM4 rechaza, y el error aparecería recién al guardar.
 *
 * ── El rechazo usa `reset()`, no manipula campos privados (mejora sobre la versión React) ──────
 * La fachada React limpia el componente a mano cuando rechaza un archivo:
 *
 * ```tsx
 * target._fileName = null; target._fileType = null; target._blobURL = null;
 * target.inputRef.value.value = ''; target.requestUpdate();
 * ```
 *
 * Acá no hace falta y **no se replica**. El elemento expone `reset()` público (declarado en su
 * `.d.ts`), y su implementación hace exactamente eso mismo desde adentro: pone los tres campos en
 * `null`, limpia `inputRef.value.files`/`.value`, y deja que Lit re-renderice solo. Verificado en
 * `web-components/dist/file-input.js` (`reset()` → `onDelete_fn`). Replicar la versión manual sería
 * copiar un workaround que la API ya cubre — y además `requestUpdate()` **no existe** en ese archivo
 * (0 ocurrencias): viene de `LitElement`, así que el React dependía de un detalle de la clase base.
 *
 * **El efecto secundario de `reset()` que hay que conocer:** además de limpiar, emite
 * `change` con `detail: null` — o sea que **re-entra en este mismo handler**. No es un problema
 * (la rama de `null` solo limpia el control y el registro, que es lo que se quiere) pero significa
 * que el `error` no se puede setear *antes* de resetear: la re-entrada lo pisaría. Por eso el orden
 * acá es **resetear primero, avisar después**, y por eso el aviso sale por un `output` en vez de
 * escribirse en el control.
 *
 * ── El `(change)` de plantilla SÍ escucha el `EventEmitter`, y por qué vale aclararlo ─────────
 * Leyendo el bundle del DS, el `ɵɵngDeclareComponent` de `ZaFileInput` declara `inputs` pero
 * **ningún `outputs`**, y su `propDecorators` trae solo `Input`. Eso invita a concluir que `change`
 * no es un `@Output` y que un `(change)` en la plantilla se engancharía al evento **DOM nativo** del
 * host en vez del `EventEmitter`. **Es una lectura incorrecta del bundle**, y conviene dejarla
 * anotada porque cuesta un rato de diagnóstico:
 *
 * `ZaFileInput` se declara con **`usesInheritance: true`**, y `change` vive en su base
 * `ZaModelElement` (`outputs: { ngModelChange: "ngModelChange", change: "change" }`). El **linker de
 * Angular** resuelve la cadena de herencia al compilar, así que la subclase termina con el output
 * heredado aunque su propia declaración parcial no lo repita. Verificado en runtime: con el
 * `(change)` de la plantilla, el handler corre y el `File` reconstruido llega al registro.
 *
 * O sea que la regla es "los metadatos parciales no se leen sin mirar `usesInheritance`", no "los
 * outputs no se heredan".
 *
 * ── Por qué el error sale por `output` y no lo escribe el wrapper ─────────────────────────────
 * En React el rechazo llamaba `setError(name, {...})` de react-hook-form. El equivalente sería
 * `control.setErrors({...})` acá, pero el wrapper **no debe escribir errores en el control de la
 * pantalla**: un `setErrors` lo pisa entero (no compone), así que borraría el `required` u otro
 * validador que la pantalla haya declarado. Se emite `rechazado` con el mensaje y la pantalla decide
 * —normalmente pasándolo de vuelta como `[error]`, que es el mismo `input` que ya usan los otros
 * cinco wrappers para `setError`.
 */
@Component({
  selector: 'zds-file-input',
  standalone: true,
  imports: [ReactiveFormsModule, ZaFileInput],
  // Accessor de paso: habilita el `formControlName` de la pantalla sin escribir el control. El
  // `useExisting` apunta a esta clase concreta, no a `CampoZaBase` — ver `proveerAccessorDePaso`.
  providers: [proveerAccessorDePaso(() => ZdsFileInput)],
  template: `
    <div class="zds-field-wrap" [id]="strId" tabindex="-1">
      <za-file-input
        #objHijo
        (change)="alCambiarArchivo($event)"
        [formControl]="control"
        [name]="name()"
        [label]="label()"
        [accept]="cllAccept()"
        [droppable]="droppable()"
        [invalid]="blnEnError"
        [help-text]="strTextoAyuda"
      />
    </div>
  `,
})
export class ZdsFileInput extends CampoZaBase {
  /**
   * El asterisco se escribe por código y no con `[required]` en la plantilla, por el mismo motivo
   * estructural que en [`ZdsRadio`](./zds-radio.ts) —cuyo docstring tiene el detalle— y que aplica a
   * los dos wrappers de esta base: el selector del `RequiredValidator` de Angular incluye
   * `[required][formControl]`, y el `[formControl]="control"` de acá es el control **de la pantalla**.
   * Un `[required]` en este elemento le filtraría `{required: true}` aunque el input público ya se
   * llame `obligatorio`. Ni `[attr.required]` (es un input, el binding de atributo no corre el setter)
   * ni un control clonado (el CVA nativo tiene que escribir el objeto real) sirven de salida.
   */
  private readonly objHijo = viewChild.required<ZaFileInput>('objHijo');

  constructor() {
    super();
    effect(() => {
      this.objHijo().required = this.obligatorio();
    });
  }

  /**
   * Extensiones aceptadas, sin punto. El `za-file-input` las pasa a `[accept]` del elemento de Lit,
   * que las convierte a `.pdf,.doc,...` para el `<input type=file>` — o sea que el filtro del
   * navegador sale gratis. **No alcanza como validación**: el diálogo nativo permite "todos los
   * archivos", así que la extensión se vuelve a chequear acá. Mismos defaults que React.
   */
  readonly allowedExtensions = input<readonly string[]>(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']);

  /**
   * Copia mutable de `allowedExtensions` para el `[accept]` del DS. El input es `readonly string[]`
   * —el contrato correcto de cara a la pantalla, que suele pasar un `as const`— pero
   * `ZFileInput_Props['accept']` es `string[]` **mutable**, así que asignarlo directo falla con
   * `TS4104`. Se copia en vez de aflojar el tipo del input: entregarle el mismo array que la pantalla
   * declaró le daría al componente del DS una referencia que podría mutar a sus espaldas.
   */
  protected readonly cllAccept = computed(() => [...this.allowedExtensions()]);

  readonly maxSizeMb = input(5);

  /** Zona de arrastrar-y-soltar además del botón. `true` por defecto, igual que en React. */
  readonly droppable = input(true);

  /** Mensajes de rechazo. Si no vienen, se construyen con las extensiones y el tamaño reales. */
  readonly errorMessage = input<string>('');
  readonly duplicateMessage = input<string>('');

  /**
   * Se emite cuando el archivo se rechaza (extensión, tamaño o duplicado). La pantalla lo recibe y
   * normalmente lo devuelve por `[error]`. Ver el bloque "por qué el error sale por `output`".
   */
  readonly rechazado = output<string>();

  /** Se emite cuando un archivo se acepta y queda en el registro. Útil para habilitar el submit. */
  readonly aceptado = output<File>();

  private readonly objRegistro = inject(FileRegistryService);

  protected readonly strMensajeError = computed(
    () =>
      this.errorMessage() ||
      `Solo se permiten archivos ${this.allowedExtensions().join(', ')}, máx ${this.maxSizeMb()} MB`,
  );

  protected readonly strMensajeDuplicado = computed(
    () =>
      this.duplicateMessage() ||
      'Este archivo ya fue adjuntado (el contenido es idéntico a otro documento, aunque el nombre sea distinto)',
  );

  /**
   * Handler del `change` del componente de Zurich. Recibe un `Blob` en `detail` (ver el bloque 1 de
   * la cabecera), o `null` cuando el usuario borra el archivo o cuando `reset()` re-entra acá.
   */
  protected async alCambiarArchivo(in_objEvento: Event): Promise<void> {
    const objDetalle = (in_objEvento as CustomEvent<Blob | null>).detail;
    const objElemento = in_objEvento.target as ElementoFileInput;

    if (!objDetalle) {
      this.limpiar();
      return;
    }

    const strNombre = objElemento._fileName ?? '';
    const strExtension = strNombre.split('.').pop()?.toLowerCase() ?? '';
    const intMaxBytes = this.maxSizeMb() * 1024 * 1024;

    if (!this.allowedExtensions().includes(strExtension) || objDetalle.size > intMaxBytes) {
      this.rechazar(objElemento, this.strMensajeError());
      return;
    }

    // Reconstrucción obligatoria: el `Blob` que emite el DS no tiene nombre y PM4 necesita la
    // extensión para resolver el media. Ver el bloque 1 de la cabecera.
    const objArchivo = new File([objDetalle], strNombre, { type: objDetalle.type });

    const strDuplicado = await findDuplicateAttachment(
      objArchivo,
      this.objRegistro.mapArchivos,
      this.name(),
    );
    if (strDuplicado) {
      this.rechazar(objElemento, this.strMensajeDuplicado());
      return;
    }

    this.control.setValue(strNombre);
    this.objRegistro.registrar(this.name(), objArchivo);
    this.aceptado.emit(objArchivo);
  }

  /**
   * Limpia el componente y avisa. El orden importa: `reset()` re-entra en `alCambiarArchivo` con
   * `detail: null`, así que el `rechazado` se emite **después** — si se emitiera antes, la pantalla
   * pintaría el error y la re-entrada lo dejaría en pie igual, pero el `setValue('')` de la
   * re-entrada correría después del aviso y el orden quedaría al revés de lo que se lee.
   */
  private rechazar(in_objElemento: ElementoFileInput, in_strMensaje: string): void {
    in_objElemento.reset?.();
    this.limpiar();
    this.rechazado.emit(in_strMensaje);
  }

  /** Deja el campo sin archivo: control vacío y binario fuera del registro. */
  private limpiar(): void {
    this.control.setValue('');
    this.objRegistro.quitar(this.name());
  }
}
