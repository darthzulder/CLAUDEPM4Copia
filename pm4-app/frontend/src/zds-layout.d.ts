import 'react';

// Atributos de layout del Zurich DS (z-flex / z-align / z-grid / column),
// implementados por `@zurich/css-components/base.css`. Se declaran aquí para que
// el TSX los acepte sobre elementos HTML nativos sin error de tipos.
//   z-flex="<dir>:<wrap>:<gap>"   (gap ∈ 50|75|100|150|200|300)
//   z-align="<justify>:<align>:<content>"
//   z-grid="main"  +  column="A:B" | column="m:A:B"
declare module 'react' {
  interface HTMLAttributes<T> {
    'z-flex'?: string | boolean;
    'z-align'?: string;
    'z-grid'?: string;
    column?: string;
  }
}
