// Valores por defecto GLOBALES de Quejas Directas — solo los campos cuyo default
// es idéntico en TODAS las pantallas donde aparece (los placeholders "de back":
// se muestran vacíos hasta que la integración SFC/watcher los resuelve).
//
// Los defaults que VARÍAN por pantalla (p.ej. `qd_strAction`, cuyo valor inicial
// depende de la acción por defecto de cada flujo) NO viven aquí — permanecen en
// el `DEFAULTS` propio de cada `variables.ts`, construido con las claves de `QD`
// (nunca strings sueltos). Cada pantalla compone su `DEFAULTS` final con
// `{ ...QD_GLOBAL_DEFAULTS, [QD.strAction]: 'GUARDAR', ... }`.

import { QD } from './fields';
import type { QdFields } from './fields';

export const QD_GLOBAL_DEFAULTS: Partial<QdFields> = {
  [QD.strAddress]: '',            // FLD-319 — Back, default vacío (pendiente API SFC)
  [QD.strSex]: '',                // FLD-320 — Back, resuelto desde CAT-SEXO ("No informa")
  [QD.strLgbtiq]: '',             // FLD-321 — Back, oculto, resuelto desde CAT-LGBTIQ ("No informa")
  [QD.strSpecialCondition]: '',   // FLD-322 — Back, oculto, resuelto desde CAT-COND-ESP ("NINGUNA")
  [QD.strAdmission]: '',          // FLD-331 — Back, resuelto desde CAT-ADMISION si rol ≠ Defensor
  [QD.strControlEntity]: '',      // FLD-332 — Back, resuelto desde CAT-ENTE ("Otros")
  [QD.strTutela]: '',             // FLD-333 — Back, resuelto desde CAT-TUTELA ("No")
  [QD.strExpressComplaint]: '',   // FLD-334 — Back, resuelto desde CAT-EXPRES ("No")
};
