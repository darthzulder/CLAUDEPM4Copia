// Clasificación de cada script frente a su última captura.
//
// Este módulo es deliberadamente simple, y esa simplicidad es una consecuencia del modelo: git es
// una GRABADORA, no un pipeline de despliegue. Nadie edita los .php capturados —son registro, no
// fuente— así que no existe un "estado local" que pueda divergir. La comparación tiene solo dos
// lados: lo que hay en PM4 ahora, y lo que el índice dice que se capturó la última vez.
//
// (Un diseño donde git gobernara a PM4 necesitaría tres lados y una tabla de cinco estados con
// conflictos y merges. No es este caso, y no hay que construirlo "por si acaso".)

/** Estados posibles de un script. El valor es la etiqueta que se imprime en consola. */
export const ESTADO = {
  SIN_CAMBIOS: 'SIN CAMBIOS',
  MODIFICADO: 'MODIFICADO',
  NUEVO: 'NUEVO',
  BORRADO_EN_PM4: 'BORRADO EN PM4',
};

/**
 * Clasifica un script de PM4 contra la entrada del índice que le corresponde.
 *
 * @param {{uuid: string, sha256: string}} objRemoto script tal como está hoy en PM4, ya normalizado
 * @param {{sha256: string} | undefined} objEntrada entrada del índice, o undefined si no está
 * @returns {string} uno de ESTADO
 */
export function clasificarScript(objRemoto, objEntrada) {
  if (!objEntrada) return ESTADO.NUEVO;
  return objRemoto.sha256 === objEntrada.sha256 ? ESTADO.SIN_CAMBIOS : ESTADO.MODIFICADO;
}

/**
 * Compara el estado completo de la instancia contra el índice de la última captura.
 *
 * Devuelve las tres listas que necesita `capture` para decidir qué escribir, más `sinCambios` para
 * poder reportar cobertura ("62 revisados, 2 capturados") sin que el llamador tenga que recalcular.
 *
 * Los scripts BORRADOS EN PM4 se reportan pero **nunca se borran del historial**: el registro de un
 * script que existió es justamente lo que hay que conservar. Solo desaparecen del índice si alguien
 * lo decide a mano.
 *
 * @param {Array<{uuid: string, id: number, title: string, sha256: string, codigo: string}>} lstRemotos
 * @param {Record<string, {sha256: string, file: string, title: string, lastKnownId: number}>} dicIndice
 * @returns {{nuevos: Array, modificados: Array, sinCambios: Array, borrados: Array, hayCambios: boolean}}
 */
export function compararInstancia(lstRemotos, dicIndice) {
  const lstNuevos = [];
  const lstModificados = [];
  const lstSinCambios = [];

  for (const objRemoto of lstRemotos) {
    const objEntrada = dicIndice[objRemoto.uuid];
    const strEstado = clasificarScript(objRemoto, objEntrada);

    if (strEstado === ESTADO.NUEVO) lstNuevos.push(objRemoto);
    else if (strEstado === ESTADO.MODIFICADO) lstModificados.push({ ...objRemoto, previo: objEntrada });
    else lstSinCambios.push(objRemoto);
  }

  // Un uuid que está en el índice pero ya no en PM4: el script se borró de la instancia.
  const dicUuidsRemotos = new Set(lstRemotos.map((o) => o.uuid));
  const lstBorrados = Object.entries(dicIndice)
    .filter(([strUuid]) => !dicUuidsRemotos.has(strUuid))
    .map(([strUuid, objEntrada]) => ({ uuid: strUuid, ...objEntrada }));

  return {
    nuevos: lstNuevos,
    modificados: lstModificados,
    sinCambios: lstSinCambios,
    borrados: lstBorrados,
    hayCambios: lstNuevos.length > 0 || lstModificados.length > 0,
  };
}

/**
 * Detecta si el id numérico de un script cambió respecto al que teníamos cacheado.
 *
 * Los ids de PM4 son específicos de cada instancia y cambian al migrar (regla #6 de CLAUDE.md: se
 * resuelve por nombre/uuid, nunca por id hardcodeado). Acá el uuid es la autoridad y `lastKnownId`
 * es solo caché para poder mostrar algo legible; esta función existe para avisar del cambio en vez
 * de dejar que el caché mienta en silencio.
 *
 * @returns {Array<{uuid: string, title: string, idPrevio: number, idNuevo: number}>}
 */
export function detectarCambiosDeId(lstRemotos, dicIndice) {
  const lstCambios = [];
  for (const objRemoto of lstRemotos) {
    const objEntrada = dicIndice[objRemoto.uuid];
    if (objEntrada && objEntrada.lastKnownId !== objRemoto.id) {
      lstCambios.push({
        uuid: objRemoto.uuid,
        title: objRemoto.title,
        idPrevio: objEntrada.lastKnownId,
        idNuevo: objRemoto.id,
      });
    }
  }
  return lstCambios;
}

/**
 * Convierte un título de PM4 en un slug de archivo estable.
 *
 * No lleva el id numérico a propósito: el id cambia entre instancias, y un nombre de archivo que lo
 * incluya obligaría a un renombrado masivo tras cada migración, rompiendo `git log --follow` justo
 * cuando más se necesita el historial.
 *
 * @param {string} strTitulo título del script en PM4
 * @returns {string} slug kebab-case seguro como nombre de archivo
 */
export function slugDesdeTitulo(strTitulo) {
  const strSlug = String(strTitulo)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Un título compuesto solo por símbolos dejaría un nombre de archivo vacío.
  return strSlug || 'script-sin-titulo';
}

/**
 * Scripts de la instancia que NADIE está vigilando y que aparecieron después de la última captura.
 *
 * Existe porque el alcance por proceso deja un hueco real: un script recién creado en la UI y aún
 * no cableado a ningún BPMN —el caso típico mientras se lo desarrolla— no lo descubre ninguna de
 * las tres vías, y su historial no se registra sin que nadie avise.
 *
 * Se acota a los CREADOS DESPUÉS de la última captura a propósito. La instancia tiene decenas de
 * scripts de otros proyectos que nunca van a vigilarse; listarlos todos sería ruido permanente que
 * se aprende a ignorar, y entonces el aviso dejaría de servir justo cuando importa. Acotado, solo
 * aparece cuando hay algo accionable.
 *
 * @param {Array<{uuid: string, id: number, title: string, createdAt?: string}>} lstTodos scripts de la instancia
 * @param {Set<string>} setVigilados uuids que ya están dentro del alcance
 * @param {string | undefined} strDesde ISO de la última captura; sin ella no se reporta nada
 * @returns {Array<{uuid: string, id: number, title: string, createdAt: string}>} más nuevos primero
 */
export function detectarNuevosSinVigilar(lstTodos, setVigilados, strDesde) {
  // Sin referencia temporal (primera corrida, o índice recién creado) callamos: reportar los ~50
  // scripts ajenos de la instancia sería exactamente el ruido que este diseño evita.
  if (!strDesde) return [];

  const intDesde = Date.parse(strDesde);
  if (Number.isNaN(intDesde)) return [];

  return lstTodos
    .filter((objScript) => !setVigilados.has(objScript.uuid))
    .filter((objScript) => {
      const intCreado = Date.parse(objScript.createdAt ?? '');
      return !Number.isNaN(intCreado) && intCreado > intDesde;
    })
    .sort((objA, objB) => Date.parse(objB.createdAt) - Date.parse(objA.createdAt));
}
