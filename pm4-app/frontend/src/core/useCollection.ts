import { useState, useEffect } from 'react';
import pm4 from '../api/pm4Client';

export interface CollectionDef {
  id: number;
  labelField: string;        // dotted path en el record: 'data.frm_nombre_entidad' | 'id'
  valueField: string;        // dotted path en el record: 'id' | 'data.frm_codigo'
  dependsOn?: string | string[]; // campo(s) del form que disparan recarga; si son varios se exigen TODOS con valor
  pmqlTemplate?: string;     // PMQL con placeholders {{field_name}} resueltos con el valor del form
  distinct?: boolean;        // deduplica las opciones por `value` (p. ej. columnas de una matriz con filas repetidas)
}

export interface CollectionOption {
  value: string;
  label: string;
}

function resolvePath(in_dicObj: Record<string, unknown>, in_strPath: string): string {
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

function resolvePmql(in_strTemplate: string, in_dicValues: Record<string, unknown>): string {
  // Reemplazamos cada placeholder por el valor correspondiente del form
  return in_strTemplate.replace(/\{\{(\w+)\}\}/g, (_, in_strKey) => String(in_dicValues[in_strKey] ?? ''));
}

export function useCollection(
  in_objDef: CollectionDef | null,
  in_dicWatchValues?: Record<string, unknown>
): { options: CollectionOption[]; loading: boolean; rawMap: Record<string, Record<string, unknown>> } {
  const [options, setOptions] = useState<CollectionOption[]>([]);
  const [rawMap, setRawMap] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(false);

  // Campos de los que depende esta coleccion (uno o varios) y sus valores actuales.
  const arrDependsOn = in_objDef?.dependsOn
    ? (Array.isArray(in_objDef.dependsOn) ? in_objDef.dependsOn : [in_objDef.dependsOn])
    : [];
  const arrDependsValues = arrDependsOn.map((in_strField) => in_dicWatchValues?.[in_strField]);
  // Clave estable para el arreglo de deps del effect (recarga al cambiar cualquiera).
  const strDependsKey = arrDependsValues.map((in_genVal) => String(in_genVal ?? '')).join('|');

  useEffect(() => {
    if (!in_objDef) return;

    // Si depende de otro(s) campo(s) y alguno todavía no tiene valor, no cargar (cascada).
    if (arrDependsOn.length > 0 && arrDependsValues.some((in_genVal) => !in_genVal)) {
      setOptions([]);
      setRawMap({});
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
        // Mapeamos cada registro a su value y label y descartamos los vacios
        let cllMapped = cllRecords
          .map((in_dicRec) => ({
            value: resolvePath(in_dicRec, in_objDef.valueField),
            label: resolvePath(in_dicRec, in_objDef.labelField),
            rec: in_dicRec,
          }))
          .filter((in_objOpt) => in_objOpt.value !== '' && in_objOpt.label !== '');
        // `distinct`: una columna de una matriz (p. ej. `interaccion`) se repite en muchas
        // filas; nos quedamos con la primera aparición de cada `value`.
        if (in_objDef.distinct) {
          const setSeen = new Set<string>();
          cllMapped = cllMapped.filter((in_objOpt) =>
            setSeen.has(in_objOpt.value) ? false : (setSeen.add(in_objOpt.value), true));
        }
        setOptions(cllMapped.map(({ value, label }) => ({ value, label })));
        setRawMap(Object.fromEntries(cllMapped.map(({ value, rec }) => [value, rec])));
      })
      .catch((in_excError) => {
        console.error(`[useCollection] id=${in_objDef.id} error:`, in_excError.message);
        setOptions([]);
        setRawMap({});
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [in_objDef?.id, strDependsKey]);

  return { options, loading, rawMap };
}
