/**
 * Extractor de **una sola pasada** del contrato de campos que declara la app React, para congelarlo
 * como dato antes de que la Fase 7 borre `frontend/`.
 *
 * ── Por qué existe, y por qué es un script de autoría y no infraestructura ────────────────────────
 * De los tres defectos que el port de la SCR-008 dejó pasar con la suite verde, uno **no es
 * detectable desde Angular**: los 3 textarea sin `[maxLength]`. `formControlName` es universal (se
 * decide sin saber nada de la pantalla, y por eso lo cubren las guardas de `campo-base.ts` y
 * `contrato-pantalla.ts`), pero `maxLength` es **condicional**: vale 5000 en un campo, 2000 en otro y
 * nada en un tercero, y el único origen de esa verdad es el `.tsx` de React.
 *
 * Ese origen **desaparece**: la Fase 7 borra `frontend/` entero. Así que esto corre **una vez**, su
 * salida se commitea como dato de migración, y el script queda como registro reproducible de cómo se
 * obtuvo. No es una dependencia de nada: no lo importa ningún componente, no lo llama ningún build,
 * y no hace ninguna llamada de red — la arquitectura BFF es prioridad y este script vive del lado de
 * autoría, leyendo archivos del disco.
 *
 * ── Por qué usa el AST de TypeScript y no una regex ──────────────────────────────────────────────
 * Las tres formas reales del código de React lo hacen inevitable:
 *
 * 1. **El `name` nunca es un literal**: es `name={QD.strClientResponse}`, una referencia al mapa de
 *    `fields/fields.ts`. Una regex de `name="..."` no encuentra **nada**.
 * 2. **Los props van en cualquier orden y con saltos de línea arbitrarios** — `maxLength` puede estar
 *    en la misma línea que el `name` o cuatro líneas abajo.
 * 3. **`rules` tiene llaves anidadas**: `rules={{ required: '…', maxLength: { value: 2000, message:
 *    '…' } }}`. Una regex no recursiva no puede casar eso, y es justo la estructura que hay que leer.
 *
 * ── El hallazgo que define la forma de la salida: los dos `maxLength` son DOS contratos ───────────
 * Un `grep -c maxLength` sobre la SCR-004 da **4** y la pantalla tiene **2** campos. No es un error de
 * conteo: cada campo lo declara dos veces, y cada una hace algo distinto.
 *
 *   maxLength={2000}                                          ← contador visual del DS ("9/2000")
 *   rules={{ maxLength: { value: 2000, message: 'Máximo…' } }} ← el que de verdad invalida
 *
 * Hacen falta los dos, y el template Angular ya portado de la SCR-008 lo dice en un comentario. Por
 * eso la salida los guarda **separados** (`props.maxLength` y `validadores.maxLength`) en vez de
 * colapsarlos a un número: si un port copiara solo uno, el campo quedaría con contador y sin límite
 * real (o al revés), y un dataset que los mezcla no podría delatarlo.
 *
 * ── Uso ─────────────────────────────────────────────────────────────────────────────────────────
 *   node scripts/extraer-paridad-react.mjs            # escribe el JSON
 *   node scripts/extraer-paridad-react.mjs --check     # no escribe: compara y sale 1 si difiere
 *
 * El `--check` es lo que permite re-correrlo mientras `frontend/` siga vivo y confirmar que el dato
 * congelado sigue coincidiendo con la fuente.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const DIR_ESTE = dirname(fileURLToPath(import.meta.url));
const DIR_NG = resolve(DIR_ESTE, '..');
const DIR_REACT = resolve(DIR_NG, '..', 'frontend', 'src');
const RUTA_SALIDA = join(DIR_NG, 'src', 'components', 'fields', 'paridad-react.json');

/**
 * Los wrappers de la fachada React que son **campos de formulario**. Se listan explícitamente en vez
 * de aceptar todo `Zds*`/`Zr*` porque los re-exports directos (`ZrButton`, `ZrCard`, …) no tienen
 * `name` ni control y solo ensuciarían la salida.
 */
const CLL_WRAPPERS = [
  'ZdsInput',
  'ZdsSelect',
  'ZdsTextarea',
  'ZdsDate',
  'ZdsRadio',
  'ZdsCheckboxField',
  'ZdsFileInput',
  'ZdsSegmented',
];

