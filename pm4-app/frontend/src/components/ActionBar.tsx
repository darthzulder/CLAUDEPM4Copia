import type { ReactNode } from 'react';

/**
 * Barra de acciones al pie del formulario: botones alineados a la derecha, para
 * enviar / derivar la tarea. Unifica las antiguas .submit-bar / .actions-bar.
 *
 * Layout vía atributos del Zurich DS (z-flex/z-align); el borde superior, margen
 * y padding viven en .action-bar (sin equivalente en el DS).
 * El color/variante de cada botón se define por pantalla en los ZrButton hijos.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="action-bar" z-flex="75" z-align="right:center">
      {children}
    </div>
  );
}
