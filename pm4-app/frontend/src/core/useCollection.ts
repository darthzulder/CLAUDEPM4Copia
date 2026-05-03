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

function resolvePath(obj: Record<string, unknown>, path: string): string {
  return String(
    path.split('.').reduce<unknown>((acc, key) => {
      if (acc !== null && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj) ?? ''
  );
}

function resolvePmql(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ''));
}

export function useCollection(
  def: CollectionDef | null,
  watchValues?: Record<string, unknown>
): { options: CollectionOption[]; loading: boolean } {
  const [options, setOptions] = useState<CollectionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const dependsOnValue = def?.dependsOn ? watchValues?.[def.dependsOn] : undefined;

  useEffect(() => {
    if (!def) return;

    // Si depende de otro campo y todavía no tiene valor, no cargar
    if (def.dependsOn && !dependsOnValue) {
      setOptions([]);
      return;
    }

    const params: Record<string, string> = { per_page: '500' };

    if (def.pmqlTemplate && watchValues) {
      params.pmql = resolvePmql(def.pmqlTemplate, watchValues);
      console.log(`[useCollection] id=${def.id} pmql=`, params.pmql);
    }

    setLoading(true);
    pm4
      .get(`/collections/${def.id}/records`, { params })
      .then((r) => {
        const records: Record<string, unknown>[] = r.data?.data ?? [];
        console.log(`[useCollection] id=${def.id} → ${records.length} registros`);
        setOptions(
          records
            .map((rec) => ({
              value: resolvePath(rec, def.valueField),
              label: resolvePath(rec, def.labelField),
            }))
            .filter((o) => o.value !== '' && o.label !== '')
        );
      })
      .catch((e) => {
        console.error(`[useCollection] id=${def.id} error:`, e.message);
        setOptions([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def?.id, String(dependsOnValue)]);

  return { options, loading };
}
