import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import type { InfoBarItem } from '../../../../components/info-bar';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD, SCR0051_ADJUNTO_KEYS, SCR000_ADJUNTO_KEYS } from '../fields/fields';
import { ExpedienteCompletoModal } from './expediente-completo-modal';

/**
 * SCR-0051 · ACT-0051-06 — el **expediente completo**, un caso por regla propia del modal.
 *
 * ── Por qué tiene spec aparte de la pantalla, y no es un archivo de relleno ───────────────────────
 * Porque su regla central no pasa por el `FormGroup` ni por PM4: el modal recibe una **foto** de los
 * valores (`getRawValue()`) y decide qué pintar. Eso lo hace el único componente de la pantalla que se
 * puede aseverar con entradas puras —un objeto de datos— sin montar la pantalla, sin `task_id` y sin
 * drenar peticiones. Probarlo desde la pantalla obligaría a precargar el caso entero para mover un solo
 * campo, y cada caso costaría un montaje completo de las tres secciones.
 *
 * ── La regla que se prueba, y por qué el título es la mitad que importa ───────────────────────────
 * *"Un campo sin valor no se pinta, y un bloque cuyos campos están todos vacíos desaparece completo,
 * título incluido."* La segunda mitad es la que se rompe sola al refactorizar: filtrar los campos es lo
 * obvio, y deja el `<h4>` colgado sobre una fila vacía. Un caso que solo contara pares etiqueta/valor
 * quedaría **verde** con cinco títulos huérfanos en pantalla, así que acá se asevera sobre los `<h4>`.
 *
 * ── ⚠ El modal se monta dentro de un HOST, no con `createComponent` directo ───────────────────────
 * `datos` e `infoItems` son `input.required`, y un `input.required` sin valor tira NG0950 al leerse. El
 * host los provee por plantilla, que además es cómo la pantalla lo usa de verdad — así que el caso
 * también cubre que los bindings de la plantilla sean los que el componente declara.
 *
 * ── Las dos listas de archivos SÍ piden a PM4, y por eso hay `HttpTestingController` ──────────────
 * `app-request-file-list` es un componente propio con su propio ciclo de carga: cuando un bloque de
 * adjuntos se muestra, sale un GET de los archivos del request. Se drena en el helper para que el
 * `verify()` del `afterEach` no falle por una petición legítima — el mismo criterio de los otros specs.
 */
const INT_REQUEST_ID = 70;
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

/**
 * Host mínimo. Los `input.required` van por plantilla y no por `setInput()` a propósito: es la forma en
 * que la pantalla lo consume, así que un binding renombrado en `expediente-completo-modal.html` se ve acá.
 */
@Component({
  standalone: true,
  imports: [ExpedienteCompletoModal],
  template: `
    <app-expediente-completo-modal
      [datos]="sigDatos()"
      [infoItems]="cllInfoItems"
      [nombre]="strNombre"
      [identificacion]="strIdentificacion"
      [requestId]="intRequestId"
      (cerrar)="intCerrado = intCerrado + 1"
    />
  `,
})
class HostExpediente {
  readonly sigDatos = signal<Record<string, unknown>>({});
  cllInfoItems: readonly InfoBarItem[] = [{ label: 'Case', value: 'QD-2026-000123' }];
  strNombre = 'María Fernanda Ríos';
  strIdentificacion = 'Cédula de Ciudadanía 52.844.107';
  intRequestId: number | null = INT_REQUEST_ID;
  intCerrado = 0;
}

let objFixture: ComponentFixture<HostExpediente>;
let objHost: HostExpediente;
let objMock: HttpTestingController;

const INT_MAX_VUELTAS_DRENADO = 6;

/**
 * Consume los GET de las dos listas de archivos. Solo `GET`: acá no hay ningún PUT que aseverar, pero se
 * mantiene el filtro por el mismo motivo que en los otros specs —drenar a ciegas convierte un caso que
 * comprueba "no se envió nada" en uno que pasa siempre.
 */
async function drenarPeticiones(): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await objFixture.whenStable();
    objFixture.detectChanges();
    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    if (cllPendientes.length === 0) return;
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }
  throw new Error(
    `El drenado no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas: ` +
      objMock
        .match(() => true)
        .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
        .join(', '),
  );
}

/**
 * Monta el host con la foto ya puesta.
 *
 * `in_objHost` ajusta los campos del host **antes** del primer `detectChanges()`, y por eso existe: el
 * caso de los bloques vacíos necesita `nombre`/`identificacion` en blanco desde el arranque, porque el
 * bloque "Datos del Consumidor" los toma de ahí y no de la foto. Cambiarlos después del primer render
 * también funcionaría, pero dejaría el caso probando un re-render en vez del estado inicial.
 */
