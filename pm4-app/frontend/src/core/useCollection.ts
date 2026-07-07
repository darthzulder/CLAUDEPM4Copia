import { useState, useEffect } from 'react';
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

  // Valor del campo del que depende esta coleccion
  const genDependsOnValue = in_objDef?.dependsOn ? in_dicWatchValues?.[in_objDef.dependsOn] : undefined;

  useEffect(() => {
    if (!in_objDef) return;

    // Si depende de otro campo y todavía no tiene valor, no cargar
    if (in_objDef.dependsOn && !genDependsOnValue) {
      setOptions([]);
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
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [in_objDef?.id, String(genDependsOnValue)]);

  return { options, loading, rawMap };
}
