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

export function useCotizador(in_objInputs: CotizadorInputs | null, in_intDebounceMs = 800) {
  const [result, setResult]       = useState<CotizadorResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const objTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objRetryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objInputsRef = useRef(in_objInputs);

  // Función de cálculo reutilizable para reintentos
  const doCalculate = async (in_objInp: CotizadorInputs) => {
    setLoading(true);
    setError(null);
    try {
      // Llamamos al servicio de cotizacion
      const objRes = await pm4.post('/cotizador/calcular', in_objInp, { timeout: 35000 });
      if (objRes.data?.ok) {
        setResult(objRes.data.result as CotizadorResult);
        setWarmingUp(false);
      } else {
        setError(objRes.data?.message ?? 'Error desconocido del cotizador');
        setWarmingUp(false);
      }
    } catch (in_excError: unknown) {
      // Normalizamos el error para leer status y codigo
      const objErr = in_excError as { response?: { status?: number }; code?: string; message?: string };
      const intStatus = objErr.response?.status ?? 0;
      // Detectamos si el fallo es de conectividad o arranque en frio
      const blnIsConnectivity = intStatus === 0 || intStatus === 502 || intStatus === 503 || intStatus === 504
        || objErr.code === 'ECONNABORTED' || objErr.code === 'ERR_NETWORK';

      if (blnIsConnectivity) {
        console.warn('[useCotizador] Servicio iniciando (cold start), reintentando en 10s…');
        setWarmingUp(true);
        setResult(null);
        // Reintento automático en 10s con los inputs actuales
        if (objRetryRef.current) clearTimeout(objRetryRef.current);
        objRetryRef.current = setTimeout(() => {
          if (objInputsRef.current) doCalculate(objInputsRef.current);
        }, 10000);
      } else {
        // Construimos el mensaje de error para mostrarlo
        const strMsg = objErr.response?.status
          ? `Error ${objErr.response.status} del cotizador`
          : (objErr.message ?? 'Error al calcular');
        setError(strMsg);
        setWarmingUp(false);
        console.error('[useCotizador] Error:', strMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    objInputsRef.current = in_objInputs;
    // Si no hay entradas con al menos un producto, limpiar
    if (!in_objInputs || (!in_objInputs.dyo && !in_objInputs.cc && !in_objInputs.pdysi && !in_objInputs.pi)) {
      setResult(null);
      setError(null);
      setWarmingUp(false);
      if (objRetryRef.current) clearTimeout(objRetryRef.current);
      return;
    }

    if (objTimerRef.current) clearTimeout(objTimerRef.current);

    // Esperamos el debounce antes de calcular para no llamar en cada cambio
    objTimerRef.current = setTimeout(() => {
      if (in_objInputs) doCalculate(in_objInputs);
    }, in_intDebounceMs);

    return () => {
      if (objTimerRef.current) clearTimeout(objTimerRef.current);
    };
  }, [JSON.stringify(in_objInputs)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { result, loading, error, warmingUp };
}

// ─── Helper: convierte resultado a variables PM4 para incluir en el payload ──

export function cotizadorResultToPayload(
  in_objResult: CotizadorResult,
  in_objInputs: CotizadorInputs,
): Record<string, unknown> {
  // Acumulamos aqui las variables PM4 del resultado
  const dicPayload: Record<string, unknown> = {};

  // Volcamos las opciones de D&O
  if (in_objResult.dyo && in_objInputs.dyo) {
    for (const intN of [1, 2, 3] as const) {
      const strKey = `opt${intN}` as 'opt1' | 'opt2' | 'opt3';
      const objOpt = in_objResult.dyo[strKey];
      dicPayload[`cot_dyo_opt${intN}_prima_a`]   = objOpt.prima_a      ?? 0;
      dicPayload[`cot_dyo_opt${intN}_deducible`] = objOpt.deducible    ?? 0;
      dicPayload[`cot_dyo_ent${intN}_limite`]    = objOpt.ent_limite   ?? 0;
      dicPayload[`cot_dyo_ent${intN}_deducible`] = objOpt.ent_deducible ?? 0;
    }
  }

  // Volcamos las opciones de CC con sus limites por evento y agregado
  if (in_objResult.cc && in_objInputs.cc) {
    const objCc = in_objInputs.cc;
    const lstLimEvt = [objCc.limite1_evento, objCc.limite2_evento, objCc.limite3_evento];
    const lstLimAgr = [objCc.limite1_agregado, objCc.limite2_agregado, objCc.limite3_agregado];
    for (const intN of [1, 2, 3] as const) {
      const strKey = `opt${intN}` as 'opt1' | 'opt2' | 'opt3';
      const objOpt = in_objResult.cc[strKey];
      dicPayload[`cot_cc_opt${intN}_lim_evt`]    = lstLimEvt[intN - 1] ?? 0;
      dicPayload[`cot_cc_opt${intN}_lim_agr`]    = lstLimAgr[intN - 1] ?? 0;
      dicPayload[`cot_cc_opt${intN}_deducible`]  = objOpt.deducible ?? 0;
      dicPayload[`cot_cc_opt${intN}_prima`]      = objOpt.prima     ?? 0;
    }
  }

  // Volcamos las opciones de PDySI
  if (in_objResult.pdysi && in_objInputs.pdysi) {
    for (const intN of [1, 2, 3] as const) {
      const strKey = `opt${intN}` as 'opt1' | 'opt2' | 'opt3';
      const objOpt = in_objResult.pdysi[strKey];
      dicPayload[`cot_pdysi_opt${intN}_deducible`] = objOpt.deducible ?? 0;
      dicPayload[`cot_pdysi_opt${intN}_prima`]     = objOpt.prima     ?? 0;
    }
  }

  // Volcamos las opciones de PI
  if (in_objResult.pi && in_objInputs.pi) {
    for (const intN of [1, 2, 3] as const) {
      const strKey = `opt${intN}` as 'opt1' | 'opt2' | 'opt3';
      const objOpt = in_objResult.pi[strKey];
      dicPayload[`cot_pi_opt${intN}_limite`]    = objOpt.limite    ?? 0;
      dicPayload[`cot_pi_opt${intN}_deducible`] = objOpt.deducible ?? 0;
      dicPayload[`cot_pi_opt${intN}_prima`]     = objOpt.prima     ?? 0;
    }
  }

  return dicPayload;
}
