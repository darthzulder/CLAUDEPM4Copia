import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { OS } from '../fields/fields';
import { ReasignarCasoModal } from './reasignar-caso-modal';

/**
 * ACT-003-02 · `ReasignarCasoModal` — los cuatro comportamientos que el componente **decide**, no los
 * que delega.
 *
 * El modal es casi todo plantilla, y por eso este archivo es corto a propósito: lo que se prueba es la
 * lógica que no se ve leyendo el `.html`.
 *
 * ── 1. La guarda de generación (`intGeneracion`) es el caso que justifica el archivo ─────────────
 * Es el único defecto de este componente que un humano no detecta usándolo: elegir un área, cambiar de
 * idea antes de que responda, y quedarse con los usuarios de la PRIMERA área bajo el rótulo de la
 * segunda. En producción pasa cuando la red va lenta; en el spec se reproduce **flusheando las dos
 * cargas al revés**. Sin la guarda, el select termina ofreciendo gente que no pertenece al área
 * elegida, y reasignar a esa persona es un 200 de PM4 con el caso en la bandeja equivocada.
 *
 * ── 2. `strUserId` es una resolución, no un passthrough ─────────────────────────────────────────
 * El select guarda el **username** (`value`); PM4 reasigna por **user_id** (`id`). Que el `confirmado`
 * emita el `id` y no el `value` es lo que separa "reasignado a quien el usuario eligió" de "reasignado
 * a nadie", y las dos cosas se ven igual desde la UI. Ver el ⚠ del pivote GroupMember en
 * `pm4-groups.service.ts`, que es de dónde viene ese `id`.
 *
 * ── 3. Las cuatro afordancias son mutuamente excluyentes ────────────────────────────────────────
 * helpText / spinner / alerta de error / aviso de "0 usuarios": el componente las coordina con
 * `blnAreaSinUsuarios`, y superponer dos le mostraría al usuario mensajes contradictorios. El caso fija
 * que el aviso de vacío **no** aparezca durante la carga ni encima de un error.
 *
 * ── 4. Por qué hay un host de prueba y no se monta el modal solo ────────────────────────────────
 * `form` y `abierto` son `input.required()`, y el `effect` del constructor lee `form()` en el primer
 * render. Montarlo con `TestBed.createComponent(ReasignarCasoModal)` sin inputs revienta con NG0950
 * antes de llegar a cualquier aserción. El host los provee como la pantalla real: un `FormGroup` con
 * los dos controles del caso.
 */
const OBJ_GRUPO = { id: '77', name: 'Siniestros' };

/**
 * Respuesta de `GET /groups/{id}/users` con forma de **pivote GroupMember**: `id` es el id de la fila
 * y `member_id` el del usuario. Es la forma real que devuelve PM4, no la del OpenAPI.
 */
const CLL_MIEMBROS = [
  { id: 900, member_id: 12, username: 'jrios', firstname: 'Juliana', lastname: 'Ríos' },
  { id: 901, member_id: 34, username: 'pgomez', firstname: 'Pedro', lastname: 'Gómez' },
];

@Component({
  standalone: true,
  imports: [ReasignarCasoModal],
  template: `
    <app-reasignar-caso-modal
      [abierto]="blnAbierto()"
      [form]="form"
      [enviando]="false"
      (confirmado)="alConfirmar($event)"
    />
  `,
})
class HostDePrueba {
  readonly blnAbierto = signal(false);
  readonly form = new FormGroup({
    [OS.strAssigneeArea]: new FormControl(''),
    [OS.strAssigneeUser]: new FormControl(''),
  });

  /**
   * Se acumulan **todas** las emisiones en vez de guardar la última, y esa decisión es lo que hace
   * detectable la mutación de la guarda de `confirmar()`.
   *
   * Con un solo `strEmitido = ''` inicial, "no emitió nada" y "emitió la cadena vacía" son el mismo
   * estado observable — así que sacar el `if (strId)` del componente dejaba el caso VERDE. Contando
   * emisiones, no emitir es `[]` y emitir vacío es `['']`, que es justamente la diferencia entre
   * abrir un PUT de reasignación sin destinatario y no abrirlo.
   */
  readonly cllEmitidos: string[] = [];

  alConfirmar(in_strUserId: string): void {
    this.cllEmitidos.push(in_strUserId);
  }
}

let objFixture: ComponentFixture<HostDePrueba>;
let objHost: HostDePrueba;
let objMock: HttpTestingController;

async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

/** El componente hijo, para leer sus signals internos. */
function objModal(): ReasignarCasoModal {
  return objFixture.debugElement.children[0].componentInstance as ReasignarCasoModal;
}

