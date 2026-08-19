import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

/**
 * Portado de `frontend/src/core/scrollToFirstError.ts`. **Es el único archivo de la lógica pura que
 * se reescribe en vez de copiarse**, y conviene saber exactamente qué cambió y qué no.
 *
 * ── Lo que NO cambió: toda la parte que importa ────────────────────────────────────────────────
 * El contrato con el DOM es idéntico, y es el que la fachada tiene que seguir cumpliendo:
 * busca `#field-<ruta>`, ordena los candidatos por `getBoundingClientRect().top` (orden **visual**,
 * no el orden de claves), scrollea con `{behavior:'smooth', block:'center'}` y enfoca. El
 * `setTimeout(0)` también se conserva, con el mismo motivo: darle a Angular/Lit la vuelta que
 * necesitan para pintar el estado inválido antes de medir posiciones. Se prefiere sobre
 * `requestAnimationFrame` porque rAF puede quedar suspendido indefinidamente si el iframe no está
 * en primer plano — y esta app **vive dentro de un iframe de PM4**, así que ese caso no es teórico.
 *
 * ── Lo que sí cambió, y por qué no es una traducción línea a línea ─────────────────────────────
 * En react-hook-form la entrada era `FieldErrors`: un objeto anidado que replica la forma del form
 * y donde una hoja se reconoce por tener la propiedad `message`. De ahí el `flattenErrorPaths`
 * recursivo del original — había que **aplanar un objeto de errores** para recuperar las rutas.
 *
 * En Angular no existe ese objeto: el `FormGroup` **ya es** el árbol, y cada control sabe si es
 * inválido. Así que la recursión sigue existiendo pero cambia de sujeto — camina *controles*, no
 * *errores* — y eso la vuelve más precisa en dos puntos:
 *
 *   1. **No hay ambigüedad de hoja.** El original tomaba como hoja cualquier objeto con `message`,
 *      y además seguía recursando *dentro* de esa hoja (un `type`/`ref` de RHF podía colarse). Acá
 *      la hoja es `FormControl`, un tipo, no una heurística.
 *   2. **Solo se reportan los inválidos.** Se poda por `control.valid`: si un subgrupo es válido, ni
 *      se entra. Con RHF eso salía gratis porque `errors` solo contenía lo roto; acá hay que pedirlo
 *      explícitamente, y omitirlo devolvería la ruta de **todos** los campos del formulario.
 *
 * `FormArray` se maneja con índice numérico (`productos.0.campo`), igual que las rutas anidadas que
 * RHF producía para arrays — mismo formato de id, así que un `#field-productos.0.campo` que
 * funcionaba en React sigue funcionando.
 *
 * Un campo que no está en el DOM (dentro de una pestaña inactiva, o de una sección condicional que
 * no se está renderizando) se ignora en silencio: `getElementById` devuelve `null` y se filtra. Es
 * el comportamiento del original y hay pantallas que dependen de él.
 */

/**
 * Rutas con puntos de los controles **inválidos** del árbol, en notación `grupo.sub.campo` /
 * `array.0.campo`. Exportada para poder testearla sin DOM; no es API para las pantallas.
 */
export function rutasDeControlesInvalidos(in_objControl: AbstractControl, in_strPrefijo = ''): string[] {
  // Poda: si el subárbol es válido no hay nada abajo que reportar. Sin esto la función devolvería
  // la ruta de todos los campos del formulario, no solo de los que fallaron.
  if (in_objControl.valid) return [];

  if (in_objControl instanceof FormGroup) {
    const lstRutas: string[] = [];
    for (const strClave of Object.keys(in_objControl.controls)) {
      const objHijo = in_objControl.get(strClave);
      if (!objHijo) continue;
      const strRuta = in_strPrefijo ? `${in_strPrefijo}.${strClave}` : strClave;
      lstRutas.push(...rutasDeControlesInvalidos(objHijo, strRuta));
    }
    return lstRutas;
  }

  if (in_objControl instanceof FormArray) {
    const lstRutas: string[] = [];
    in_objControl.controls.forEach((in_objHijo, in_intIndice) => {
      const strRuta = in_strPrefijo ? `${in_strPrefijo}.${in_intIndice}` : String(in_intIndice);
      lstRutas.push(...rutasDeControlesInvalidos(in_objHijo, strRuta));
    });
    return lstRutas;
  }

  // FormControl inválido: es una hoja, y su ruta es la que la fachada usó para el id del campo.
  // El prefijo vacío solo pasa si alguien llama con un control suelto, que no tiene id asociado.
  return in_strPrefijo ? [in_strPrefijo] : [];
}

/**
 * Equivalente del `onInvalid` de `handleSubmit(onValid, onInvalid)` de RHF: se llama cuando el
 * submit encuentra el form inválido, y lleva al usuario al primer campo roto **en orden visual**.
 *
 * No marca nada como `touched` ni dispara validación: eso es responsabilidad de la pantalla antes de
 * llamar (`form.markAllAsTouched()`), porque el estado `touched` es lo que hace que la fachada pinte
 * el error — y esta función solo navega.
 */
export function scrollToFirstError(in_objForm: AbstractControl): void {
  const lstRutas = rutasDeControlesInvalidos(in_objForm);
  if (lstRutas.length === 0) return;

  // setTimeout(0): deja que Angular/Lit terminen de pintar el estado invalid/help-text post-submit
  // antes de medir. Ver el encabezado sobre por qué no es requestAnimationFrame.
  setTimeout(() => {
    const lstCandidatos = lstRutas
      .map((in_strRuta) => document.getElementById(`field-${in_strRuta}`))
      .filter((in_objEl): in_objEl is HTMLElement => !!in_objEl);
    if (lstCandidatos.length === 0) return;

    lstCandidatos.sort(
      (in_objA, in_objB) => in_objA.getBoundingClientRect().top - in_objB.getBoundingClientRect().top,
    );
    const objDestino = lstCandidatos[0];
    objDestino.scrollIntoView({ behavior: 'smooth', block: 'center' });
    objDestino.focus?.();
  });
}
