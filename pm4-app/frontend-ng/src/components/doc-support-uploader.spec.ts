import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileRegistryService } from '../core/file-registry.service';
import { DocSupportUploaderComponent } from './doc-support-uploader';

/**
 * Port de `components/DocSupportUploader.test.tsx` (3 casos), más 5 casos propios.
 *
 * Los 3 de React van 1:1: título/intro/un solo slot al montar · el botón "Agregar documento" visible
 * mientras no se llegue al tope · título/intro/max personalizados (con `max=1` no hay botón).
 *
 * ── Los 5 casos propios cubren lo que React NO probaba, y es justo lo peligroso ───────────────────
 * El baseline no tenía **ningún** caso del borrado con desplazamiento de slots — la lógica más larga y
 * la única con consecuencia silenciosa. Portar solo los 3 casos originales dejaría sin red el
 * escenario que manda a PM4 un adjunto que no corresponde al nombre registrado (ver el ⚠ del
 * componente). Así que:
 *
 * 1. **Agregar suma filas hasta el tope y ahí el botón desaparece.**
 * 2. **⚠ Borrar desplaza el VALOR de los slots posteriores**, no deja un hueco.
 * 3. **⚠⚠ Borrar desplaza el BINARIO junto con el valor.** Es el caso que atrapa el error silencioso:
 *    con solo el valor desplazado, la pantalla muestra el nombre correcto y sube el archivo del
 *    documento equivocado.
 * 4. **Borrar limpia el último slot en los tres lugares** (valor, binario y error), así que reabrir la
 *    fila no resucita el documento borrado.
 * 5. **El tope lo acota `docKeys`, no `max`** — con `max=5` y 2 claves, el tope real es 2.
 *
 * ── Por qué el registro se inyecta de verdad y no se mockea ──────────────────────────────────────
 * `FileRegistryService` es un `Map` con 5 métodos, sin I/O: mockearlo probaría que el componente llama
 * a un doble, no que el binario terminó donde tiene que estar. Se provee el servicio real (que es lo
 * que hace la pantalla) y se asevera **el contenido del registro**, que es el dato que se sube.
 */

@Component({
  standalone: true,
  imports: [DocSupportUploaderComponent],
  template: `
    <app-doc-support-uploader
      [form]="objForm"
      [docKeys]="claves()"
      [max]="intMax()"
      [title]="titulo()"
      [intro]="intro()"
    />
  `,
  // El registro va por pantalla, no como singleton global: dos pantallas abiertas no comparten
  // archivos a medio cargar. Es el mismo provider que declara una pantalla real.
  providers: [FileRegistryService],
})
class Host {
  readonly objForm: FormGroup = new FormBuilder().group({
    qd_strDoc01: [''],
    qd_strDoc02: [''],
    qd_strDoc03: [''],
  });
  readonly claves = signal<readonly string[]>(['qd_strDoc01', 'qd_strDoc02', 'qd_strDoc03']);
  readonly intMax = signal(3);
  readonly titulo = signal('Documento de soporte de las confirmaciones');
  readonly intro = signal(
    'Por favor cargue aquí el documento de respaldo proporcionado por el intermediario. Se pueden agregar hasta 3 documentos.',
  );
}

/** Un `File` reconocible por su contenido, para poder aseverar CUÁL binario quedó en cada slot. */
function archivo(in_strNombre: string): File {
  return new File([in_strNombre], in_strNombre, { type: 'application/pdf' });
}