function montar(): void {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  objFixture = TestBed.createComponent(HostDePrueba);
  objHost = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
}

/** Abre el modal y elige un área, que es lo que dispara la carga de usuarios. */
async function abrirYElegirArea(in_strArea: string): Promise<void> {
  objHost.blnAbierto.set(true);
  objHost.form.get(OS.strAssigneeArea)!.setValue(in_strArea);
  await asentar();
}

/** La petición de búsqueda del grupo, filtrada por el nombre que se espera. */
function petGrupos(in_strFiltro: string) {
  return objMock.expectOne(
    (in_objReq) =>
      in_objReq.method === 'GET' &&
      in_objReq.url.endsWith('/groups') &&
      in_objReq.params.get('filter') === in_strFiltro,
  );
}

/** La petición de usuarios de un grupo ya resuelto. */
function petUsuarios(in_strGroupId: string) {
  return objMock.expectOne(
    (in_objReq) =>
      in_objReq.method === 'GET' && in_objReq.url.endsWith(`/groups/${in_strGroupId}/users`),
  );
}

/** Resuelve una carga completa (los dos GET) para un área ya elegida. */
async function responderCarga(
  in_strFiltro: string,
  in_objGrupo: { id: string; name: string },
  in_cllMiembros: unknown[],
): Promise<void> {
  petGrupos(in_strFiltro).flush({ data: [in_objGrupo] });
  await asentar();
  petUsuarios(in_objGrupo.id).flush({ data: in_cllMiembros });
  await asentar();
}

afterEach(() => {
  // El `try/finally` por el mismo motivo que en el spec de la pantalla: un `verify()` que tira aborta
  // el hook y dejaría el TestBed instanciado, convirtiendo un caso roto en todos los siguientes rojos.
  try {
    objMock?.verify();
  } finally {
    TestBed.resetTestingModule();
  }
});

describe('ReasignarCasoModal · carga de usuarios del área', () => {
  it('con el modal cerrado NO consulta nada', async () => {
    montar();
    // El área puede venir precargada de `task.data` con el modal cerrado. Pedir los usuarios ahí sería
    // una petición por una pantalla que el usuario todavía no abrió.
    objHost.form.get(OS.strAssigneeArea)!.setValue('siniestros');
    await asentar();

    objMock.expectNone(() => true);
  });

  it('al elegir un área busca el grupo por su ETIQUETA, no por su value', async () => {
    montar();
    await abrirYElegirArea('siniestros');

    // ⚠ El `value` del catálogo es `siniestros`; el nombre del grupo PM4 es la **etiqueta**
    // ("Siniestros"). Buscar por el value no encontraría el grupo y el select quedaría vacío sin
    // decir por qué. Es la suposición 5 de la ficha de la pantalla.
    petGrupos('Siniestros').flush({ data: [OBJ_GRUPO] });
    await asentar();
    petUsuarios('77').flush({ data: CLL_MIEMBROS });
    await asentar();

    expect(objModal().cllUsuarios().length).toBe(2);
  });

  it('preselecciona el primer usuario para no dejar el área sin destinatario', async () => {
    montar();
    await abrirYElegirArea('siniestros');
    await responderCarga('Siniestros', OBJ_GRUPO, CLL_MIEMBROS);

    expect(objHost.form.get(OS.strAssigneeUser)!.value).toBe('jrios');
  });

  it('emite el user_id del PIVOTE (member_id), no el username ni el id de la fila', async () => {
    montar();
    await abrirYElegirArea('siniestros');
    await responderCarga('Siniestros', OBJ_GRUPO, CLL_MIEMBROS);

    objModal().confirmar();
    await asentar();

    // `jrios` → member_id 12. Ni `'jrios'` (el username) ni `'900'` (el id de la fila del pivote):
    // los tres son strings plausibles y solo uno reasigna a la persona correcta.
    expect(objHost.cllEmitidos).toEqual(['12']);
  });

  it('sin usuario resuelto NO emite nada aunque se llame a confirmar', async () => {
    montar();
    objHost.blnAbierto.set(true);
    await asentar();

    // Un botón deshabilitado del DS igual dispara su handler bajo jsdom (trampa 1 de
    // `testing-conventions.md`), así que el corte real vive en el método y este caso lo fija.
    objModal().confirmar();
    await asentar();

    // ⚠ `toEqual([])` y no `toBe('')`: lo que se asevera es que **no hubo emisión**. Aseverar el valor
    // de la última emisión no distingue "no emitió" de "emitió vacío", y esa es exactamente la
    // mutación que hay que atrapar — un `confirmado.emit('')` haría que la pantalla llame a
    // `reasignarTarea` con un `user_id` vacío y PM4 respondería 200 sin reasignar a nadie.
    expect(objHost.cllEmitidos).toEqual([]);
  });
});

