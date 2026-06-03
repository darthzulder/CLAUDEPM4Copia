import { useState, useEffect, useRef } from 'react';
import pm4 from '../api/pm4Client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CotizadorInputs {
  dyo?: {
    facturacion: string | number;
    limite1: string | number;
    limite2: string | number;
    limite3: string | number;
    anexo: boolean;
    sector: string;
  };
  cc?: {
    facturacion: string | number;
    limite1_evento: string | number;
    limite2_evento: string | number;
    limite3_evento: string | number;
    limite1_agregado: string | number;
    limite2_agregado: string | number;
    limite3_agregado: string | number;
    empleados: string;
  };
  pdysi?: {
    facturacion: string | number;
    limite1: string | number;
    limite2: string | number;
    limite3: string | number;
  };
  pi?: {
    facturacion: string | number;
    limite1: string | number;
    limite2?: string | number;
    limite3?: string | number;
    actividad: string;
    deducible1?: string | number;
    deducible2?: string | number;
    deducible3?: string | number;
  };
}

export interface CotizadorOptDyo {
  prima_a: number | null;
  deducible: number;
  ent_limite: number | null;
  ent_deducible: number | null;
}

export interface CotizadorOptCC {
  deducible: number | null;
  prima: number | null;
}

export interface CotizadorOptPdysi {
  deducible: number | null;
  prima: number | null;
}

export interface CotizadorOptPi {
  limite: number | null;
  deducible: number | null;
  prima: number | null;
}

export interface CotizadorResult {
  dyo?:   { opt1: CotizadorOptDyo;   opt2: CotizadorOptDyo;   opt3: CotizadorOptDyo };
  cc?:    { opt1: CotizadorOptCC;    opt2: CotizadorOptCC;    opt3: CotizadorOptCC };
  pdysi?: { opt1: CotizadorOptPdysi; opt2: CotizadorOptPdysi; opt3: CotizadorOptPdysi };
  pi?:    { opt1: CotizadorOptPi; opt2: CotizadorOptPi; opt3: CotizadorOptPi };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCotizador(inputs: CotizadorInputs | null, debounceMs = 800) {
  const [result, setResult]   = useState<CotizadorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Si no hay entradas con al menos un producto, limpiar
    if (!inputs || (!inputs.dyo && !inputs.cc && !inputs.pdysi && !inputs.pi)) {
      setResult(null);
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await pm4.post('/cotizador/calcular', inputs);
        if (res.data?.ok) {
          setResult(res.data.result as CotizadorResult);
        } else {
          setError(res.data?.message ?? 'Error desconocido del cotizador');
        }
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } }; message?: string })
          .response?.data?.message ?? (e as { message?: string }).message ?? 'Error al calcular';
        setError(msg);
        console.error('[useCotizador] Error:', msg);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [JSON.stringify(inputs)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { result, loading, error };
}

// ─── Helper: convierte resultado a variables PM4 para incluir en el payload ──

export function cotizadorResultToPayload(
  result: CotizadorResult,
  inputs: CotizadorInputs,
): Record<string, unknown> {
  const p: Record<string, unknown> = {};

  if (result.dyo && inputs.dyo) {
    for (const n of [1, 2, 3] as const) {
      const k = `opt${n}` as 'opt1' | 'opt2' | 'opt3';
      const o = result.dyo[k];
      p[`cot_dyo_opt${n}_prima_a`]   = o.prima_a      ?? 0;
      p[`cot_dyo_opt${n}_deducible`] = 0;
      p[`cot_dyo_ent${n}_limite`]    = o.ent_limite   ?? 0;
      p[`cot_dyo_ent${n}_deducible`] = o.ent_deducible ?? 0;
    }
  }

  if (result.cc && inputs.cc) {
    const cc = inputs.cc;
    const limEvt = [cc.limite1_evento, cc.limite2_evento, cc.limite3_evento];
    const limAgr = [cc.limite1_agregado, cc.limite2_agregado, cc.limite3_agregado];
    for (const n of [1, 2, 3] as const) {
      const k = `opt${n}` as 'opt1' | 'opt2' | 'opt3';
      const o = result.cc[k];
      p[`cot_cc_opt${n}_lim_evt`]    = limEvt[n - 1] ?? 0;
      p[`cot_cc_opt${n}_lim_agr`]    = limAgr[n - 1] ?? 0;
      p[`cot_cc_opt${n}_deducible`]  = o.deducible ?? 0;
      p[`cot_cc_opt${n}_prima`]      = o.prima     ?? 0;
    }
  }

  if (result.pdysi && inputs.pdysi) {
    for (const n of [1, 2, 3] as const) {
      const k = `opt${n}` as 'opt1' | 'opt2' | 'opt3';
      const o = result.pdysi[k];
      p[`cot_pdysi_opt${n}_deducible`] = o.deducible ?? 0;
      p[`cot_pdysi_opt${n}_prima`]     = o.prima     ?? 0;
    }
  }

  if (result.pi && inputs.pi) {
    for (const n of [1, 2, 3] as const) {
      const k = `opt${n}` as 'opt1' | 'opt2' | 'opt3';
      const o = result.pi[k];
      p[`cot_pi_opt${n}_limite`]    = o.limite    ?? 0;
      p[`cot_pi_opt${n}_deducible`] = o.deducible ?? 0;
      p[`cot_pi_opt${n}_prima`]     = o.prima     ?? 0;
    }
  }

  return p;
}
