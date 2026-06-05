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
  const [result, setResult]       = useState<CotizadorResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef(inputs);

  // Función de cálculo reutilizable para reintentos
  const doCalculate = async (inp: CotizadorInputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await pm4.post('/cotizador/calcular', inp, { timeout: 35000 });
      if (res.data?.ok) {
        setResult(res.data.result as CotizadorResult);
        setWarmingUp(false);
      } else {
        setError(res.data?.message ?? 'Error desconocido del cotizador');
        setWarmingUp(false);
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; code?: string; message?: string };
      const status = err.response?.status ?? 0;
      const isConnectivity = status === 0 || status === 502 || status === 503 || status === 504
        || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK';

      if (isConnectivity) {
        console.warn('[useCotizador] Servicio iniciando (cold start), reintentando en 10s…');
        setWarmingUp(true);
        setResult(null);
        // Reintento automático en 10s con los inputs actuales
        if (retryRef.current) clearTimeout(retryRef.current);
        retryRef.current = setTimeout(() => {
          if (inputsRef.current) doCalculate(inputsRef.current);
        }, 10000);
      } else {
        const msg = err.response?.status
          ? `Error ${err.response.status} del cotizador`
          : (err.message ?? 'Error al calcular');
        setError(msg);
        setWarmingUp(false);
        console.error('[useCotizador] Error:', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    inputsRef.current = inputs;
    // Si no hay entradas con al menos un producto, limpiar
    if (!inputs || (!inputs.dyo && !inputs.cc && !inputs.pdysi && !inputs.pi)) {
      setResult(null);
      setError(null);
      setWarmingUp(false);
      if (retryRef.current) clearTimeout(retryRef.current);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (inputs) doCalculate(inputs);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [JSON.stringify(inputs)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { result, loading, error, warmingUp };
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
      p[`cot_dyo_opt${n}_deducible`] = o.deducible    ?? 0;
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
