import { useState, useEffect } from 'react';
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import pm4 from '../api/pm4Client';

export interface CollectionDef {
  id: number;
  labelField: string;        // dotted path en el record: 'data.frm_nombre_entidad' | 'id'
  valueField: string;        // dotted path en el record: 'id' | 'data.frm_codigo'
  dependsOn?: string;        // nombre del campo del form que dispara recarga
  pmqlTemplate?: string;     // PMQL con placeholders {{field_name}} resueltos con el valor del form
}

export interface CollectionOption {
  value: string;
  label: string;
}

// Exportadas para poder testearlas: resolvePmql arma la consulta PMQL que se manda a PM4 y
// resolvePath camina rutas con puntos sobre el record crudo. No son API para las pantallas —
// se consumen solo desde useCollection, acá abajo.
export function resolvePath(in_dicObj: Record<string, unknown>, in_strPath: string): string {
  // Recorremos el path separado por puntos para bajar por el objeto
  return String(
    in_strPath.split('.').reduce<unknown>((in_objAcc, in_strKey) => {
      if (in_objAcc !== null && typeof in_objAcc === 'object') {
        return (in_objAcc as Record<string, unknown>)[in_strKey];
      }
      return undefined;
    }, in_dicObj) ?? ''
  );
}

export function resolvePmql(in_strTemplate: string, in_dicValues: Record<string, unknown>): string {
  // Reemplazamos cada placeholder por el valor correspondiente del form
  return in_strTemplate.replace(/\{\{(\w+)\}\}/g, (_, in_strKey) => String(in_dicValues[in_strKey] ?? ''));
}

