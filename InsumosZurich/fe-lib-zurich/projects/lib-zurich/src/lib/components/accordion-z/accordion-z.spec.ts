import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccordionZ } from './accordion-z';

describe('AccordionZ', () => {
  let component: AccordionZ;
  let fixture: ComponentFixture<AccordionZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccordionZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccordionZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