describe('ReasignarCasoModal · la guarda de generación', () => {
  it('⚠ descarta la respuesta de un área que ya no es la elegida (respuesta tardía)', async () => {
    montar();

    // 1 · el usuario elige "Siniestros"…
    await abrirYElegirArea('siniestros');
    const objPetGruposSiniestros = petGrupos('Siniestros');

    // 2 · …y cambia a "Pagos" antes de que la primera responda.
    objHost.form.get(OS.strAssigneeArea)!.setValue('pagos');
    await asentar();
    const objPetGruposPagos = petGrupos('Pagos');

    // 3 · Las dos responden EN ORDEN INVERTIDO: primero Pagos, después la vieja de Siniestros.
    objPetGruposPagos.flush({ data: [{ id: '88', name: 'Pagos' }] });
    await asentar();
    petUsuarios('88').flush({
      data: [{ id: 910, member_id: 56, username: 'lmora', firstname: 'Lucía', lastname: 'Mora' }],
    });
    await asentar();

    objPetGruposSiniestros.flush({ data: [OBJ_GRUPO] });
    await asentar();
    petUsuarios('77').flush({ data: CLL_MIEMBROS });
    await asentar();

    // ⚠ Sin `intGeneracion` el select termina con los usuarios de Siniestros bajo el rótulo de Pagos,
    // y reasignar a `jrios` mandaría el caso a un área que el usuario descartó. PM4 responde 200.
    expect(objModal().cllUsuarios().map((in_objU) => in_objU.value)).toEqual(['lmora']);
    expect(objHost.form.get(OS.strAssigneeUser)!.value).toBe('lmora');
  });

  it('al volver el área a vacío limpia la lista en vez de dejar la anterior', async () => {
    montar();
    await abrirYElegirArea('siniestros');
    await responderCarga('Siniestros', OBJ_GRUPO, CLL_MIEMBROS);
    expect(objModal().cllUsuarios().length).toBe(2);

    objHost.form.get(OS.strAssigneeArea)!.setValue('');
    await asentar();

    // Dejar la lista vieja permitiría confirmar con un usuario que no corresponde a ningún área.
    expect(objModal().cllUsuarios()).toEqual([]);
  });
});

describe('ReasignarCasoModal · las cuatro afordancias son excluyentes', () => {
  it('sin área elegida guía con el helpText y NO avisa de lista vacía', async () => {
    montar();
    objHost.blnAbierto.set(true);
    await asentar();

    // "0 usuarios" con el área sin elegir sería acusar al catálogo de PM4 de algo que no pasó: el
    // estado real es "todavía no eligió".
    expect(objModal().strAreaElegida()).toBe('');
    expect(objModal().blnAreaSinUsuarios()).toBe(false);
  });

  it('durante la carga NO avisa de lista vacía todavía', async () => {
    montar();
    await abrirYElegirArea('siniestros');

    // La lista está vacía porque la petición está en vuelo, no porque el grupo no tenga gente. El
    // spinner es la afordancia correcta acá; el aviso llegaría a destiempo y contradiciéndolo.
    expect(objModal().blnCargando()).toBe(true);
    expect(objModal().cllUsuarios()).toEqual([]);
    expect(objModal().blnAreaSinUsuarios()).toBe(false);

    await responderCarga('Siniestros', OBJ_GRUPO, CLL_MIEMBROS);
    expect(objModal().blnCargando()).toBe(false);
  });

  it('un grupo real pero vacío SÍ dispara el aviso de 0 usuarios', async () => {
    montar();
    await abrirYElegirArea('siniestros');
    await responderCarga('Siniestros', OBJ_GRUPO, []);

    // Acá la petición salió bien y la respuesta vino vacía: el problema está en OPTIONS_AREA o en el
    // catálogo de grupos de PM4, no en la conexión. Por eso es un aviso `info` y no la alerta negativa.
    expect(objModal().blnAreaSinUsuarios()).toBe(true);
    expect(objModal().strErrorCarga()).toBe('');
  });

  it('si la búsqueda falla muestra el error y NO el aviso de lista vacía', async () => {
    montar();
    await abrirYElegirArea('siniestros');
    petGrupos('Siniestros').flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );
    await asentar();

    // Los dos mensajes juntos serían contradictorios: "no se pudo cargar" y "no hay usuarios" cuentan
    // historias distintas sobre la misma pantalla.
    expect(objModal().strErrorCarga()).toBe(
      'No se pudieron cargar los usuarios del área seleccionada.',
    );
    expect(objModal().blnAreaSinUsuarios()).toBe(false);
    expect(objModal().blnCargando()).toBe(false);
  });
});
