import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeZ } from './shape-z';

describe('ShapeZ', () => {
  let component: ShapeZ;
  let fixture: ComponentFixture<ShapeZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShapeZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShapeZ);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
