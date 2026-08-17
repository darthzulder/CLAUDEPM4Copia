import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RecaptchaLoaderService, STR_SITE_KEY } from './recaptcha-loader.service';
import { ZrAlertInline, ZrButton, ZrLoader, ZrModal, ZrTemplate } from './fields/zds-reexports';

/** Los tres estados del widget. Heredado textual del `strStatus` de React. */
type EstadoRecaptcha = 'cargando' | 'listo' | 'error';

/**
 * Modal con el reCAPTCHA v2 (checkbox "No soy un robot"). Port de `components/RecaptchaModal.tsx`.
 *
 * ```html
 * <app-recaptcha-modal
 *   [abierto]="blnPideCaptcha()"
 *   (verificado)="enviarConToken($event)"
 *   (cerrar)="blnPideCaptcha.set(false)"
 * />
 * ```
 *
 * El token que emite `(verificado)` **no es una prueba de nada por sí solo**: hay que verificarlo
 * server-side contra `POST /api/recaptcha/verify`, que es el único lugar donde vive
 * `RECAPTCHA_SECRET_KEY` (regla 3). Una pantalla que confíe en el token sin ese paso no tiene captcha,
 * tiene un checkbox.
 *
 * ── El `<script>` de Google: la excepción al BFF, y dónde termina ────────────────────────────────
 * `RecaptchaLoaderService` inyecta `https://www.google.com/recaptcha/api.js`, y es la **excepción
 * documentada** en `pm4-app/CLAUDE.md`: un script de terceros sin credenciales ni datos del caso. La
 * excepción cubre exactamente eso y nada más — la verificación sigue yendo por el backend.
 *
 * ── ⚠ El modal NO se envuelve en un `@if`, y acá el motivo es MÁS fuerte que en preview-modal ────
 * `ModalZ` lee sus slots con `@ContentChildren(ZTemplate)` en un `ngAfterContentInit` que corre **una
 * sola vez** (ver el ⚠⚠ de `preview-modal.ts`), así que un `@if` alrededor del modal lo deja con el
 * cuerpo vacío para siempre a partir del primer cierre. Eso ya vale por sí solo.
 *
 * Pero acá hay una segunda razón, propia de este componente y peor: `grecaptcha.render()` necesita un
 * contenedor **presente y visible** en el documento. Si el `@if` desmonta el árbol, el `viewChild` del
 * contenedor no existe cuando la promesa de carga resuelve, y el render nunca ocurre. Y como el
 * `render()` de Google es de **una sola vez por contenedor**, un ciclo abrir → cerrar → abrir con
 * desmontaje de por medio deja el modal mostrando el loader indefinidamente.
 *
 * Por eso el `@if (abierto())` va **adentro** del slot `content`, igual que en `preview-modal`, y la
 * consecuencia es la que gobierna el diseño de esta clase: el contenedor solo existe mientras el modal
 * está abierto, así que el widget se **rerenderiza en cada apertura**. De ahí el `intWidgetId = null`
 * del cierre (ver el bloque siguiente), que no es limpieza opcional sino la condición para que la
 * segunda apertura funcione.
 *
 * ── Qué pasa al cerrar, y por qué el `reset()` importa más de lo que parece ──────────────────────
 * Heredado de React (`if (!open) { … }` al principio del effect), y las dos cosas que hace son
 * distintas:
 * - **`grecaptcha.reset(id)`** descarta el token ya emitido **y su timer de expiración**. Sin esto, un
 *   modal que se cerró sin enviar deja vivo un timer que a los dos minutos dispara el
 *   `expired-callback` de un widget que ya no está en el DOM — que es el origen del "reCAPTCHA
 *   Timeout (d)" que el bloque siguiente silencia. O sea: el `reset` no es cosmético, es lo que evita
 *   el ruido en vez de taparlo.
 * - **`intWidgetId = null`** hace que la próxima apertura renderice un widget nuevo. Es obligatorio
 *   por lo dicho arriba: el contenedor anterior murió con el `@if`, así que el id viejo apunta a un
 *   nodo que no existe.
 *
 * ── El `unhandledrejection` que se silencia, y por qué el filtro es tan estrecho ─────────────────
 * `api.js` de Google emite a veces un `Promise` rechazado con "reCAPTCHA Timeout (d)" por su cuenta
 * (bug conocido del script; el token ya se consumió, es inofensivo). Se hereda el listener que lo
 * silencia, con el mismo filtro doble: el mensaje tiene que decir **`recaptcha`** *y* **`timeout`**.
 * Estrechar así es deliberado — un `preventDefault()` a cualquier rechazo no manejado escondería
 * errores de la propia app, que es exactamente el tipo de "limpieza de consola" que hace invisible un
 * defecto real.
 *
 * El listener se registra en el constructor y se quita con `DestroyRef`: mientras esta pantalla vive,
 * silencia; al salir, deja de tocar el `window` global.
 */
