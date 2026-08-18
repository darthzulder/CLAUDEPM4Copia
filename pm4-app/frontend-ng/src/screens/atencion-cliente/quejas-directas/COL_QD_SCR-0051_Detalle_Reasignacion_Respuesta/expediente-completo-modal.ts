import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZrButton, ZrModal, ZrTable, ZrTemplate, type ModeloTablaZr } from '../../../../components/fields/zds-reexports';
import { InfoBarComponent, type InfoBarItem } from '../../../../components/info-bar';
import { RequestFileListComponent } from '../../../../components/request-file-list';
import {
  QD, SCR000_ADJUNTO_KEYS, SCR0051_ADJUNTO_KEYS, SCR0051_OPTIONS_FAVOR,
} from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';

/** Un par etiqueta/valor del documento, ya filtrado (los vacíos no llegan a la plantilla). */
interface CampoExpediente {
  readonly label: string;
  readonly valor: string;
}

/** Un bloque del documento: título + sus pares visibles. */
interface BloqueExpediente {
  readonly titulo: string;
  readonly cllCampos: readonly CampoExpediente[];
}

/** Fila del historial normalizada a texto para `lib-table-z`. */
interface FilaExpediente {
  readonly fecha: string;
  readonly de: string;
  readonly para: string;
  readonly observaciones: string;
  readonly respondioTexto: string;
}

/**
 * ACT-0051-06 · "Ver Expediente Completo".
 *
 * Documento de solo lectura con los datos del caso que **ya llegaron** al formulario (`task.data`):
 * no dispara ninguna petición nueva, salvo las dos listas de archivos, que son componentes propios y
 * traen su propio ciclo de carga. Porte de `ExpedienteCompletoModal.tsx`.
 *
 * ── "Solo si hay datos" es la regla central, y aplica a los campos Y a los bloques ───────────────
 * Un campo sin valor **no se pinta** (ni su etiqueta), y un bloque cuyos campos están todos vacíos
 * desaparece completo, título incluido. Es lo que hace que esto se lea como un expediente y no como
 * un formulario con huecos — con un caso recién asignado, la mitad de los bloques no existe todavía.
 *
 * Los tres helpers de React (`DocField`, `DocSection`, `OptionalSection`) no se portan como
 * componentes: eran subcomponentes locales que existían para poder devolver `null` en medio del JSX.
 * En Angular el filtrado se hace **acá**, en un `computed()` que arma solo los bloques con contenido,
 * y la plantilla se reduce a un `@for`. Menos piezas y el filtro queda en un lugar aseverable.
 *
 * ── Todo se lee de `datos`, no del `FormGroup` ────────────────────────────────────────────────────
 * El modal recibe una **foto** de los valores (`getRawValue()` de la pantalla) y no el form: es un
 * documento, no un formulario, y no debe poder escribir. Por eso los campos de catálogo se resuelven
 * con la convención `<campo>_desc` que las secciones ya sincronizaron, con fallback al código crudo
 * si el catálogo no había respondido — misma cadena que en React.
 *
 * ── ⚠ El historial pierde la píldora verde, igual que en S7 ──────────────────────────────────────
 * React pinta "Respondió" con un `ZdsStatusBadge variant="success">✓`. Acá va como texto `✓`/`—`
 * porque `TableZ` **no soporta plantillas por columna** (`columnTemplates` se escribe y nunca se lee)
 * y su alternativa `isTag` resuelve el color contra una lista de palabras **en inglés**, así que un
 * `'✓'` saldría negro. El detalle completo está en `seccion-asignacion.ts`; acá además no hay
 * `showGenericEnd` disponible como salida, porque la columna no es la última… salvo que sí lo es, pero
 * usarla para el check dejaría el rótulo "Respondió" fuera del `[headers]` y desalineado del resto.
 * Se prefiere el texto, que es la misma información sin mentir con el color.
 */
