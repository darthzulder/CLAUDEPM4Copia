<!--
Este proyecto integra por PR, no con `git merge` local. El motivo es concreto: en un PR,
GitHub corre la suite sobre la MERGE COMMIT (la base + esta rama, ya integradas). Un merge local
solo prueba la rama aislada, y los conflictos semánticos —la base renombra un campo `qd_*`, la
rama agrega un uso del nombre viejo, ambos verdes por separado— únicamente aparecen así.

Base correcta según el tipo de cambio:
  · trabajo normal (feat/… fix/… chore/…)  →  dev    (se despliega en el Render de desarrollo)
  · release / versión estable              →  main   (se despliega en el Render de producción)
-->

## Qué cambia y por qué

<!-- El "por qué" es la parte que no se puede reconstruir leyendo el diff. -->

## Cómo se verificó

<!-- No basta con "los tests pasan": el criterio del proyecto es que el test se ponga ROJO
     cuando el código se rompe. Si agregaste o cambiaste lógica, decí qué mutaste y qué test
     lo detectó (ver docs/guides/testing-conventions.md). -->

- [ ] `npm run verify` verde en local
- [ ] Tests nuevos/actualizados para la lógica que toqué, y verifiqué que fallan si rompo el código
- [ ] La rama contiene la base de este PR (lo que verifiqué es el resultado integrado)

## Reglas obligatorias que aplican

<!-- Marcá solo las que este cambio toca. Referencia: pm4-app/CLAUDE.md → "Reglas obligatorias". -->

- [ ] **Nomenclatura** `qd_*` respetada (`docs/guides/nomenclatura-variables.md`)
- [ ] **UI desde el DS**: revisé `frontend/vendor` / `outputs/react/` antes de crear nada nuevo
- [ ] **BFF**: ninguna llamada externa sale directo de una pantalla
- [ ] **PM4 por nombre**: sin ids/uuids hardcodeados; resueltos vía el registro
- [ ] **Comentarios técnicos** donde el porqué no es evidente en el código

## Riesgo y reversión

<!-- Qué se rompe si esto sale mal, y cómo se vuelve atrás. Poné "ninguno" si de verdad no hay. -->