@Component({
  selector: 'app-recaptcha-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-modal-z [open]="abierto()" (close)="cerrar.emit()">
      <!-- El id va como atributo ESTATICO y este ng-template no puede quedar dentro de un @if:
           ModalZ resuelve sus slots una sola vez. Ver el ⚠ del componente. -->
      <ng-template libZTemplate id="content">
        @if (abierto()) {
          <h3 class="recaptcha-modal-title">Validación de seguridad</h3>
          <p class="recaptcha-modal-text">Confirma que no eres un robot para radicar tu solicitud.</p>

          <div z-flex="col" z-align="center:center" class="recaptcha-modal-box">
            @if (strEstado() === 'cargando') {
              <lib-loader-z />
            }

            @if (strEstado() === 'error') {
              <!-- Caja INLINE (za-alert), no la cola de AlertZService: el aviso vive donde está el
                   bloque que describe. Ver el punto 5b de la fachada. -->
              <za-alert config="negative" [hide-close]="true">
                No se pudo cargar la validación de seguridad. Verifica tu conexión e inténtalo de nuevo.
              </za-alert>
            }

            <!-- Google renderiza el checkbox acá dentro. Siempre visible mientras el modal está
                 abierto: con display:none, grecaptcha.render() puede fallar. -->
            <div #contenedor></div>
          </div>
        }
      </ng-template>

      <!-- El botón va en el slot "buttons", que es el que ModalZ pinta al pie. React lo ponía en un
           div con flex-end propio; acá el slot ya da esa posición.
           (Sin comillas invertidas en los comentarios: adentro de un template literal terminan la
           cadena y el error que sale no menciona el comentario. Ver preview-modal.) -->
      <ng-template libZTemplate id="buttons">
        <lib-button-z
          type="secondary"
          label="Cancelar"
          [disabled]="false"
          (eventClick)="cerrar.emit()"
        />
      </ng-template>
    </lib-modal-z>
  `,
  styles: `
    /* Los tres bloques que React tenía inline. Solo tokens, sin px ni hex crudos. El min-height
       reserva el alto del checkbox de Google (78px es su tamaño fijo) para que el modal no salte
       cuando el loader se reemplaza por el widget.

       ⚠ Los dos tokens de font estaban INVENTADOS y no resolvían a nada (una declaración font con
       una var() indefinida se invalida ENTERA, así que ambos textos venían con los estilos por
       defecto del navegador). Verificado contra @zurich/css-components/dist/base.css:
       - la escala de headings NO lleva sufijo de peso (--zf-h-20--700 no existe; los --700 solo
         existen en las familias body-* y capt-*) → va --zf-body-20--700;
       - el peso base tampoco lleva sufijo (--zf-body-16--400 no existe) → va --zf-body-16.
       Los sufijos válidos hay que verificarlos en base.css, no deducirlos del patrón.

       (Sin comillas invertidas acá: este comentario vive DENTRO del template literal de styles, así
       que una comilla invertida cierra la cadena. El error que sale no menciona el comentario: habla
       de un "var ;" inexistente 70 líneas más arriba y de un NG8110 en cada input/output/viewChild
       de la clase, porque lo que en realidad falló al parsear es el decorador entero. Misma trampa
       que el comentario del template, y el NG8110 es ruido derivado, no la causa.) */
    .recaptcha-modal-title {
      margin: 0 0 var(--zs-75);
      font: var(--zf-body-20--700);
      color: var(--z-text);
    }

    .recaptcha-modal-text {
      margin: 0 0 var(--zs-150);
      font: var(--zf-body-16);
      color: var(--z-text);
    }

    .recaptcha-modal-box {
      min-height: 78px;
    }
  `,
  imports: [ZrAlertInline, ZrButton, ZrLoader, ZrModal, ZrTemplate],
})
export class RecaptchaModalComponent {
  private readonly objCargador = inject(RecaptchaLoaderService);
  private readonly objDestroy = inject(DestroyRef);

  /** Gobierna la apertura. El widget se renderiza al pasar a `true` y se resetea al volver a `false`. */
  public readonly abierto = input<boolean>(false);

  /**
   * El token que Google emite cuando el usuario resuelve el checkbox.
   *
   * Ver el encabezado: **hay que verificarlo** contra `POST /api/recaptcha/verify` antes de confiar.
   */
  public readonly verificado = output<string>();

  /**
   * El usuario cerró desde el backdrop, la X o el botón Cancelar.
   *
   * La pantalla **tiene que** bajar su propia bandera acá: `ModalZ.change()` hace `this.open = false`
   * sobre su propio input, así que con un `[open]` de una sola vía el segundo intento de abrir no haría
   * nada. Ver el punto 3 de la fachada.
   */
  public readonly cerrar = output<void>();

  protected readonly strEstado = signal<EstadoRecaptcha>('cargando');

  /**
   * El contenedor donde Google pinta el checkbox.
   *
   * **No** es `viewChild.required`: vive dentro del `@if (abierto())`, así que con el modal cerrado no
   * existe — y `.required` lanzaría al leerlo. El `?.` del `renderizar()` es la contracara de eso.
   */
  private readonly objContenedor = viewChild<ElementRef<HTMLDivElement>>('contenedor');

  /** Id del widget que devolvió `grecaptcha.render`, para poder resetearlo. `null` = no renderizado. */
  private intWidgetId: number | null = null;

  /** Corre al cerrar o al destruirse, para descartar el `.then()` de una carga que ya no interesa. */
  private blnCancelado = false;

  public constructor() {
    // Ver el bloque del componente sobre el "reCAPTCHA Timeout (d)": el filtro es doble a propósito.
    const fnSilenciar = (in_objEvento: PromiseRejectionEvent): void => {
      const objRazon: unknown = in_objEvento.reason;
      const strMensaje = String(
        (objRazon instanceof Error ? objRazon.message : objRazon) ?? '',
      );
      if (/recaptcha/i.test(strMensaje) && /timeout/i.test(strMensaje)) in_objEvento.preventDefault();
    };
    window.addEventListener('unhandledrejection', fnSilenciar);
    this.objDestroy.onDestroy(() => {
      this.blnCancelado = true;
      window.removeEventListener('unhandledrejection', fnSilenciar);
    });

    // El equivalente del `useEffect([open])` de React. Es un `effect` y no `ngOnInit` porque esto
    // **sí** depende de una señal: el widget se renderiza al abrir y se resetea al cerrar.
    effect(() => {
      if (!this.abierto()) {
        this.limpiarWidget();
        return;
      }

      if (!STR_SITE_KEY) {
        this.strEstado.set('error');
        return;
      }

      this.blnCancelado = false;
      this.strEstado.set('cargando');
      this.objCargador
        .cargar()
        .then(() => {
          if (this.blnCancelado || this.intWidgetId !== null) return;
          this.renderizar();
        })
        .catch((in_excError: unknown) => {
          console.error('[recaptcha] no se pudo cargar api.js:', in_excError);
          if (!this.blnCancelado) this.strEstado.set('error');
        });
    });
  }

  /**
   * Pide a Google que pinte el checkbox en nuestro contenedor.
   *
   * El `try/catch` no es defensivo de más: `grecaptcha.render()` **lanza** si el contenedor ya tiene un
   * widget, si la site key no corresponde al dominio, o si el nodo no es visible. Sin capturarlo, la
   * excepción viaja dentro de un `.then()` y termina en un `unhandledrejection` que no pinta nada — el
   * usuario se queda mirando el loader. Capturado, cae al estado `error`.
   */
  private renderizar(): void {
    // Ver el comentario del `viewChild`: dentro del @if puede no existir todavía. Si no está, no se
    // renderiza y el estado queda en `cargando`, que es lo correcto — la próxima apertura reintenta.
    const objNodo = this.objContenedor()?.nativeElement;
    if (!objNodo) return;

    try {
      this.intWidgetId = window.grecaptcha!.render(objNodo, {
        sitekey: STR_SITE_KEY,
        callback: (in_strToken: string): void => this.verificado.emit(in_strToken),
        // A diferencia del widget suelto, acá NO se reemite nada hacia afuera al expirar: el modal se
        // abre para obtener un token y se cierra en cuanto lo tiene, así que la pantalla no guarda uno
        // que pueda quedar rancio. Solo se destilda el checkbox. Es el comportamiento de React.
        'expired-callback': (): void => {
          if (this.intWidgetId !== null) window.grecaptcha!.reset(this.intWidgetId);
        },
      });
      this.strEstado.set('listo');
    } catch (in_excError: unknown) {
      console.error('[recaptcha] grecaptcha.render() falló:', in_excError);
      this.strEstado.set('error');
    }
  }

  /**
   * Descarta el widget al cerrar. Ver el bloque del componente: el `reset` mata el timer de expiración
   * y el `null` habilita el render de la próxima apertura.
   */
  private limpiarWidget(): void {
    this.blnCancelado = true;
    if (this.intWidgetId !== null) {
      try {
        window.grecaptcha?.reset(this.intWidgetId);
      } catch {
        // El widget ya no está en el DOM (el @if se lo llevó). No hay nada que resetear y no es un
        // error: el objetivo —que no quede un timer vivo— se cumple igual porque el nodo murió.
      }
    }
    this.intWidgetId = null;
  }
}