@Component({
  selector: 'app-expediente-completo-modal',
  standalone: true,
  imports: [ZrModal, ZrTemplate, ZrButton, ZrTable, InfoBarComponent, RequestFileListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expediente-completo-modal.html',
})
export class ExpedienteCompletoModal {
  /** Foto de los valores del caso (`getRawValue()`). El modal no escribe: es un documento. */
  readonly datos = input.required<Record<string, unknown>>();

  /** Los pares de la barra superior, tal como los arma la pantalla. */
  readonly infoItems = input.required<readonly InfoBarItem[]>();

  readonly nombre = input('');
  readonly identificacion = input('');
  readonly requestId = input<number | null>(null);

  /**
   * Cierre del modal.
   *
   * ⚠ Obligatorio escucharlo: `ModalZ.change()` hace `this.open = false` sobre su **propio** input,
   * así que cerrar desde el backdrop o la X deja la bandera de la pantalla en `true` y el modal no
   * vuelve a abrir. Ver el punto 3 de `zds-reexports.ts`.
   */
  readonly cerrar = output<void>();

  protected readonly CLL_CLAVES_RADICADOR = SCR000_ADJUNTO_KEYS;
  protected readonly CLL_CLAVES_SOPORTE = SCR0051_ADJUNTO_KEYS;

  /** Subtítulo: nombre y —si hay— identificación. */
  protected readonly strSubtitulo = computed(() => {
    const strId = this.identificacion();
    return this.nombre() + (strId ? ` · ${strId}` : '');
  });

  /**
   * Los bloques del documento, ya filtrados: cada uno trae solo sus campos con dato, y los bloques
   * que se quedaron sin ninguno no aparecen en la lista.
   *
   * El orden es el de React y es el del expediente: consumidor → clasificación → queja → asignación
   * → respuesta. Las tres secciones con componentes propios (documentos, historial, soportes) van
   * intercaladas en la plantilla, no acá, porque no son pares etiqueta/valor.
   */
  protected readonly cllBloques = computed<readonly BloqueExpediente[]>(() => {
    const strFavor = SCR0051_OPTIONS_FAVOR.find(
      (in_objOpt) => in_objOpt.value === this.leer(QD.strFavorability),
    )?.label;

    const cllCrudos: readonly { titulo: string; campos: readonly (readonly [string, string])[] }[] = [
      {
        titulo: 'Datos del Consumidor',
        campos: [
          ['Nombre del Consumidor', this.nombre()],
          ['Tipo y N.° de Identificación', this.identificacion()],
          ['Correo Electrónico', this.leer(QD.strEmail)],
          ['Tipo de Persona', this.desc(QD.strPersonType)],
        ],
      },
      {
        titulo: 'Clasificación Regulatoria',
        campos: [
          ['Producto SFC', this.desc(QD.strSfcProduct)],
          ['Momento', this.leer(QD.strInteraction)],
          ['Servicio', this.leer(QD.strServiceProvided)],
          ['Placa', this.leer(QD.strPlate)],
          ['Motivo SFC', this.desc(QD.strSfcReason)],
          ['Canal de Recepción', this.desc(QD.strChannel)],
          ['Instancia de Recepción', this.desc(QD.strReceptionInstance)],
          ['Admisión', this.desc(QD.strAdmission)],
          ['Ente de Control', this.desc(QD.strControlEntity)],
          ['Escalamiento Defensor', this.leer(QD.strOmbudsmanEscalation)],
          ['Compensación', this.leer(QD.strCompensation)],
          ['Relación con Fraude', this.leer(QD.strFraudRelated)],
        ],
      },
      {
        titulo: 'Descripción de la Queja',
        campos: [['Descripción / Texto de la Queja', this.leer(QD.strComplaintText)]],
      },
      {
        titulo: 'Asignación / Reasignación',
        campos: [
          ['Área a Cargo', this.leer(QD.strAssigneeArea)],
          ['Usuario Responsable', this.desc(QD.strAssigneeUser)],
          ['Comentario de Reasignación', this.leer(QD.strAssignmentRemarks)],
        ],
      },
      {
        titulo: 'Respuesta',
        campos: [
          ['Respuesta a favor de', strFavor ?? ''],
          ['Observaciones SAC', this.leer(QD.strSacRemarks)],
          ['Respuesta al Cliente', this.leer(QD.strClientResponse)],
          ['Acciones Tomadas', this.leer(QD.strActionsTaken)],
        ],
      },
    ];

    const cllSalida: BloqueExpediente[] = [];
    for (const objBloque of cllCrudos) {
      const cllCampos = objBloque.campos
        .filter(([, strValor]) => !!strValor.trim())
        .map(([strLabel, strValor]) => ({ label: strLabel, valor: strValor.trim() }));
      if (cllCampos.length) cllSalida.push({ titulo: objBloque.titulo, cllCampos });
    }
    return cllSalida;
  });

  /**
   * Los tres bloques con componentes propios se muestran solo si el caso trae algo.
   *
   * Para los adjuntos se pregunta por los **campos del formulario** (`qd_strAttach01..05` /
   * `qd_strSupport01..10`), no por lo que devuelva PM4: es la señal que ya está en la foto y no
   * obliga a esperar una petición para decidir si el bloque existe. Es lo que hace React.
   */
  protected readonly blnHayDocsRadicador = computed(
    () => SCR000_ADJUNTO_KEYS.some((in_strClave) => !!this.leer(in_strClave)),
  );

  protected readonly blnHaySoportes = computed(
    () => SCR0051_ADJUNTO_KEYS.some((in_strClave) => !!this.leer(in_strClave)),
  );

  /**
   * Cinco columnas, no las ocho de S7: el expediente es un resumen y omite Motivo, Comentario y
   * Adjunto (los dos últimos requieren interacción, que un documento no tiene). Es la tabla de React.
   *
   * Sin `readonly` en el tipo: el input `data` de `TableZ` es mutable y un array `readonly` rebota
   * con TS4104.
   */
  protected readonly cllColumnasHistorial: ModeloTablaZr[] = [
    { title: 'Fecha', key: 'fecha' },
    { title: 'De', key: 'de' },
    { title: 'Para', key: 'para' },
    { title: 'Observaciones', key: 'observaciones' },
    { title: 'Respondió', key: 'respondioTexto' },
  ];

  protected readonly cllFilasHistorial = computed<FilaExpediente[]>(() => {
    const genCrudo = this.datos()[QD.lstAssignHistory];
    if (!Array.isArray(genCrudo)) return [];
    return genCrudo
      .filter((in_gen): in_gen is AsignacionHistorial => !!in_gen && typeof in_gen === 'object')
      .map((in_objFila) => ({
        fecha: in_objFila.fecha ?? '',
        de: in_objFila.de ?? '',
        para: in_objFila.para ?? '',
        observaciones: in_objFila.observaciones ?? '',
        respondioTexto: in_objFila.respondio === 'si' ? '✓' : '—',
      }));
  });

  private leer(in_strCampo: string): string {
    return String(this.datos()[in_strCampo] ?? '');
  }

  /**
   * Descripción legible de un campo respaldado por catálogo.
   *
   * Lee el companion `<campo>_desc` que las secciones sincronizan con `sincronizarDesc()`, y cae al
   * código crudo si el catálogo todavía no había resuelto una etiqueta cuando se tomó la foto.
   */
  private desc(in_strCampo: string): string {
    return String(this.datos()[`${in_strCampo}_desc`] ?? this.datos()[in_strCampo] ?? '');
  }
}