export function useCollection(
  in_objDef: CollectionDef | null,
  in_dicWatchValues?: Record<string, unknown>
): {
  options: CollectionOption[];
  loading: boolean;
  rawMap: Record<string, Record<string, unknown>>;
  records: Record<string, unknown>[];
} {
  const [options, setOptions] = useState<CollectionOption[]>([]);
  const [rawMap, setRawMap] = useState<Record<string, Record<string, unknown>>>({});
  // Registros crudos tal cual los devuelve PM4 — necesarios para colecciones tipo
  // "matriz" cuya cascada se filtra en cliente por varias columnas (ver SCR-000).
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  // Valor del campo del que depende esta coleccion
  const genDependsOnValue = in_objDef?.dependsOn ? in_dicWatchValues?.[in_objDef.dependsOn] : undefined;

  useEffect(() => {
    if (!in_objDef) return;

    // Si depende de otro campo y todavía no tiene valor, no cargar
    if (in_objDef.dependsOn && !genDependsOnValue) {
      setOptions([]);
      setRawMap({});
      setRecords([]);
      return;
    }

    // Armamos los parametros de la consulta a la coleccion
    const dicParams: Record<string, string> = { per_page: '500' };

    // Si hay plantilla PMQL la resolvemos con los valores actuales del form
    if (in_objDef.pmqlTemplate && in_dicWatchValues) {
      dicParams.pmql = resolvePmql(in_objDef.pmqlTemplate, in_dicWatchValues);
      console.log(`[useCollection] id=${in_objDef.id} pmql=`, dicParams.pmql);
    }

    setLoading(true);
    // Pedimos los registros de la coleccion a PM4
    pm4
      .get(`/collections/${in_objDef.id}/records`, { params: dicParams })
      .then((in_objResp) => {
        const cllRecords: Record<string, unknown>[] = in_objResp.data?.data ?? [];
        console.log(`[useCollection] id=${in_objDef.id} → ${cllRecords.length} registros`);
        setRecords(cllRecords);
        // Mapeamos cada registro a su value y label y descartamos los vacios
        const cllMapped = cllRecords
          .map((in_dicRec) => ({
            value: resolvePath(in_dicRec, in_objDef.valueField),
            label: resolvePath(in_dicRec, in_objDef.labelField),
            rec: in_dicRec,
          }))
          .filter((in_objOpt) => in_objOpt.value !== '' && in_objOpt.label !== '');
        setOptions(cllMapped.map(({ value, label }) => ({ value, label })));
        setRawMap(Object.fromEntries(cllMapped.map(({ value, rec }) => [value, rec])));
      })
      .catch((in_excError) => {
        console.error(`[useCollection] id=${in_objDef.id} error:`, in_excError.message);
        setOptions([]);
        setRawMap({});
        setRecords([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [in_objDef?.id, String(genDependsOnValue)]);

  return { options, loading, rawMap, records };
}

// ─── Desambiguación de catálogos con código repetido ─────────────────────────
// Algunos catálogos PM4 repiten el mismo `value` (código) en más de un registro —
// p.ej. colección 16 "Producto SFC": "Garantía extendida" y "Copropiedades" comparten
// codigo_producto_sfc = "104". El picker (ZrSelect) indexa sus opciones por `value`, así
// que si dos opciones comparten value, no puede distinguir cuál de las dos se clickeó
// (ambas terminan resolviendo al mismo registro interno). Se compone un value de UI único
// (código + etiqueta) para el picker, y se decodifica de vuelta al código real (lo que se
// guarda en el form / se envía a PM4) y a la etiqueta elegida (para el `_desc` compañero).
const UI_VALUE_SEP = '::';

export function toUiValue(in_strCode: string, in_strLabel: string): string {
  return `${in_strCode}${UI_VALUE_SEP}${in_strLabel}`;
}

// Código real a partir de un value de UI compuesto.
export function codeFromUiValue(in_strUiValue: string | undefined): string {
  return String(in_strUiValue ?? '').split(UI_VALUE_SEP)[0] ?? '';
}

// Etiqueta elegida (para él `_desc` compañero) a partir de un value de UI compuesto.
export function labelFromUiValue(in_strUiValue: string | undefined): string {
  return String(in_strUiValue ?? '').split(UI_VALUE_SEP).slice(1).join(UI_VALUE_SEP);
}

// Opciones con value de UI desambiguado — usar como `options` del picker cuando el
// catálogo puede repetir el mismo código en más de un registro.
export function toUiOptions(in_lstOptions: readonly CollectionOption[]): CollectionOption[] {
  return in_lstOptions.map((o) => ({ value: toUiValue(o.value, o.label), label: o.label }));
}

// Reconstruye el value de UI a partir del código + descripción ya guardados en el form
// (p.ej. al precargar `task.data`), para preseleccionar el registro correcto entre
// duplicados. Sin `_desc` (dato guardado antes de este fix) cae al primer registro que
// tenga ese código — mismo comportamiento que había antes de desambiguar.
export function uiValueFromCode(
  in_lstOptions: readonly CollectionOption[],
  in_strCode: string | undefined,
  in_strDesc: string | undefined,
): string {
  if (!in_strCode) return '';
  const objMatch = (in_strDesc ? in_lstOptions.find((o) => o.value === in_strCode && o.label === in_strDesc) : undefined)
    ?? in_lstOptions.find((o) => o.value === in_strCode);
  return objMatch ? toUiValue(objMatch.value, objMatch.label) : '';
}

// Resuelve la DESCRIPCIÓN (label) de un código contra las opciones de una colección.
// Fuente única que reemplaza las copias locales de desc()/descOpt() en las pantallas.
// Fallback al propio código si no hay match; '—' cuando no hay código (para render de
// solo lectura).
export function descOf(
  in_lstOptions: readonly CollectionOption[],
  in_strCode: string | undefined,
): string {
  if (!in_strCode) return '—';
  return in_lstOptions.find((in_objOpt) => in_objOpt.value === in_strCode)?.label ?? in_strCode;
}

// Mantiene sincronizada la variable COMPAÑERA `<field>_desc` en el estado del formulario
// con la descripción del código guardado en `field`. Como los payloads a PM4 se arman con
// { ...formData } (completeTask/saveDraft/sendToPm4), el `_desc` viaja solo, sin tocar el
// submit. Convención: el campo base guarda el CÓDIGO (numérico) y `<field>_desc` la etiqueta.
// Para código vacío escribe '' (no '—'), para no mandar guiones a PM4.
export function useSyncDesc<T extends FieldValues>(
  in_objForm: UseFormReturn<T>,
  in_strField: string,
  in_lstOptions: readonly CollectionOption[],
  in_objOpts?: { suffix?: string },
): void {
  const { watch, setValue } = in_objForm;
  const strSuffix = in_objOpts?.suffix ?? '_desc';
  // El campo `_desc` no está tipado en el form de cada pantalla; se castea (mismo criterio
  // que los `as Record<string,unknown>` que el repo ya usa al enviar a PM4).
  const strCode = watch(in_strField as Path<T>) as unknown as string | undefined;

  useEffect(() => {
    const strDesc = strCode ? descOf(in_lstOptions, strCode) : '';
    setValue(`${in_strField}${strSuffix}` as Path<T>, strDesc as PathValue<T, Path<T>>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strCode, in_lstOptions]);
}
