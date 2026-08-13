import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextareaZ } from './textarea-z';

describe('TextareaZ', () => {
  let component: TextareaZ;
  let fixture: ComponentFixture<TextareaZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextareaZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
