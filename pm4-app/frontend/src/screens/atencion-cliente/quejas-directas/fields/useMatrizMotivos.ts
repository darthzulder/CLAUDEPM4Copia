// Cascada de clasificación regulatoria de cat_matriz_motivos (colección 45):
//   producto SFC (seguro) → momento (interacción) → servicio → motivo SFC.
//
// La matriz se carga COMPLETA (≈385 filas) y la cascada se filtra en CLIENTE:
// `tipoSolicitud`/`productoZurich` guardan el TEXTO (no el código) y los datos
// traen espacios sobrantes, así que PMQL no puede compararlos con fiabilidad
// (detalle en core/collections.ts → matrixMotivos).
//
// Este hook centraliza esa derivación para no volver a copiarla en cada pantalla
// que re-edita la clasificación. Devuelve SOLO las opciones derivadas y la fila
// de motivo seleccionada: qué hacer cuando un valor cae fuera de sus opciones
// (limpiarlo, avisar, re-derivar regulatorios) es política de cada pantalla.
//
// Consumidores: SCR-003 (editor del payload de Momento 2). SCR-000
// (SeccionDetalleQueja) y SCR-0051 (SeccionDetalleCaso) mantienen su copia y
// pueden migrar a este hook más adelante.

import { useMemo } from 'react';
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import type { CollectionOption } from '../../../../core/useCollection';
import {
  useCollection, useSyncDesc, toUiOptions, uiValueFromCode, labelFromUiValue,
} from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS } from './fields';

/** Normaliza para comparar columnas de texto de la matriz (trim + minúsculas). */
export const normalizarMatriz = (in_gen: unknown): string => String(in_gen ?? '').trim().toLowerCase();

/** Lee una columna del registro crudo de la matriz (los campos viven bajo `data`). */
export function leerColumnaMatriz(in_objRow: Record<string, unknown>, in_strCol: string): string {
  const dicData = (in_objRow.data ?? in_objRow) as Record<string, unknown>;
  return String(dicData?.[in_strCol] ?? '').trim();
}

/** Opciones únicas por value, descartando vacíos (una misma columna se repite en la matriz). */
function opcionesUnicas(in_cll: CollectionOption[]): CollectionOption[] {
  const setSeen = new Set<string>();
  const cllOut: CollectionOption[] = [];
  for (const objOpt of in_cll) {
    if (!objOpt.value || setSeen.has(objOpt.value)) continue;
    setSeen.add(objOpt.value);
    cllOut.push(objOpt);
  }
  return cllOut;
}

export interface MatrizMotivos {
  /** Catálogo de producto SFC (colección 16) con su value real (código). */
  cllInsurance: CollectionOption[];
  /** Mismo catálogo con value de UI desambiguado — es el que recibe el picker. */
  cllInsuranceUi: CollectionOption[];
  /** Value de UI del producto actualmente guardado (para preseleccionar el duplicado correcto). */
  strInsuranceUiValue: string;
  /** Etiqueta del producto elegido (la matriz filtra por texto). */
  strProductLabel: string;
  blnIsAutos: boolean;
  blnIsAsistencias: boolean;
  cllInteraction: CollectionOption[];
  cllService: CollectionOption[];
  cllReason: CollectionOption[];
  /** Fila completa de la matriz para el motivo seleccionado (regulatorios derivados). */
  objSelectedReasonRow: Record<string, unknown> | undefined;
  /** Sincroniza qd_strSfcProduct_desc con la etiqueta elegida en el picker. */
  syncProductDesc: (in_strUiValue: string) => void;
}

