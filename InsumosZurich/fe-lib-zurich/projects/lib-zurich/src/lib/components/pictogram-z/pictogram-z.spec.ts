import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PictogramZ } from './pictogram-z';

describe('PictogramZ', () => {
  let component: PictogramZ;
  let fixture: ComponentFixture<PictogramZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PictogramZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PictogramZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
