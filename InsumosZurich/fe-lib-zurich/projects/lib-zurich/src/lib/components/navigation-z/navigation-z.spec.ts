// navigation-z.class-only.spec.ts
import { NavigationZ } from './navigation-z';

describe('NavigationZ (class-only)', () => {
  it('defaults', () => {
    const c = new NavigationZ();
    expect(c.routes).toBeUndefined();
    expect(c.social).toBeUndefined();
  });

  it('permite asignar routes como arreglo vacío', () => {
    const c = new NavigationZ();
    c.routes = [];
    expect(Array.isArray(c.routes)).toBeTrue();
    expect(c.routes!.length).toBe(0);
  });

  

  it('usa referencia directa del array (no clona)', () => {
    const c = new NavigationZ();
    const arr = [{ text: 'Link 1' }] as any[];
    c.routes = arr;
    arr.push({ text: 'Link 2' } as any);
    expect(c.routes!.length).toBe(2);
    expect(c.routes![1].text).toBe('Link 2');
  });

  it('permite reasignar routes con un nuevo arreglo', () => {
    const c = new NavigationZ();
    c.routes = [{ text: 'A' }] as any[];
    expect(c.routes!.length).toBe(1);
    c.routes = [{ text: 'B' }, { text: 'C' }] as any[];
    expect(c.routes!.length).toBe(2);
    expect(c.routes![0].text).toBe('B');
  });

  it('soporta listas grandes sin lanzar errores', () => {
    const c = new NavigationZ();
    const big = Array.from({ length: 1000 }, (_, i) => ({ text: `Link ${i}` })) as any[];
    c.routes = big;
    expect(c.routes!.length).toBe(1000);
    expect(c.routes![999].text).toBe('Link 999');
  });

  it('permite asignar social parcial (solo facebook)', () => {
    const c = new NavigationZ();
    c.social = { facebook: 'https://facebook.com/zurich' };
    expect(c.social!.facebook).toBe('https://facebook.com/zurich');
    expect(c.social!.twitter).toBeUndefined();
    expect(c.social!.linkedin).toBeUndefined();
    expect(c.social!.instagram).toBeUndefined();
  });

  it('permite asignar social completo', () => {
    const c = new NavigationZ();
    c.social = {
      facebook: 'https://facebook.com/zurich',
      twitter: 'https://twitter.com/zurich',
      linkedin: 'https://linkedin.com/company/zurich',
      instagram: 'https://instagram.com/zurich',
    };
    expect(c.social!.facebook).toContain('facebook.com');
    expect(c.social!.twitter).toContain('twitter.com');
    expect(c.social!.linkedin).toContain('linkedin.com');
    expect(c.social!.instagram).toContain('instagram.com');
  });

  it('permite reasignar social', () => {
    const c = new NavigationZ();
    c.social = { facebook: 'fb1' };
    expect(c.social!.facebook).toBe('fb1');
    c.social = { twitter: 'tw2' };
    expect(c.social!.facebook).toBeUndefined();
    expect(c.social!.twitter).toBe('tw2');
  });
});