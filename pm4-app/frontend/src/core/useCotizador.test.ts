import { describe, expect, it } from 'vitest';
import { quoterResultToPayload, type QuoterInputs, type QuoterResult } from './useCotizador';

describe('quoterResultToPayload', () => {
  it('vuelca D&O al payload PM4 con las claves cot_dyo_*', () => {
    const inputs: QuoterInputs = {
      dyo: { facturacion: 7_000_000_000, limite1: 500_000_000, limite2: 0, limite3: 0, anexo: true, sector: 'OTROS' },
    };
    const result: QuoterResult = {
      dyo: {
        opt1: { prima_a: 1_542_800.94, deducible: 0, ent_limite: 100_000_000, ent_deducible: 10_000_000 },
        opt2: { prima_a: null, deducible: 0, ent_limite: null, ent_deducible: null },
        opt3: { prima_a: null, deducible: 0, ent_limite: null, ent_deducible: null },
      },
    };

    const payload = quoterResultToPayload(result, inputs);

    expect(payload.cot_dyo_opt1_prima_a).toBe(1_542_800.94);
    expect(payload.cot_dyo_ent1_limite).toBe(100_000_000);
    expect(payload.cot_dyo_ent1_deducible).toBe(10_000_000);
    // Opciones sin prima (null) se normalizan a 0 — nunca se manda null a PM4.
    expect(payload.cot_dyo_opt2_prima_a).toBe(0);
    expect(payload.cot_dyo_ent2_limite).toBe(0);
  });

  it('vuelca CC arrastrando los límites de evento/agregado desde los inputs (no del result)', () => {
    const inputs: QuoterInputs = {
      cc: {
        facturacion: 15_000_000_000,
        limite1_evento: 500_000_000, limite1_agregado: 500_000_000,
        limite2_evento: 0, limite2_agregado: 0,
        limite3_evento: 0, limite3_agregado: 0,
        empleados: '1-100',
      },
    };
    const result: QuoterResult = {
      cc: {
        opt1: { deducible: 30_000_000, prima: 5_011_056 },
        opt2: { deducible: null, prima: null },
        opt3: { deducible: null, prima: null },
      },
    };

    const payload = quoterResultToPayload(result, inputs);

    expect(payload.cot_cc_opt1_lim_evt).toBe(500_000_000);
    expect(payload.cot_cc_opt1_lim_agr).toBe(500_000_000);
    expect(payload.cot_cc_opt1_prima).toBe(5_011_056);
    expect(payload.cot_cc_opt2_prima).toBe(0);
  });

  it('no toca las claves de un producto que no viene ni en result ni en inputs', () => {
    const inputs: QuoterInputs = { pdysi: { facturacion: 1, limite1: 1, limite2: 1, limite3: 1 } };
    const result: QuoterResult = { pdysi: { opt1: { deducible: 1, prima: 1 }, opt2: { deducible: 1, prima: 1 }, opt3: { deducible: 1, prima: 1 } } };

    const payload = quoterResultToPayload(result, inputs);

    expect(payload).not.toHaveProperty('cot_dyo_opt1_prima_a');
    expect(payload).not.toHaveProperty('cot_cc_opt1_prima');
    expect(payload).not.toHaveProperty('cot_pi_opt1_prima');
  });
});
