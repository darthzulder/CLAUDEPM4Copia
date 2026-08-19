import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Barra de acciones al pie del formulario: botones alineados a la derecha, para enviar / derivar la
 * tarea. Port de `components/ActionBar.tsx`. Unifica las antiguas `.submit-bar` / `.actions-bar`.
 *
 * ── El layout va por atributos del DS, no por CSS propio ────────────────────────────────────────
 * `z-flex="75"` + `z-align="right:center"` es la vía idiomática del Zurich DS (eje B de la jerarquía
 * de UI: nunca `display:flex` a mano en el markup). Lo único que aporta `.action-bar` de `shared.css`
 * es el borde superior, el margen y el padding, que no tienen equivalente en el DS.
 *
 * ── `ng-content` en lugar de `children`, y por qué no recibe una lista de botones ────────────────
 * El color y la variante de cada botón los decide **la pantalla**, no esta barra: una pantalla de
 * revisión tiene "Aprobar"/"Rechazar" y otra un solo "Enviar". Proyectar el contenido mantiene esa
 * decisión donde pertenece, igual que el `children` de React. Un `@Input() botones: Boton[]` obligaría
 * a esta barra a conocer todas las variantes posibles, que es exactamente el acoplamiento que el
 * componente evita.
 *
 * ── Atributos con guion en el template de Angular ───────────────────────────────────────────────
 * `z-flex` y `z-align` se escriben como atributos estáticos y llegan al DOM tal cual. No se bindean
 * (`[z-flex]`) porque son valores fijos: bindear un atributo desconocido obligaría a `attr.` y no
 * aportaría nada.
 */
@Component({
  selector: 'app-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action-bar" z-flex="75" z-align="right:center">
      <ng-content />
    </div>
  `,
})
export class ActionBarComponent {}
