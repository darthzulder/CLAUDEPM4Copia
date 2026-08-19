import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TileZ } from './tile-z';

@Component({
  standalone: true,
  imports: [TileZ],
  template: `
    <lib-tile-z
      [img]="img"
      [nameButton]="nameButton"
      [customButtons]="customButtons"
      [imgLeft]="imgLeft"
      (eventClick)="onEventClick($event)"
    >
      <ng-template zTemplate id="title">Título</ng-template>
      <ng-template zTemplate id="content">Contenido</ng-template>
      <ng-template zTemplate id="buttons">Botón</ng-template>
    </lib-tile-z>
  `,
})
class HostComponent {
  img = 'https://example.com/img.png';
  nameButton = 'Aceptar';
  customButtons = true;
  imgLeft = false;

  emitted: any[] = [];
  onEventClick(ev: any) {
    this.emitted.push(ev);
  }
}

describe('TileZ (Zoneless)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let tile: TileZ;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;

    const tileDe = fixture.debugElement.children.find(
      (de) => de.componentInstance instanceof TileZ,
    )!;
    tile = tileDe.componentInstance as TileZ;

    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(tile).toBeTruthy();
  });

  // it('debe mapear title/content/buttons desde @ContentChildren', () => {
  //   expect(tile.title).toBeTruthy();
  //   expect(tile.content).toBeTruthy();
  //   expect(tile.buttons).toBeTruthy();
  // });

  it('debe recibir Inputs desde el host', () => {
    expect(tile.img).toBe('https://example.com/img.png');
    expect(tile.nameButton).toBe('Aceptar');
    expect(tile.customButtons).toBeTrue();
    expect(tile.imgLeft).toBeFalse();
  });

  it('debe emitir eventClick cuando eventButtonClick es llamado', () => {
    const payload = { ok: true };
    tile.eventButtonClick(payload);
    fixture.detectChanges();
    expect(host.emitted.length).toBe(1);
    expect(host.emitted[0]).toEqual(payload);
  });
});
