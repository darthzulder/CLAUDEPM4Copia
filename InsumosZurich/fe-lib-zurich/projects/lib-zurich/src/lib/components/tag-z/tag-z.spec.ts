import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagZ } from './tag-z';

describe('TagZ', () => {
  let component: TagZ;
  let fixture: ComponentFixture<TagZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