/** Props del DS que son **condicionales** y por lo tanto no se pueden deducir desde Angular. */
const CLL_PROPS = ['maxLength', 'min', 'max', 'inputType', 'rows', 'elastic'];

/**
 * Los mapas de nombres de campo, por identificador.
 *
 * ⚠ **Son DOS, no uno.** `QD` (quejas directas, `fields/fields.ts`) y **`OS`** (otras solicitudes,
 * la bandeja de la OS_SCR-003). Buscar solo `QD` dejaba los 10 campos de esa pantalla fuera del
 * dataset, y el informe los mostraba como "usos dinámicos" — o sea que la omisión venía disfrazada de
 * comportamiento esperado. Se descubrió solo cuando el mensaje de diagnóstico pasó a imprimir el
 * texto de la expresión (`OS.strBpmCaseId`) en vez de la etiqueta genérica `expresion-dinamica`.
 */
const CLL_MAPAS = [
  {
    strIdent: 'QD',
    cllRuta: ['screens', 'atencion-cliente', 'quejas-directas', 'fields', 'fields.ts'],
  },
  {
    strIdent: 'OS',
    cllRuta: ['screens', 'atencion-cliente', 'otras-solicitudes', 'fields', 'fields.ts'],
  },
];

/**
 * Un mapa de nombres de campo leído de su `fields.ts`: `strClientResponse` → `'qd_strClientResponse'`.
 *
 * Se lee por AST y no con un `import()` a propósito: `fields.ts` es TypeScript y arrastra tipos y
 * otros módulos, así que importarlo desde un `.mjs` obligaría a compilar. Acá solo hace falta un
 * objeto literal de strings planos, que el AST entrega directo.
 */
