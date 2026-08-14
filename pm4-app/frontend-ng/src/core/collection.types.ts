/**
 * Tipos de las colecciones PM4, en su propio archivo **a propósito**.
 *
 * En la app React estos dos tipos vivían dentro de `core/useCollection.ts`, junto al hook que hace el
 * HTTP. Eso obligaba a `collections.ts` —que es un módulo de **datos puros**, las 37 definiciones de
 * colección— a escribir `import type { CollectionDef } from './useCollection'`, y por lo tanto a
 * arrastrar el cliente HTTP entero por la cadena de imports.
 *
 * Con `import type` TypeScript borra el import al compilar, así que en React no costaba bundle. Pero acá
 * sí costaría: en Angular el equivalente de ese hook es `CollectionService`, un `@Injectable` que
 * `inject(HttpClient)`. Un archivo de datos que importa de un servicio inyectable es una inversión de
 * dependencia al revés, y además haría que el spec de `collections.ts` necesitara `TestBed` para
 * testear una lista de constantes.
 *
 * Separarlos deja `collections.ts` como lo que es —datos, testeables sin mockear nada— y le da al
 * servicio un contrato que consume en vez de definir.
 */

/** Definición de una colección PM4 y de cómo se leen sus records para armar un select. */
export interface CollectionDef {
  id: number;
  /** Dotted path en el record: `'data.frm_nombre_entidad'` | `'id'`. */
  labelField: string;
  /** Dotted path en el record: `'id'` | `'data.frm_codigo'`. */
  valueField: string;
  /** Nombre del campo del form que dispara la recarga (gating por dependencia). */
  dependsOn?: string;
  /** PMQL con placeholders `{{field_name}}` que se resuelven con el valor del form. */
  pmqlTemplate?: string;
}

/** Par código/etiqueta ya listo para un `<select>` del DS. */
export interface CollectionOption {
  value: string;
  label: string;
}