export function useMatrizMotivos<T extends FieldValues>(in_objForm: UseFormReturn<T>): MatrizMotivos {
  const { watch, setValue } = in_objForm;
  // Lectura tipada laxa: los nombres físicos qd_* son claves del form de cada
  // pantalla, pero el hook es genérico (mismo criterio que useSyncDesc).
  const leer = (in_strField: string): string =>
    (watch(in_strField as Path<T>) as unknown as string | undefined) ?? '';

  const { options: cllInsurance } = useCollection(QD_COLLECTIONS.sfcProduct);
  const { options: cllRequestType } = useCollection(QD_COLLECTIONS.requestType);
  const { records: cllMatrizRows } = useCollection(QD_COLLECTIONS.matrixMotivos);

  // La colección 16 repite el mismo código en varios registros (p.ej. "Garantía
  // extendida" y "Copropiedades" comparten 104): el picker necesita values únicos,
  // pero el form sigue guardando el código puro (ver ZdsSelect toPickerValue/
  // fromPickerValue y toUiOptions en core/useCollection.ts).
  const strSfcProductDescField = `${QD.strSfcProduct}_desc`;
  const strProductCode = leer(QD.strSfcProduct);
  const strInteraction = leer(QD.strInteraction);
  const strService = leer(QD.strServiceProvided);
  const strReasonCode = leer(QD.strSfcReason);

  const cllInsuranceUi = useMemo(() => toUiOptions(cllInsurance), [cllInsurance]);
  const strInsuranceUiValue = uiValueFromCode(cllInsurance, strProductCode, leer(strSfcProductDescField));
  const strProductLabel = labelFromUiValue(strInsuranceUiValue);
  const blnIsAsistencias = /asistencias/i.test(strInteraction);
  const blnIsAutos = /autos/i.test(strProductLabel);

  const strRequestTypeLabel = cllRequestType.find((o) => o.value === leer(QD.strRequestType))?.label ?? '';

  // Las listas derivadas se memoizan: son deps de los useEffect de las pantallas
  // (y de useSyncDesc), así que una identidad nueva en cada render dispararía esos
  // efectos —y su setValue— en bucle.
  const cllRowsForProduct = useMemo(() => cllMatrizRows.filter((r) =>
    normalizarMatriz(leerColumnaMatriz(r, 'tipoSolicitud')) === normalizarMatriz(strRequestTypeLabel) &&
    normalizarMatriz(leerColumnaMatriz(r, 'productoZurich')) === normalizarMatriz(strProductLabel)),
  [cllMatrizRows, strRequestTypeLabel, strProductLabel]);

  // Momento (interacción) — opciones únicas de la columna `interaccion`.
  const cllInteraction = useMemo(() => opcionesUnicas(cllRowsForProduct.map((r) => {
    const strVal = leerColumnaMatriz(r, 'interaccion');
    return { value: strVal, label: strVal };
  })), [cllRowsForProduct]);

  const cllRowsForInteraction = useMemo(() => cllRowsForProduct.filter((r) =>
    normalizarMatriz(leerColumnaMatriz(r, 'interaccion')) === normalizarMatriz(strInteraction)),
  [cllRowsForProduct, strInteraction]);

  // Servicio (`servicioPrestado`) — solo aplica cuando el momento es "Asistencias".
  const cllService = useMemo(() => opcionesUnicas(cllRowsForInteraction.map((r) => {
    const strVal = leerColumnaMatriz(r, 'servicioPrestado');
    return { value: strVal, label: strVal };
  })), [cllRowsForInteraction]);

  // Motivo — value = codigoMotivoSFC (código real que espera la SFC), label = motivoSFC.
  const cllRowsForReason = useMemo(() => (blnIsAsistencias
    ? cllRowsForInteraction.filter((r) =>
      normalizarMatriz(leerColumnaMatriz(r, 'servicioPrestado')) === normalizarMatriz(strService))
    : cllRowsForInteraction), [blnIsAsistencias, cllRowsForInteraction, strService]);

  const cllReason = useMemo(() => opcionesUnicas(cllRowsForReason.map((r) => ({
    value: leerColumnaMatriz(r, 'codigoMotivoSFC'),
    label: leerColumnaMatriz(r, 'motivoSFC'),
  }))), [cllRowsForReason]);

  const objSelectedReasonRow = useMemo(() => cllRowsForReason.find(
    (r) => leerColumnaMatriz(r, 'codigoMotivoSFC') === strReasonCode), [cllRowsForReason, strReasonCode]);

  // Companion qd_strSfcReason_desc (convención `_desc` del proyecto). El de
  // producto se sincroniza a mano: el código no alcanza para distinguir duplicados.
  useSyncDesc(in_objForm, QD.strSfcReason, cllReason);

  const syncProductDesc = (in_strUiValue: string) =>
    setValue(strSfcProductDescField as Path<T>, labelFromUiValue(in_strUiValue) as PathValue<T, Path<T>>);

  return {
    cllInsurance, cllInsuranceUi, strInsuranceUiValue, strProductLabel,
    blnIsAutos, blnIsAsistencias,
    cllInteraction, cllService, cllReason, objSelectedReasonRow, syncProductDesc,
  };
}