function dicMapaDeCampos(in_strRuta, in_strIdent) {
  const objFuente = ts.createSourceFile(
    in_strRuta,
    readFileSync(in_strRuta, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  const dicMapa = {};
  let blnEncontrado = false;

  const fnVisitar = (in_objNodo) => {
    // Se busca `export const <Ident> = { ... } as const` — la declaración, no cualquier objeto literal
    // suelto del archivo (que tiene varios).
    if (
      ts.isVariableDeclaration(in_objNodo) &&
      ts.isIdentifier(in_objNodo.name) &&
      in_objNodo.name.text === in_strIdent
    ) {
      // `as const` envuelve el literal en un TypeAssertion, así que hay que desenvolverlo.
      let objInit = in_objNodo.initializer;
      while (objInit && (ts.isAsExpression(objInit) || ts.isParenthesizedExpression(objInit))) {
        objInit = objInit.expression;
      }

      if (objInit && ts.isObjectLiteralExpression(objInit)) {
        blnEncontrado = true;
        for (const objProp of objInit.properties) {
          if (
            ts.isPropertyAssignment(objProp) &&
            ts.isIdentifier(objProp.name) &&
            ts.isStringLiteral(objProp.initializer)
          ) {
            dicMapa[objProp.name.text] = objProp.initializer.text;
          }
        }
      }
    }

    ts.forEachChild(in_objNodo, fnVisitar);
  };

  fnVisitar(objFuente);

  // Sin esto, un rename del mapa lo dejaría vacío y **todos** sus campos saldrían sin resolver, que se
  // leería como "React no declaraba nada" en vez de como el error que es.
  if (!blnEncontrado) {
    throw new Error(`no se encontró la declaración de ${in_strIdent} en ${in_strRuta}`);
  }

  return dicMapa;
}

/** El valor de un prop JSX, ya desenvuelto del `{...}` cuando es una expresión. */
function valorDeProp(in_objProp) {
  if (!in_objProp.initializer) {
    // `required` / `readOnly` sin `=` son booleanos implícitos en JSX.
    return true;
  }

  if (ts.isStringLiteral(in_objProp.initializer)) {
    return in_objProp.initializer.text;
  }

  if (ts.isJsxExpression(in_objProp.initializer)) {
    const objExpr = in_objProp.initializer.expression;
    if (!objExpr) return null;
    if (ts.isNumericLiteral(objExpr)) return Number(objExpr.text);
    if (ts.isStringLiteral(objExpr)) return objExpr.text;
    if (objExpr.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (objExpr.kind === ts.SyntaxKind.FalseKeyword) return false;
    // Cualquier otra cosa (una llamada, un ternario, una referencia) queda fuera: es lógica de la
    // pantalla, no un valor congelable. Devolver el texto crudo daría un dato que nadie puede usar.
    return null;
  }

  return null;
}

/**
 * El `name` de un campo, resuelto contra el mapa `QD`.
 *
 * Devuelve `{strNombre, strOrigen}` para poder distinguir un campo que no se pudo resolver de uno que
 * no tenía `name`: el primero es un defecto del extractor y el segundo es un uso legítimo (el
 * `DsCatalog` monta wrappers sin `name`).
 */
function nombreDelCampo(in_objProp, in_dicMapas, in_dicLocales) {
  if (!in_objProp.initializer) return { strNombre: null, strOrigen: 'sin-valor' };

  if (ts.isStringLiteral(in_objProp.initializer)) {
    return { strNombre: in_objProp.initializer.text, strOrigen: 'literal' };
  }

  if (!ts.isJsxExpression(in_objProp.initializer) || !in_objProp.initializer.expression) {
    return { strNombre: null, strOrigen: 'sin-valor' };
  }

  return resolverExpresion(in_objProp.initializer.expression, in_dicMapas, in_dicLocales);
}

/**
 * Resuelve una expresión de `name={...}` a un nombre de campo congelable, o a `null` con el motivo.
 *
 * Está aparte de `nombreDelCampo` porque se llama **recursivamente**: un `name={strPersonTypeDesc}`
 * resuelve a la expresión de su `const`, que a su vez es un template sobre `QD.*`.
 */
function resolverExpresion(in_objExpr, in_dicMapas, in_dicLocales, in_numProf = 0) {
  // Tope de recursión: un alias que se referencia a sí mismo colgaría el script. No debería pasar en
  // código que compila, pero un extractor que se cuelga es peor que uno que reporta "no resuelto".
  if (in_numProf > 5) return { strNombre: null, strOrigen: 'alias-demasiado-profundo' };

  // `name={QD.strClientResponse}` / `name={OS.strDueDate}` — el caso normal.
  if (
    ts.isPropertyAccessExpression(in_objExpr) &&
    ts.isIdentifier(in_objExpr.expression) &&
    in_dicMapas[in_objExpr.expression.text]
  ) {
    const strIdent = in_objExpr.expression.text;
    const strClave = in_objExpr.name.text;
    const strResuelto = in_dicMapas[strIdent][strClave];

    // Una clave que no está en el mapa es un desajuste entre el `.tsx` y `fields.ts`, no un campo sin
    // nombre. Se marca para que salga en el informe en vez de desaparecer.
    return strResuelto
      ? { strNombre: strResuelto, strOrigen: strIdent }
      : { strNombre: null, strOrigen: `${strIdent}.${strClave}-no-resuelto` };
  }

  // `` `${QD.strPersonType}_desc` `` — los campos compañeros de la convención `_desc`.
  //
  // ⚠ **Esto NO es un uso dinámico.** Un template con `${QD.algo}` y texto fijo alrededor es tan
  // estático como `QD.algo`: resuelve a `qd_strPersonType_desc` sin ejecutar nada.
  if (ts.isTemplateExpression(in_objExpr)) {
    let strArmado = in_objExpr.head.text;

    for (const objSpan of in_objExpr.templateSpans) {
      const { strNombre } = resolverExpresion(
        objSpan.expression,
        in_dicMapas,
        in_dicLocales,
        in_numProf + 1,
      );

      // Un `${}` que no resuelve (una variable de loop, una llamada) hace que el nombre completo deje
      // de ser congelable. Se corta acá en vez de emitir un nombre a medias.
      if (!strNombre) return { strNombre: null, strOrigen: 'template-dinamico' };

      strArmado += strNombre + objSpan.literal.text;
    }

    return { strNombre: strArmado, strOrigen: 'template' };
  }

  // `name={strPersonTypeDesc}`, donde arriba hay
  // `const strPersonTypeDesc = `${QD.strPersonType}_desc` as FieldPath<…>`.
  //
  // ⚠ **Este es el caso que más costó, y el que más se parecía a "esperado".** El `_desc` no llega al
  // JSX como template sino como **identificador**: el template vive en un `const` un scope más arriba.
  // Soportar solo el template inline no alcanzaba, y el informe seguía contando estos 8 campos como
  // usos dinámicos. Se resuelve mirando los `const` del archivo (`in_dicLocales`) y recurriendo.
  if (ts.isIdentifier(in_objExpr)) {
    const objAlias = in_dicLocales[in_objExpr.text];

    if (objAlias) {
      const objResuelto = resolverExpresion(objAlias, in_dicMapas, in_dicLocales, in_numProf + 1);
      if (objResuelto.strNombre) {
        return { strNombre: objResuelto.strNombre, strOrigen: `alias:${in_objExpr.text}` };
      }
    }

    // Lo que queda es genuinamente dinámico: `name={strName}` dentro de un `.map()` sobre un array de
    // definiciones de campo (la SCR-003 y la bandeja de la OS_SCR-003 lo hacen). No hay valor que
    // congelar porque el campo no existe hasta que corre el loop.
    return { strNombre: null, strOrigen: `dinamico:${in_objExpr.text}` };
  }

  if (ts.isStringLiteral(in_objExpr)) return { strNombre: in_objExpr.text, strOrigen: 'literal' };

  // `as FieldPath<…>` y los paréntesis se desenvuelven: son ruido de tipos, no cambian el valor.
  if (ts.isAsExpression(in_objExpr) || ts.isParenthesizedExpression(in_objExpr)) {
    return resolverExpresion(in_objExpr.expression, in_dicMapas, in_dicLocales, in_numProf + 1);
  }

  return { strNombre: null, strOrigen: `expresion:${in_objExpr.getText().slice(0, 40)}` };
}

/**
 * Los `const <ident> = <expr>` del archivo, para resolver los alias del caso `_desc`.
 *
 * Se recogen **todos** sin distinguir scope: dos `const` con el mismo nombre en dos funciones del
 * mismo archivo se pisarían. Es aceptable acá porque el valor que interesa es el nombre de un campo
 * PM4 —si dos scopes lo declaran, declaran el mismo—, y la alternativa (un type checker con scopes
 * reales) es desproporcionada para un script de una sola pasada.
 */
function dicAliasLocales(in_objFuente) {
  const dicLocales = {};

  const fnVisitar = (in_objNodo) => {
    if (
      ts.isVariableDeclaration(in_objNodo) &&
      ts.isIdentifier(in_objNodo.name) &&
      in_objNodo.initializer
    ) {
      dicLocales[in_objNodo.name.text] = in_objNodo.initializer;
    }

    ts.forEachChild(in_objNodo, fnVisitar);
  };

  fnVisitar(in_objFuente);

  return dicLocales;
}

/**
 * Los validadores de `rules={{ ... }}`.
 *
 * Se guardan **aparte** de los props del DS por el hallazgo del encabezado: `maxLength` vive en los
 * dos lados y son contratos distintos (contador visual vs. validación real).
 */
function dicValidadores(in_objProp) {
  if (!in_objProp.initializer || !ts.isJsxExpression(in_objProp.initializer)) return null;

  const objExpr = in_objProp.initializer.expression;
  if (!objExpr || !ts.isObjectLiteralExpression(objExpr)) return null;

  const dicReglas = {};

  for (const objRegla of objExpr.properties) {
    if (!ts.isPropertyAssignment(objRegla)) continue;

    const strClave = ts.isIdentifier(objRegla.name)
      ? objRegla.name.text
      : ts.isStringLiteral(objRegla.name)
        ? objRegla.name.text
        : null;
    if (!strClave) continue;

    const objValor = objRegla.initializer;

    // Forma corta: `required: 'Campo requerido'`.
    if (ts.isStringLiteral(objValor)) {
      dicReglas[strClave] = { mensaje: objValor.text };
      continue;
    }

    if (ts.isNumericLiteral(objValor)) {
      dicReglas[strClave] = { valor: Number(objValor.text) };
      continue;
    }

    // Forma larga: `maxLength: { value: 2000, message: 'Máximo 2000 caracteres' }`.
    if (ts.isObjectLiteralExpression(objValor)) {
      const dicDetalle = {};
      for (const objCampo of objValor.properties) {
        if (!ts.isPropertyAssignment(objCampo) || !ts.isIdentifier(objCampo.name)) continue;
        if (ts.isNumericLiteral(objCampo.initializer)) {
          dicDetalle[objCampo.name.text === 'value' ? 'valor' : objCampo.name.text] = Number(
            objCampo.initializer.text,
          );
        } else if (ts.isStringLiteral(objCampo.initializer)) {
          dicDetalle[objCampo.name.text === 'message' ? 'mensaje' : objCampo.name.text] =
            objCampo.initializer.text;
        }
      }
      if (Object.keys(dicDetalle).length) dicReglas[strClave] = dicDetalle;
      continue;
    }

    // Un validador que es una función (`validate: (v) => ...`) no se congela: es lógica, y copiarla
    // como texto daría un dato que ningún spec puede consumir. Se marca su presencia y nada más.
    dicReglas[strClave] = { esFuncion: true };
  }

  return Object.keys(dicReglas).length ? dicReglas : null;
}

/** Los campos de la fachada declarados en un `.tsx`. */
function cllCamposDelArchivo(in_strRuta, in_dicMapas) {
  const objFuente = ts.createSourceFile(
    in_strRuta,
    readFileSync(in_strRuta, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  // Se arma **antes** de recorrer el JSX: un `const strPersonTypeDesc = …` puede estar declarado
  // después del `<ZdsInput name={strPersonTypeDesc} />` en el orden del archivo (en otra función), así
  // que resolver los alias sobre la marcha perdería los que vienen más abajo.
  const dicLocales = dicAliasLocales(objFuente);

  const cllCampos = [];

  const fnVisitar = (in_objNodo) => {
    const blnEsElemento = ts.isJsxSelfClosingElement(in_objNodo) || ts.isJsxOpeningElement(in_objNodo);

    if (blnEsElemento && ts.isIdentifier(in_objNodo.tagName)) {
      const strWrapper = in_objNodo.tagName.text;

      if (CLL_WRAPPERS.includes(strWrapper)) {
        const objCampo = { wrapper: strWrapper, props: {} };

        for (const objProp of in_objNodo.attributes.properties) {
          if (!ts.isJsxAttribute(objProp) || !ts.isIdentifier(objProp.name)) continue;
          const strProp = objProp.name.text;

          if (strProp === 'name') {
            const { strNombre, strOrigen } = nombreDelCampo(objProp, in_dicMapas, dicLocales);
            objCampo.name = strNombre;
            if (!strNombre) objCampo.nameOrigen = strOrigen;
            continue;
          }

          if (strProp === 'rules') {
            const dicReglas = dicValidadores(objProp);
            if (dicReglas) objCampo.validadores = dicReglas;
            continue;
          }

          if (CLL_PROPS.includes(strProp)) {
            const objValor = valorDeProp(objProp);
            if (objValor !== null) objCampo.props[strProp] = objValor;
          }
        }

        if (!Object.keys(objCampo.props).length) delete objCampo.props;
        cllCampos.push(objCampo);
      }
    }

    ts.forEachChild(in_objNodo, fnVisitar);
  };

  fnVisitar(objFuente);

  return cllCampos;
}

/** Los `.tsx` de `screens/`, sin el catálogo del DS (que monta wrappers de muestra, no campos). */
function cllArchivosDePantalla(in_strDir) {
  const cllRutas = [];

  const fnRecorrer = (in_strActual) => {
    for (const strEntrada of readdirSync(in_strActual)) {
      const strRuta = join(in_strActual, strEntrada);
      if (statSync(strRuta).isDirectory()) {
        if (strEntrada === 'ds-catalog') continue;
        fnRecorrer(strRuta);
      } else if (strEntrada.endsWith('.tsx')) {
        cllRutas.push(strRuta);
      }
    }
  };

  fnRecorrer(in_strDir);

  return cllRutas.sort();
}

/**
 * El slug de pantalla al que pertenece un archivo: la carpeta `COL_*` que lo contiene.
 *
 * Importa porque una pantalla se reparte en varios `.tsx` (`CrearRecibirQueja.tsx` +
 * `SeccionConsumidor.tsx` + `SeccionDetalleQueja.tsx`), y el dato útil es **por pantalla**, no por
 * archivo: quien porta la SCR-000 necesita todos sus campos juntos.
 */
function strSlugDePantalla(in_strRuta) {
  const cllPartes = relative(DIR_REACT, in_strRuta).split(/[\\/]/);
  const strSlug = cllPartes.find((in_strParte) => /^(COL_|smartsupervision)/.test(in_strParte));

  return strSlug ?? cllPartes.slice(0, -1).join('/');
}

function objExtraer() {
  // Los mapas quedan **por identificador** y no fusionados en uno solo: `QD` y `OS` podrían declarar la
  // misma clave (`strBpmCaseId`) apuntando a nombres PM4 distintos, y aplanarlos haría que el orden de
  // lectura decidiera el valor. Con el identificador como parte de la clave, `QD.x` y `OS.x` no se
  // pueden confundir.
  const dicMapas = {};
  let numNombres = 0;

  for (const { strIdent, cllRuta } of CLL_MAPAS) {
    dicMapas[strIdent] = dicMapaDeCampos(join(DIR_REACT, ...cllRuta), strIdent);
    numNombres += Object.keys(dicMapas[strIdent]).length;
  }

  const dicPantallas = {};
  const cllSinResolver = [];
  let numCampos = 0;

  for (const strRuta of cllArchivosDePantalla(join(DIR_REACT, 'screens'))) {
    const cllCampos = cllCamposDelArchivo(strRuta, dicMapas);
    if (!cllCampos.length) continue;

    const strSlug = strSlugDePantalla(strRuta);
    dicPantallas[strSlug] ??= {};

    for (const objCampo of cllCampos) {
      numCampos += 1;

      if (!objCampo.name) {
        cllSinResolver.push({
          archivo: relative(DIR_REACT, strRuta).replace(/\\/g, '/'),
          wrapper: objCampo.wrapper,
          origen: objCampo.nameOrigen,
        });
        continue;
      }

      const { name, wrapper, props, validadores } = objCampo;
      const objEntrada = { wrapper };
      if (props) objEntrada.props = props;
      if (validadores) objEntrada.validadores = validadores;

      // Un `name` repetido en la misma pantalla es legítimo (dos secciones condicionales que declaran
      // el mismo campo). Se queda el primero y se anota, en vez de pisar en silencio.
      if (dicPantallas[strSlug][name]) {
        dicPantallas[strSlug][name].repetido =
          (dicPantallas[strSlug][name].repetido ?? 1) + 1;
        continue;
      }

      dicPantallas[strSlug][name] = objEntrada;
    }
  }

  return { dicPantallas, cllSinResolver, numCampos, numNombres };
}

// ── Ejecución ────────────────────────────────────────────────────────────────────────────────────
const blnCheck = process.argv.includes('--check');

if (!existsSync(DIR_REACT)) {
  // El modo esperado después de la Fase 7: `frontend/` ya no está y el dataset congelado es la única
  // fuente. No es un error — es exactamente el escenario para el que se congeló.
  console.log(
    `frontend/src no existe (${relative(DIR_NG, DIR_REACT)}): el dataset congelado es la única fuente.\n` +
      'Nada que extraer. Si esto corre después de la Fase 7, es lo correcto.',
  );
  process.exit(0);
}

const { dicPantallas, cllSinResolver, numCampos, numNombres } = objExtraer();

const objSalida = {
  _comentario:
    'Contrato de campos que declaraba la app React, congelado como dato de migración. Generado una ' +
    'sola vez por scripts/extraer-paridad-react.mjs; frontend/ desaparece en la Fase 7. ' +
    'props.maxLength es el contador visual del DS; validadores.maxLength es el que invalida — son ' +
    'dos contratos distintos y hacen falta los dos.',
  _generadoPor: 'scripts/extraer-paridad-react.mjs',
  pantallas: dicPantallas,
};

const strJson = `${JSON.stringify(objSalida, null, 2)}\n`;

const numPantallas = Object.keys(dicPantallas).length;
const numConProps = Object.values(dicPantallas)
  .flatMap((in_dic) => Object.values(in_dic))
  .filter((in_obj) => in_obj.props || in_obj.validadores).length;

console.log(
  `${numPantallas} pantallas · ${numCampos} campos leídos · ${numConProps} con props/validadores · ` +
    `${numNombres} nombres en los mapas (${CLL_MAPAS.map((in_obj) => in_obj.strIdent).join(', ')})`,
);

if (cllSinResolver.length) {
  console.log(`\n${cllSinResolver.length} campo(s) sin name resoluble (esperado en usos dinámicos):`);
  for (const objSin of cllSinResolver) {
    console.log(`  ${objSin.archivo} · ${objSin.wrapper} · ${objSin.origen}`);
  }
}

if (blnCheck) {
  if (!existsSync(RUTA_SALIDA)) {
    console.error(`\n✗ no existe ${relative(DIR_NG, RUTA_SALIDA)}; corré el script sin --check`);
    process.exit(1);
  }

  const strActual = readFileSync(RUTA_SALIDA, 'utf8');
  if (strActual === strJson) {
    console.log('\n✓ el dataset congelado coincide con el .tsx de React');
    process.exit(0);
  }

  console.error('\n✗ el dataset congelado NO coincide con el .tsx de React');

  // ⚠ **Hay que nombrar la divergencia, y este bloque se agregó porque la primera versión no lo
  // hacía.** El `--check` comparaba los dos archivos como cadenas y el mensaje de arriba era todo lo
  // que imprimía: contra un dataset de 128 campos, "algo difiere" no alcanza para arreglar nada, y el
  // criterio del proyecto es justamente poder **nombrar** lo que se rompió. Medido en su propia
  // mutación: cambiar un `props.maxLength` de 5000 a 999 y **olvidar el `\n` final al reescribir el
  // JSON** producían el mismo mensaje, y el segundo se leyó como si fuera el primero.
  //
  // Se compara campo por campo y no con un diff de texto porque lo que importa es el **dato**
  // (`qd_strClientResponse.props.maxLength`), no la línea del archivo: reordenar claves no es una
  // divergencia del contrato de React y no debería reportarse como si lo fuera.
  const dicCongelado = JSON.parse(strActual).pantallas ?? {};
  const cllDiferencias = [];

  const cllSlugs = [...new Set([...Object.keys(dicCongelado), ...Object.keys(dicPantallas)])].sort();
  for (const strSlug of cllSlugs) {
    const dicViejo = dicCongelado[strSlug];
    const dicNuevo = dicPantallas[strSlug];

    if (!dicViejo) {
      cllDiferencias.push(`+ ${strSlug}: pantalla nueva en React, ausente del dataset`);
      continue;
    }
    if (!dicNuevo) {
      cllDiferencias.push(`- ${strSlug}: está en el dataset pero React ya no la declara`);
      continue;
    }

    const cllCampos = [...new Set([...Object.keys(dicViejo), ...Object.keys(dicNuevo)])].sort();
    for (const strCampo of cllCampos) {
      const strA = JSON.stringify(dicViejo[strCampo]);
      const strB = JSON.stringify(dicNuevo[strCampo]);
      if (strA === strB) continue;

      if (strA === undefined) cllDiferencias.push(`+ ${strSlug} · ${strCampo}: campo nuevo en React`);
      else if (strB === undefined) cllDiferencias.push(`- ${strSlug} · ${strCampo}: ya no está en React`);
      else cllDiferencias.push(`~ ${strSlug} · ${strCampo}:\n      dataset: ${strA}\n      React:   ${strB}`);
    }
  }

  if (cllDiferencias.length) {
    console.error(`\n${cllDiferencias.length} divergencia(s):`);
    for (const strDif of cllDiferencias) console.error(`  ${strDif}`);
  } else {
    // Los datos son iguales campo por campo pero los bytes no: formato, no contrato. Vale distinguirlo
    // — es lo que pasa al reescribir el JSON a mano sin el `\n` final, y buscarlo como si fuera una
    // divergencia de `maxLength` es tiempo perdido.
    console.error(
      '\nLos datos coinciden campo por campo: la diferencia es de formato (orden de claves, ' +
        'indentación o el salto de línea final). Corré el script sin --check para regenerarlo.',
    );
  }

  process.exit(1);
}

writeFileSync(RUTA_SALIDA, strJson);
console.log(`\n→ ${relative(DIR_NG, RUTA_SALIDA)}`);
