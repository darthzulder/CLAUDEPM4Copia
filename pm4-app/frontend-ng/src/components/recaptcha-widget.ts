import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RecaptchaLoaderService, STR_SITE_KEY } from './recaptcha-loader.service';
import { ZrAlertInline, ZrLoader } from './fields/zds-reexports';

/** Los tres estados del widget. Heredado textual del `strStatus` de React. */
type EstadoRecaptcha = 'cargando' | 'listo' | 'error';

/**
 * El checkbox "No soy un robot" suelto, en el flujo de la página. Port de `RecaptchaWidget` de
 * `components/RecaptchaModal.tsx`.
 *
 * ```html
 * <app-recaptcha-widget (verificado)="strToken.set($event)" (expirado)="strToken.set('')" />
 * ```
 *
 * Lo usa la SCR-000, que muestra la validación de seguridad como un campo más del formulario en vez de
 * como un modal. Comparte con `app-recaptcha-modal` el `RecaptchaLoaderService`, así que el `<script>`
 * de Google se inyecta una sola vez aunque las dos cosas convivan en una pantalla.
 *
 * ── ⚠ `(expirado)` no es opcional para quien lo use: hay un token guardado que queda inválido ────
 * El token de reCAPTCHA v2 **caduca a los dos minutos**. Si la pantalla guardó el token en un signal y
 * el usuario tarda más que eso en enviar, `siteverify` va a rechazarlo del lado del backend con
 * `timeout-or-duplicate` — y el usuario ve un fallo de validación sobre un checkbox que en pantalla
 * sigue tildado. De ahí que este componente reemita `(expirado)` **y además** resetee el widget: lo
 * primero para que la pantalla invalide su copia, lo segundo para que el checkbox se destilde y el
 * usuario vea que tiene que volver a marcarlo. Las dos mitades hacen falta; con solo una, el estado de
 * la pantalla y lo que se ve quedan en desacuerdo.
 *
 * ── El contenedor va SIEMPRE montado, y no dentro del `@if` de estado ──────────────────────────
 * Heredado de React, con el mismo comentario, y es un requisito de Google y no una preferencia:
 * `grecaptcha.render()` necesita un elemento **en el documento y visible**, así que sobre un
 * `display:none` (o un nodo que un `@if` todavía no creó) falla. Por eso el `<div #contenedor>` está
 * fuera de las tres ramas de estado y el `viewChild` lo encuentra siempre.
 *
 * ── Por qué `ngOnInit` y no un `effect` ─────────────────────────────────────────────────────────
 * El render del widget ocurre **una sola vez** y no depende de ninguna señal — es el `useEffect(…, [])`
 * de React, con array de dependencias vacío. Un `effect()` acá pediría leer alguna señal para tener
 * sentido, y no hay ninguna que gobierne esto; `ngOnInit` dice literalmente "una vez, al arrancar".
 * (El modal es el caso opuesto: ahí sí hay un input `abierto` que lo gobierna.)
 */
@Component({
  selector: 'app-recaptcha-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @if (strEstado() === 'cargando') {
        <!-- Ver el punto 2 de la fachada: lib-loader-z no tiene input de tamaño (customStr es un
             input muerto), así que si hiciera falta ajustarlo va por variable CSS. -->
        <lib-loader-z />
      }

      @if (strEstado() === 'error') {
        <!-- Caja INLINE (za-alert), no la cola de AlertZService: el aviso describe este bloque y
             desaparece con él. Ver el punto 5b de la fachada. El hide-close va como binding porque su
             input está tipado boolean. -->
        <za-alert config="negative" [hide-close]="true">
          No se pudo cargar la validación de seguridad. Verifica tu conexión e inténtalo de nuevo.
        </za-alert>
      }

      <!-- Google renderiza el checkbox acá dentro. Siempre montado y visible: ver el bloque del
           componente — con display:none o sin el nodo creado, grecaptcha.render() falla. -->
      <div #contenedor></div>
    </div>
  `,
  imports: [ZrAlertInline, ZrLoader],
})
export class RecaptchaWidgetComponent implements OnInit {
  private readonly objCargador = inject(RecaptchaLoaderService);
  private readonly objDestroy = inject(DestroyRef);

  /** El token que Google emite cuando el usuario resuelve el checkbox. */
  public readonly verificado = output<string>();

  /**
   * El token caducó y el que la pantalla tenga guardado ya no sirve.
   *
   * Ver el ⚠ del componente: la pantalla **tiene que** invalidar su copia acá.
   */
  public readonly expirado = output<void>();

  protected readonly strEstado = signal<EstadoRecaptcha>('cargando');

  private readonly objContenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');

  /** Id del widget que devolvió `grecaptcha.render`, para poder resetearlo. `null` = no renderizado. */
  private intWidgetId: number | null = null;

  public ngOnInit(): void {
    // La bandera de cancelación del `useEffect` de React: si el componente se destruye mientras la
    // carga viaja, el `.then` no debe escribir estado ni renderizar sobre un nodo que ya no está.
    let blnCancelado = false;
    this.objDestroy.onDestroy(() => {
      blnCancelado = true;
    });

    // Sin site key no hay nada que renderizar. `STR_SITE_KEY` cae a la conocida cuando el entorno no
    // la trae, así que en la práctica esta rama solo se da si alguien fija la variable en vacío a mano
    // — pero se preserva porque es la única forma de que el usuario vea *algo* en vez de un hueco.
    if (!STR_SITE_KEY) {
      this.strEstado.set('error');
      return;
    }

    this.objCargador
      .cargar()
      .then(() => {
        if (blnCancelado || this.intWidgetId !== null) return;
        this.renderizar();
      })
      .catch((in_excError: unknown) => {
        console.error('[recaptcha] no se pudo cargar api.js:', in_excError);
        if (!blnCancelado) this.strEstado.set('error');
      });
  }

  /**
   * Pide a Google que pinte el checkbox en nuestro contenedor.
   *
   * El `try/catch` no es defensivo de más: `grecaptcha.render()` **lanza** si el contenedor ya tiene un
   * widget, si la site key no corresponde al dominio, o si el nodo no es visible. Sin capturarlo, la
   * excepción viaja por dentro de un `.then()` y termina en un `unhandledrejection` que no muestra
   * nada en pantalla — el usuario vería el loader para siempre. Capturado, cae al estado `error`, que
   * al menos dice qué pasó.
   */
  private renderizar(): void {
    try {
      this.intWidgetId = window.grecaptcha!.render(this.objContenedor().nativeElement, {
        sitekey: STR_SITE_KEY,
        callback: (in_strToken: string): void => this.verificado.emit(in_strToken),
        'expired-callback': (): void => {
          // Las dos mitades del ⚠ del componente: destildar el checkbox y avisar a la pantalla.
          if (this.intWidgetId !== null) window.grecaptcha!.reset(this.intWidgetId);
          this.expirado.emit();
        },
      });
      this.strEstado.set('listo');
    } catch (in_excError: unknown) {
      console.error('[recaptcha] grecaptcha.render() falló:', in_excError);
      this.strEstado.set('error');
    }
  }
}
