// stage-banner-z.class-only.spec.ts
import { StageBannerZ } from './stage-banner-z';

describe('StageBannerZ (class-only)', () => {
  function make(overrides?: Partial<any>) {
    const c = new StageBannerZ();
    if (overrides) Object.assign(c, overrides);
    return c;
  }

  // it('inicializa @Input con valores por defecto', () => {
  //   const c = make();

  //   expect(c.category).toBe('Category Header');
  //   expect(c.customStr).toBe('bg: #73DCE6; color: #000;');
  //   expect(c.imageSrc).toBe('https://zds.zurich.com/0.7.0/nyancat.webp');
  //   expect(c.content).toBe('CONTENT');
  //   expect(c.config).toBe('left:center');
  //   expect(c.shape).toBe('1');
  // });

  it('permite asignar valores personalizados a todos los @Input', () => {
    const c = make();

    c.category = 'Noticias';
    c.customStr = 'bg: #000; color: #fff;';
    c.imageSrc = '/assets/banner.jpg';
    c.content = 'Contenido dinámico';
    c.config = 'right:center';
    c.shape = '3';

    expect(c.category).toBe('Noticias');
    expect(c.customStr).toBe('bg: #000; color: #fff;');
    expect(c.imageSrc).toBe('/assets/banner.jpg');
    expect(c.content).toBe('Contenido dinámico');
    expect(c.config).toBe('right:center');
    expect(c.shape).toBe('3');
  });

  it('acepta strings vacíos en los @Input sin lanzar errores', () => {
    const c = make({
      category: '',
      customStr: '',
      imageSrc: '',
      content: '',
      config: '',
      shape: '',
    });

    expect(c.category).toBe('');
    expect(c.customStr).toBe('');
    expect(c.imageSrc).toBe('');
    expect(c.content).toBe('');
    expect(c.config).toBe('');
    expect(c.shape).toBe('');
  });

  it('múltiples asignaciones sucesivas actualizan el estado correctamente', () => {
    const c = make();

    c.category = 'A';
    expect(c.category).toBe('A');
    c.category = 'B';
    expect(c.category).toBe('B');

    c.config = 'left:top';
    expect(c.config).toBe('left:top');
    c.config = 'center:bottom';
    expect(c.config).toBe('center:bottom');

    c.shape = '2';
    expect(c.shape).toBe('2');
    c.shape = '5';
    expect(c.shape).toBe('5');
  });

  // it('las instancias son independientes (no hay fuga de estado entre ellas)', () => {
  //   const a = make();
  //   const b = make();

  //   a.category = 'A-cat';
  //   a.customStr = 'bg: red;';
  //   a.imageSrc = '/a.png';
  //   a.content = 'A-content';
  //   a.config = 'left:left';
  //   a.shape = '9';

  //   // b debe conservar defaults
  //   expect(b.category).toBe('Category Header');
  //   expect(b.customStr).toBe('bg: #73DCE6; color: #000;');
  //   expect(b.imageSrc).toBe('https://zds.zurich.com/0.7.0/nyancat.webp');
  //   expect(b.content).toBe('CONTENT');
  //   expect(b.config).toBe('left:center');
  //   expect(b.shape).toBe('1');
  // });

  it('sanity: el objeto expone exactamente las propiedades esperadas como @Input', () => {
    const c = make();
    // Verifica existencia de las claves básicas
    expect('category' in c).toBeTrue();
    expect('customStr' in c).toBeTrue();
    expect('imageSrc' in c).toBeTrue();
    expect('content' in c).toBeTrue();
    expect('config' in c).toBeTrue();
    expect('shape' in c).toBeTrue();
  });
});