async function montar(
  in_dicDatos: Record<string, unknown> = {},
  in_objHost: Partial<Pick<HostExpediente, 'strNombre' | 'strIdentificacion' | 'intRequestId'>> = {},
): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
    ],
  });
  objFixture = TestBed.createComponent(HostExpediente);
  objHost = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  Object.assign(objHost, in_objHost);
  objHost.sigDatos.set(in_dicDatos);
  objFixture.detectChanges();
  await drenarPeticiones();
}

/** Los títulos de bloque que el documento pintó, en orden. Es el sujeto de la regla del modal. */
function cllTitulos(): string[] {
  return Array.from(
    objFixture.nativeElement.querySelectorAll('h4.form-subsection-title') as NodeListOf<HTMLElement>,
  ).map((in_objH4) => (in_objH4.textContent ?? '').trim());
}

/** Los rótulos de campo (`<p class="subsection-note">`) dentro del cuerpo del documento. */
function cllRotulos(): string[] {
  return Array.from(
    objFixture.nativeElement.querySelectorAll(
      '.modal-scroll-body .form-row p.subsection-note',
    ) as NodeListOf<HTMLElement>,
  ).map((in_objP) => (in_objP.textContent ?? '').trim());
}

/** Texto plano del documento entero, para las aserciones de "no aparece en ninguna parte". */
function strTexto(): string {
  return (objFixture.nativeElement.textContent ?? '') as string;
}

/**
 * El subtítulo del documento (nombre · identificación).
 *
 * ⚠ Se ancla al `<h3>` y no a `p.subsection-note` a secas: esa clase la comparten los **rótulos de
 * campo** de cada bloque, así que un `querySelector` global devolvería el subtítulo hoy y el primer
 * rótulo el día que el orden cambie.
 */
function strSubtitulo(): string {
  const objTitulo = objFixture.nativeElement.querySelector('h3.modal-titulo') as HTMLElement | null;
  const objSubtitulo = objTitulo?.nextElementSibling as HTMLElement | null | undefined;
  return (objSubtitulo?.textContent ?? '').trim();
}

/**
 * El valor pintado junto a un rótulo, o `null` si el campo no se pintó.
 *
 * ⚠ **Se busca por el rótulo y no con un selector posicional**, y el motivo es un falso rojo que ya
 * costó una vuelta: la primera versión de este helper tomaba el primer `p:not(.subsection-note)` del
 * documento y devolvía el valor del bloque "Datos del Consumidor" —que casi siempre existe, porque el
 * host trae nombre por defecto— en vez del campo que el caso nombraba. Un helper posicional acá es
 * frágil por construcción: el orden de los bloques depende de qué campos trae la foto de cada caso.
 */
function strValorDe(in_strRotulo: string): string | null {
  const objRotulo = Array.from(
    objFixture.nativeElement.querySelectorAll(
      '.modal-scroll-body .form-row p.subsection-note',
    ) as NodeListOf<HTMLElement>,
  ).find((in_objP) => (in_objP.textContent ?? '').trim() === in_strRotulo);

  const objValor = objRotulo?.nextElementSibling as HTMLElement | null | undefined;
  return objValor ? (objValor.textContent ?? '') : null;
}

