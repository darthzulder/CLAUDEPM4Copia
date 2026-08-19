import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTimeZ } from './input-time-z';

describe('InputTimeZ', () => {
  let component: InputTimeZ;
  let fixture: ComponentFixture<InputTimeZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTimeZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputTimeZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
