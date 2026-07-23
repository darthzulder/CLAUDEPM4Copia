import type { FieldErrors, FieldValues } from 'react-hook-form';

// Recorre el objeto errors de RHF (puede tener rutas anidadas tipo array/objeto)
// y devuelve las rutas hoja en notación con puntos, p.ej. "productos.0.campo".
function flattenErrorPaths(in_objErrors: FieldErrors, in_strPrefix = ''): string[] {
  const lstPaths: string[] = [];
  for (const strKey of Object.keys(in_objErrors)) {
    const objValue = (in_objErrors as Record<string, unknown>)[strKey];
    const strPath = in_strPrefix ? `${in_strPrefix}.${strKey}` : strKey;
    if (objValue && typeof objValue === 'object') {
      if ('message' in objValue) lstPaths.push(strPath);
      lstPaths.push(...flattenErrorPaths(objValue as FieldErrors, strPath));
    }
  }
  return lstPaths;
}

// Handler para el segundo argumento de handleSubmit(onValid, onInvalid): al fallar
// la validación, scrollea y enfoca el primer campo inválido en orden visual (de
// arriba hacia abajo), no en el orden de claves de `errors`. Los campos que no
// existen en el DOM (p.ej. dentro de una pestaña inactiva) se ignoran.
export function scrollToFirstError<TFV extends FieldValues>(in_objErrors: FieldErrors<TFV>): void {
  const lstPaths = flattenErrorPaths(in_objErrors);
  if (lstPaths.length === 0) return;

  // setTimeout(0): deja que React/Lit terminen de pintar el estado invalid/help-text
  // post-submit antes de scrollear. Se prefiere sobre requestAnimationFrame porque
  // rAF puede quedar suspendido indefinidamente si la pestaña/iframe no está en
  // primer plano en el momento del submit.
  setTimeout(() => {
    const lstCandidates = lstPaths
      .map((strPath) => document.getElementById(`field-${strPath}`))
      .filter((el): el is HTMLElement => !!el);
    if (lstCandidates.length === 0) return;

    lstCandidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const elTarget = lstCandidates[0];
    elTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elTarget.focus?.();
  });
}