describe('SCR-0051 · Expediente Completo (ACT-0051-06)', () => {
  afterEach(() => {
    objMock?.verify();
    TestBed.resetTestingModule();
  });

  // ── La regla central: solo lo que tiene dato ────────────────────────────────────────────────────

  it('⚠ un bloque sin ningún campo con dato desaparece completo, TÍTULO incluido', async () => {
    // Solo un campo del bloque "Descripción de la Queja". Los otros cuatro bloques quedan sin nada:
    // ni siquiera "Datos del Consumidor", porque `nombre`/`identificacion` se vacían en el host.
    await montar(
      { [QD.strComplaintText]: 'No me aplicaron el descuento pactado.' },
      { strNombre: '', strIdentificacion: '' },
    );

    // El único bloque con contenido es el que tiene el único campo poblado.
    expect(cllTitulos()).toEqual(['Descripción de la Queja']);

    // Y los títulos de los cuatro vacíos no están en NINGUNA parte del documento — que es la mitad de
    // la regla que un filtro de campos mal hecho dejaría verde, con el `<h4>` colgado sobre una fila
    // vacía. Se asevera sobre el texto completo y no sobre `cllTitulos()` para que un título que
    // reapareciera con otra clase CSS también se vea.
    for (const strTitulo of [
      'Datos del Consumidor',
      'Clasificación Regulatoria',
      'Asignación / Reasignación',
      'Respuesta',
    ]) {
      expect(strTexto(), `el bloque vacío "${strTitulo}" no debe pintar su título`).not.toContain(
        strTitulo,
      );
    }
  });

  it('un campo sin valor no se pinta, y su etiqueta tampoco', async () => {
    // Mismo bloque, dos campos: uno con dato y otro vacío. Que el bloque exista es lo que hace este
    // caso distinto del anterior — acá el filtro tiene que actuar **dentro** de un bloque que sí se pinta.
    await montar({
      [QD.strAssigneeArea]: 'Servicio al Cliente',
      [QD.strAssignmentRemarks]: '   ', // solo espacios: el filtro usa `trim()`
    });

    expect(cllTitulos()).toContain('Asignación / Reasignación');
    expect(cllRotulos()).toContain('Área a Cargo');

    // El comentario en blanco no aparece. El valor son espacios, así que aseverar sobre el rótulo es la
    // única forma de verlo: buscar el valor daría un falso verde contra cualquier texto del documento.
    expect(cllRotulos()).not.toContain('Comentario de Reasignación');
  });

  it('el valor se pinta con trim(), no con los espacios de PM4', async () => {
    await montar({ [QD.strComplaintText]: '  Cobro no reconocido en la factura de julio.  ' });

    expect(strValorDe('Descripción / Texto de la Queja')).toBe(
      'Cobro no reconocido en la factura de julio.',
    );
  });

  // ── La resolución de catálogos: `_desc` con fallback al código ──────────────────────────────────

  it('⚠ un campo de catálogo muestra su `_desc`, y cae al CÓDIGO cuando el catálogo no respondió', async () => {
    await montar({
      // Con `_desc`: es lo que las secciones sincronizaron antes de la foto.
      [QD.strPersonType]: '1',
      [`${QD.strPersonType}_desc`]: 'Persona Natural',
      // Sin `_desc`: la foto se tomó antes de que el catálogo resolviera. Tiene que salir el código
      // crudo y NO un hueco — un bloque que desaparece por un catálogo lento sería el peor modo de
      // falla del documento: el gestor no puede distinguir "no hay dato" de "no cargó".
      [QD.strChannel]: '13',
    });

    // El que resolvió muestra la etiqueta, y **no** el código: aseverar los dos lados es lo que
    // distingue un `_desc` bien leído de un fallback que se disparó de más.
    expect(strValorDe('Tipo de Persona')).toBe('Persona Natural');

    // El que no resolvió muestra el código crudo.
    expect(strValorDe('Canal de Recepción')).toBe('13');
  });

  it('la favorabilidad se muestra por su ETIQUETA del catálogo estático, no por el código', async () => {
    // `'1'` es Cliente y `'3'` es Compañía en `SCR0051_OPTIONS_FAVOR` — no son 1/2, que es el error
    // fácil de escribir a mano.
    await montar({ [QD.strFavorability]: '3' });

    expect(cllRotulos()).toContain('Respuesta a favor de');
    expect(strTexto()).toContain('Compañía');
  });

  it('una favorabilidad que no está en el catálogo no pinta el campo (ni un código crudo)', async () => {
    // El `find()` devuelve `undefined` y el `?? ''` lo convierte en campo vacío, que el filtro descarta.
    // Es deliberado: un código huérfano en pantalla ("Respuesta a favor de: 7") no le dice nada al
    // gestor, y el bloque igual aparece si trae otro campo.
    await montar({ [QD.strFavorability]: '7', [QD.strClientResponse]: 'Se acepta la reclamación.' });

    expect(cllTitulos()).toContain('Respuesta');
    expect(cllRotulos()).toContain('Respuesta al Cliente');
    expect(cllRotulos()).not.toContain('Respuesta a favor de');
  });

  // ── Nombre e identificación entran por input, no por la foto ────────────────────────────────────

  it('el subtítulo une nombre e identificación con ` · `', async () => {
    await montar({});

    expect(strSubtitulo()).toBe('María Fernanda Ríos · Cédula de Ciudadanía 52.844.107');
  });

  /**
   * ⚠ **Va como segundo `it()` con su propio montaje, y no como una segunda mitad del anterior.**
   * Cambiar `strIdentificacion` después del primer render y volver a llamar `detectChanges()` tira
   * NG0100 (`ExpressionChangedAfterItHasBeenCheckedError`): el campo es una propiedad plana, no un
   * signal, así que el segundo pase de verificación de Angular ve un valor distinto al que acababa de
   * pintar. Medido acá. Un montaje por estado es más barato que convertir el host a signals para un
   * caso que igual no prueba la transición.
   */
  it('el subtítulo omite el separador cuando no hay identificación', async () => {
    await montar({}, { strIdentificacion: '' });

    expect(strSubtitulo()).toBe('María Fernanda Ríos');
  });

  // ── Los tres bloques con componentes propios ────────────────────────────────────────────────────

  it('⚠ los bloques de archivos se deciden por los campos del FORM, no esperando a PM4', async () => {
    // La señal es `qd_strAttach01` en la foto. Aseverarlo importa porque la alternativa —preguntar a
    // PM4 y decidir con la respuesta— haría que el bloque apareciera y desapareciera mientras el
    // gestor lee el documento, y que un request sin archivos ocultara un caso que sí los declaró.
    await montar({ [SCR000_ADJUNTO_KEYS[0]]: 'cedula.pdf' });

    expect(cllTitulos()).toContain('Documentos del Radicador');
    expect(cllTitulos()).not.toContain('Soportes Internos');
  });

  it('el bloque de soportes internos aparece con una clave de soporte poblada', async () => {
    await montar({ [SCR0051_ADJUNTO_KEYS[0]]: 'concepto-tecnico.pdf' });

    expect(cllTitulos()).toContain('Soportes Internos');
    expect(cllTitulos()).not.toContain('Documentos del Radicador');
  });

  it('sin adjuntos declarados no se pinta ninguno de los dos bloques de archivos', async () => {
    await montar({ [QD.strComplaintText]: 'Texto de la queja.' });

    expect(cllTitulos()).not.toContain('Documentos del Radicador');
    expect(cllTitulos()).not.toContain('Soportes Internos');
  });

  // ── El historial ───────────────────────────────────────────────────────────────────────────────

  it('el historial pinta una fila por asignación, con ✓/— en lugar de la píldora de React', async () => {
    await montar({
      [QD.lstAssignHistory]: [
        {
          fecha: '2026-08-10 09:15', de: 'SAC', para: 'Técnica',
          observaciones: 'Requiere concepto del área técnica.', respondio: 'si',
        },
        { fecha: '2026-08-12 14:40', de: 'Técnica', para: 'Jurídica', observaciones: '', respondio: 'no' },
      ],
    });

    expect(cllTitulos()).toContain('Historial de Asignaciones');

    const cllFilas = Array.from(
      objFixture.nativeElement.querySelectorAll('lib-table-z tbody tr') as NodeListOf<HTMLElement>,
    );
    expect(cllFilas.length).toBe(2);

    // `respondio: 'si'` → `'✓'`, cualquier otra cosa → `'—'`. Es texto y no un badge porque `TableZ` no
    // soporta plantillas por columna y su `isTag` colorea contra una lista de palabras en inglés (ver
    // la cabecera del `.ts`): un `'✓'` saldría negro, o sea mentiría con el color.
    expect((cllFilas[0].textContent ?? '')).toContain('✓');
    expect((cllFilas[1].textContent ?? '')).toContain('—');
  });

  it('un historial que no es un array —o trae basura— no rompe el documento', async () => {
    // PM4 devuelve `''` cuando la variable de lista nunca se escribió, y una fila `null` cuando un
    // script la borró a medias. Las dos llegan acá y el documento tiene que seguir en pie.
    await montar({ [QD.lstAssignHistory]: '', [QD.strComplaintText]: 'Texto.' });
    expect(cllTitulos()).not.toContain('Historial de Asignaciones');

    objHost.sigDatos.set({ [QD.lstAssignHistory]: [null, { fecha: '2026-08-10' }] });
    objFixture.detectChanges();
    await drenarPeticiones();

    // La fila `null` se descarta; la buena sobrevive con sus columnas vacías en blanco.
    const cllFilas = Array.from(
      objFixture.nativeElement.querySelectorAll('lib-table-z tbody tr') as NodeListOf<HTMLElement>,
    );
    expect(cllFilas.length).toBe(1);
  });

  // ── El cierre ──────────────────────────────────────────────────────────────────────────────────

  it('⚠ el botón Cerrar emite `cerrar`, y el modal declara el `(close)` del DS', async () => {
    await montar({ [QD.strComplaintText]: 'Texto.' });

    // El clic va por el `<za-button>` interno: el handler de `ButtonZ` está enganchado ahí y un
    // `click()` sobre el host `lib-button-z` no dispara nada (trampa medida en la fachada).
    const objBoton = objFixture.nativeElement.querySelector(
      'lib-button-z[label="Cerrar"] za-button',
    ) as HTMLElement | null;
    expect(objBoton, 'el modal no montó el botón Cerrar').not.toBeNull();

    objBoton!.dispatchEvent(new Event('click', { bubbles: true }));
    await objFixture.whenStable();
    expect(objHost.intCerrado).toBe(1);

    // Y la otra vía de cierre: `ModalZ.change()` hace `open = false` sobre su propio input, así que sin
    // el `(close)` declarado el backdrop y la X dejarían la bandera de la pantalla en `true` y el modal
    // no volvería a abrir. Se asevera que el `lib-modal-z` está y que la pantalla puede escucharlo.
    const objModal = objFixture.nativeElement.querySelector('lib-modal-z');
    expect(objModal, 'el documento tiene que vivir dentro de un lib-modal-z').not.toBeNull();
  });
});
