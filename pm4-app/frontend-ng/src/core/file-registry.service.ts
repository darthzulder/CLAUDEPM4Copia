import { Injectable } from '@angular/core';

/**
 * Registro de los binarios que el usuario adjuntó, mientras navega entre secciones y antes de que se
 * suban a PM4. Reemplaza el `useRef(new Map<string, File>())` que la app React declara en el
 * componente raíz de cada pantalla con adjuntos.
 *
 * ── Por qué existe un registro aparte del formulario ─────────────────────────────────────────
 * El `FormControl` del campo guarda el **nombre** del archivo (es lo que viaja a PM4 como dato del
 * caso y lo que se muestra en pantalla); el binario no cabe ahí. En el submit, cada entrada de este
 * mapa se sube con `POST /requests/{id}/files?data_name=<docKey>`, o sea que la **clave es el
 * `docKey`**: el mismo nombre de campo `qd_*` con el que PM4 asocia el media al request. Perder esa
 * correspondencia significa subir un archivo que el proceso no puede encontrar.
 *
 * ── `providedIn` deliberadamente ausente: es un servicio POR PANTALLA, no un singleton ────────
 * No lleva `providedIn: 'root'` a propósito. Cada pantalla lo declara en sus propios `providers`,
 * así que cada una tiene su registro y se destruye con ella. Un singleton global arrastraría los
 * adjuntos de una pantalla a la siguiente dentro del mismo iframe — que es exactamente el bug que el
 * `useRef` de React no podía tener (moría con el componente) y que un servicio de root sí tendría.
 *
 * Esto lo pide el plan de migración de forma explícita ("provider **por pantalla**, no singleton
 * global") y es la única razón por la que este archivo no sigue el default de los demás servicios.
 *
 * ── Se expone el `Map`, no una copia ──────────────────────────────────────────────────────────
 * `mapArchivos` devuelve el mapa real porque `findDuplicateAttachment` y el bucle de subida lo
 * recorren tal cual, igual que hacía `fileRegistry.current` en React. Devolver una copia defensiva
 * en cada lectura obligaría a re-hashear todo (el caché de `file-hash.ts` es un `WeakMap` sobre las
 * instancias de `File`, no sobre el mapa) y no compraría nada: el consumidor es la propia pantalla.
 */
@Injectable()
export class FileRegistryService {
  private readonly mapInterno = new Map<string, File>();

  /** El registro real, para recorrerlo en el submit y para la detección de duplicados. */
  get mapArchivos(): Map<string, File> {
    return this.mapInterno;
  }

  get intCantidad(): number {
    return this.mapInterno.size;
  }

  /** Registra (o reemplaza) el binario de un `docKey`. */
  registrar(in_strDocKey: string, in_objArchivo: File): void {
    this.mapInterno.set(in_strDocKey, in_objArchivo);
  }

  /** Saca el binario de un `docKey`. Es lo que corre cuando el usuario borra o el archivo se rechaza. */
  quitar(in_strDocKey: string): void {
    this.mapInterno.delete(in_strDocKey);
  }

  obtener(in_strDocKey: string): File | undefined {
    return this.mapInterno.get(in_strDocKey);
  }

  /** Vacía el registro. Corre después de un submit exitoso, igual que el `.clear()` de React. */
  limpiar(): void {
    this.mapInterno.clear();
  }
}