describe('DocSupportUploaderComponent', () => {
  let objFixture: ComponentFixture<Host>;
  let objRegistro: FileRegistryService;

  function filas(): HTMLElement[] {
    return Array.from(objFixture.nativeElement.querySelectorAll('.doc-row'));
  }

  /** Las etiquetas visibles de cada fila ("Documento 1", "Documento 2", …). */
  function etiquetas(): string[] {
    return filas().map((in_objF) => in_objF.querySelector('.doc-row-label')!.textContent!.trim());
  }

  /** El botón "Agregar documento", o `null` si no está montado. */
  function botonAgregar(): HTMLElement | null {
    return Array.from(
      objFixture.nativeElement.querySelectorAll('lib-button-z'),
    ).find((in_objB) => (in_objB as HTMLElement).getAttribute('label') === 'Agregar documento') as
      | HTMLElement
      | null ?? null;
  }

  /** Los botones de borrar, uno por fila (solo existen con más de una fila). */
  function botonesBorrar(): HTMLElement[] {
    return filas()
      .map((in_objF) => in_objF.querySelector('lib-button-z') as HTMLElement | null)
      .filter((in_objB): in_objB is HTMLElement => in_objB !== null);
  }

  /** Suma una fila haciendo click en el botón real, como el usuario. */
  async function agregar(): Promise<void> {
    botonAgregar()!.dispatchEvent(new Event('eventClick'));
    await objFixture.whenStable();
  }

  /** Borra la fila `in_intIdx` por su botón. */
  async function borrar(in_intIdx: number): Promise<void> {
    botonesBorrar()[in_intIdx]!.dispatchEvent(new Event('eventClick'));
    await objFixture.whenStable();
  }

  function valor(in_strClave: string): unknown {
    return objFixture.componentInstance.objForm.get(in_strClave)!.value;
  }

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
    objRegistro = objFixture.debugElement
      .query((in_objNodo) => in_objNodo.componentInstance instanceof DocSupportUploaderComponent)
      .injector.get(FileRegistryService);
  });

  it('renderiza el título, la intro y un solo slot al montar', () => {
    expect(objFixture.nativeElement.textContent).toContain(
      'Documento de soporte de las confirmaciones',
    );
    expect(objFixture.nativeElement.textContent).toContain('documento de respaldo proporcionado');
    // Una sola fila: la lista arranca con un slot listo para cargar.
    expect(etiquetas()).toEqual(['Documento 1']);
    // Y sin botón de borrar: con una sola fila, borrar dejaría al usuario sin dónde cargar.
    expect(botonesBorrar()).toHaveLength(0);
  });

  it('el botón "Agregar documento" está visible mientras no se llegue al tope', () => {
    expect(botonAgregar()).not.toBeNull();
  });

  it('acepta título, intro y max personalizados', async () => {
    objFixture.componentInstance.titulo.set('Otro título');
    objFixture.componentInstance.intro.set('Otra intro');
    objFixture.componentInstance.intMax.set(1);
    await objFixture.whenStable();

    expect(objFixture.nativeElement.textContent).toContain('Otro título');
    expect(objFixture.nativeElement.textContent).toContain('Otra intro');
    // max=1 → el tope ya se alcanzó en la primera fila, no hay botón de agregar.
    expect(botonAgregar()).toBeNull();
  });

  it('agregar suma filas hasta el tope, y ahí el botón desaparece', async () => {
    await agregar();
    expect(etiquetas()).toEqual(['Documento 1', 'Documento 2']);
    expect(botonAgregar()).not.toBeNull();

    await agregar();
    expect(etiquetas()).toEqual(['Documento 1', 'Documento 2', 'Documento 3']);
    // Tope alcanzado (3 claves, max 3): sin botón, porque una 4ª fila no tendría clave donde escribir.
    expect(botonAgregar()).toBeNull();
  });

  it('⚠ borrar una fila desplaza el VALOR de las posteriores, no deja hueco', async () => {
    await agregar();
    await agregar();
    objFixture.componentInstance.objForm.patchValue({
      qd_strDoc01: 'primero.pdf',
      qd_strDoc02: 'segundo.pdf',
      qd_strDoc03: 'tercero.pdf',
    });
    await objFixture.whenStable();

    await borrar(0);

    // El usuario ve una lista, no slots fijos: al borrar el 1 de 3, quedan dos documentos corridos.
    expect(etiquetas()).toEqual(['Documento 1', 'Documento 2']);
    expect(valor('qd_strDoc01')).toBe('segundo.pdf');
    expect(valor('qd_strDoc02')).toBe('tercero.pdf');
    // Y el último slot queda libre, no con una copia del que subió.
    expect(valor('qd_strDoc03')).toBe('');
  });

  it('⚠⚠ borrar desplaza el BINARIO junto con el valor (el error silencioso)', async () => {
    // El caso más importante del archivo. Si solo se desplazara el valor, la pantalla mostraría
    // "segundo.pdf" en la fila 1 y subiría a PM4 el binario de "primero.pdf": un adjunto que no
    // corresponde al nombre registrado, imposible de notar desde la UI.
    await agregar();
    await agregar();
    objFixture.componentInstance.objForm.patchValue({
      qd_strDoc01: 'primero.pdf',
      qd_strDoc02: 'segundo.pdf',
      qd_strDoc03: 'tercero.pdf',
    });
    objRegistro.registrar('qd_strDoc01', archivo('primero.pdf'));
    objRegistro.registrar('qd_strDoc02', archivo('segundo.pdf'));
    objRegistro.registrar('qd_strDoc03', archivo('tercero.pdf'));
    await objFixture.whenStable();

    await borrar(0);

    // El binario de cada slot tiene que coincidir con el nombre que muestra el formulario.
    expect(objRegistro.obtener('qd_strDoc01')?.name).toBe('segundo.pdf');
    expect(objRegistro.obtener('qd_strDoc02')?.name).toBe('tercero.pdf');
    // Y el binario del documento borrado ya no está en ninguna parte: si quedara, se subiría igual.
    expect(objRegistro.obtener('qd_strDoc03')).toBeUndefined();
    expect(objRegistro.intCantidad).toBe(2);
    const lstNombres = Array.from(objRegistro.mapArchivos.values()).map((in_obj) => in_obj.name);
    expect(lstNombres).not.toContain('primero.pdf');
  });

  it('borrar limpia el último slot cuando el que sube no tiene archivo', async () => {
    // La rama `else` del desplazamiento: si el slot siguiente está vacío, hay que BORRAR el binario
    // del actual, no dejarlo. Si no, la fila mostraría vacío y subiría el archivo viejo.
    await agregar();
    objFixture.componentInstance.objForm.patchValue({ qd_strDoc01: 'primero.pdf' });
    objRegistro.registrar('qd_strDoc01', archivo('primero.pdf'));
    await objFixture.whenStable();

    // Se borra la fila 1 (que tiene archivo) y la 2 está vacía.
    await borrar(0);

    expect(etiquetas()).toEqual(['Documento 1']);
    expect(valor('qd_strDoc01')).toBe('');
    expect(objRegistro.obtener('qd_strDoc01')).toBeUndefined();
    expect(objRegistro.intCantidad).toBe(0);
  });

  it('borrar limpia también el ERROR del slot que queda libre', async () => {
    // El error es la tercera cosa que viaja con el documento. Si no se limpiara, la fila reabierta
    // nacería en rojo por un archivo que ya no existe.
    await agregar();
    objFixture.componentInstance.objForm.get('qd_strDoc02')!.setErrors({ invalido: true });
    await objFixture.whenStable();

    await borrar(0);

    expect(objFixture.componentInstance.objForm.get('qd_strDoc02')!.errors).toBeNull();
    // Y el error viajó al slot que ahora ocupa esa fila, no se perdió.
    expect(objFixture.componentInstance.objForm.get('qd_strDoc01')!.errors).toEqual({
      invalido: true,
    });
  });

  it('el tope lo acota docKeys, no max', async () => {
    // `Math.min(max, docKeys.length)`: con max=5 y 2 claves declaradas, una 3ª fila no tendría campo
    // donde escribir. El tope lo pone el contrato con PM4, no el parámetro.
    objFixture.componentInstance.claves.set(['qd_strDoc01', 'qd_strDoc02']);
    objFixture.componentInstance.intMax.set(5);
    await objFixture.whenStable();

    await agregar();

    expect(etiquetas()).toEqual(['Documento 1', 'Documento 2']);
    expect(botonAgregar()).toBeNull();
  });
});
