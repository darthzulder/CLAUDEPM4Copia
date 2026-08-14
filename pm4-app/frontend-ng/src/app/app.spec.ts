import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // `App` declara `RouterOutlet`, que necesita un Router configurado para instanciarse.
      // Se pasan las rutas reales, no `[]`, para que este smoke también se rompa si alguien
      // deja `app.routes.ts` sintácticamente inválido.
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('monta la raíz de la app', () => {
    const objFixture = TestBed.createComponent(App);
    expect(objFixture.componentInstance).toBeTruthy();
  });

  it('renderiza el router-outlet', async () => {
    const objFixture = TestBed.createComponent(App);
    await objFixture.whenStable();
    expect(
      (objFixture.nativeElement as HTMLElement).querySelector('router-outlet'),
    ).not.toBeNull();
  });
});
